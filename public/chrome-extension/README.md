# ShopOpti+ Chrome Extension v5.7.0

> Extension professionnelle d'import de produits e-commerce pour 17+ plateformes marketplace.

## 🚀 Fonctionnalités Principales

- **Import 1-clic** depuis Amazon, AliExpress, eBay, Temu, Shein, Shopify, Etsy et 10+ autres
- **Extraction HD** des images, vidéos et variantes produit
- **Validation intelligente** avec score de qualité 0-100%
- **Import bulk** avec gestion de file d'attente et retry automatique
- **Synchronisation temps réel** avec ShopOpti Cloud
- **Pipeline atomique** en 6 étapes avec feedback utilisateur

## 📦 Installation

### Option 1: Téléchargement automatique (Recommandé)

1. Connectez-vous à [shopopti.io](https://shopopti.io)
2. Naviguez vers `/extensions/chrome`
3. Cliquez sur **"Télécharger l'extension"**
4. Décompressez le fichier ZIP téléchargé
5. Ouvrez Chrome → `chrome://extensions`
6. Activez le **"Mode développeur"** (coin supérieur droit)
7. Cliquez **"Charger l'extension non empaquetée"**
8. Sélectionnez le dossier décompressé

### Option 2: Installation manuelle

```bash
# Cloner le repository
git clone https://github.com/your-org/shopopti-extension.git

# Naviguer vers le dossier extension
cd public/chrome-extension

# Charger dans Chrome (étapes 5-8 ci-dessus)
```

## 🔐 Configuration

### Authentification par Token

1. Rendez-vous sur [shopopti.io/auth/extension](https://shopopti.io/auth/extension)
2. Générez un nouveau token d'extension
3. Dans l'extension, collez le token dans le champ prévu
4. Cliquez **"Connecter"**

Le token expire après 1 an et peut être révoqué à tout moment.

## 🎯 Utilisation

### Import Rapide

1. Visitez une page produit sur une plateforme supportée
2. Le bouton **"+ ShopOpti"** apparaît automatiquement
3. Cliquez pour prévisualiser les données extraites
4. Vérifiez le score de qualité (recommandé: ≥60%)
5. Confirmez pour importer dans votre catalogue

### Import en Masse

1. Ouvrez le popup de l'extension
2. Sélectionnez l'onglet **"Bulk Import"**
3. Collez vos URLs (une par ligne)
4. Configurez les options (variantes, avis, etc.)
5. Lancez l'import

## 🌐 Plateformes Supportées

| Plateforme | Produits | Variantes | Avis | Images HD | Vidéos |
|------------|----------|-----------|------|-----------|--------|
| Amazon | ✅ | ✅ | ✅ | ✅ | ✅ |
| AliExpress | ✅ | ✅ | ✅ | ✅ | ✅ |
| eBay | ✅ | ✅ | ✅ | ✅ | ❌ |
| Temu | ✅ | ✅ | ✅ | ✅ | ✅ |
| Shein | ✅ | ✅ | ✅ | ✅ | ❌ |
| Shopify | ✅ | ✅ | ✅ | ✅ | ✅ |
| Etsy | ✅ | ✅ | ✅ | ✅ | ✅ |
| CJ Dropshipping | ✅ | ✅ | ❌ | ✅ | ❌ |
| Banggood | ✅ | ✅ | ✅ | ✅ | ❌ |
| DHgate | ✅ | ✅ | ❌ | ✅ | ❌ |
| Wish | ✅ | ✅ | ✅ | ✅ | ❌ |
| Cdiscount | ✅ | ❌ | ✅ | ✅ | ❌ |
| Walmart | ✅ | ✅ | ✅ | ✅ | ❌ |
| Home Depot | ✅ | ✅ | ✅ | ✅ | ❌ |
| Fnac | ✅ | ❌ | ✅ | ✅ | ❌ |
| Rakuten | ✅ | ✅ | ✅ | ✅ | ❌ |
| TikTok Shop | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🏗️ Architecture v5.7.0

```
public/chrome-extension/
├── manifest.json                    # Configuration Chrome Extension (Manifest V3)
├── background.js                    # Service Worker
├── content-script.js                # Script d'injection principal
├── popup.html/css/js                # Interface utilisateur
├── extractors/                      # Extracteurs modulaires par plateforme
│   ├── extractor-registry.js        # Registre central des extracteurs
│   ├── amazon-extractor.js          # Amazon (toutes régions)
│   ├── aliexpress-extractor.js      # AliExpress
│   ├── ebay-extractor.js            # eBay
│   ├── temu-extractor.js            # Temu
│   ├── shein-extractor.js           # Shein
│   ├── shopify-extractor.js         # Stores Shopify
│   ├── etsy-extractor.js            # Etsy
│   └── ...                          # 10+ autres extracteurs
├── lib/                             # Librairies partagées
│   ├── base-extractor.js            # Contrat d'extraction unifié
│   ├── platform-detector.js         # Détection plateforme avancée
│   ├── extraction-orchestrator.js   # Gestionnaire cycle de vie jobs
│   ├── extractor-bridge.js          # Interface extracteurs unifiée
│   ├── retry-manager.js             # Gestion retry exponential backoff
│   └── session-manager.js           # Gestion tokens/sessions
└── docs/                            # Documentation
    ├── DEVELOPER_GUIDE.md           # Guide création extracteurs
    ├── API_REFERENCE.md             # Référence API complète
    └── TROUBLESHOOTING.md           # Résolution problèmes
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
| `/import-product` | Import d'un produit unique |
| `/bulk-import` | Import en masse |
| `/extension-sync` | Synchronisation état extension |
| `/validate-token` | Validation token extension |

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
    "https://*/*",
    "http://*/*"
  ]
}
```

## 🧪 Tests

```bash
# Exécuter tous les tests
npm run test

# Tests E2E extension uniquement
npm run test -- src/test/chrome-extension

# Tests spécifiques
npm run test -- src/test/chrome-extension/e2e/extraction-e2e.test.ts
```

### Couverture de Tests

- **Unit Tests**: Validation, normalisation, détection plateforme
- **Integration Tests**: Pipeline complet d'import
- **E2E Tests**: 17 plateformes, performance, fiabilité

## 📝 Notes de Version

### v5.7.0 (Janvier 2025)
- **Pipeline Atomique**: Flux 6 étapes (Detect → Extract → Validate → Normalize → Confirm → Import)
- **Prévisualisation Pré-Import**: Modal confirmation avec score qualité
- **17 Extracteurs Modulaires**: Isolation complète pour mises à jour rapides
- **Interception Réseau**: Capture données API natives (fetch/XHR)
- **Score Qualité 0-100%**: Évaluation automatique des données

### v5.6.6 (Janvier 2025)
- Détection environnement preview vs extension installée
- Optimisation popup authentification token-only

### v5.6.0 (Janvier 2025)
- Support TikTok Shop
- Extraction vidéos pour Amazon et AliExpress
- Import bulk avec queue et retry automatique

## 📄 Licence

Propriétaire - ShopOpti © 2025

## 📞 Support

- **Documentation:** [docs.shopopti.io](https://docs.shopopti.io)
- **Website:** [shopopti.io](https://shopopti.io)
- **Email:** support@shopopti.io
- **Discord:** [Rejoindre le serveur](https://discord.gg/shopopti)
