
# Plan d'import du flux Matterhorn

## Analyse du flux

Le fichier `https://lingeriematterhorn.fr/xmldata/products_full.php?type=shopify&category_id=223` est au **format CSV Shopify** contenant :
- **Colonnes** : Handle, Title, Body (HTML), Vendor, Type, Tags, Published, Option1 Name/Value, Variant SKU, Variant Price, Image Src, Barcode, etc.
- **Structure** : Format d'export natif Shopify avec variantes

## Méthodes d'import disponibles actuellement

### 1. Import CSV avec auto-mapping (CSVImportWizard)
- **Accès** : `/import/quick` ou via le Hub Import
- **Comment** : Télécharger le fichier CSV depuis l'URL, puis uploader
- **Avantage** : Mapping automatique des 43+ champs Shopify FR/EN

### 2. Import XML/Feed URL (XMLFeedImporter)
- **Accès** : Hub Import → Fichiers & Feeds → XML
- **Limitation actuelle** : Supporte XML/RSS, pas CSV via URL directement

### 3. Import JSON/XML via URL (xml-json-import)
- **Edge function** : Supporte JSON et XML
- **Limitation** : Ne parse pas CSV actuellement

---

## Améliorations proposées

### Nouvelle fonctionnalité : Import Feed URL universel

Je propose de créer un **composant d'import universel par URL** qui :

1. **Détecte automatiquement le format** (CSV, XML, JSON) en analysant le contenu
2. **Supporte votre flux Matterhorn** et autres fournisseurs
3. **Interface simplifiée** : Coller l'URL → Prévisualiser → Importer

### Fichiers à créer/modifier

```text
┌─────────────────────────────────────────────────────────────────┐
│  ARCHITECTURE - Import Feed URL Universel                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Utilisateur]                                                   │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────┐                            │
│  │ FeedURLImporter.tsx             │                            │
│  │ - Input URL                     │                            │
│  │ - Détection format              │                            │
│  │ - Prévisualisation              │                            │
│  │ - Mapping automatique           │                            │
│  └─────────────────┬───────────────┘                            │
│                    │                                             │
│                    ▼                                             │
│  ┌─────────────────────────────────┐                            │
│  │ feed-url-import Edge Function   │                            │
│  │ - Fetch URL                     │                            │
│  │ - Auto-detect CSV/XML/JSON      │                            │
│  │ - Parse selon format            │                            │
│  │ - Mapping intelligent           │                            │
│  └─────────────────┬───────────────┘                            │
│                    │                                             │
│                    ▼                                             │
│  ┌─────────────────────────────────┐                            │
│  │ imported_products (DB)          │                            │
│  └─────────────────────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Nouveau composant `FeedURLImporter.tsx`

Interface utilisateur avec :
- Champ pour coller l'URL du flux
- Bouton "Analyser" pour détecter le format
- Prévisualisation des produits détectés
- Configuration du mapping si nécessaire
- Options : sync automatique, intervalle, store cible
- Progression de l'import en temps réel

### 2. Nouvelle Edge Function `feed-url-import`

Fonctionnalités :
- Fetch du contenu distant
- Détection automatique du format (CSV, XML, JSON)
- Parser CSV avec support Shopify FR/EN
- Mapping intelligent des colonnes
- Mode test (aperçu) et mode import complet
- Gestion des variantes Shopify (consolidation par Handle)
- Import par lots avec suivi de progression

### 3. Intégration dans le Hub Import

Ajouter une carte visible "Import par URL Feed" dans la section "Fichiers & Feeds" avec :
- Icône distinctive
- Description claire
- Badge "Nouveau"

---

## Détails techniques

### Parser CSV Shopify intégré

Le parser gérera :
- Consolidation des variantes par `Handle`
- Parsing des prix internationaux (virgule/point)
- Extraction des images multiples
- Gestion des options (taille, couleur)
- Codes-barres EAN/UPC

### Presets de mapping par fournisseur

- **Matterhorn** : Mapping spécifique pour leur format
- **Google Shopping** : Format standard
- **Shopify Export** : Mapping natif
- **Custom** : Configuration manuelle

### Synchronisation planifiée (optionnel)

- Enregistrement du flux dans `scheduled_imports`
- Intervalle configurable (15min à 24h)
- Notifications de mise à jour

---

## Résumé des livrables

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/import/FeedURLImporter.tsx` | Créer | Interface import URL universelle |
| `supabase/functions/feed-url-import/index.ts` | Créer | Edge function multi-format |
| `src/components/import/ImportHub.tsx` | Modifier | Ajouter carte Feed URL |
| `src/pages/ImportPage.tsx` | Modifier | Route vers nouveau composant |

Cette solution vous permettra d'importer directement depuis l'URL Matterhorn sans téléchargement manuel.
