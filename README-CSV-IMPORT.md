# Import CSV - Guide Complet

## Template CSV Standardisé

Le système d'import supporte un template CSV complet avec plus de 60 colonnes pour une intégration e-commerce optimale.

### Colonnes Supportées

#### Informations Produit de Base
- `id` : identifiant interne unique
- `sku` : SKU principal du produit
- `title` : titre produit (optimisé SEO)
- `description` : description HTML/texte
- `category` / `sub_category` : hiérarchie produit
- `brand` : marque (optionnel)
- `tags` : mots-clés, séparés par `;`

#### Prix et Devises
- `price` / `currency` : prix de vente et devise (EUR, USD…)
- `compare_at_price` : ancien prix / prix barré
- `cost` : coût d'achat fournisseur
- `suggested_price` : prix recommandé (IA ou fournisseur)

#### Stock et Commandes
- `stock` / `quantity` : stock disponible / quantité par défaut
- `min_order` / `max_order` : limites de commande

#### Dimensions et Poids
- `weight` / `weight_unit` : poids + unité (kg, g, lb)
- `length` / `width` / `height` / `dimension_unit` : dimensions + unité (cm, mm, in)

#### État et Variantes
- `condition` : état (new, refurbished, used)
- `variant_group` / `variant_name` / `variant_sku` : gestion des variantes (taille, couleur, etc.)
- `variant_price` / `variant_stock` / `variant_image` : infos variantes spécifiques

#### Médias
- `images` / `main_image_url` / `additional_image_urls` : gestion multi-images (séparées par `;`)
- `video_url` : URL vidéo produit (YouTube, Vimeo, mp4 direct)

#### Attributs Marketing
- `color` / `size` / `material` / `style` : attributs marketing
- `genders` / `target_audience` : public visé (men, women, kids)

#### Codes Standardisés
- `barcode` / `ean` / `upc` / `mpn` / `gtin` : codes standardisés

#### Informations Fournisseur
- `vendor` / `supplier` / `supplier_sku` / `supplier_price` / `supplier_link` : infos fournisseur

#### Livraison et Localisation
- `shipping_time` / `shipping_cost` : délais et coûts de livraison
- `country_of_origin` / `currency_region` / `language` : localisation

#### SEO Avancé
- `seo_title` / `seo_description` / `seo_keywords` / `meta_tags` : SEO avancé

#### Champs Personnalisés
- `custom_fields` : champs spécifiques (JSON ou texte)
- `product_url` : URL finale du produit dans la boutique

## Utilisation

### 1. Télécharger le Template
- Rendez-vous sur `/import`
- Cliquez sur "Import CSV/Excel" 
- Cliquez sur "Télécharger Template" pour obtenir le fichier `template-import.csv`

### 2. Remplir le Template
- Utilisez le fichier téléchargé comme base
- Remplissez les colonnes nécessaires pour vos produits
- Respectez les formats :
  - Prix : nombres décimaux (ex: 29.90)
  - Images multiples : séparées par `;` (ex: img1.jpg;img2.jpg)
  - Tags : séparés par `;` (ex: tag1;tag2;tag3)
  - Booléens : `true`/`false` ou `1`/`0`

### 3. Importer le Fichier
- Sélectionnez votre fichier CSV rempli
- Cliquez sur "Importer le fichier"
- Suivez la progression de l'import
- Consultez le résultat dans "Produits Importés"

## Mapping Automatique

Le système détecte automatiquement les colonnes grâce à un mapping intelligent :
- Supporte les noms en français et anglais
- Détecte les variantes de noms communs
- Mappe automatiquement vers les champs de la base de données

## Gestion des Erreurs

- Validation des champs requis (nom, prix)
- Gestion des types de données
- Rapport détaillé des erreurs par ligne
- Possibilité de corriger et re-importer

## Compatibilité

✅ **Compatible avec :**
- Shopify exports
- WooCommerce exports  
- AliExpress listings
- Amazon seller reports
- Feuilles Excel personnalisées
- Catalogues fournisseurs

Le template est conçu pour être universellement compatible avec les principales plateformes e-commerce.