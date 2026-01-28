# Changelog - ShopOpti+ Extension

Toutes les modifications notables de l'extension ShopOpti+ sont documentées ici.

## [5.7.0] - 2025-01-28

### ✨ Nouvelles Fonctionnalités

- **Pipeline d'Extraction Atomique** - Nouveau flux d'import en 6 étapes (Detect → Extract → Validate → Normalize → Confirm → Import) avec feedback utilisateur à chaque étape
- **Prévisualisation Pré-Import** - Modal de confirmation affichant score qualité, données extraites et avertissements avant persistance
- **17 Extracteurs Modulaires** - Extracteurs dédiés par plateforme avec isolation complète pour mises à jour rapides
- **Interception Réseau Avancée** - Capture des données API natives (fetch/XHR) pour contourner les protections DOM
- **Score de Qualité 0-100%** - Évaluation automatique des données avec seuils configurables (60% minimum par défaut)

### 🔧 Améliorations

- **Base Extractor Contract** - Classe de base standardisant toutes les méthodes d'extraction (pricing, media, variants, reviews)
- **Platform Detector** - Détection automatique de 17+ plateformes avec extraction d'ID produit et locale régionale
- **Extraction Orchestrator** - Gestionnaire central du cycle de vie des jobs avec tracking de progression
- **Extractor Bridge** - Interface unifiée connectant tous les extracteurs avec stratégies API/Network/DOM
- **Images HD Automatiques** - Upgrade automatique des URLs images vers résolutions maximales par plateforme

### 🐛 Corrections

- Correction de l'extraction des variantes AliExpress avec SKU properties complexes
- Amélioration du parsing des prix européens (format 1.234,56 €)
- Fix de la détection Shopify pour les stores avec domaines personnalisés
- Correction du timeout sur les pages Temu à chargement lent

### 📊 Tests

- Suite de tests unitaires complète (product-validator, data-normalizer, platform-detector)
- Tests d'intégration pour le pipeline complet
- Tests E2E pour les 17 plateformes supportées
- Benchmarks de performance et tests de fiabilité

### 🏗️ Architecture

```
Nouveaux fichiers:
├── lib/base-extractor.js          # Contrat d'extraction unifié
├── lib/platform-detector.js       # Détection plateforme avancée
├── lib/extraction-orchestrator.js # Gestionnaire de jobs
├── lib/extractor-bridge.js        # Interface extracteurs unifiée
└── extractors/*-extractor.js      # 17 extracteurs mis à jour v5.7.0
```

---

## [5.6.6] - 2025-01-15

### Améliorations
- Détection environnement preview vs extension installée
- Toast notifications pour guider l'installation
- Optimisation du popup pour authentification token-only

---

## [5.6.0] - 2025-01-01

### Nouvelles Fonctionnalités
- Support TikTok Shop
- Extraction vidéos pour Amazon et AliExpress
- Import bulk avec queue et retry automatique

---

## [5.5.0] - 2024-12-15

### Nouvelles Fonctionnalités
- Support Etsy avec extraction matériaux
- Amélioration extraction avis avec photos
- Traduction automatique via LibreTranslate

---

## Notes de Migration

### De 5.6.x vers 5.7.0

1. **Aucune action requise** - L'extension se met à jour automatiquement via le système de téléchargement
2. Les tokens existants restent valides
3. Les imports en cours seront préservés

### Compatibilité

- Chrome 88+
- Edge 88+
- Brave (dernière version)
- Opera (dernière version)
