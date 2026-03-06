/**
 * Documentation Articles Data Store
 * Full content for all documentation guides organized by category
 */

export interface DocArticle {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  readTime: string;
  lastUpdated: string;
  content: string;
  relatedLinks?: { title: string; slug: string }[];
}

export function slugifyDoc(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getDocArticleBySlug(slug: string): DocArticle | null {
  return ALL_DOC_ARTICLES.find(a => a.slug === slug) || null;
}

export function getDocArticlesByCategory(categorySlug: string): DocArticle[] {
  return ALL_DOC_ARTICLES.filter(a => a.categorySlug === categorySlug);
}

export const ALL_DOC_ARTICLES: DocArticle[] = [
  // ═══════════════════════════════════════
  // CATALOGUE PRODUITS
  // ═══════════════════════════════════════
  {
    slug: 'importer-depuis-aliexpress',
    title: 'Importer depuis AliExpress',
    category: 'Catalogue Produits',
    categorySlug: 'catalogue-produits',
    readTime: '8 min',
    lastUpdated: '2026-02-15',
    content: `
## Importer des produits depuis AliExpress

ShopOpti+ vous permet d'importer des produits AliExpress en quelques clics grâce à notre extension Chrome et notre moteur d'import intelligent.

### Prérequis

- Un compte ShopOpti+ actif (plan Starter ou supérieur)
- L'extension Chrome ShopOpti+ installée (recommandé)
- Un navigateur Chrome, Edge ou Brave

### Méthode 1 : Via l'extension Chrome

1. **Installez l'extension** depuis le Chrome Web Store
2. **Naviguez sur AliExpress** et trouvez le produit souhaité
3. **Cliquez sur l'icône ShopOpti+** dans la barre d'extensions
4. **Sélectionnez « Importer »** — le produit est ajouté à votre catalogue

L'extension récupère automatiquement :
- Les images haute résolution
- Les variantes (taille, couleur, etc.)
- Les prix fournisseur et les délais de livraison
- Les avis clients et la note moyenne

### Méthode 2 : Via l'URL du produit

1. Rendez-vous dans **Import > Import par URL**
2. Collez l'URL du produit AliExpress
3. ShopOpti+ analyse la page et extrait toutes les données
4. Personnalisez le titre, la description et les prix
5. Cliquez sur **Importer**

### Méthode 3 : Import en masse

1. Préparez un fichier CSV avec les URLs AliExpress (une par ligne)
2. Allez dans **Import > Import CSV**
3. Uploadez le fichier
4. ShopOpti+ traite automatiquement chaque URL en arrière-plan

### Optimisation automatique

Après l'import, ShopOpti+ propose :
- **Réécriture IA** des titres et descriptions pour le SEO
- **Ajustement automatique des prix** selon vos règles de marge
- **Suppression des watermarks** fournisseur sur les images
- **Traduction** en 68+ langues

### Conseils

> ⚡ **Astuce Pro** : Utilisez l'import par lot pour traiter jusqu'à 1000 produits simultanément. L'IA optimise chaque fiche pour maximiser vos conversions.

> ⚠️ **Attention** : Vérifiez toujours les droits d'utilisation des images et la conformité de chaque produit avec les politiques de votre marketplace.
    `,
    relatedLinks: [
      { title: 'Optimisation IA des fiches produits', slug: 'optimisation-ia-des-fiches-produits' },
      { title: 'Gestion des variantes et options', slug: 'gestion-des-variantes-et-options' },
      { title: 'Import CJ Dropshipping', slug: 'import-cj-dropshipping' },
    ]
  },
  {
    slug: 'optimisation-ia-des-fiches-produits',
    title: 'Optimisation IA des fiches produits',
    category: 'Catalogue Produits',
    categorySlug: 'catalogue-produits',
    readTime: '10 min',
    lastUpdated: '2026-02-20',
    content: `
## Optimisation IA des fiches produits

L'IA de ShopOpti+ analyse et optimise automatiquement vos fiches produits pour maximiser le SEO et les conversions.

### Fonctionnalités principales

#### 1. Génération de titres optimisés
L'IA génère des titres qui intègrent les mots-clés les plus recherchés tout en restant naturels et attractifs.

**Avant :** \`Robe femme été 2024 nouvelle collection\`
**Après :** \`Robe d'Été Élégante pour Femme – Coupe Fluide & Confortable | Collection 2026\`

#### 2. Descriptions SEO enrichies
Génération automatique de descriptions structurées avec :
- Paragraphe d'accroche orienté bénéfices
- Liste des caractéristiques techniques
- Section FAQ intégrée
- Appel à l'action persuasif

#### 3. Optimisation des métadonnées
- Meta titles < 60 caractères avec mot-clé principal
- Meta descriptions < 160 caractères avec CTA
- Balises Alt sur toutes les images
- Données structurées JSON-LD Product

#### 4. Score de qualité en temps réel
Chaque fiche reçoit un score sur 100 basé sur :
- **Titre** (20 pts) : longueur, mots-clés, unicité
- **Description** (25 pts) : longueur, structure, mots-clés
- **Images** (25 pts) : nombre, qualité, alt text
- **Meta** (15 pts) : title, description, URL
- **Structure** (15 pts) : variantes, prix, stock

### Comment utiliser

1. Sélectionnez un ou plusieurs produits dans votre catalogue
2. Cliquez sur **IA > Optimiser les fiches**
3. Choisissez le ton (professionnel, décontracté, luxe...)
4. Validez ou modifiez les suggestions
5. Appliquez les changements

### Traitement par lot

Pour optimiser en masse :
1. Allez dans **Catalogue > Actions groupées**
2. Sélectionnez les produits à optimiser
3. Choisissez **Optimisation IA par lot**
4. L'IA traite chaque produit en arrière-plan

> 💡 **Conseil** : Utilisez l'optimisation IA après chaque import pour garantir la qualité de vos listings.
    `,
    relatedLinks: [
      { title: 'Importer depuis AliExpress', slug: 'importer-depuis-aliexpress' },
      { title: 'Dashboard analytics', slug: 'dashboard-analytics' },
    ]
  },
  {
    slug: 'gestion-des-variantes-et-options',
    title: 'Gestion des variantes et options',
    category: 'Catalogue Produits',
    categorySlug: 'catalogue-produits',
    readTime: '7 min',
    lastUpdated: '2026-02-10',
    content: `
## Gestion des variantes et options

Gérez efficacement les variantes de vos produits (taille, couleur, matière) avec ShopOpti+.

### Types de variantes supportés

- **Taille** : XS, S, M, L, XL, XXL ou personnalisé
- **Couleur** : Sélecteur visuel avec swatch
- **Matière** : Texte libre
- **Style** : Texte libre
- **Personnalisé** : Créez vos propres options

### Créer des variantes

1. Ouvrez la fiche produit
2. Section **Variantes**, cliquez **Ajouter une option**
3. Nommez l'option (ex: "Taille")
4. Ajoutez les valeurs (ex: S, M, L)
5. Définissez prix et stock par variante

### Gestion du stock par variante

Chaque variante possède son propre stock indépendant :
- Stock disponible
- Stock réservé (commandes en cours)
- Seuil d'alerte configurable
- Réapprovisionnement automatique (si configuré)

### Import de variantes

Lors de l'import CSV, utilisez les colonnes :
\`\`\`
variant_option1_name, variant_option1_value, variant_price, variant_sku, variant_stock
\`\`\`

### Synchronisation multi-canal

Les variantes sont synchronisées automatiquement avec :
- Shopify (via API Variants)
- WooCommerce (via Product Variations)
- Amazon (via listings multiples)

> ⚡ **Astuce** : Utilisez l'édition groupée pour modifier les prix de toutes les variantes d'un coup.
    `,
    relatedLinks: [
      { title: 'Édition groupée (Bulk Edit)', slug: 'edition-groupee-bulk-edit' },
      { title: 'Gestion du stock', slug: 'gestion-du-stock' },
    ]
  },
  {
    slug: 'edition-groupee-bulk-edit',
    title: 'Édition groupée (Bulk Edit)',
    category: 'Catalogue Produits',
    categorySlug: 'catalogue-produits',
    readTime: '6 min',
    lastUpdated: '2026-01-28',
    content: `
## Édition groupée (Bulk Edit)

Modifiez des centaines de produits simultanément grâce à l'éditeur groupé de ShopOpti+.

### Actions disponibles en masse

| Action | Description |
|--------|-------------|
| **Modifier les prix** | Augmenter/diminuer de X% ou montant fixe |
| **Modifier le stock** | Définir, ajouter ou soustraire du stock |
| **Modifier les catégories** | Assigner/retirer des collections |
| **Modifier les tags** | Ajouter/supprimer des tags |
| **Modifier le statut** | Actif, brouillon, archivé |
| **Modifier le fournisseur** | Réassigner à un autre fournisseur |
| **Appliquer l'IA** | Optimiser titres/descriptions en masse |

### Comment utiliser

1. Dans **Catalogue > Produits**, cochez les produits souhaités
2. La barre d'actions groupées apparaît en haut
3. Sélectionnez l'action à effectuer
4. Configurez les paramètres
5. Cliquez **Appliquer à X produits**

### Filtrage avancé

Utilisez les filtres pour sélectionner précisément :
- Par catégorie ou collection
- Par fournisseur
- Par plage de prix
- Par niveau de stock
- Par score de qualité IA
- Par statut de publication

### Import/Export CSV pour modification

1. **Exportez** votre catalogue en CSV
2. Modifiez dans Excel/Google Sheets
3. **Réimportez** le CSV modifié
4. ShopOpti+ détecte les changements et applique les mises à jour

> ⚠️ **Attention** : Les modifications groupées sont irréversibles. Utilisez l'export CSV comme sauvegarde avant toute opération importante.
    `,
    relatedLinks: [
      { title: 'Gestion des variantes et options', slug: 'gestion-des-variantes-et-options' },
      { title: 'Catégories et collections', slug: 'categories-et-collections' },
    ]
  },
  {
    slug: 'categories-et-collections',
    title: 'Catégories et collections',
    category: 'Catalogue Produits',
    categorySlug: 'catalogue-produits',
    readTime: '5 min',
    lastUpdated: '2026-01-20',
    content: `
## Catégories et collections

Organisez votre catalogue avec des catégories hiérarchiques et des collections intelligentes.

### Catégories vs Collections

- **Catégories** : Structure hiérarchique fixe (ex: Vêtements > Femme > Robes)
- **Collections** : Regroupements dynamiques basés sur des règles (ex: "Produits en promotion")

### Créer une catégorie

1. Allez dans **Catalogue > Catégories**
2. Cliquez **Nouvelle catégorie**
3. Nommez la catégorie et choisissez le parent (optionnel)
4. Ajoutez une description et une image
5. Sauvegardez

### Collections intelligentes

Les collections automatiques se mettent à jour en temps réel selon des règles :
- Prix > 50€
- Tag contient "promotion"
- Stock < 10
- Score IA > 80
- Ajouté dans les 7 derniers jours

### Synchronisation avec les canaux

Les catégories sont mappées automatiquement vers :
- Les collections Shopify
- Les catégories WooCommerce
- Les catégories Amazon

> 💡 **Conseil** : Créez des collections "Best-sellers" et "Nouveautés" automatiques pour votre vitrine.
    `,
    relatedLinks: [
      { title: 'Édition groupée (Bulk Edit)', slug: 'edition-groupee-bulk-edit' },
      { title: 'Gestion du stock', slug: 'gestion-du-stock' },
    ]
  },
  {
    slug: 'gestion-du-stock',
    title: 'Gestion du stock',
    category: 'Catalogue Produits',
    categorySlug: 'catalogue-produits',
    readTime: '8 min',
    lastUpdated: '2026-02-05',
    content: `
## Gestion du stock

ShopOpti+ centralise la gestion des stocks de tous vos canaux et fournisseurs.

### Vue d'ensemble

Le tableau de bord stock affiche en temps réel :
- Stock disponible par produit et variante
- Alertes de rupture (seuils configurables)
- Historique des mouvements de stock
- Prévisions de rupture par IA

### Synchronisation automatique

Le stock est synchronisé bidirectionnellement :
1. **Fournisseur → ShopOpti+** : Mise à jour du stock disponible fournisseur
2. **ShopOpti+ → Canaux** : Propagation vers Shopify, Amazon, eBay, etc.
3. **Canaux → ShopOpti+** : Déduction lors d'une vente sur n'importe quel canal

### Règles de stock

Configurez des règles automatiques :
- **Seuil d'alerte** : Notification quand stock < X
- **Masquage automatique** : Masquer le produit si stock = 0
- **Réapprovisionnement** : Commander automatiquement chez le fournisseur
- **Buffer de sécurité** : Réserver X unités comme stock de sécurité

### Multi-entrepôt

Si vous avez plusieurs sources de stock :
1. Créez des emplacements dans **Stock > Entrepôts**
2. Assignez les quantités par emplacement
3. Définissez les priorités de fulfillment

### Export des données de stock

Exportez vos données de stock en CSV ou XLSX pour analyse externe ou comptabilité.

> ⚡ **Astuce** : Activez les alertes email pour ne jamais manquer une rupture de stock importante.
    `,
    relatedLinks: [
      { title: 'Résoudre les conflits de stock', slug: 'resoudre-les-conflits-de-stock' },
      { title: 'Gestion des variantes et options', slug: 'gestion-des-variantes-et-options' },
    ]
  },

  // ═══════════════════════════════════════
  // FOURNISSEURS & SOURCING
  // ═══════════════════════════════════════
  {
    slug: 'connecter-un-fournisseur',
    title: 'Connecter un fournisseur',
    category: 'Fournisseurs & Sourcing',
    categorySlug: 'fournisseurs-sourcing',
    readTime: '6 min',
    lastUpdated: '2026-02-18',
    content: `
## Connecter un fournisseur

ShopOpti+ prend en charge 99+ fournisseurs dropshipping internationaux.

### Fournisseurs supportés nativement

| Fournisseur | Type | Région |
|-------------|------|--------|
| AliExpress | Dropshipping | Chine / Global |
| CJ Dropshipping | Dropshipping | Chine / US / EU |
| BigBuy | Grossiste | Europe |
| Spocket | Dropshipping | US / EU |
| Oberlo | Dropshipping | Global |
| Printful | POD | US / EU |
| Zendrop | Dropshipping | US |

### Étapes de connexion

1. Rendez-vous dans **Fournisseurs > Ajouter un fournisseur**
2. Sélectionnez le fournisseur dans la liste
3. Suivez le wizard de connexion (OAuth ou clé API)
4. Testez la connexion
5. Configurez les paramètres de synchronisation

### Configuration de la synchronisation

- **Fréquence** : Temps réel, toutes les heures, quotidien
- **Données synchronisées** : Stock, prix, délais, tracking
- **Règles de prix** : Marge fixe, pourcentage ou formule personnalisée
- **Devises** : Conversion automatique en 58+ devises

### Fournisseurs personnalisés

Pour les fournisseurs non listés :
1. Créez un **fournisseur personnalisé**
2. Configurez l'import via CSV ou flux XML
3. Planifiez la synchronisation automatique

> 💡 **Conseil** : Commencez par connecter un seul fournisseur pour tester le flux complet avant d'en ajouter d'autres.
    `,
    relatedLinks: [
      { title: 'Synchronisation automatique', slug: 'synchronisation-automatique' },
      { title: 'Gestion multi-fournisseurs', slug: 'gestion-multi-fournisseurs' },
    ]
  },
  {
    slug: 'synchronisation-automatique',
    title: 'Synchronisation automatique',
    category: 'Fournisseurs & Sourcing',
    categorySlug: 'fournisseurs-sourcing',
    readTime: '7 min',
    lastUpdated: '2026-02-12',
    content: `
## Synchronisation automatique

La synchronisation bidirectionnelle assure la cohérence des données entre ShopOpti+, vos fournisseurs et vos canaux de vente.

### Types de synchronisation

| Type | Direction | Fréquence |
|------|-----------|-----------|
| Stock | Fournisseur → ShopOpti+ → Canaux | Temps réel |
| Prix | Fournisseur → ShopOpti+ (+ marge) → Canaux | Configurable |
| Commandes | Canaux → ShopOpti+ → Fournisseur | Temps réel |
| Tracking | Fournisseur → ShopOpti+ → Canaux → Client | Automatique |

### Configurer la synchronisation

1. Dans **Sync Manager**, sélectionnez l'intégration
2. Activez les types de sync souhaités
3. Définissez la fréquence et les règles
4. Testez avec un produit
5. Activez pour tout le catalogue

### Résolution de conflits

Quand deux sources modifient la même donnée :
- **Dernière modification gagne** (par défaut)
- **Source prioritaire** : Définissez quelle source a la priorité
- **Notification manuelle** : Recevez une alerte pour décider

### Monitoring

Le tableau de bord de synchronisation affiche :
- État de chaque intégration (connecté, erreur, en pause)
- Dernière synchronisation réussie
- Nombre d'éléments synchronisés
- Erreurs et avertissements

> ⚡ **Astuce** : Activez le mode "temps réel" pour le stock afin d'éviter les surventes.
    `,
    relatedLinks: [
      { title: 'Connecter un fournisseur', slug: 'connecter-un-fournisseur' },
      { title: 'Résoudre les conflits de stock', slug: 'resoudre-les-conflits-de-stock' },
    ]
  },
  {
    slug: 'gestion-multi-fournisseurs',
    title: 'Gestion multi-fournisseurs',
    category: 'Fournisseurs & Sourcing',
    categorySlug: 'fournisseurs-sourcing',
    readTime: '6 min',
    lastUpdated: '2026-01-30',
    content: `
## Gestion multi-fournisseurs

Gérez plusieurs fournisseurs pour un même produit et automatisez le basculement.

### Fournisseur principal vs secondaires

- **Fournisseur principal** : Reçoit les commandes par défaut
- **Fournisseurs secondaires** : Prennent le relais en cas de rupture

### Règles de basculement automatique

Configurez le fallback automatique :
1. Si stock fournisseur principal = 0
2. Si prix fournisseur principal > seuil
3. Si délai de livraison > X jours
4. Si évaluation fournisseur < X étoiles

### Comparaison de prix

Le tableau comparatif affiche pour chaque produit :
- Prix chez chaque fournisseur
- Stock disponible
- Délai de livraison estimé
- Frais de port
- Note qualité

### Gestion des commandes multi-fournisseurs

Quand une commande contient des produits de fournisseurs différents :
1. ShopOpti+ split automatiquement la commande
2. Chaque partie est envoyée au bon fournisseur
3. Le client reçoit un tracking unifié

> 💡 **Conseil** : Négociez des tarifs préférentiels avec vos fournisseurs réguliers et configurez-les comme prioritaires.
    `,
    relatedLinks: [
      { title: 'Connecter un fournisseur', slug: 'connecter-un-fournisseur' },
    ]
  },
  {
    slug: 'import-cj-dropshipping',
    title: 'Import CJ Dropshipping',
    category: 'Fournisseurs & Sourcing',
    categorySlug: 'fournisseurs-sourcing',
    readTime: '5 min',
    lastUpdated: '2026-01-25',
    content: `
## Import CJ Dropshipping

Connectez CJ Dropshipping à ShopOpti+ pour importer des produits avec fulfillment automatique.

### Connexion de votre compte CJ

1. Créez un compte sur [CJ Dropshipping](https://cjdropshipping.com)
2. Dans ShopOpti+, allez à **Fournisseurs > CJ Dropshipping**
3. Entrez votre clé API CJ
4. Testez la connexion

### Import de produits

- **Recherche intégrée** : Cherchez des produits CJ directement dans ShopOpti+
- **Import par URL** : Collez l'URL produit CJ
- **Import par catégorie** : Importez une catégorie entière
- **Produits sourcés** : Accédez aux produits négociés par CJ

### Avantages CJ

- Entrepôts US, EU et Chine
- Livraison rapide (5-12 jours EU/US)
- Personnalisation packaging
- Prix compétitifs
- Fulfillment automatique intégré

### Configuration du fulfillment

1. Activez **Auto-fulfillment** dans les paramètres CJ
2. Définissez la méthode d'expédition par défaut
3. Les commandes sont transmises automatiquement à CJ

> ⚡ **Astuce** : Utilisez les entrepôts US de CJ pour des délais de 3-7 jours sur le marché américain.
    `,
    relatedLinks: [
      { title: 'Import BigBuy', slug: 'import-bigbuy' },
      { title: 'Importer depuis AliExpress', slug: 'importer-depuis-aliexpress' },
    ]
  },
  {
    slug: 'import-bigbuy',
    title: 'Import BigBuy',
    category: 'Fournisseurs & Sourcing',
    categorySlug: 'fournisseurs-sourcing',
    readTime: '5 min',
    lastUpdated: '2026-01-22',
    content: `
## Import BigBuy

BigBuy est le plus grand grossiste européen. Importez son catalogue directement dans ShopOpti+.

### Connexion BigBuy

1. Créez un compte professionnel sur [BigBuy](https://www.bigbuy.eu)
2. Obtenez votre clé API depuis le dashboard BigBuy
3. Dans ShopOpti+, allez à **Fournisseurs > BigBuy**
4. Entrez la clé API et testez

### Catalogue BigBuy

- **150 000+ produits** dans 20+ catégories
- Stock en temps réel
- Livraison depuis l'Espagne (EU)
- Dropshipping direct au client final
- Multi-langues / Multi-devises

### Import sélectif

1. Parcourez le catalogue BigBuy dans ShopOpti+
2. Filtrez par catégorie, prix ou marge
3. Sélectionnez les produits à importer
4. L'IA optimise automatiquement les fiches

### Synchronisation

- Stock synchronisé toutes les heures
- Prix mis à jour quotidiennement
- Alertes de rupture automatiques

> 💡 **Conseil** : BigBuy offre des marges élevées sur les produits technologiques et maison. Ciblez ces catégories pour maximiser vos profits.
    `,
    relatedLinks: [
      { title: 'Import CJ Dropshipping', slug: 'import-cj-dropshipping' },
      { title: 'Connecter un fournisseur', slug: 'connecter-un-fournisseur' },
    ]
  },
  {
    slug: 'resoudre-les-conflits-de-stock',
    title: 'Résoudre les conflits de stock',
    category: 'Fournisseurs & Sourcing',
    categorySlug: 'fournisseurs-sourcing',
    readTime: '5 min',
    lastUpdated: '2026-02-01',
    content: `
## Résoudre les conflits de stock

Quand les données de stock divergent entre vos sources, ShopOpti+ vous aide à résoudre les conflits.

### Types de conflits

1. **Survente** : Plus de ventes que de stock disponible
2. **Désynchronisation** : Stock différent entre ShopOpti+ et le fournisseur
3. **Conflit multi-canal** : Stock non cohérent entre vos boutiques

### Détection automatique

ShopOpti+ détecte les conflits en temps réel et vous alerte via :
- Notification push
- Email
- Badge d'alerte dans le tableau de bord

### Résolution

Pour chaque conflit, vous pouvez :
- **Accepter la source fournisseur** (recommandé)
- **Accepter la source canal** (Shopify, Amazon...)
- **Définir manuellement** le stock correct
- **Mettre en pause** la synchronisation pour investigation

### Prévention

- Activez la synchronisation temps réel
- Configurez un buffer de sécurité (stock affiché = stock réel - buffer)
- Utilisez les alertes de seuil bas

> ⚠️ **Important** : Les surventes peuvent entraîner des annulations et des avis négatifs. Configurez toujours un buffer de sécurité d'au moins 2 unités.
    `,
    relatedLinks: [
      { title: 'Gestion du stock', slug: 'gestion-du-stock' },
      { title: 'Synchronisation automatique', slug: 'synchronisation-automatique' },
    ]
  },

  // ═══════════════════════════════════════
  // BOUTIQUES & CANAUX
  // ═══════════════════════════════════════
  {
    slug: 'connexion-shopify',
    title: 'Connexion Shopify',
    category: 'Boutiques & Canaux',
    categorySlug: 'boutiques-canaux',
    readTime: '6 min',
    lastUpdated: '2026-02-22',
    content: `
## Connexion Shopify

Connectez votre boutique Shopify à ShopOpti+ en quelques minutes.

### Prérequis

- Un compte Shopify actif (Basic ou supérieur)
- Les droits d'administration sur votre boutique

### Étapes de connexion

1. Dans ShopOpti+, allez à **Boutiques & Canaux > Shopify**
2. Cliquez **Connecter Shopify**
3. Entrez l'URL de votre boutique (ex: maboutique.myshopify.com)
4. Autorisez l'accès OAuth
5. ShopOpti+ importe automatiquement votre catalogue existant

### Données synchronisées

| Donnée | Direction | Fréquence |
|--------|-----------|-----------|
| Produits | Bidirectionnel | Temps réel |
| Commandes | Shopify → ShopOpti+ | Temps réel |
| Stock | Bidirectionnel | Temps réel |
| Clients | Shopify → ShopOpti+ | Quotidien |
| Collections | ShopOpti+ → Shopify | À la demande |

### Publication depuis ShopOpti+

1. Sélectionnez les produits dans votre catalogue
2. Cliquez **Publier > Shopify**
3. Mappez les catégories et les variantes
4. Définissez les prix (avec marge automatique si configurée)
5. Publiez

### Gestion des thèmes

ShopOpti+ ne modifie pas votre thème Shopify. Tous les produits publiés s'intègrent naturellement dans votre boutique existante.

> ⚡ **Astuce** : Activez le webhook Shopify pour une synchronisation instantanée des commandes.
    `,
    relatedLinks: [
      { title: 'Connexion WooCommerce', slug: 'connexion-woocommerce' },
      { title: 'Multi-canal avancé', slug: 'multi-canal-avance' },
    ]
  },
  {
    slug: 'connexion-woocommerce',
    title: 'Connexion WooCommerce',
    category: 'Boutiques & Canaux',
    categorySlug: 'boutiques-canaux',
    readTime: '6 min',
    lastUpdated: '2026-02-15',
    content: `
## Connexion WooCommerce

Intégrez votre boutique WooCommerce avec ShopOpti+ via l'API REST.

### Prérequis

- WordPress avec WooCommerce 5.0+
- Plugin REST API activé
- Certificat SSL (HTTPS)

### Étapes

1. Dans WooCommerce, allez à **Réglages > Avancé > REST API**
2. Créez une clé API avec permissions Lecture/Écriture
3. Dans ShopOpti+, allez à **Boutiques & Canaux > WooCommerce**
4. Entrez l'URL du site et les clés API
5. Testez et connectez

### Fonctionnalités

- Import du catalogue existant
- Synchronisation bidirectionnelle des produits
- Gestion des commandes centralisée
- Synchronisation des stocks en temps réel
- Support des variantes WooCommerce

> 💡 **Conseil** : Assurez-vous que les permaliens WordPress sont en mode "Nom de l'article" pour un fonctionnement optimal de l'API.
    `,
    relatedLinks: [
      { title: 'Connexion Shopify', slug: 'connexion-shopify' },
    ]
  },
  {
    slug: 'publication-sur-amazon',
    title: 'Publication sur Amazon',
    category: 'Boutiques & Canaux',
    categorySlug: 'boutiques-canaux',
    readTime: '8 min',
    lastUpdated: '2026-02-08',
    content: `
## Publication sur Amazon

Publiez vos produits sur Amazon directement depuis ShopOpti+.

### Prérequis

- Un compte vendeur Amazon (Individual ou Professional)
- Approbation dans les catégories concernées

### Connexion

1. Dans ShopOpti+, allez à **Boutiques & Canaux > Amazon**
2. Sélectionnez votre marketplace (FR, DE, UK, US...)
3. Autorisez l'accès via Amazon Seller Central
4. Configurez les paramètres de publication

### Mapping des catégories

Amazon utilise un système de catégories spécifique. ShopOpti+ :
- Suggère automatiquement la meilleure catégorie via IA
- Mappe vos attributs aux attributs Amazon requis
- Vérifie la conformité avant publication

### Gestion des prix Amazon

- Prix FBA vs FBM
- Buy Box optimization
- Repricing automatique basé sur la concurrence

### Fulfillment

- **FBM** : Fulfillment par le marchand (via votre fournisseur)
- **FBA** : Fulfillment by Amazon (envoi au centre Amazon)

> ⚠️ **Attention** : Amazon a des règles strictes. Assurez-vous que vos produits respectent les guidelines avant publication.
    `,
    relatedLinks: [
      { title: 'Publication sur eBay', slug: 'publication-sur-ebay' },
      { title: 'Multi-canal avancé', slug: 'multi-canal-avance' },
    ]
  },
  {
    slug: 'publication-sur-ebay',
    title: 'Publication sur eBay',
    category: 'Boutiques & Canaux',
    categorySlug: 'boutiques-canaux',
    readTime: '6 min',
    lastUpdated: '2026-02-05',
    content: `
## Publication sur eBay

Vendez vos produits sur eBay avec gestion centralisée depuis ShopOpti+.

### Connexion eBay

1. **Boutiques & Canaux > eBay**
2. Autorisez via OAuth eBay
3. Sélectionnez votre marketplace (FR, DE, UK, US...)
4. Configurez les templates de listing

### Templates eBay

Créez des templates réutilisables pour :
- Description HTML enrichie
- Conditions de vente et retour
- Frais de port
- Options d'enchères vs prix fixe

### Synchronisation

- Stock synchronisé en temps réel
- Prix mis à jour automatiquement
- Commandes importées instantanément
- Tracking envoyé au vendeur et à l'acheteur

> 💡 **Conseil** : Utilisez les templates HTML de ShopOpti+ pour des listings eBay professionnels qui se démarquent.
    `,
    relatedLinks: [
      { title: 'Publication sur Amazon', slug: 'publication-sur-amazon' },
    ]
  },
  {
    slug: 'multi-canal-avance',
    title: 'Multi-canal avancé',
    category: 'Boutiques & Canaux',
    categorySlug: 'boutiques-canaux',
    readTime: '10 min',
    lastUpdated: '2026-02-20',
    content: `
## Multi-canal avancé

Gérez tous vos canaux de vente depuis une interface unique.

### Vue d'ensemble multi-canal

Le tableau de bord multi-canal affiche :
- État de chaque canal (connecté, en erreur, en pause)
- Nombre de produits publiés par canal
- Ventes par canal (temps réel)
- Alertes et synchronisations en attente

### Gestion centralisée

Depuis ShopOpti+, vous pouvez :
- Publier un produit sur plusieurs canaux en un clic
- Définir des prix différents par canal
- Gérer le stock global avec allocation par canal
- Recevoir toutes les commandes dans un seul flux

### Règles par canal

Configurez des règles spécifiques :
- **Prix** : Marge différente par canal
- **Stock** : Allocation de X% du stock total par canal
- **Description** : Adaptation du contenu par plateforme
- **Images** : Tailles et formats spécifiques

### Rapports multi-canal

Analysez les performances comparées :
- CA par canal
- Taux de conversion par canal
- Produits best-sellers par canal
- Coût d'acquisition par canal

> ⚡ **Astuce** : Utilisez les règles de prix par canal pour maximiser vos marges là où la concurrence est moindre.
    `,
    relatedLinks: [
      { title: 'Connexion Shopify', slug: 'connexion-shopify' },
      { title: 'Feeds produits XML/CSV', slug: 'feeds-produits-xml-csv' },
    ]
  },
  {
    slug: 'feeds-produits-xml-csv',
    title: 'Feeds produits XML/CSV',
    category: 'Boutiques & Canaux',
    categorySlug: 'boutiques-canaux',
    readTime: '7 min',
    lastUpdated: '2026-01-28',
    content: `
## Feeds produits XML/CSV

Générez des flux de données pour Google Shopping, Facebook Catalog et autres comparateurs.

### Types de feeds supportés

- **Google Shopping** (XML/RSS) : Format Merchant Center
- **Facebook Catalog** (CSV/XML) : Format Meta Commerce
- **Idealo / LeGuide** : Formats spécifiques
- **Custom** : Format personnalisé

### Créer un feed

1. Allez dans **Feeds > Nouveau feed**
2. Sélectionnez le format cible
3. Choisissez les produits à inclure
4. Mappez les champs
5. Planifiez la mise à jour automatique

### Optimisation des feeds

L'IA optimise automatiquement :
- Les titres pour Google Shopping (max 150 caractères, mots-clés en premier)
- Les descriptions pour le taux de clic
- Les catégories Google (taxonomie officielle)
- Les images (format, taille, qualité)

### URL du feed

Chaque feed génère une URL unique que vous collez dans :
- Google Merchant Center
- Facebook Business Manager
- Tout comparateur de prix

Le feed est mis à jour automatiquement selon votre planning.

> 💡 **Conseil** : Activez le diagnostic de feed pour détecter et corriger les erreurs avant que Google ne les signale.
    `,
    relatedLinks: [
      { title: 'Multi-canal avancé', slug: 'multi-canal-avance' },
    ]
  },

  // ═══════════════════════════════════════
  // COMMANDES & EXPÉDITIONS
  // ═══════════════════════════════════════
  {
    slug: 'traitement-automatique-fulfillment',
    title: 'Traitement automatique (fulfillment)',
    category: 'Commandes & Expéditions',
    categorySlug: 'commandes-expeditions',
    readTime: '8 min',
    lastUpdated: '2026-02-18',
    content: `
## Traitement automatique (fulfillment)

Automatisez le traitement de vos commandes de la réception à la livraison.

### Flux de fulfillment

\`\`\`
Commande reçue → Validation → Envoi fournisseur → Tracking → Livraison → Confirmation
\`\`\`

### Configuration

1. **Fournisseurs > Auto-fulfillment** : Activez par fournisseur
2. **Règles** : Définissez les conditions d'auto-traitement
3. **Notifications** : Configurez les alertes client

### Règles d'auto-fulfillment

| Condition | Action |
|-----------|--------|
| Paiement confirmé | Envoyer au fournisseur |
| Stock disponible | Traiter immédiatement |
| Montant < seuil | Auto-approve |
| Client VIP | Priorité haute |

### Monitoring

Suivez chaque commande en temps réel :
- Statut de traitement
- Suivi d'expédition
- Délai estimé de livraison
- Alertes en cas de problème

### Gestion des exceptions

- Commande en attente de paiement
- Produit en rupture
- Adresse invalide
- Commande suspecte (fraude)

> ⚡ **Astuce** : Le taux de traitement automatique optimal est de 85%+. Les 15% restants nécessitent une validation manuelle (montants élevés, nouvelles adresses).
    `,
    relatedLinks: [
      { title: 'Suivi des expéditions', slug: 'suivi-des-expeditions' },
      { title: 'Gestion des retours', slug: 'gestion-des-retours' },
    ]
  },
  {
    slug: 'suivi-des-expeditions',
    title: 'Suivi des expéditions',
    category: 'Commandes & Expéditions',
    categorySlug: 'commandes-expeditions',
    readTime: '5 min',
    lastUpdated: '2026-02-10',
    content: `
## Suivi des expéditions

Centralisez le tracking de toutes vos expéditions et informez automatiquement vos clients.

### Transporteurs supportés

ShopOpti+ supporte 200+ transporteurs via l'intégration multi-carrier :
- Colissimo, Chronopost, Mondial Relay (France)
- DHL, UPS, FedEx, DPD (International)
- ePacket, Yanwen, 4PX (Chine)
- USPS, Canada Post (Amérique du Nord)

### Fonctionnalités

- **Tracking automatique** : Le numéro de suivi est récupéré du fournisseur et envoyé au client
- **Page de suivi brandée** : Page aux couleurs de votre marque
- **Notifications email** : Envoi automatique à chaque mise à jour de statut
- **SMS** : Notifications SMS optionnelles (plan Business+)
- **Carte de livraison** : Visualisation du parcours du colis

### Configuration

1. **Paramètres > Expéditions** : Activez le tracking
2. **Templates email** : Personnalisez les messages
3. **Transporteurs** : Mappez les codes transporteur

> 💡 **Conseil** : Les notifications de tracking réduisent les demandes de support de 40% en moyenne.
    `,
    relatedLinks: [
      { title: 'Traitement automatique (fulfillment)', slug: 'traitement-automatique-fulfillment' },
      { title: 'Notifications clients', slug: 'notifications-clients' },
    ]
  },
  {
    slug: 'gestion-des-retours',
    title: 'Gestion des retours',
    category: 'Commandes & Expéditions',
    categorySlug: 'commandes-expeditions',
    readTime: '6 min',
    lastUpdated: '2026-02-05',
    content: `
## Gestion des retours

Gérez les retours, remboursements et échanges de manière centralisée.

### Processus de retour

1. Client demande un retour (formulaire automatique)
2. Numéro RMA généré automatiquement
3. Approbation manuelle ou automatique selon les règles
4. Étiquette de retour générée
5. Réception et inspection
6. Remboursement ou échange

### Règles automatiques

Configurez des règles d'auto-approbation :
- Délai de retour (ex: < 30 jours)
- Montant (ex: < 50€ → auto-rembourser)
- Motif (ex: "Produit défectueux" → toujours approuver)
- Historique client (ex: client fidèle → auto-approuver)

### Tableau de bord retours

- Taux de retour par produit
- Motifs de retour les plus fréquents
- Coût total des retours
- Délai moyen de traitement

> ⚡ **Astuce** : Analysez les motifs de retour fréquents pour améliorer vos fiches produits et réduire le taux de retour.
    `,
    relatedLinks: [
      { title: 'Commandes groupées', slug: 'commandes-groupees' },
    ]
  },
  {
    slug: 'commandes-groupees',
    title: 'Commandes groupées',
    category: 'Commandes & Expéditions',
    categorySlug: 'commandes-expeditions',
    readTime: '5 min',
    lastUpdated: '2026-01-28',
    content: `
## Commandes groupées

Traitez des lots de commandes simultanément pour gagner du temps.

### Actions groupées disponibles

- **Marquer comme traitée** : Bulk fulfillment
- **Imprimer les étiquettes** : Génération batch d'étiquettes d'expédition
- **Exporter** : Export CSV/PDF des commandes sélectionnées
- **Mettre à jour le statut** : Changement de statut en masse
- **Envoyer au fournisseur** : Transmission groupée

### Impression d'étiquettes

1. Sélectionnez les commandes à expédier
2. Cliquez **Imprimer les étiquettes**
3. Choisissez le transporteur et le format
4. Téléchargez le PDF avec toutes les étiquettes

### Filtrage pour le traitement groupé

Filtrez les commandes par :
- Statut (en attente, payée, en cours)
- Date de commande
- Canal de vente
- Transporteur
- Fournisseur

> 💡 **Conseil** : Traitez vos commandes en lot à heures fixes (9h et 14h par ex.) pour optimiser l'efficacité opérationnelle.
    `,
    relatedLinks: [
      { title: 'Traitement automatique (fulfillment)', slug: 'traitement-automatique-fulfillment' },
    ]
  },
  {
    slug: 'impression-d-etiquettes',
    title: "Impression d'étiquettes",
    category: 'Commandes & Expéditions',
    categorySlug: 'commandes-expeditions',
    readTime: '4 min',
    lastUpdated: '2026-01-22',
    content: `
## Impression d'étiquettes

Générez et imprimez des étiquettes d'expédition directement depuis ShopOpti+.

### Formats supportés

- **A4** : 1 ou 4 étiquettes par page
- **Thermique** : 10x15 cm (Zebra, Brother, Dymo)
- **PDF** : Téléchargement pour impression externe

### Transporteurs intégrés

Générez des étiquettes pour :
- Colissimo, Chronopost (via API La Poste)
- Mondial Relay (points relais)
- DHL Express
- UPS, FedEx

### Personnalisation

- Logo de votre boutique
- Message personnalisé
- Code-barres / QR Code
- Poids et dimensions automatiques

> ⚡ **Astuce** : Investissez dans une imprimante thermique pour gagner 30 secondes par commande.
    `,
    relatedLinks: [
      { title: 'Commandes groupées', slug: 'commandes-groupees' },
      { title: 'Suivi des expéditions', slug: 'suivi-des-expeditions' },
    ]
  },
  {
    slug: 'notifications-clients',
    title: 'Notifications clients',
    category: 'Commandes & Expéditions',
    categorySlug: 'commandes-expeditions',
    readTime: '5 min',
    lastUpdated: '2026-01-18',
    content: `
## Notifications clients

Informez automatiquement vos clients à chaque étape de leur commande.

### Types de notifications

| Événement | Canal | Automatique |
|-----------|-------|-------------|
| Confirmation de commande | Email | ✅ |
| Paiement reçu | Email | ✅ |
| Commande expédiée | Email + SMS | ✅ |
| En cours de livraison | Email | ✅ |
| Livré | Email | ✅ |
| Retard détecté | Email | ✅ |
| Retour accepté | Email | ✅ |

### Personnalisation des templates

1. **Paramètres > Notifications > Templates**
2. Sélectionnez le template à modifier
3. Personnalisez le contenu avec des variables dynamiques
4. Prévisualisez et sauvegardez

### Variables disponibles

\`\`\`
{{customer_name}}, {{order_number}}, {{tracking_url}},
{{estimated_delivery}}, {{product_names}}, {{total_amount}}
\`\`\`

### Notifications SMS

Disponibles sur les plans Business et Enterprise :
- Expédition
- Livraison imminente
- Promo personnalisée

> 💡 **Conseil** : Les emails de suivi de commande ont un taux d'ouverture de 70%+. Profitez-en pour inclure des recommandations produits.
    `,
    relatedLinks: [
      { title: 'Suivi des expéditions', slug: 'suivi-des-expeditions' },
    ]
  },

  // ═══════════════════════════════════════
  // MARKETING & VENTES
  // ═══════════════════════════════════════
  {
    slug: 'campagnes-email-automatisees',
    title: 'Campagnes email automatisées',
    category: 'Marketing & Ventes',
    categorySlug: 'marketing-ventes',
    readTime: '8 min',
    lastUpdated: '2026-02-20',
    content: `
## Campagnes email automatisées

Créez des séquences email automatiques pour fidéliser vos clients et augmenter vos ventes.

### Types de campagnes

- **Bienvenue** : Email de bienvenue après inscription
- **Panier abandonné** : Relance après abandon de panier
- **Post-achat** : Demande d'avis + upsell
- **Réactivation** : Relance des clients inactifs
- **Promotion** : Offres flash et soldes
- **Newsletter** : Contenu éditorial régulier

### Créer une campagne

1. **Marketing > Email > Nouvelle campagne**
2. Choisissez le type de campagne
3. Configurez le trigger (événement déclencheur)
4. Créez le contenu (éditeur drag & drop)
5. Définissez le timing (délai, fréquence)
6. Activez la campagne

### Segmentation

Ciblez précisément avec :
- Historique d'achat
- Montant dépensé
- Catégorie de produits achetés
- Localisation géographique
- Source d'acquisition

### Métriques

Suivez en temps réel :
- Taux d'ouverture
- Taux de clic
- Taux de conversion
- Revenus générés par campagne

> ⚡ **Astuce** : Les emails de panier abandonné génèrent en moyenne 10-15% de conversions additionnelles.
    `,
    relatedLinks: [
      { title: 'CRM et segmentation', slug: 'crm-et-segmentation' },
      { title: 'A/B Testing', slug: 'a-b-testing' },
    ]
  },
  {
    slug: 'publicite-facebook-instagram',
    title: 'Publicité Facebook & Instagram',
    category: 'Marketing & Ventes',
    categorySlug: 'marketing-ventes',
    readTime: '7 min',
    lastUpdated: '2026-02-15',
    content: `
## Publicité Facebook & Instagram

Gérez vos campagnes publicitaires Meta directement depuis ShopOpti+.

### Connexion

1. **Marketing > Ads > Facebook/Instagram**
2. Connectez votre compte Meta Business
3. Sélectionnez vos comptes publicitaires
4. Autorisez le partage du catalogue

### Catalogue Facebook

ShopOpti+ synchronise automatiquement votre catalogue avec Facebook :
- Flux de produits optimisé
- Mise à jour des prix et stocks en temps réel
- Tags et catégories pour le ciblage

### Types de campagnes

- **Dynamic Product Ads** : Retargeting automatique
- **Collection Ads** : Catalogue immersif
- **Story Ads** : Format vertical engageant
- **Carousel** : Multi-produits

### Optimisation IA

L'IA ShopOpti+ optimise automatiquement :
- Le ciblage des audiences
- Les enchères
- Les créatives (A/B test automatique)
- Le budget par produit

> 💡 **Conseil** : Commencez avec les Dynamic Product Ads pour le retargeting, c'est le meilleur ROI pour les e-commerçants.
    `,
    relatedLinks: [
      { title: 'A/B Testing', slug: 'a-b-testing' },
      { title: 'SEO et contenu', slug: 'seo-et-contenu' },
    ]
  },
  {
    slug: 'coupons-et-promotions',
    title: 'Coupons et promotions',
    category: 'Marketing & Ventes',
    categorySlug: 'marketing-ventes',
    readTime: '5 min',
    lastUpdated: '2026-02-08',
    content: `
## Coupons et promotions

Créez et gérez des codes promo, réductions et offres spéciales.

### Types de promotions

- **Code promo** : Pourcentage ou montant fixe
- **Livraison gratuite** : Au-dessus d'un seuil
- **Buy X Get Y** : Offres groupées
- **Flash Sale** : Durée limitée avec compteur
- **Fidélité** : Points et récompenses

### Créer un coupon

1. **Marketing > Coupons > Nouveau**
2. Définissez le type de réduction
3. Configurez les conditions (min d'achat, produits éligibles)
4. Définissez la durée de validité
5. Limitez l'utilisation (nombre total, par client)
6. Générez le code

### Synchronisation multi-canal

Les coupons sont synchronisés avec :
- Shopify Discount Codes
- WooCommerce Coupons
- Vos campagnes email

### Analytics promotions

- Utilisation par coupon
- Revenus générés
- Panier moyen avec/sans coupon
- Taux de conversion impact

> ⚡ **Astuce** : Créez des codes promo personnalisés pour chaque influenceur afin de tracker précisément le ROI.
    `,
    relatedLinks: [
      { title: 'Campagnes email automatisées', slug: 'campagnes-email-automatisees' },
    ]
  },
  {
    slug: 'crm-et-segmentation',
    title: 'CRM et segmentation',
    category: 'Marketing & Ventes',
    categorySlug: 'marketing-ventes',
    readTime: '7 min',
    lastUpdated: '2026-02-12',
    content: `
## CRM et segmentation

Gérez la relation client et segmentez votre audience pour un marketing ciblé.

### Vue client 360°

Pour chaque client, accédez à :
- Historique complet des commandes
- Panier moyen et lifetime value
- Dernière visite et dernier achat
- Score de fidélité
- Notes et tags personnalisés

### Segments automatiques

ShopOpti+ crée automatiquement des segments :
- **VIP** : Top 10% par CA
- **À risque** : Pas d'achat depuis 60 jours
- **Nouveaux** : Inscrits dans les 30 derniers jours
- **Abandonneurs** : 2+ paniers abandonnés
- **Ambassadeurs** : Avis positifs + achats récurrents

### Segments personnalisés

Créez vos propres segments avec des filtres :
- Nombre de commandes
- Montant total dépensé
- Catégorie de produits achetés
- Localisation
- Source d'acquisition

### Actions par segment

- Envoi de campagnes email ciblées
- Offres promotionnelles exclusives
- Notifications push personnalisées
- Export pour Facebook Custom Audiences

> 💡 **Conseil** : Créez un segment "Acheteurs de Noël" pour les cibler avec des offres 2 mois avant la saison.
    `,
    relatedLinks: [
      { title: 'Campagnes email automatisées', slug: 'campagnes-email-automatisees' },
    ]
  },
  {
    slug: 'a-b-testing',
    title: 'A/B Testing',
    category: 'Marketing & Ventes',
    categorySlug: 'marketing-ventes',
    readTime: '6 min',
    lastUpdated: '2026-02-01',
    content: `
## A/B Testing

Testez différentes versions de vos fiches produits, emails et pages pour optimiser vos conversions.

### Ce que vous pouvez tester

- **Titres produits** : Quel format convertit le mieux ?
- **Images** : Fond blanc vs lifestyle
- **Prix** : Prix psychologiques (X.99 vs X.00)
- **Descriptions** : Courte vs longue, technique vs émotionnelle
- **Emails** : Objet, contenu, CTA, heure d'envoi

### Créer un test A/B

1. **Marketing > A/B Testing > Nouveau test**
2. Sélectionnez l'élément à tester
3. Créez les variantes (A et B, jusqu'à 4)
4. Définissez la répartition du trafic
5. Choisissez la métrique de succès
6. Lancez le test

### Durée et significativité

- Minimum recommandé : 7 jours ou 1000 visiteurs
- ShopOpti+ calcule automatiquement la significativité statistique
- Le gagnant est déclaré avec un intervalle de confiance de 95%

### Application automatique

Une fois le gagnant identifié :
- Application automatique si configuré
- Notification avec résultats détaillés
- Archivage pour historique

> ⚡ **Astuce** : Ne testez qu'un seul élément à la fois pour des résultats fiables.
    `,
    relatedLinks: [
      { title: 'Campagnes email automatisées', slug: 'campagnes-email-automatisees' },
    ]
  },
  {
    slug: 'seo-et-contenu',
    title: 'SEO et contenu',
    category: 'Marketing & Ventes',
    categorySlug: 'marketing-ventes',
    readTime: '9 min',
    lastUpdated: '2026-02-22',
    content: `
## SEO et contenu

Optimisez le référencement de vos produits et créez du contenu qui convertit.

### Audit SEO automatique

ShopOpti+ analyse chaque fiche produit sur 5 piliers :
1. **Titre** : Longueur, mots-clés, unicité
2. **Description** : Qualité, structure, richesse sémantique
3. **Images** : Alt text, taille, format
4. **Meta tags** : Title, description, canonical
5. **Structure** : URL, breadcrumbs, données structurées

### Score de qualité SEO

Chaque produit reçoit un score /100 avec des recommandations actionnables. Ciblez un score > 80 pour un référencement optimal.

### Génération de contenu IA

L'IA génère automatiquement :
- Articles de blog optimisés SEO
- Descriptions produits enrichies
- Meta descriptions persuasives
- Alt text pour les images
- FAQ structurées

### Blog intégré

Publiez des articles pour améliorer votre autorité :
- Éditeur Markdown avec prévisualisation
- Planification de publication
- Catégories et tags
- Optimisation SEO automatique

### Recherche de mots-clés

L'outil de recherche de mots-clés intégré :
- Volume de recherche
- Difficulté de ranking
- Suggestions long-tail
- Analyse de la concurrence

> 💡 **Conseil** : Publiez 2-4 articles de blog par mois sur des sujets liés à vos produits pour améliorer votre trafic organique.
    `,
    relatedLinks: [
      { title: 'Optimisation IA des fiches produits', slug: 'optimisation-ia-des-fiches-produits' },
    ]
  },

  // ═══════════════════════════════════════
  // ANALYTICS & IA
  // ═══════════════════════════════════════
  {
    slug: 'dashboard-analytics',
    title: 'Dashboard analytics',
    category: 'Analytics & IA',
    categorySlug: 'analytics-ia',
    readTime: '7 min',
    lastUpdated: '2026-02-20',
    content: `
## Dashboard analytics

Votre centre de commande avec toutes les métriques business en temps réel.

### KPIs principaux

- **Chiffre d'affaires** : Total et par canal
- **Nombre de commandes** : Avec tendance
- **Panier moyen** : Évolution sur 30j
- **Taux de conversion** : Par canal et global
- **Marge brute** : Revenus - coûts produits

### Widgets personnalisables

Personnalisez votre tableau de bord avec des widgets :
- Graphiques de ventes (ligne, barre, donut)
- Top produits par revenus
- Répartition par canal
- Flux d'activité en temps réel
- Alertes et recommandations IA

### Filtres temporels

Analysez vos données sur :
- Aujourd'hui
- 7 derniers jours
- 30 derniers jours
- Trimestre en cours
- Année en cours
- Plage personnalisée

### Export et rapports

- Export PDF du dashboard
- Rapports automatiques par email (quotidien/hebdo)
- Export des données brutes en CSV

> ⚡ **Astuce** : Configurez un rapport hebdomadaire automatique pour suivre vos KPIs sans avoir à vous connecter.
    `,
    relatedLinks: [
      { title: 'Prévisions de ventes IA', slug: 'previsions-de-ventes-ia' },
      { title: 'Rapports personnalisés', slug: 'rapports-personnalises' },
    ]
  },
  {
    slug: 'previsions-de-ventes-ia',
    title: 'Prévisions de ventes IA',
    category: 'Analytics & IA',
    categorySlug: 'analytics-ia',
    readTime: '6 min',
    lastUpdated: '2026-02-15',
    content: `
## Prévisions de ventes IA

L'IA analyse vos données historiques pour prédire vos ventes futures.

### Comment ça fonctionne

1. L'IA analyse 90+ jours d'historique de ventes
2. Elle identifie les patterns (saisonnalité, tendances, pics)
3. Elle intègre des facteurs externes (jours fériés, météo, événements)
4. Elle génère des prévisions sur 7, 30 et 90 jours

### Métriques prédites

- Chiffre d'affaires projeté
- Nombre de commandes estimé
- Produits à fort potentiel de vente
- Risques de rupture de stock

### Fiabilité

- Intervalle de confiance affiché (85-95% selon les données)
- Amélioration continue avec plus de données
- Comparaison prévisions vs réalité

### Utilisations pratiques

- Planifier le stock et les réapprovisionnements
- Anticiper les besoins en trésorerie
- Optimiser le budget publicitaire
- Préparer les périodes de forte demande

> 💡 **Conseil** : Les prévisions sont plus fiables avec au moins 6 mois de données. Commencez à collecter dès maintenant.
    `,
    relatedLinks: [
      { title: 'Dashboard analytics', slug: 'dashboard-analytics' },
      { title: 'Recommandations IA', slug: 'recommandations-ia' },
    ]
  },
  {
    slug: 'recommandations-ia',
    title: 'Recommandations IA',
    category: 'Analytics & IA',
    categorySlug: 'analytics-ia',
    readTime: '5 min',
    lastUpdated: '2026-02-10',
    content: `
## Recommandations IA

Recevez des recommandations personnalisées pour optimiser votre business.

### Types de recommandations

- **Produits** : Produits à ajouter ou retirer du catalogue
- **Prix** : Ajustements de prix pour maximiser les marges
- **Marketing** : Campagnes à lancer, segments à cibler
- **Stock** : Réapprovisionnements à anticiper
- **SEO** : Fiches à optimiser en priorité

### Score de confiance

Chaque recommandation a un score de confiance (0-100%) :
- **90%+** : Haute confiance, action recommandée
- **70-90%** : Bonne confiance, à évaluer
- **< 70%** : Suggestion exploratoire

### Application en un clic

Pour chaque recommandation :
- Voir le détail et le raisonnement
- Appliquer la recommandation
- Ignorer/reporter
- Personnaliser avant application

> ⚡ **Astuce** : Consultez vos recommandations quotidiennement. Les utilisateurs qui les suivent voient +25% de croissance en moyenne.
    `,
    relatedLinks: [
      { title: 'Prévisions de ventes IA', slug: 'previsions-de-ventes-ia' },
      { title: 'Repricing dynamique', slug: 'repricing-dynamique' },
    ]
  },
  {
    slug: 'repricing-dynamique',
    title: 'Repricing dynamique',
    category: 'Analytics & IA',
    categorySlug: 'analytics-ia',
    readTime: '8 min',
    lastUpdated: '2026-02-18',
    content: `
## Repricing dynamique

Ajustez automatiquement vos prix en fonction du marché et de vos objectifs de marge.

### Stratégies de pricing

1. **Marge fixe** : Coût + pourcentage fixe
2. **Marge variable** : Pourcentage adapté par catégorie
3. **Compétitif** : Alignement sur les prix concurrents
4. **Psychologique** : Arrondis X.99 automatiques
5. **Dynamique IA** : Optimisation continue par l'IA

### Configuration

1. **Pricing Manager > Règles**
2. Définissez votre stratégie par défaut
3. Créez des exceptions par catégorie ou produit
4. Définissez les limites (min/max de marge)
5. Activez l'automatisation

### Simulateur de prix

Avant d'appliquer, simulez l'impact :
- Marge prévisionnelle
- Comparaison avec les prix actuels
- Impact sur le CA estimé
- Nombre de produits affectés

### Monitoring

- Historique des changements de prix
- Alertes si marge < seuil
- Rapport hebdomadaire d'optimisation

> ⚡ **Astuce** : Utilisez les arrondis psychologiques (X.99) pour augmenter les conversions de 5-8%.
    `,
    relatedLinks: [
      { title: 'Recommandations IA', slug: 'recommandations-ia' },
    ]
  },
  {
    slug: 'rapports-personnalises',
    title: 'Rapports personnalisés',
    category: 'Analytics & IA',
    categorySlug: 'analytics-ia',
    readTime: '5 min',
    lastUpdated: '2026-02-05',
    content: `
## Rapports personnalisés

Créez des rapports sur mesure pour suivre les métriques importantes pour votre business.

### Créer un rapport

1. **Analytics > Rapports > Nouveau**
2. Choisissez les métriques à inclure
3. Définissez les filtres et la période
4. Sélectionnez le format de visualisation
5. Planifiez l'envoi automatique (optionnel)

### Métriques disponibles

- Ventes par produit, catégorie, canal
- Performance marketing (ROI, CPA, ROAS)
- Comportement client (panier moyen, fréquence)
- Stocks et supply chain
- Performance SEO

### Formats d'export

- PDF avec graphiques
- Excel/CSV pour analyse
- Dashboard partageable (lien)

### Rapports automatiques

- Quotidien, hebdomadaire ou mensuel
- Envoi par email aux destinataires choisis
- Comparaison automatique avec la période précédente

> 💡 **Conseil** : Créez un rapport mensuel synthétique pour vos investisseurs ou partenaires avec les KPIs clés.
    `,
    relatedLinks: [
      { title: 'Dashboard analytics', slug: 'dashboard-analytics' },
      { title: 'Alertes intelligentes', slug: 'alertes-intelligentes' },
    ]
  },
  {
    slug: 'alertes-intelligentes',
    title: 'Alertes intelligentes',
    category: 'Analytics & IA',
    categorySlug: 'analytics-ia',
    readTime: '5 min',
    lastUpdated: '2026-01-28',
    content: `
## Alertes intelligentes

Soyez notifié en temps réel des événements importants pour votre business.

### Types d'alertes

- **Stock** : Rupture, seuil bas, surstock
- **Ventes** : Pic de ventes, baisse inhabituelle
- **Prix** : Changement de prix fournisseur, marge négative
- **Avis** : Avis négatif, baisse de note
- **Performance** : Temps de réponse API, erreurs sync
- **Sécurité** : Connexion suspecte, tentative de fraude

### Configuration

1. **Paramètres > Alertes**
2. Activez les types d'alertes souhaités
3. Définissez les seuils de déclenchement
4. Choisissez les canaux (email, push, SMS)
5. Définissez les destinataires

### Centre d'alertes

Le centre d'alertes centralise toutes les notifications :
- Filtrage par type et priorité
- Actions directes depuis l'alerte
- Historique des alertes résolues
- Statistiques d'alertes

> ⚡ **Astuce** : Configurez les alertes critiques (rupture, fraude) en SMS pour une réaction immédiate.
    `,
    relatedLinks: [
      { title: 'Dashboard analytics', slug: 'dashboard-analytics' },
    ]
  },

  // ═══════════════════════════════════════
  // AUTOMATISATION
  // ═══════════════════════════════════════
  {
    slug: 'workflows-automatises',
    title: 'Workflows automatisés',
    category: 'Automatisation',
    categorySlug: 'automatisation',
    readTime: '8 min',
    lastUpdated: '2026-02-20',
    content: `
## Workflows automatisés

Créez des automatisations complexes avec un éditeur visuel intuitif.

### Éditeur de workflows

L'éditeur drag & drop vous permet de :
1. Définir un **trigger** (événement déclencheur)
2. Ajouter des **conditions** (filtres)
3. Configurer des **actions** (ce qui se passe)
4. Ajouter des **délais** entre les étapes

### Triggers disponibles

- Nouvelle commande reçue
- Produit en rupture de stock
- Client inscrit
- Avis publié
- Prix fournisseur modifié
- Panier abandonné
- Planification horaire (cron)

### Actions disponibles

- Envoyer un email
- Modifier un produit
- Créer une tâche
- Notifier l'équipe
- Appeler un webhook
- Modifier le stock
- Appliquer une promotion

### Exemples de workflows

**Workflow "Nouveau client VIP"** :
\`\`\`
Trigger: Commande > 200€
→ Ajouter tag "VIP"
→ Envoyer email de bienvenue VIP
→ Attendre 7 jours
→ Envoyer coupon -10% fidélité
\`\`\`

> 💡 **Conseil** : Commencez par les workflows les plus simples et ajoutez de la complexité progressivement.
    `,
    relatedLinks: [
      { title: 'Triggers et actions', slug: 'triggers-et-actions' },
      { title: 'Règles de traitement', slug: 'regles-de-traitement' },
    ]
  },
  {
    slug: 'regles-de-traitement',
    title: 'Règles de traitement',
    category: 'Automatisation',
    categorySlug: 'automatisation',
    readTime: '6 min',
    lastUpdated: '2026-02-10',
    content: `
## Règles de traitement

Définissez des règles automatiques pour le traitement des commandes et des données.

### Types de règles

- **Fulfillment** : Auto-traitement selon conditions
- **Pricing** : Ajustement automatique des prix
- **Stock** : Réapprovisionnement automatique
- **Catégorisation** : Classement automatique des produits
- **Modération** : Filtrage des avis et commentaires

### Créer une règle

1. **Automatisation > Règles > Nouvelle règle**
2. Sélectionnez le type de règle
3. Définissez les conditions (SI...)
4. Configurez l'action (ALORS...)
5. Testez avec des données réelles
6. Activez

### Priorité des règles

Les règles sont exécutées par ordre de priorité. En cas de conflit, la règle de priorité la plus haute l'emporte.

### Historique d'exécution

Chaque exécution est loggée avec :
- Date et heure
- Données d'entrée
- Résultat de l'action
- Statut (succès/échec)

> ⚡ **Astuce** : Testez toujours vos règles en mode "simulation" avant de les activer en production.
    `,
    relatedLinks: [
      { title: 'Workflows automatisés', slug: 'workflows-automatises' },
    ]
  },
  {
    slug: 'auto-fulfillment',
    title: 'Auto-fulfillment',
    category: 'Automatisation',
    categorySlug: 'automatisation',
    readTime: '6 min',
    lastUpdated: '2026-02-05',
    content: `
## Auto-fulfillment

Le traitement automatique des commandes réduit le travail manuel et accélère les livraisons.

### Activation

1. **Automatisation > Auto-fulfillment**
2. Sélectionnez les fournisseurs à activer
3. Définissez les conditions d'auto-traitement
4. Activez

### Conditions configurables

- Montant max de commande pour auto-traitement
- Types de produits éligibles
- Pays de livraison acceptés
- Méthode de paiement vérifiée
- Score de risque fraude < seuil

### Processus automatique

1. Commande reçue et paiement confirmé
2. Vérification des conditions auto-fulfillment
3. Transmission automatique au fournisseur
4. Récupération du numéro de tracking
5. Notification automatique au client

### Tableau de bord

- Taux de fulfillment automatique
- Délai moyen de traitement
- Commandes en attente de validation manuelle
- Erreurs et exceptions

> 💡 **Conseil** : Visez un taux d'auto-fulfillment > 80% pour optimiser votre efficacité opérationnelle.
    `,
    relatedLinks: [
      { title: 'Traitement automatique (fulfillment)', slug: 'traitement-automatique-fulfillment' },
    ]
  },
  {
    slug: 'triggers-et-actions',
    title: 'Triggers et actions',
    category: 'Automatisation',
    categorySlug: 'automatisation',
    readTime: '5 min',
    lastUpdated: '2026-01-28',
    content: `
## Triggers et actions

Les triggers et actions sont les blocs de base de l'automatisation ShopOpti+.

### Triggers (déclencheurs)

| Trigger | Description |
|---------|-------------|
| Nouvelle commande | Quand une commande est créée |
| Paiement reçu | Quand le paiement est confirmé |
| Stock bas | Quand le stock passe sous le seuil |
| Nouveau client | Quand un client s'inscrit |
| Avis publié | Quand un avis est posté |
| Prix modifié | Quand un prix fournisseur change |
| Planifié | À heure/jour/semaine fixe |

### Actions

| Action | Description |
|--------|-------------|
| Envoyer email | Email template personnalisé |
| Webhook | Appel HTTP vers URL externe |
| Modifier produit | MAJ titre, prix, stock, statut |
| Créer tâche | Tâche dans le gestionnaire |
| Notification | Push/Email à l'équipe |
| Appliquer promotion | Coupon ou réduction automatique |

### Combinaisons

Chaînez triggers et actions pour des automatisations puissantes :
\`\`\`
Stock < 5 → Commander chez fournisseur + Alerter le responsable
\`\`\`

> ⚡ **Astuce** : Utilisez les webhooks pour connecter ShopOpti+ à n'importe quel outil externe (Slack, Zapier, Make...).
    `,
    relatedLinks: [
      { title: 'Workflows automatisés', slug: 'workflows-automatises' },
      { title: 'Webhooks', slug: 'webhooks' },
    ]
  },
  {
    slug: 'planification-de-taches',
    title: 'Planification de tâches',
    category: 'Automatisation',
    categorySlug: 'automatisation',
    readTime: '4 min',
    lastUpdated: '2026-01-22',
    content: `
## Planification de tâches

Programmez des actions récurrentes pour automatiser votre routine quotidienne.

### Tâches planifiables

- Synchronisation des stocks (ex: toutes les heures)
- Mise à jour des prix (ex: quotidien à 6h)
- Génération de rapports (ex: lundi 9h)
- Nettoyage des données (ex: mensuel)
- Vérification des listings (ex: hebdomadaire)

### Configuration

1. **Automatisation > Planificateur**
2. Cliquez **Nouvelle tâche planifiée**
3. Sélectionnez l'action à planifier
4. Définissez la fréquence (cron)
5. Activez

### Monitoring

- Historique d'exécution
- Statut de la dernière exécution
- Alertes en cas d'échec
- Temps d'exécution moyen

> 💡 **Conseil** : Planifiez les synchronisations lourdes en dehors des heures de pic (la nuit ou tôt le matin).
    `,
    relatedLinks: [
      { title: 'Workflows automatisés', slug: 'workflows-automatises' },
    ]
  },
  {
    slug: 'webhooks',
    title: 'Webhooks',
    category: 'Automatisation',
    categorySlug: 'automatisation',
    readTime: '7 min',
    lastUpdated: '2026-02-15',
    content: `
## Webhooks

Recevez des notifications en temps réel via HTTP quand des événements se produisent.

### Événements webhook

- \`order.created\` — Nouvelle commande
- \`order.fulfilled\` — Commande traitée
- \`product.updated\` — Produit modifié
- \`stock.low\` — Stock bas
- \`customer.created\` — Nouveau client
- \`sync.completed\` — Synchronisation terminée

### Configurer un webhook

1. **API > Webhooks > Nouveau**
2. Entrez l'URL de destination
3. Sélectionnez les événements
4. Configurez les headers (authentification)
5. Testez avec un événement test
6. Activez

### Sécurité

- Signature HMAC-SHA256 sur chaque payload
- Secret partagé pour validation
- Retry automatique (3 tentatives avec backoff)
- Logs de livraison

### Format du payload

\`\`\`json
{
  "event": "order.created",
  "timestamp": "2026-02-15T14:30:00Z",
  "data": { /* données de l'événement */ },
  "signature": "sha256=..."
}
\`\`\`

> ⚡ **Astuce** : Utilisez les webhooks avec Zapier ou Make pour connecter ShopOpti+ à 5000+ applications.
    `,
    relatedLinks: [
      { title: 'API REST complète', slug: 'api-rest-complete' },
      { title: 'Triggers et actions', slug: 'triggers-et-actions' },
    ]
  },

  // ═══════════════════════════════════════
  // FACTURATION & PLANS
  // ═══════════════════════════════════════
  {
    slug: 'plans-et-tarifs',
    title: 'Plans et tarifs',
    category: 'Facturation & Plans',
    categorySlug: 'facturation-plans',
    readTime: '5 min',
    lastUpdated: '2026-02-20',
    content: `
## Plans et tarifs

ShopOpti+ propose des plans adaptés à chaque étape de votre business.

### Plans disponibles

| Plan | Prix | Produits | Canaux | Support |
|------|------|----------|--------|---------|
| **Starter** | 29€/mois | 500 | 1 | Email |
| **Pro** | 79€/mois | 5 000 | 3 | Email + Chat |
| **Business** | 199€/mois | 25 000 | Illimité | Prioritaire |
| **Enterprise** | Sur mesure | Illimité | Illimité | Dédié |

### Fonctionnalités par plan

- **Starter** : Import, gestion catalogue, analytics de base
- **Pro** : + IA, multi-canal, A/B testing, CRM
- **Business** : + API, webhooks, équipe multi-utilisateurs, rapports avancés
- **Enterprise** : + SLA, account manager, intégrations custom

### Essai gratuit

Tous les plans incluent un **essai gratuit de 14 jours** sans carte bancaire.

### Changement de plan

Vous pouvez upgrader ou downgrader à tout moment depuis **Paramètres > Abonnement**.

> 💡 **Conseil** : Commencez avec le plan Starter et passez au Pro quand vous atteignez 500 produits ou 3 canaux.
    `,
    relatedLinks: [
      { title: 'Gérer son abonnement', slug: 'gerer-son-abonnement' },
      { title: 'Essai gratuit', slug: 'essai-gratuit' },
    ]
  },
  {
    slug: 'gerer-son-abonnement',
    title: 'Gérer son abonnement',
    category: 'Facturation & Plans',
    categorySlug: 'facturation-plans',
    readTime: '4 min',
    lastUpdated: '2026-02-10',
    content: `
## Gérer son abonnement

Gérez votre plan, votre facturation et vos options depuis les paramètres.

### Accéder à la gestion

1. **Paramètres > Abonnement**
2. Voir votre plan actuel et l'utilisation
3. Modifier ou annuler

### Changer de plan

- **Upgrade** : Immédiat, proratisé pour le mois en cours
- **Downgrade** : Effectif à la fin de la période de facturation
- **Annulation** : Accès jusqu'à la fin de la période payée

### Moyens de paiement

- Carte bancaire (Visa, Mastercard, Amex)
- PayPal
- Virement bancaire (Enterprise uniquement)

### Factures

Toutes les factures sont disponibles dans **Paramètres > Facturation** :
- Téléchargement PDF
- Envoi automatique par email
- TVA conforme

> ⚡ **Astuce** : Optez pour la facturation annuelle et économisez 20%.
    `,
    relatedLinks: [
      { title: 'Plans et tarifs', slug: 'plans-et-tarifs' },
      { title: 'Factures et paiements', slug: 'factures-et-paiements' },
    ]
  },
  {
    slug: 'factures-et-paiements',
    title: 'Factures et paiements',
    category: 'Facturation & Plans',
    categorySlug: 'facturation-plans',
    readTime: '3 min',
    lastUpdated: '2026-01-28',
    content: `
## Factures et paiements

Accédez à toutes vos factures et gérez vos moyens de paiement.

### Historique des factures

Dans **Paramètres > Facturation**, retrouvez :
- Toutes vos factures (PDF téléchargeable)
- Le statut de paiement (payée, en attente)
- Le détail de chaque facture

### Modifier le moyen de paiement

1. **Paramètres > Facturation > Moyens de paiement**
2. Ajoutez ou modifiez votre carte
3. La prochaine facture utilisera le nouveau moyen

### En cas d'échec de paiement

- Notification email automatique
- 3 tentatives automatiques sur 7 jours
- Compte suspendu après 14 jours sans paiement
- Données conservées 30 jours après suspension

> 💡 **Conseil** : Ajoutez un moyen de paiement secondaire pour éviter toute interruption de service.
    `,
    relatedLinks: [
      { title: 'Gérer son abonnement', slug: 'gerer-son-abonnement' },
    ]
  },
  {
    slug: 'credits-ia',
    title: 'Crédits IA',
    category: 'Facturation & Plans',
    categorySlug: 'facturation-plans',
    readTime: '4 min',
    lastUpdated: '2026-02-05',
    content: `
## Crédits IA

Les crédits IA sont la monnaie de l'intelligence artificielle ShopOpti+.

### Utilisation des crédits

| Action | Crédits |
|--------|---------|
| Optimisation de titre | 1 |
| Génération de description | 2 |
| Traduction complète | 3 |
| Analyse concurrentielle | 5 |
| Prévision de ventes | 3 |
| Audit SEO complet | 2 |

### Crédits par plan

- **Starter** : 100 crédits/mois
- **Pro** : 500 crédits/mois
- **Business** : 2 000 crédits/mois
- **Enterprise** : Illimité

### Acheter des crédits supplémentaires

Si vous dépassez votre allocation mensuelle :
- Pack 100 crédits : 9€
- Pack 500 crédits : 39€
- Pack 2000 crédits : 129€

### Suivi de consommation

Suivez votre utilisation dans **Paramètres > Crédits IA** :
- Consommation par jour
- Détail par type d'action
- Prévision de fin de mois
- Alertes de seuil

> ⚡ **Astuce** : Utilisez l'optimisation par lot pour maximiser l'efficacité de vos crédits IA.
    `,
    relatedLinks: [
      { title: 'Plans et tarifs', slug: 'plans-et-tarifs' },
    ]
  },
  {
    slug: 'essai-gratuit',
    title: 'Essai gratuit',
    category: 'Facturation & Plans',
    categorySlug: 'facturation-plans',
    readTime: '3 min',
    lastUpdated: '2026-01-20',
    content: `
## Essai gratuit

Testez ShopOpti+ gratuitement pendant 14 jours, sans carte bancaire.

### Ce qui est inclus

- Accès complet au plan Pro pendant 14 jours
- 100 crédits IA offerts
- Support par chat et email
- Import illimité de produits
- Tous les canaux de vente

### Démarrer l'essai

1. Créez votre compte sur [shopopti.io](https://shopopti.io)
2. Confirmez votre email
3. L'essai démarre immédiatement
4. Aucune carte bancaire requise

### Après l'essai

- **Vous souscrivez** : Vos données sont conservées, la transition est transparente
- **Vous ne souscrivez pas** : Votre compte passe en lecture seule pendant 30 jours puis les données sont supprimées

### Prolonger l'essai

Contactez le support pour une prolongation exceptionnelle si vous avez besoin de plus de temps pour évaluer.

> 💡 **Conseil** : Profitez de l'essai pour tester toutes les fonctionnalités, y compris l'IA et le multi-canal.
    `,
    relatedLinks: [
      { title: 'Plans et tarifs', slug: 'plans-et-tarifs' },
    ]
  },
  {
    slug: 'programme-entreprise',
    title: 'Programme entreprise',
    category: 'Facturation & Plans',
    categorySlug: 'facturation-plans',
    readTime: '5 min',
    lastUpdated: '2026-02-15',
    content: `
## Programme entreprise

Le programme Enterprise est conçu pour les grandes entreprises avec des besoins spécifiques.

### Avantages Enterprise

- **Crédits IA illimités**
- **SLA garanti** (99.9% uptime)
- **Account manager dédié**
- **Intégrations personnalisées**
- **Formation sur site**
- **Support prioritaire 24/7**
- **API haute fréquence** (5000 RPM)

### Fonctionnalités exclusives

- SSO (SAML 2.0 / OAuth)
- Audit trail complet
- Rôles et permissions granulaires
- Multi-workspace
- Environnement de staging
- Export et migration assistés

### Demander un devis

1. Contactez-nous via le [formulaire entreprise](/contact)
2. Un consultant vous rappelle sous 24h
3. Démonstration personnalisée
4. Devis sur mesure

> ⚡ **Astuce** : Le programme Enterprise inclut une migration assistée depuis votre solution actuelle.
    `,
    relatedLinks: [
      { title: 'Plans et tarifs', slug: 'plans-et-tarifs' },
    ]
  },

  // ═══════════════════════════════════════
  // INTÉGRATIONS
  // ═══════════════════════════════════════
  {
    slug: 'api-rest-complete',
    title: 'API REST complète',
    category: 'Intégrations',
    categorySlug: 'integrations',
    readTime: '10 min',
    lastUpdated: '2026-02-22',
    content: `
## API REST complète

L'API ShopOpti+ vous permet d'intégrer la plateforme dans vos outils et workflows existants.

### Authentification

\`\`\`bash
curl -H "Authorization: Bearer sk_live_xxxx" \\
     https://api.shopopti.io/v1/products
\`\`\`

### Endpoints principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| \`/v1/products\` | GET, POST | Liste et création de produits |
| \`/v1/products/:id\` | GET, PATCH, DELETE | CRUD produit |
| \`/v1/orders\` | GET, POST | Liste et création de commandes |
| \`/v1/customers\` | GET, POST | Liste et création de clients |
| \`/v1/analytics/kpis\` | GET | KPIs business |
| \`/v1/webhooks\` | GET, POST | Gestion des webhooks |

### Rate limiting

| Plan | Requêtes/min |
|------|-------------|
| Starter | 60 |
| Pro | 300 |
| Business | 1000 |
| Enterprise | 5000 |

### SDKs disponibles

- **JavaScript** : \`npm install @shopopti/sdk\`
- **Python** : \`pip install shopopti\`
- **PHP** : \`composer require shopopti/sdk\`

### Documentation interactive

Testez les endpoints en direct dans notre [API Playground](/api-docs).

> 💡 **Conseil** : Utilisez les webhooks plutôt que le polling pour des intégrations en temps réel.
    `,
    relatedLinks: [
      { title: 'Webhooks', slug: 'webhooks' },
      { title: 'Extensions Chrome', slug: 'extensions-chrome' },
    ]
  },
  {
    slug: 'extensions-chrome',
    title: 'Extensions Chrome',
    category: 'Intégrations',
    categorySlug: 'integrations',
    readTime: '5 min',
    lastUpdated: '2026-02-15',
    content: `
## Extensions Chrome

L'extension Chrome ShopOpti+ vous permet d'importer des produits directement depuis votre navigateur.

### Installation

1. Visitez le [Chrome Web Store](https://chrome.google.com/webstore)
2. Recherchez "ShopOpti+"
3. Cliquez "Ajouter à Chrome"
4. Connectez-vous avec vos identifiants ShopOpti+

### Fonctionnalités

- **Import en 1 clic** depuis AliExpress, CJ, Amazon
- **Analyse de produit** : Marge, concurrence, tendance
- **Comparaison de prix** multi-fournisseurs
- **Alertes de prix** sur les produits suivis
- **Import d'images** avec suppression watermark

### Sites supportés

- AliExpress
- CJ Dropshipping
- 1688.com
- DHGate
- Amazon (analyse uniquement)
- eBay (analyse uniquement)

### Configuration

Dans les paramètres de l'extension :
- Langue de l'interface
- Devise par défaut
- Règle de marge automatique
- Notifications push

> ⚡ **Astuce** : Épinglez l'extension dans la barre Chrome pour un accès rapide.
    `,
    relatedLinks: [
      { title: 'Importer depuis AliExpress', slug: 'importer-depuis-aliexpress' },
    ]
  },
  {
    slug: 'zapier-make',
    title: 'Zapier & Make',
    category: 'Intégrations',
    categorySlug: 'integrations',
    readTime: '6 min',
    lastUpdated: '2026-02-08',
    content: `
## Zapier & Make

Connectez ShopOpti+ à 5000+ applications via Zapier et Make (ex-Integromat).

### Zapier

#### Triggers disponibles
- Nouvelle commande
- Nouveau produit importé
- Stock bas
- Nouveau client

#### Actions disponibles
- Créer un produit
- Mettre à jour le stock
- Envoyer une notification
- Créer une commande

#### Configuration
1. Dans Zapier, cherchez "ShopOpti+"
2. Connectez votre compte via clé API
3. Créez vos Zaps

### Make (Integromat)

Mêmes triggers et actions, avec en plus :
- Scénarios multi-étapes visuels
- Filtres et routeurs avancés
- Gestion d'erreurs intégrée

### Cas d'usage populaires

- **Slack** : Notification à chaque commande
- **Google Sheets** : Export automatique des ventes
- **Mailchimp** : Ajout de clients à une liste
- **Trello** : Carte créée pour chaque commande à traiter

> 💡 **Conseil** : Utilisez Make pour des workflows complexes et Zapier pour des automatisations simples.
    `,
    relatedLinks: [
      { title: 'Webhooks', slug: 'webhooks' },
      { title: 'API REST complète', slug: 'api-rest-complete' },
    ]
  },
  {
    slug: 'google-analytics',
    title: 'Google Analytics',
    category: 'Intégrations',
    categorySlug: 'integrations',
    readTime: '5 min',
    lastUpdated: '2026-01-28',
    content: `
## Google Analytics

Connectez Google Analytics 4 pour un suivi complet de votre activité e-commerce.

### Configuration

1. **Paramètres > Tracking > Google Analytics**
2. Entrez votre ID de mesure GA4 (G-XXXXXXXXX)
3. Activez le suivi e-commerce amélioré
4. Sauvegardez

### Événements trackés automatiquement

- \`page_view\` : Chaque page visitée
- \`view_item\` : Produit consulté
- \`add_to_cart\` : Ajout au panier
- \`begin_checkout\` : Début de checkout
- \`purchase\` : Achat complété
- \`refund\` : Remboursement

### Rapports e-commerce

Dans GA4, accédez aux rapports :
- Revenus par source de trafic
- Taux de conversion par canal
- Comportement d'achat (funnel)
- Performance des produits

> ⚡ **Astuce** : Configurez des audiences GA4 pour le remarketing Facebook et Google Ads.
    `,
    relatedLinks: [
      { title: 'Facebook Pixel', slug: 'facebook-pixel' },
    ]
  },
  {
    slug: 'facebook-pixel',
    title: 'Facebook Pixel',
    category: 'Intégrations',
    categorySlug: 'integrations',
    readTime: '4 min',
    lastUpdated: '2026-01-22',
    content: `
## Facebook Pixel

Installez le Pixel Facebook/Meta pour le tracking des conversions et le retargeting.

### Configuration

1. **Paramètres > Tracking > Facebook Pixel**
2. Entrez votre Pixel ID
3. Activez les événements standard
4. (Optionnel) Configurez l'API Conversions pour une précision accrue

### Événements trackés

- \`PageView\` : Visite de page
- \`ViewContent\` : Consultation produit
- \`AddToCart\` : Ajout au panier
- \`InitiateCheckout\` : Début checkout
- \`Purchase\` : Achat
- \`Search\` : Recherche produit

### API Conversions (CAPI)

Pour contourner les limitations des bloqueurs de publicités :
1. Activez l'API Conversions dans les paramètres
2. Les événements sont envoyés serveur-side directement à Facebook
3. Dédupliquation automatique avec le Pixel navigateur

> 💡 **Conseil** : Combinez Pixel + API Conversions pour un tracking à 95%+ de précision.
    `,
    relatedLinks: [
      { title: 'Google Analytics', slug: 'google-analytics' },
      { title: 'Publicité Facebook & Instagram', slug: 'publicite-facebook-instagram' },
    ]
  },
  {
    slug: 'webhooks-sortants',
    title: 'Webhooks sortants',
    category: 'Intégrations',
    categorySlug: 'integrations',
    readTime: '5 min',
    lastUpdated: '2026-02-01',
    content: `
## Webhooks sortants

Envoyez des notifications HTTP à vos systèmes externes quand des événements se produisent dans ShopOpti+.

### Différence webhook entrant vs sortant

- **Entrant** : ShopOpti+ reçoit des données d'un service externe
- **Sortant** : ShopOpti+ envoie des données vers un service externe

### Configuration

1. **API > Webhooks sortants > Nouveau**
2. URL de destination
3. Événements à envoyer
4. Secret de signature
5. Headers personnalisés (optionnel)

### Retry et fiabilité

- 3 tentatives automatiques en cas d'échec
- Backoff exponentiel (1s, 10s, 60s)
- Log de chaque tentative
- Alerte après 3 échecs consécutifs

### Debug

- Logs de livraison en temps réel
- Rejeu d'événement à la demande
- Inspection du payload envoyé
- Vérification de la signature côté récepteur

> ⚡ **Astuce** : Utilisez [webhook.site](https://webhook.site) pour tester vos webhooks avant de les connecter à votre production.
    `,
    relatedLinks: [
      { title: 'API REST complète', slug: 'api-rest-complete' },
      { title: 'Webhooks', slug: 'webhooks' },
    ]
  },
];
