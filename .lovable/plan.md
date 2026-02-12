

# Optimisation SEO Complete de ShopOpti+ pour Google

## Etat actuel (ce qui existe deja)

**Bien en place :**
- Composant `<SEO>` avec Helmet (title, meta, canonical, OG, Twitter)
- JSON-LD : Organization, SoftwareApplication, FAQ, Article, Breadcrumb, LocalBusiness (dans `StructuredData.tsx`)
- Breadcrumbs UI + schema
- Sitemap.xml statique + script de generation
- Robots.txt basique
- `_redirects` www vers non-www
- `_headers` avec cache control
- Blog statique (hardcode dans `BlogPage.tsx`)
- Pages publiques : Index, Features, Pricing, FAQ, About, Contact

**Manquant :**
- Pages SEO SaaS (/logiciel-dropshipping, /alternative-autods, etc.)
- Blog dynamique avec articles individuels (/blog/slug)
- Sitemap dynamique couvrant toutes les routes
- BreadcrumbSchema non utilise sur les pages publiques
- Tracking Google (Search Console, Analytics)
- Alt text automatique IA
- Audit Core Web Vitals automatise

---

## Plan d'implementation en 5 phases

### Phase 1 : SEO technique (fondations)

**1.1 - Corriger le composant `<SEO>`**
- Remplacer `www.shopopti.io` par `shopopti.io` (coherent avec le canonical defini dans `_redirects`)
- Remplacer "Drop Craft AI" par "ShopOpti+" partout (og:site_name, author)

**1.2 - Sitemap.xml dynamique**
- Mettre a jour `scripts/generate-sitemap.cjs` pour inclure toutes les routes publiques existantes + les 4 nouvelles pages SaaS + les routes blog
- Ajouter les dates `lastmod` actualisees

**1.3 - Robots.txt optimise**
- Ajouter directives pour bloquer les parametres de requete (`?sort=`, `?filter=`)
- S'assurer que le sitemap pointe vers `https://shopopti.io/sitemap.xml` (sans www)

**1.4 - BreadcrumbSchema sur toutes les pages publiques**
- Ajouter `<BreadcrumbSchema>` sur : Features, Pricing, FAQ, About, Contact, Blog
- Le composant existe deja dans `StructuredData.tsx`, il suffit de l'integrer

**1.5 - Meta tag Google Site Verification**
- Ajouter un composant pour inserer `<meta name="google-site-verification">` via une variable d'environnement
- Ajouter le support Google Analytics (gtag.js) via un composant `<GoogleAnalytics>`

**Fichiers modifies :**
- `src/components/SEO.tsx`
- `public/robots.txt`
- `scripts/generate-sitemap.cjs`
- `src/pages/Features.tsx`, `Pricing.tsx`, `FAQ.tsx`, `About.tsx`, `Contact.tsx`

**Fichiers crees :**
- `src/components/seo/GoogleTracking.tsx`

---

### Phase 2 : Pages SEO SaaS (contenu strategique)

Creer 4 pages longues (1500-2500 mots) optimisees pour le referencement :

| Page | URL | Mot-cle principal |
|------|-----|-------------------|
| Logiciel Dropshipping | `/logiciel-dropshipping` | logiciel dropshipping |
| Alternative AutoDS | `/alternative-autods` | alternative autods |
| Optimisation Shopify | `/optimisation-shopify` | optimisation shopify |
| Gestion Catalogue | `/gestion-catalogue-ecommerce` | gestion catalogue ecommerce |

**Chaque page contiendra :**
- H1 unique + structure H2/H3 semantique
- 1500-2500 mots de contenu riche
- Section FAQ integree avec `<FAQSchema>`
- `<BreadcrumbSchema>`
- `<SEO>` avec title, description, keywords optimises
- CTA vers inscription / essai gratuit
- Maillage interne vers les autres pages SaaS et le blog

**Fichiers crees :**
- `src/pages/public/LogicielDropshippingPage.tsx`
- `src/pages/public/AlternativeAutodsPage.tsx`
- `src/pages/public/OptimisationShopifyPage.tsx`
- `src/pages/public/GestionCatalogueEcommercePage.tsx`

**Fichiers modifies :**
- Routeur principal (ajout des 4 routes)

---

### Phase 3 : Blog SEO dynamique

**3.1 - Page article individuel**
- Creer `src/pages/public/BlogArticlePage.tsx` avec URL `/blog/:slug`
- Integrer `<ArticleSchema>` + `<BreadcrumbSchema>`
- Generer le slug a partir du titre
- Afficher le contenu Markdown avec `react-markdown`

**3.2 - Ameliorer BlogPage.tsx**
- Remplacer les articles hardcodes par des donnees dynamiques depuis la base de donnees (table `blog_posts` existante)
- Ajouter pagination

**Fichiers crees :**
- `src/pages/public/BlogArticlePage.tsx`

**Fichiers modifies :**
- `src/pages/public/BlogPage.tsx`
- Routeur (ajout route `/blog/:slug`)

---

### Phase 4 : Performance et Core Web Vitals

**Deja en place :**
- Code splitting (manualChunks dans vite.config.ts)
- Lazy loading d'images (loading="lazy")
- Cache headers
- Image optimizer plugin

**A ameliorer :**
- Verifier que toutes les images publiques ont des attributs `width` et `height` explicites (CLS)
- Ajouter `loading="lazy"` et `decoding="async"` sur toutes les images sauf hero (LCP)
- S'assurer que les images hero utilisent `fetchpriority="high"` (deja fait sur Index)
- Verifier les `alt` text sur toutes les images des pages publiques

**Fichiers modifies :**
- `src/pages/Features.tsx`, `About.tsx` (ajout alt/width/height si manquant)

---

### Phase 5 : SEO Produit (enrichissement)

**Deja en place :**
- Table `product_seo` + `product_seo_versions` avec historique
- Hook `useProductSEO` pour CRUD
- Pipeline d'enrichissement IA OpenAI
- Composant `ProductSchema` pour JSON-LD produit

**A ajouter :**
- Alt text automatique : lors de l'enrichissement IA, generer aussi un `alt_text` pour chaque image produit et le stocker dans la table produit
- Cela sera integre dans le pipeline existant d'enrichissement (edge function)

**Fichiers modifies :**
- Edge function d'enrichissement IA (ajout du champ `alt_text` dans le prompt)

---

## Ordre d'execution recommande

1. **Phase 1** - SEO technique (corrections rapides, impact immediat)
2. **Phase 4** - Performance (optimisations images)
3. **Phase 2** - Pages SaaS (contenu a fort impact SEO)
4. **Phase 3** - Blog dynamique
5. **Phase 5** - Alt text IA

## Section technique

### Routes a ajouter au routeur
```text
/logiciel-dropshipping    -> LogicielDropshippingPage
/alternative-autods       -> AlternativeAutodsPage
/optimisation-shopify     -> OptimisationShopifyPage
/gestion-catalogue-ecommerce -> GestionCatalogueEcommercePage
/blog/:slug               -> BlogArticlePage
```

### Variables d'environnement necessaires (optionnelles)
- `VITE_GOOGLE_SITE_VERIFICATION` : meta tag verification Search Console
- `VITE_GA_MEASUREMENT_ID` : ID Google Analytics (G-XXXXXXXXXX)

### Estimation
- ~15 fichiers modifies ou crees
- Aucune migration base de donnees requise (tables SEO et blog existent deja)
- Impact attendu : Score Lighthouse SEO > 95

