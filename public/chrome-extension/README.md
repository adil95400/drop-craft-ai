# Drop Craft AI - Extension Chrome

Extension Chrome professionnelle pour scraper automatiquement les produits e-commerce et les synchroniser avec votre plateforme Drop Craft AI.

## 🚀 Fonctionnalités

### Scraping Intelligent
- **Détection automatique** des produits sur toutes les plateformes e-commerce
- **Support multi-plateformes** : Shopify, WooCommerce, Magento, PrestaShop, OpenCart
- **Extraction de données structurées** (JSON-LD, Microdata)
- **Scraping par lots** avec pagination automatique
- **Déduplication intelligente** des produits

### Interface Utilisateur
- **Popup moderne** avec design glassmorphism
- **Indicateurs visuels** de scraping en temps réel
- **Statistiques en direct** des produits scrapés
- **Tooltips informatifs** sur survol des produits
- **Notifications système** pour les actions importantes

### Synchronisation Avancée
- **Sync temps réel** avec Drop Craft AI
- **Stockage local** pour travail hors ligne
- **Retry automatique** en cas d'échec
- **Compression des données** pour optimiser le transfert

### Automatisation
- **Auto-scraping** sur sites configurés
- **Scraping programmé** par intervalles
- **Détection contextuelle** des pages e-commerce
- **Actions en arrière-plan** sans interruption

## 📦 Installation

### Méthode 1 : Installation directe
1. Téléchargez le dossier `chrome-extension`
2. Ouvrez Chrome et allez dans `chrome://extensions/`
3. Activez le "Mode développeur"
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier `chrome-extension`

### Méthode 2 : Depuis Drop Craft AI
1. Connectez-vous à votre compte Drop Craft AI
2. Allez dans Extensions Hub
3. Cliquez sur "Télécharger Extension Chrome"
4. Suivez les instructions d'installation

## 🛠️ Utilisation

### Scraping Manuel
1. **Clic sur l'icône** de l'extension dans la barre d'outils
2. **"Scraper cette page"** pour extraire les produits de la page actuelle
3. **"Scraper tous les produits"** pour un scraping automatique avec pagination

### Scraping par Sélection
1. **Sélectionnez du texte** contenant des informations produit
2. **Clic droit** → "Scraper la sélection"
3. L'extension extrait automatiquement nom et prix

### Auto-Scraping
1. **Activez l'auto-scraping** dans les paramètres
2. **Configurez les sites cibles** à surveiller
3. L'extension scrape automatiquement lors de la navigation

### Menu Contextuel
- **Clic droit** sur une page → "Scraper avec Drop Craft AI"
- **Accès rapide** au dashboard depuis n'importe quelle page
- **Scraping instantané** sans ouvrir le popup

## ⚙️ Configuration

### Paramètres Avancés
```javascript
{
  "autoScrape": false,           // Auto-scraping activé
  "scrapingInterval": 30,        // Intervalle en minutes
  "enableNotifications": true,   // Notifications système
  "targetSites": [               // Sites à surveiller
    "example-shop.com",
    "another-store.fr"
  ],
  "dataRetention": 30,          // Jours de rétention locale
  "syncFrequency": "realtime",  // Fréquence de sync
  "compressionLevel": "high"    // Niveau de compression
}
```

### Sites Supportés
- **Shopify** : Détection via `/cdn/shop/` et `myshopify.com`
- **WooCommerce** : Détection via `wp-content` et classes CSS
- **Magento** : Détection via `/static/version` et structure
- **PrestaShop** : Détection via métadonnées et sélecteurs
- **OpenCart** : Détection via structure JavaScript
- **Générique** : Algorithme de fallback pour autres plateformes

## 🔧 Architecture Technique

### Scripts Principaux
- **`manifest.json`** : Configuration extension
- **`background.js`** : Service worker, gestion événements
- **`content.js`** : Injection dans pages web, extraction données
- **`popup.js`** : Interface utilisateur popup

### Extraction de Données
```javascript
// Stratégies d'extraction (ordre de priorité)
1. Données structurées (JSON-LD)
2. Microdata (schema.org)
3. Sélecteurs CSS spécifiques à la plateforme
4. Extraction générique par heuristiques
```

