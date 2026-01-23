# ShopOpti+ Chrome Extension v3.0

Extension Chrome professionnelle pour le dropshipping avec import 1-click, surveillance des prix et automatisation.

## 🚀 Installation pour Développeurs

### Mode Développeur (Local)

1. Ouvrez Chrome et allez à `chrome://extensions/`
2. Activez le "Mode développeur" (coin supérieur droit)
3. Cliquez sur "Charger l'extension non empaquetée"
4. Sélectionnez le dossier `public/chrome-extension/`

### Publication sur Chrome Web Store

1. Compressez tout le contenu du dossier en `.zip`
2. Allez sur [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Payez les frais d'inscription (5$ une seule fois)
4. Créez un nouvel élément et uploadez le `.zip`
5. Remplissez les informations (voir `STORE_LISTING.md`)
6. Soumettez pour révision

## 📁 Structure des Fichiers

```
chrome-extension/
├── manifest.json          # Configuration de l'extension (Manifest V3)
├── background.js          # Service Worker (582 lignes)
├── content.js             # Script injecté sur les pages (765 lignes)
├── content.css            # Styles pour content script
├── injected.js            # Script avancé de détection
├── popup.html             # Interface popup principale
├── popup.js               # Logique du popup (557 lignes)
├── popup.css              # Styles du popup
├── options.html           # Page de configuration
├── options.js             # Logique des options
├── auth.html              # Page d'authentification
├── auth.js                # Logique d'authentification
├── icons/                 # Icônes de l'extension
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── README.md              # Ce fichier
├── PRIVACY_POLICY.md      # Politique de confidentialité (requis)
└── STORE_LISTING.md       # Informations pour le Store
```

## 🔧 Configuration API

L'extension se connecte à l'API ShopOpti+ :

```javascript
const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
const APP_URL = 'https://shopopti.io';
```

### Endpoints Utilisés

| Endpoint | Description |
|----------|-------------|
| `/extension-sync` | Synchronisation des données et import produits |
| `/product-url-scraper` | Import par URL avec Firecrawl |
| `/analyze-competitor` | Analyse concurrentielle |
| `/ai-optimize-product` | Optimisation IA des produits |

## ⚙️ Fonctionnalités Complètes

### 📦 Import 1-Click
- Détection automatique des pages produit
- Extraction des données (titre, prix, images, description)
- Import direct vers le dashboard ShopOpti+
- Support JSON-LD et Microdata

### ⭐ Import d'Avis
- Extraction des reviews depuis les pages produit
- Filtrage par note et pertinence
- Import bulk possible

### 📊 Surveillance des Prix
- Monitoring automatique toutes les 30 minutes
- Alertes push en cas de changement
- Historique des prix

### 🤖 Automatisation
- Auto-injection des boutons d'import
- Alertes de stock automatiques
- Synchronisation temps réel
- Menu contextuel (clic droit)

## 🌐 Plateformes Supportées (16+)

| Plateforme | Import | Avis | Prix |
|------------|--------|------|------|
| AliExpress | ✅ | ✅ | ✅ |
| Amazon | ✅ | ✅ | ✅ |
| eBay | ✅ | ✅ | ✅ |
| Temu | ✅ | ✅ | ✅ |
| Walmart | ✅ | ✅ | ✅ |
| Etsy | ✅ | ✅ | ✅ |
| Wish | ✅ | ✅ | ✅ |
| Banggood | ✅ | ✅ | ✅ |
| DHgate | ✅ | ✅ | ✅ |
| 1688 | ✅ | ⚠️ | ✅ |
| Taobao | ✅ | ⚠️ | ✅ |
| Shein | ✅ | ✅ | ✅ |
| CJ Dropshipping | ✅ | ✅ | ✅ |
| LightInTheBox | ✅ | ✅ | ✅ |
| Gearbest | ✅ | ✅ | ✅ |

### CMS E-commerce Détectés
- Shopify
- WooCommerce
- Magento
- PrestaShop
- OpenCart
- Sites génériques

## 🔐 Authentification

1. L'utilisateur se connecte via `auth.html`
2. Un token est généré et stocké dans `chrome.storage.local`
3. Le token est envoyé via header `x-extension-token`
4. Le token expire après 30 jours

## 📋 Permissions Requises

```json
{
  "permissions": [
    "activeTab",      // Accès à l'onglet actif
    "storage",        // Sauvegarde locale des préférences
    "tabs",           // Détection des sites e-commerce
    "scripting",      // Injection des boutons d'import
    "notifications",  // Alertes de prix
    "alarms",         // Vérifications programmées
    "contextMenus"    // Menu clic droit
  ],
  "host_permissions": [
    "https://*/*",    // Accès aux sites HTTPS
    "http://*/*"      // Accès aux sites HTTP
  ]
}
```

## 🧪 Tests

### Test Manuel

1. Installer l'extension en mode développeur
2. Aller sur AliExpress/Amazon
3. Ouvrir le popup de l'extension
4. Tester chaque fonctionnalité

### Vérification de la Connexion API

```bash
curl -X POST https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1/extension-sync \
  -H "Content-Type: application/json" \
  -d '{"action": "sync_status"}'
```

## ✅ Checklist Publication Chrome Web Store

- [x] Manifest V3 configuré
- [x] Toutes les icônes (16, 32, 48, 128px)
- [x] Privacy Policy (`PRIVACY_POLICY.md`)
- [x] Store Listing (`STORE_LISTING.md`)
- [x] Popup fonctionnel
- [x] Options page fonctionnelle
- [x] Authentification fonctionnelle
- [x] Content scripts injectés
- [x] Background service worker
- [x] Menu contextuel
- [x] Notifications
- [x] Alarms pour surveillance
- [ ] Screenshots (1280x800 ou 640x400)
- [ ] Promotional tiles
- [ ] Compte développeur Chrome ($5)

## 📝 Notes de Version

### v3.0.0 (Janvier 2025)
- Migration vers Manifest V3
- Nouveau design du popup (style AutoDS)
- Support de 16+ plateformes
- Système d'authentification amélioré
- Import d'avis
- Surveillance des prix en temps réel
- Menu contextuel complet
- Synchronisation avec ShopOpti+ Cloud
- **Auto-Order** : Commandes automatiques
- **Spy Competitor** : Analyse concurrentielle
- **Bulk Import CSV** : Import en masse depuis fichier
- **AI Optimize** : Optimisation IA des descriptions (PRO)

## 📄 Licence

Propriétaire - ShopOpti+ © 2025

## 📞 Support

- **Website:** https://shopopti.io
- **Support:** https://shopopti.io/support
- **Email:** support@shopopti.com
