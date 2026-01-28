# Troubleshooting Guide - ShopOpti+ Extension

Solutions aux problèmes courants de l'extension.

## 🔴 Problèmes d'Installation

### Le bouton "Charger l'extension non empaquetée" ne fonctionne pas

**Cause:** Le mode développeur n'est pas activé.

**Solution:**
1. Ouvrez `chrome://extensions`
2. Activez le toggle "Mode développeur" en haut à droite
3. Rafraîchissez la page
4. Le bouton devrait maintenant fonctionner

### Erreur "Manifest file is missing or unreadable"

**Cause:** Le dossier sélectionné ne contient pas de `manifest.json` à la racine.

**Solution:**
1. Vérifiez que vous avez bien décompressé le ZIP
2. Sélectionnez le dossier contenant `manifest.json` (pas un sous-dossier)
3. Structure attendue:
   ```
   chrome-extension/      ← Sélectionner CE dossier
   ├── manifest.json
   ├── background.js
   ├── popup.html
   └── ...
   ```

### Erreur "Could not load javascript" ou "Service worker registration failed"

**Cause:** Fichiers manquants ou corrompus.

**Solution:**
1. Re-téléchargez l'extension depuis shopopti.io
2. Supprimez l'ancienne version dans Chrome
3. Réinstallez depuis le nouveau ZIP

---

## 🟡 Problèmes de Connexion

### "Token invalide" ou "Session expirée"

**Cause:** Le token est incorrect ou a expiré.

**Solution:**
1. Connectez-vous à shopopti.io
2. Allez dans `/auth/extension`
3. Générez un nouveau token
4. Copiez-collez dans l'extension
5. Cliquez "Connecter"

### Le token ne se sauvegarde pas

**Cause:** Problème de stockage Chrome.

**Solution:**
1. Ouvrez les outils développeur (F12)
2. Allez dans Application → Storage
3. Cliquez "Clear site data"
4. Réessayez d'entrer le token

### Erreur "Network request failed"

**Cause:** Problème de connectivité ou bloqueur.

**Solutions:**
1. Vérifiez votre connexion internet
2. Désactivez temporairement les extensions de blocage (uBlock, AdGuard)
3. Vérifiez que shopopti.io n'est pas bloqué par votre pare-feu
4. Essayez en navigation privée

---

## 🟠 Problèmes d'Extraction

### Le bouton "ShopOpti" n'apparaît pas sur la page

**Causes possibles:**

1. **Page non supportée**
   - Vérifiez que vous êtes sur une page produit (pas une liste)
   - Consultez la liste des plateformes supportées

2. **DOM non chargé**
   - Attendez le chargement complet de la page
   - Rafraîchissez la page (F5)

3. **Conflit avec autre extension**
   - Désactivez temporairement les autres extensions
   - Testez en mode incognito (avec l'extension autorisée)

**Solution de contournement:**
- Utilisez le popup de l'extension → onglet "Import"
- Collez l'URL du produit manuellement

### Extraction incomplète (images manquantes, prix à 0)

**Cause:** Le site a changé sa structure HTML.

**Solutions:**
1. Rafraîchissez la page et réessayez
2. Attendez quelques secondes que la page charge complètement
3. Signalez le problème via le popup → "Signaler un bug"

**Pour les développeurs:**
```javascript
// Vérifier ce que l'extracteur détecte
console.log(await ShopOptiExtractorRegistry.extract());
```

### Score de qualité trop bas

**Cause:** Données manquantes sur la page source.

**Solutions:**
1. Essayez une autre page du même produit
2. Complétez manuellement les données dans ShopOpti après import
3. Baissez le seuil minimum dans les paramètres (non recommandé)

---

## 🔵 Problèmes d'Import

### "Import échoué" sans message d'erreur

**Cause:** Erreur silencieuse côté backend.

**Solutions:**
1. Vérifiez votre connexion dans le popup
2. Reconnectez-vous avec un nouveau token
3. Vérifiez les logs dans shopopti.io → Activité

### Import très lent

**Cause:** Trop d'imports simultanés ou images lourdes.

**Solutions:**
1. Réduisez le nombre d'imports bulk simultanés
2. Patientez (l'import continue en arrière-plan)
3. Vérifiez votre bande passante

### Produit dupliqué après import

**Cause:** Le système de détection de doublons a échoué.

**Solutions:**
1. Supprimez le doublon dans shopopti.io
2. L'extension devrait maintenant détecter le produit existant
3. Signalez le bug avec l'URL du produit

---

## 🟣 Problèmes de Performance

### L'extension ralentit le navigateur

**Cause:** Trop de scripts injectés ou mémoire saturée.

**Solutions:**
1. Redémarrez Chrome
2. Vérifiez que vous n'avez pas trop d'onglets marketplace ouverts
3. Désactivez les notifications si non nécessaires

### Console remplie d'erreurs ShopOpti

**Cause:** Mode debug activé ou erreurs non critiques.

**Solutions:**
1. Désactivez le mode debug:
   ```javascript
   localStorage.removeItem('SHOPOPTI_DEBUG');
   ```
2. Rafraîchissez la page

---

## 💡 Astuces de Diagnostic

### Vérifier l'état de l'extension

```javascript
// Dans la console du navigateur (sur une page marketplace)

// 1. Vérifier la version
console.log('Version:', chrome.runtime.getManifest().version);

// 2. Vérifier la détection de plateforme
console.log('Platform:', ShopOptiPlatformDetector?.detect(location.href));

// 3. Tester l'extraction
ShopOptiExtractorRegistry?.extract().then(console.log);

// 4. Vérifier le stockage
chrome.storage.local.get(null, console.log);
```

### Réinitialiser l'extension

1. Ouvrez `chrome://extensions`
2. Trouvez ShopOpti+
3. Cliquez "Détails"
4. Cliquez "Effacer les données"
5. Reconnectez-vous avec votre token

### Signaler un Bug

1. Ouvrez le popup ShopOpti
2. Cliquez l'icône ⚙️ (Paramètres)
3. Cliquez "Signaler un bug"
4. Incluez:
   - URL du produit problématique
   - Capture d'écran
   - Message d'erreur exact

---

## 📞 Support

- **Documentation:** [docs.shopopti.io](https://docs.shopopti.io)
- **Email:** support@shopopti.io
- **Discord:** [Rejoindre le serveur](https://discord.gg/shopopti)

Temps de réponse moyen: < 24h
