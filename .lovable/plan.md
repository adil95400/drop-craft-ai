
# 🔧 Plan de Correction : Fiabilisation de l'Extension Chrome ShopOpti+ v5.7.0

## Problèmes identifiés et Solutions

Suite à l'analyse approfondie du code source, voici les problèmes techniques confirmés et les solutions à implémenter.

---

## 1. Intégration des Sélecteurs Distants (CRITIQUE)

### Problème
Le fichier `content-script.js` utilise des sélecteurs statiques (`platformSelectors` lignes 35-129) et n'appelle **jamais** `RemoteSelectorsManager.init()` qui existe dans `lib/remote-selectors.js`. Le module de sélecteurs distants est prêt mais non connecté.

### Solution
Modifier l'initialisation du `content-script.js` pour:
1. Charger et initialiser `RemoteSelectorsManager` au démarrage
2. Fusionner les sélecteurs distants avec les sélecteurs locaux
3. Signaler automatiquement les sélecteurs cassés via `reportBrokenSelector()`

### Modifications techniques

**Fichier: `public/chrome-extension/content-script.js`**

Ajouter dans la fonction `init()` (après ligne 1173):
```javascript
// Initialize remote selectors for dynamic updates
if (typeof RemoteSelectorsManager !== 'undefined') {
  try {
    const remoteSelectors = await RemoteSelectorsManager.init();
    if (remoteSelectors) {
      mergeRemoteSelectors(remoteSelectors);
      console.log('[ShopOpti+] Remote selectors loaded');
    }
  } catch (e) {
    console.warn('[ShopOpti+] Remote selectors failed, using local:', e);
  }
}
```

Ajouter une nouvelle fonction de fusion:
```javascript
function mergeRemoteSelectors(remoteSelectors) {
  Object.keys(remoteSelectors).forEach(platform => {
    if (platformSelectors[platform] && remoteSelectors[platform]) {
      // Merge productButtons
      if (remoteSelectors[platform].productButtons) {
        platformSelectors[platform].productButtons = [
          ...new Set([
            ...remoteSelectors[platform].productButtons,
            ...platformSelectors[platform].productButtons
          ])
        ];
      }
      // Merge cards selectors
      if (remoteSelectors[platform].cards) {
        platformSelectors[platform].cards = [
          ...new Set([
            ...remoteSelectors[platform].cards,
            ...platformSelectors[platform].cards
          ])
        ];
      }
    }
  });
}
```

Ajouter un signalement automatique quand l'injection échoue (dans `injectProductPageButton`):
```javascript
if (reinjectAttempts >= MAX_REINJECT_ATTEMPTS) {
  // Report broken selector
  if (typeof RemoteSelectorsManager !== 'undefined') {
    RemoteSelectorsManager.reportBrokenSelector(platform, 'productButtons', {
      url: window.location.href,
      selectors: selectors.productButtons
    });
  }
}
```

---

## 2. Fallback Local pour Import API (HAUTE PRIORITÉ)

### Problème
Quand l'API `extension-scraper` échoue, l'import échoue totalement. Le module `SupplierFallback` existe mais n'est pas utilisé pour l'extraction de produits.

### Solution
Implémenter un fallback local utilisant `advanced-scraper.js` quand l'API échoue.

### Modifications techniques

**Fichier: `public/chrome-extension/background.js`**

Modifier la fonction `scrapeAndImport` (ligne 714) pour ajouter un fallback:

```javascript
async scrapeAndImport(url) {
  const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
  
  if (!extensionToken) {
    return { success: false, error: 'Non connecté. Connectez-vous via l\'extension.' };
  }

  try {
    // Try API first
    const response = await fetch(`${API_URL}/extension-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-token': extensionToken
      },
      body: JSON.stringify({ action: 'scrape_and_import', url })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      await this.updateStats({ products: 1 });
      this.showNotification('Import réussi', data.product?.title || 'Produit importé');
      return data;
    }
    
    // API failed - try local fallback
    console.log('[ShopOpti+] API failed, trying local fallback...');
    return await this.localFallbackImport(url, extensionToken, data.error);
    
  } catch (error) {
    // Network error - try local fallback
    console.log('[ShopOpti+] Network error, trying local fallback...');
    return await this.localFallbackImport(url, extensionToken, error.message);
  }
}