### Sécurité
- **Permissions minimales** requises
- **Chiffrement local** des données sensibles
- **Validation** de toutes les entrées utilisateur
- **Sandbox** pour l'exécution du code injecté

## 📊 Métriques & Analytics

### Données Collectées
- **Nombre de produits** scrapés par session
- **Sites visités** et temps passé
- **Taux de succès** du scraping par plateforme
- **Performance** (temps d'extraction, taille des données)

### Rapports Disponibles
- **Dashboard temps réel** dans le popup
- **Historique complet** dans Drop Craft AI
- **Analyses de performance** par site
- **Recommandations d'optimisation**

## 🔄 Synchronisation

### Mécanismes de Sync
- **WebSocket** pour updates temps réel
- **HTTP REST** pour sync par lots
- **IndexedDB** pour cache local performant
- **Service Worker** pour sync en arrière-plan

### Gestion des Conflits
- **Timestamp-based resolution**
- **Merge intelligent** des données
- **Backup automatique** avant modifications
- **Rollback** en cas d'erreur

## 🛡️ Confidentialité

### Données Locales
- **Stockage chiffré** avec clés rotatives
- **Nettoyage automatique** après expiration
- **Aucune donnée personnelle** collectée sans consentement

### Données Transmises
- **Chiffrement TLS 1.3** pour toutes les communications
- **Anonymisation** des URLs sensibles
- **Conformité RGPD** complète

## 🚨 Dépannage

### Problèmes Courants

**Extension ne se charge pas**
```bash
1. Vérifiez que le mode développeur est activé
2. Rechargez l'extension dans chrome://extensions/
3. Vérifiez les erreurs dans la console
```

**Scraping ne fonctionne pas**
```bash
1. Actualisez la page cible
2. Vérifiez les permissions de l'extension
3. Testez sur une autre page e-commerce
```

**Sync avec Drop Craft AI échoue**
```bash
1. Vérifiez votre connexion internet
2. Reconnectez-vous à Drop Craft AI
3. Videz le cache de l'extension
```

### Logs de Debug
```javascript
// Activer les logs détaillés
chrome.storage.local.set({ debugMode: true });

// Voir les logs dans
chrome.extension.getBackgroundPage().console
```

## 📈 Performances

### Optimisations
- **Lazy loading** des composants non critiques
- **Debouncing** des requêtes rapprochées
- **Mise en cache** intelligente des sélecteurs
- **Batch processing** des requêtes API

### Benchmarks
- **< 50ms** : Temps d'injection content script
- **< 200ms** : Extraction page simple (< 20 produits)
- **< 2s** : Scraping complet avec pagination
- **< 10MB** : Empreinte mémoire maximale

## 🔮 Roadmap

### V1.1 - Intelligence Artificielle
- **Classification automatique** des produits
- **Analyse de sentiment** des reviews
- **Détection de tendances** en temps réel
- **Recommandations de prix** basées sur l'IA

### V1.2 - Collaboration
- **Partage de sessions** de scraping
- **Équipes** avec rôles et permissions
- **Templates** de configuration partagés
- **Marketplace** d'extensions communautaires

### V1.3 - Multi-Browser
- **Support Firefox** complet
- **Extension Safari** (Mac/iOS)
- **Extension Edge** optimisée
- **Sync inter-navigateurs**

## 📞 Support

### Documentation
- **Guide utilisateur** : [docs.dropcraft.ai/chrome-extension](https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com/docs/chrome-extension)
- **API Reference** : [api.dropcraft.ai/extension](https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com/api/extension/docs)
- **Exemples de code** : [github.com/dropcraft-ai/chrome-extension](https://github.com/dropcraft-ai/chrome-extension)

### Communauté
- **Discord** : [discord.gg/dropcraft](https://discord.gg/dropcraft)
- **Forum** : [community.dropcraft.ai](https://community.dropcraft.ai)
- **Stack Overflow** : Tag `dropcraft-ai`

### Contact Direct
- **Email** : support@dropcraft.ai
- **Chat** : Depuis l'application Drop Craft AI
- **Téléphone** : +33 1 XX XX XX XX (support premium)

---

**Drop Craft AI Chrome Extension v1.0.0**  
© 2024 Drop Craft AI. Tous droits réservés.