async localFallbackImport(url, extensionToken, originalError) {
  try {
    // Execute advanced-scraper on the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) {
      return { success: false, error: originalError || 'Onglet non disponible' };
    }
    
    // Execute local extraction
    const extractResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (typeof AdvancedProductScraper !== 'undefined') {
          const scraper = new AdvancedProductScraper();
          return scraper.extractCompleteProduct();
        }
        return null;
      }
    });
    
    const extractedData = extractResults[0]?.result;
    
    if (!extractedData || !extractedData.title) {
      return { 
        success: false, 
        error: originalError || 'Extraction locale échouée',
        fallbackAttempted: true 
      };
    }
    
    // Save locally extracted product via API with minimal data
    const saveResponse = await fetch(`${API_URL}/extension-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-token': extensionToken
      },
      body: JSON.stringify({ 
        action: 'save_extracted',
        extractedData,
        url,
        source: 'local_fallback'
      })
    });
    
    if (saveResponse.ok) {
      const result = await saveResponse.json();
      await this.updateStats({ products: 1 });
      this.showNotification('Import réussi (fallback)', extractedData.title);
      return { success: true, ...result, usedFallback: true };
    }
    
    return { 
      success: false, 
      error: 'Sauvegarde échouée après extraction locale',
      extractedData // Return data anyway for debugging
    };
    
  } catch (fallbackError) {
    console.error('[ShopOpti+] Local fallback failed:', fallbackError);
    return { 
      success: false, 
      error: originalError || fallbackError.message,
      fallbackAttempted: true
    };
  }
}
```

---

## 3. Retry Intelligent pour Import en Masse (HAUTE PRIORITÉ)

### Problème
L'import en masse (`bulk-import-v5.js` et `content-script.js` ligne 895-921) utilise une simple boucle avec 500ms de pause sans retry ni gestion d'erreurs intelligente. Le `RetryManager` existe mais n'est pas utilisé.

### Solution
Intégrer `ShopOptiRetryManager` dans les flux d'import en masse.

### Modifications techniques

**Fichier: `public/chrome-extension/content-script.js`**

Remplacer la fonction `bulkImportSelected` (lignes 878-923):

```javascript
async function bulkImportSelected() {
  const selected = document.querySelectorAll('.shopopti-checkbox.selected');
  const urls = Array.from(selected).map(cb => cb.dataset.productUrl).filter(Boolean);
  
  if (urls.length === 0) {
    showToast('Aucun produit sélectionné', 'error');
    return;
  }
  
  const btn = document.getElementById('shopopti-bulk-import');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="shopopti-spinner"></span> Import ${urls.length}...`;
  }
  
  // Use RetryManager if available
  if (typeof ShopOptiRetryManager !== 'undefined') {
    const results = await ShopOptiRetryManager.batchWithRetry(
      urls,
      async (url) => {
        const response = await sendMessage({ type: 'IMPORT_FROM_URL', url });
        if (!response.success) throw new Error(response.error || 'Import failed');
        return response;
      },
      {
        maxRetries: 3,
        concurrency: 2,
        stopOnError: false,
        onItemComplete: ({ item, result, index }) => {
          const checkbox = document.querySelector(`.shopopti-checkbox[data-product-url="${CSS.escape(item)}"]`);
          if (checkbox) {
            checkbox.classList.remove('selected');
            checkbox.classList.add(result.success ? 'imported' : 'error');
          }
          // Update button progress
          if (btn) {
            btn.innerHTML = `<span class="shopopti-spinner"></span> ${index + 1}/${urls.length}...`;
          }
        },
        onRetry: ({ attempt, errorType, delay }) => {
          console.log(`[ShopOpti+] Retry attempt ${attempt}, waiting ${delay}ms...`);
        }
      }
    );
    
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg class="shopopti-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Importer tout`;
    }
    
    showToast(`${results.succeeded} importé(s), ${results.failed} erreur(s)`, results.succeeded > 0 ? 'success' : 'error');
    updateBulkSelection();
    
  } else {
    // Fallback to original logic (with small improvements)
    let success = 0, errors = 0;
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const response = await sendMessage({ type: 'IMPORT_FROM_URL', url });
        
        if (response.success) {
          success++;
          const checkbox = document.querySelector(`.shopopti-checkbox[data-product-url="${CSS.escape(url)}"]`);
          if (checkbox) {
            checkbox.classList.remove('selected');
            checkbox.classList.add('imported');
          }
        } else {
          errors++;
        }
      } catch (e) {
        errors++;
      }
      
      // Update progress
      if (btn) {
        btn.innerHTML = `<span class="shopopti-spinner"></span> ${i + 1}/${urls.length}...`;
      }
      
      // Dynamic delay based on error rate
      const delayMs = errors > success ? 1000 : 500;
      await new Promise(r => setTimeout(r, delayMs));
    }
    
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg class="shopopti-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Importer tout`;
    }
    
    showToast(`${success} importé(s), ${errors} erreur(s)`, success > 0 ? 'success' : 'error');
    updateBulkSelection();
  }
}
```

---

## 4. Vérification Token Systématique (MOYENNE PRIORITÉ)

### Problème
Le token est vérifié via `ensureAuthenticated()` mais ne gère pas les cas d'expiration pendant un import en masse.

### Solution
Ajouter une vérification de token avant chaque opération d'import avec renouvellement automatique.

### Modifications techniques

**Fichier: `public/chrome-extension/content-script.js`**

Améliorer `ensureAuthenticated`:

```javascript
async function ensureAuthenticated(forceRefresh = false) {
  if (isAuthenticated && !forceRefresh) {
    // Quick check - verify token is still valid
    const status = await sendMessage({ type: 'CHECK_AUTH_STATUS' });
    if (status?.authenticated) return true;
  }
  
  // Re-check auth status with server validation
  try {
    const response = await sendMessage({ type: 'GET_AUTH_TOKEN' });
    
    if (response.authenticated && response.token) {
      isAuthenticated = true;
      return true;
    }
    
    // Token expired or invalid
    if (response.error === 'Session expirée') {
      showToast('⏰ Session expirée - Reconnexion nécessaire', 'info');
    } else {
      showToast('🔒 Connectez-vous sur ShopOpti pour importer', 'info');
    }
    
    // Open auth page
    try {
      await sendMessage({ type: 'OPEN_AUTH_PAGE' });
    } catch (e) {
      window.open(`${APP_URL}/auth/extension`, '_blank');
    }
    
    isAuthenticated = false;
    return false;
    
  } catch (error) {
    console.error('[ShopOpti+] Auth check failed:', error);
    showToast('❌ Erreur de connexion - Réessayez', 'error');
    return false;
  }
}
```

---

## 5. Mode Injection Flottant Alternatif (MOYENNE PRIORITÉ)

### Problème
Quand les sélecteurs classiques échouent, le bouton n'apparaît pas. L'utilisateur n'a aucun moyen d'importer.

### Solution
Ajouter un bouton flottant de secours qui apparaît automatiquement si l'injection standard échoue.

### Modifications techniques

**Fichier: `public/chrome-extension/content-script.js`**

Ajouter après la fonction `injectProductPageButton`:

```javascript
function injectFloatingFallbackButton(platform) {
  // Only show if we're on a product page and normal injection failed
  if (document.getElementById('shopopti-floating-import')) return;
  
  const floatingBtn = document.createElement('div');
  floatingBtn.id = 'shopopti-floating-import';
  floatingBtn.innerHTML = `
    <button class="shopopti-import-btn shopopti-main-btn shopopti-floating-main">
      <svg class="shopopti-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span class="shopopti-btn-text">Import ShopOpti+</span>
    </button>
    <span class="shopopti-floating-hint">Bouton de secours - sélecteurs non trouvés</span>
  `;
  
  floatingBtn.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 24px;
    z-index: 9999999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  `;
  
  const hint = floatingBtn.querySelector('.shopopti-floating-hint');
  if (hint) {
    hint.style.cssText = `
      font-size: 11px;
      color: #94a3b8;
      background: rgba(0,0,0,0.7);
      padding: 4px 8px;
      border-radius: 4px;
    `;
  }
  
  floatingBtn.querySelector('.shopopti-main-btn').addEventListener('click', async () => {
    await handleQuickImport(floatingBtn.querySelector('.shopopti-main-btn'), window.location.href);
  });
  
  document.body.appendChild(floatingBtn);
  
  // Report that we needed fallback button
  if (typeof RemoteSelectorsManager !== 'undefined') {
    RemoteSelectorsManager.reportBrokenSelector(platform, 'productButtons', {
      url: window.location.href,
      reason: 'Used floating fallback button'
    });
  }
  
  console.log(`[ShopOpti+ v${VERSION}] Floating fallback button injected for ${platform}`);
}
```

Modifier `injectProductPageButton` pour appeler le fallback:

```javascript
function injectProductPageButton(platform) {
  // ... existing code ...
  
  if (!targetElement) {
    if (reinjectAttempts < MAX_REINJECT_ATTEMPTS) {
      reinjectAttempts++;
      setTimeout(() => injectProductPageButton(platform), 500);
    } else {
      // All attempts failed - inject floating fallback
      injectFloatingFallbackButton(platform);
    }
    return;
  }
  
  // ... rest of existing code ...
}
```

---

## 6. Chargement des Librairies dans manifest.json

### Problème
Les librairies (`remote-selectors.js`, `retry-manager.js`, `supplier-fallback.js`) sont dans `/lib/` mais ne sont pas injectées avec le content script.

### Solution
Modifier `manifest.json` pour inclure ces librairies comme scripts de contenu.

### Modifications techniques

**Fichier: `public/chrome-extension/manifest.json`**

Modifier la section `content_scripts` (ligne 37):

```json
"content_scripts": [
  {
    "matches": [
      "*://*.amazon.com/*",
      "*://*.amazon.fr/*",
      "*://*.amazon.de/*",
      "*://*.amazon.co.uk/*",
      "*://*.amazon.es/*",
      "*://*.amazon.it/*",
      "*://*.amazon.ca/*",
      "*://*.amazon.co.jp/*",
      "*://*.aliexpress.com/*",
      "*://*.aliexpress.fr/*",
      "*://*.aliexpress.us/*",
      "*://*.ebay.com/*",
      "*://*.ebay.fr/*",
      "*://*.ebay.de/*",
      "*://*.ebay.co.uk/*",
      "*://*.temu.com/*",
      "*://*.shein.com/*",
      "*://*.shein.fr/*",
      "*://*.etsy.com/*"
    ],
    "js": [
      "lib/remote-selectors.js",
      "lib/retry-manager.js",
      "lib/supplier-fallback.js",
      "lib/cost-calculator.js",
      "advanced-scraper.js",
      "content-script.js"
    ],
    "run_at": "document_idle"
  }
]
```

---

## 7. Harmonisation des Versions (FAIBLE PRIORITÉ)

### Problème
`advanced-scraper.js` est en version 4.5 alors que le reste est en 5.7.0.

### Solution
Mettre à jour la version dans `advanced-scraper.js`.

### Modification technique

**Fichier: `public/chrome-extension/advanced-scraper.js`**

Ligne 3: Changer "v4.5" en "v5.7.0"

---

## Résumé des Fichiers à Modifier

| Fichier | Modifications | Priorité |
|---------|---------------|----------|
| `content-script.js` | Intégration RemoteSelectors, RetryManager, fallback button | CRITIQUE |
| `background.js` | Fallback local pour import API | HAUTE |
| `manifest.json` | Ajout des librairies dans content_scripts | HAUTE |
| `advanced-scraper.js` | Mise à jour version | FAIBLE |

---

## Ordre d'Implémentation Recommandé

1. **Modifier `manifest.json`** - Inclure les librairies nécessaires
2. **Modifier `content-script.js`** - Intégrer tous les modules
3. **Modifier `background.js`** - Ajouter fallback local
4. **Mettre à jour `advanced-scraper.js`** - Version harmonisée
5. **Tester** sur Amazon, AliExpress, Temu, Shein

---

## Tests de Validation

Après implémentation, vérifier:
- [ ] Bouton d'import visible sur Amazon (page produit)
- [ ] Bouton d'import visible sur AliExpress (page produit)
- [ ] Cases à cocher sur pages de liste/recherche
- [ ] Import fonctionne même si API timeout (fallback local)
- [ ] Import en masse avec retry sur erreurs réseau
- [ ] Sélecteurs distants chargés (vérifier console)
- [ ] Bouton flottant apparaît si sélecteurs cassés
- [ ] Token vérifié avant chaque import
