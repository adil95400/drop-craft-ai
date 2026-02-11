

# Audit Complet de Toutes les Pages - ShopOpti+

## Statistiques Globales

| Metrique | Valeur |
|----------|--------|
| Fichiers route (.tsx) | 25 modules |
| Pages totales (fichiers) | ~200+ |
| Routes configurees | ~280+ (incluant redirections) |
| Routes fonctionnelles uniques | ~170 |
| Redirections legacy | ~60 |
| Pages publiques | 22 |
| Pages protegees | ~150+ |
| Pages admin | 5 |

---

## 1. ROUTES PUBLIQUES (22 pages)

| Route | Page | Module Route |
|-------|------|-------------|
| `/` | Landing Page (Index) | PublicRoutes |
| `/auth` | Authentification | PublicRoutes |
| `/auth/extension` | Auth Extension Chrome | PublicRoutes |
| `/pricing` | Page Tarifs Marketing | PublicRoutes |
| `/pricing-plans` | Plans detailles | PublicRoutes |
| `/features` | Fonctionnalites | PublicRoutes |
| `/features/ai-optimization` | Feature IA | PublicRoutes |
| `/features/multi-marketplace` | Feature Multi-Marketplace | PublicRoutes |
| `/features/analytics` | Feature Analytics | PublicRoutes |
| `/documentation` | Documentation publique | PublicRoutes |
| `/blog` | Blog | PublicRoutes |
| `/changelog` | Journal des changements | PublicRoutes |
| `/status` | Statut systeme | PublicRoutes |
| `/testimonials` | Temoignages | PublicRoutes |
| `/contact` | Contact | PublicRoutes |
| `/faq` | FAQ | PublicRoutes |
| `/privacy` | Politique de confidentialite | PublicRoutes |
| `/terms` | CGU | PublicRoutes |
| `/about` | A propos | PublicRoutes |
| `/payment/success` | Paiement reussi | PublicRoutes |
| `/payment/cancelled` | Paiement annule | PublicRoutes |
| `/store` | Shopify Store public | index.tsx |
| `/store/product/:handle` | Detail produit Shopify | index.tsx |
| `/guides/getting-started` | Guide demarrage | index.tsx |
| `/academy` | Academie (public) | index.tsx |
| `/pwa-install` | Installation PWA | index.tsx |

---

## 2. DASHBOARD & CORE (24 pages) - `/dashboard/*`

| Route | Page |
|-------|------|
| `/dashboard` | Dashboard principal (ChannableDashboard) |
| `/dashboard/profile` | Profil utilisateur |
| `/dashboard/settings` | Parametres generaux |
| `/dashboard/store/builder` | AI Store Builder |
| `/dashboard/invoices` | Facturation & Branding |
| `/dashboard/pod` | Print-on-Demand |
| `/dashboard/research/intelligence` | Intelligence Competitive |
| `/dashboard/sync-manager` | Sync Manager |
| `/dashboard/marketplace-sync` | Sync Marketplace |
| `/dashboard/multi-store` | Multi-Store Dashboard |
| `/dashboard/notifications` | Notifications |
| `/dashboard/stock` | Gestion Stock |
| `/dashboard/reports` | Rapports |
| `/dashboard/analytics` | Analytics avancees |
| `/dashboard/products` | Catalogue Produits |
| `/dashboard/ai-insights` | Analytics predictives |
| `/dashboard/workflows` | Workflows Automation |
| `/dashboard/api` | Gestion API |
| `/dashboard/billing` | Facturation |
| `/dashboard/academy` | Academie |
| `/dashboard/security` | Securite |
| `/dashboard/onboarding` | Onboarding Hub |
| `/dashboard/subscription` | Abonnement |
| `/dashboard/consumption` | Consommation |

---

## 3. PRODUITS (25 pages) - `/products/*`

| Route | Page |
|-------|------|
| `/products` | Catalogue Produits (CatalogProductsPage) |
| `/products/cockpit` | Cockpit Business |
| `/products/publish` | Publication Multi-canal |
| `/products/advanced` | Produits avances |
| `/products/:id` | Detail Produit |
| `/products/audit` | Audit Produit |
| `/products/research` | Recherche Produits |
| `/products/intelligence` | Intelligence Predictive |
| `/products/sourcing` | Sourcing Produit |
| `/products/price-rules` | Regles de Prix |
| `/products/scoring` | Scoring Produit |
| `/products/ai-content` | Contenu IA |
| `/products/image-audit` | Audit Images |
| `/products/marketplace-campaigns` | Campagnes Marketplace |
| `/products/profit-calculator` | Calculateur Profit |
| `/products/bulk-content` | Creation en masse |
| `/products/inventory-predictor` | Prediction inventaire |
| `/products/variants` | Variantes |
| `/products/warehouse` | Entrepot |
| `/products/vendors` | Fournisseurs |
| + ~10 redirections legacy | |

---

## 4. CATALOGUE (7 pages) - `/catalog/*`

| Route | Page |
|-------|------|
| `/catalog/to-process` | A traiter |
| `/catalog/variants` | Variantes |
| `/catalog/media` | Medias |
| `/catalog/attributes` | Attributs |
| `/catalog/categories-brands` | Categories & Marques |
| `/catalog/health` | Sante du catalogue |
| `/catalog/image-dedup` | Deduplication Images |

---

## 5. COMMANDES (8 pages) - `/orders/*`

| Route | Page |
|-------|------|
| `/orders` | Centre de commandes |
| `/orders/:id` | Detail commande |
| `/orders/bulk` | Commandes en masse |
| `/orders/create` | Creer commande |
| `/orders/fulfillment` | Fulfillment (onglets: carriers, rules, returns, tracking) |

---

## 6. CLIENTS (3 pages) - `/customers/*`

| Route | Page |
|-------|------|
| `/customers` | Liste clients |
| `/customers/segmentation` | Segmentation |
| `/customers/create` | Creer client |

---

## 7. IMPORT (30+ pages) - `/import/*`

| Route | Page |
|-------|------|
| `/import` | Hub Import |
| `/import/config` | Configuration |
| `/import/shopify` | Import Shopify |
| `/import/amazon` | Import Amazon |
| `/import/aliexpress` | Import AliExpress |
| `/import/ebay` | Import eBay |
| `/import/etsy` | Import Etsy |
| `/import/cj-dropshipping` | Import CJ |
| `/import/temu` | Import Temu |
| `/import/cdiscount` | Import Cdiscount |
| `/import/quick` | Import rapide |
| `/import/url` | Import URL |
| `/import/autods` | Import AutoDS |
| `/import/feed-url` | Import Feed URL |
| `/import/advanced` | Import avance |
| `/import/bulk` | Import masse |
| `/import/multi-store` | Import multi-store |
| `/import/search-suppliers` | Recherche fournisseurs |
| `/import/shopify-hub` | Hub Shopify |
| `/import/ai-generation` | Generation IA |
| `/import/extensions` | Extensions |
| `/import/history` | Historique |
| `/import/scheduled` | Planifie |
| `/import/products` | Produits importes |
| `/import/publishing` | Publication |
| `/import/marketplace` | Marketplace |
| `/import/rules` | Regles pre-import |
| `/import/item-retry` | Retry granulaire |
| `/import/item-retry/:jobId` | Retry detail job |

---

## 8. FOURNISSEURS (18 pages) - `/suppliers/*`

| Route | Page |
|-------|------|
| `/suppliers` | Hub Fournisseurs (Channable) |
| `/suppliers/catalog` | Catalogue unifie |
| `/suppliers/engine` | Moteur avance |
| `/suppliers/my` | Mes fournisseurs |
| `/suppliers/analytics` | Analytics fournisseurs |
| `/suppliers/settings` | Parametres |
| `/suppliers/feeds` | Feeds fournisseurs |
| `/suppliers/variant-mapping` | Mapping variantes |
| `/suppliers/create` | Creer fournisseur |
| `/suppliers/bts/import` | Import BTS CSV |
| `/suppliers/marketplace` | Marketplace fournisseurs |
| `/suppliers/sourcing-agent` | Agent Sourcing IA |
| `/suppliers/:supplierId` | Detail fournisseur |
| `/suppliers/:supplierId/catalog` | Catalogue par fournisseur |
| `/suppliers/:supplierId/advanced` | Avance par fournisseur |
| `/suppliers/:supplierId/import` | Import par fournisseur |
| `/suppliers/:supplierId/feeds` | Feeds par fournisseur |
| `/suppliers/:supplierId/edit` | Editer fournisseur |

---

## 9. BOUTIQUES & CANAUX (10 pages) - `/stores-channels/*`

| Route | Page |
|-------|------|
| `/stores-channels` | Hub Boutiques & Canaux |
| `/stores-channels/connect` | Connexion boutique |
| `/stores-channels/connect/:platform` | Connexion plateforme |
| `/stores-channels/:channelId` | Detail canal |
| `/stores-channels/integrations/:id` | Gestion integration |
| `/stores-channels/shopify-diagnostic` | Diagnostic Shopify |
| `/stores-channels/shopify-management` | Gestion Shopify |
| `/stores-channels/sync` | Sync Dashboard |
| `/stores-channels/analytics` | Analytics canaux |

---

## 10. FEEDS (5 pages) - `/feeds/*`

| Route | Page |
|-------|------|
| `/feeds` | Feed Manager (Channable) |
| `/feeds/optimization` | Optimisation feeds |
| `/feeds/rules` | Regles de feeds |
| `/feeds/ppc-link` | Lien PPC |
| `/feeds/categories` | Mapping categories |

---

## 11. ANALYTICS (14 pages) - `/analytics/*`

| Route | Page |
|-------|------|
| `/analytics` | Analytics avancees |
| `/analytics/predictive` | Analytics predictives |
| `/analytics/real-data` | Donnees reelles |
| `/analytics/competitive` | Analyse concurrentielle |
| `/analytics/reports` | Rapports |
| `/analytics/profit-analytics` | Dashboard Profit |
| `/analytics/advanced` | Dashboard avance |
| `/analytics/customer-segmentation` | Segmentation clients |
| `/analytics/forecasting` | Previsions revenus |

---

## 12. AUDIT (6 pages) - `/audit/*`

| Route | Page |
|-------|------|
| `/audit` | Dashboard Audit |
| `/audit/products` | Liste produits audit |
| `/audit/batch` | Audit batch |
| `/audit/scoring` | Scoring |
| `/audit/seo` | Audit SEO |
| `/audit/feed` | Audit Feed |

---

## 13. RESEARCH (7 pages) - `/research/*`

| Route | Page |
|-------|------|
| `/research` | Hub Research |
| `/research/winning` | Winning Products |
| `/research/competitors` | Analyse concurrents |
| `/research/ads` | Ads Spy |
| `/research/trends` | Tendances |
| `/research/sourcing` | Sourcing |
| `/research/intelligence` | Intelligence competitive |

---

## 14. AUTOMATION (16 pages) - `/automation/*`

| Route | Page |
|-------|------|
| `/automation` | Hub Automation |
| `/automation/ai` | IA Content |
| `/automation/fulfillment` | Auto-Fulfillment |
| `/automation/tracking` | Auto-Tracking |
| `/automation/promotions` | Promotions auto |
| `/automation/optimization` | Optimisation |
| `/automation/unified-sync` | Sync unifiee |
| `/automation/sourcing-assistant` | Assistant sourcing |
| `/automation/recommendations` | Recommandations |
| + redirections vers pricing-manager | |

---

## 15. IA (8 pages) - `/ai/*`

| Route | Page |
|-------|------|
| `/ai` | Hub IA (Content Generation) |
| `/ai/optimization` | Optimisation IA |
| `/ai/content` | Generation contenu |
| `/ai/catalog` | Intelligence catalogue |
| `/ai/rewrite` | Reecriture IA |
| `/ai/studio` | Studio IA |
| `/ai/snapshots` | Snapshots enrichissement |

---

## 16. MARKETING (21 pages) - `/marketing/*`

| Route | Page |
|-------|------|
| `/marketing` | Hub Marketing (CRM) |
| `/marketing/promotions` | Promotions |
| `/marketing/crm` | CRM |
| `/marketing/seo` | SEO Manager |
| `/marketing/ads` | Gestionnaire Ads |
| `/marketing/ab-testing` | A/B Testing |
| `/marketing/abandoned-cart` | Paniers abandonnes |
| `/marketing/affiliate` | Affiliation |
| `/marketing/email` | Email Marketing |
| `/marketing/flash-sales` | Ventes flash |
| `/marketing/loyalty` | Programme fidelite |
| `/marketing/coupons` | Gestion coupons |
| `/marketing/calendar` | Calendrier marketing |
| `/marketing/social-commerce` | Social Commerce |
| `/marketing/creative-studio` | Studio creatif |
| `/marketing/content-generation` | Generation contenu |
| `/marketing/seo/keywords` | Recherche mots-cles |
| `/marketing/seo/rank-tracker` | Suivi positions |
| `/marketing/seo/schema` | Generateur Schema |

---

## 17. PRICING (6 pages) - `/pricing-manager/*`

| Route | Page |
|-------|------|
| `/pricing-manager` | Hub Tarification |
| `/pricing-manager/rules` | Regles de prix |
| `/pricing-manager/repricing` | Repricing temps reel |
| `/pricing-manager/monitoring` | Veille prix |
| `/pricing-manager/optimization` | Optimisation IA |

---

## 18. INTEGRATIONS (15 pages) - `/integrations/*`

| Route | Page |
|-------|------|
| `/integrations` | Hub Integrations (Channable) |
| `/integrations/sync-config` | Config sync |
| `/integrations/tiktok-shop` | TikTok Shop |
| `/integrations/connectors` | Connecteurs |
| `/integrations/marketplace` | Hub Marketplace |
| `/integrations/marketplace/feed-manager` | Feed Manager |
| `/integrations/extensions` | Extensions |
| `/integrations/extensions/api` | API Extension |
| `/integrations/extensions/chrome-config` | Config Chrome |
| `/integrations/api/developer` | API Developer |
| `/integrations/support` | Support |
| `/integrations/academy` | Academie |
| `/integrations/content` | Gestion contenu |
| `/integrations/multi-channel` | Multi-Canal |
| `/integrations/multi-store-sync` | Sync Multi-Store |

---

## 19. EXTENSIONS (16 pages) - `/extensions/*`

| Route | Page |
|-------|------|
| `/extensions` | Hub Extensions |
| `/extensions/marketplace` | Marketplace |
| `/extensions/cli` | CLI |
| `/extensions/developer` | Developer |
| `/extensions/white-label` | White Label |
| `/extensions/sso` | SSO |
| `/extensions/download` | Telechargement |
| `/extensions/installation` | Installation |
| `/extensions/documentation` | Documentation |
| `/extensions/tutorials` | Tutoriels |
| `/extensions/faq` | FAQ Extension |
| `/extensions/reviews` | Import avis |
| `/extensions/chrome` | Extension Chrome |
| `/extensions/api` | API Extension |
| `/extensions/history` | Historique imports |
| `/extensions/readiness` | Readiness |
| `/extensions/health` | Sante extension |

---

## 20. STOCK (4 pages) - `/stock/*`

| Route | Page |
|-------|------|
| `/stock` | Gestion stock |
| `/stock/repricing` | Repricing stock |
| `/stock/price-monitor` | Moniteur prix |

---

## 21. OUTILS (5 pages) - `/tools/*`

| Route | Page |
|-------|------|
| `/tools` | Calculateur profit |
| `/tools/profit-calculator` | Calculateur profit |
| `/tools/bulk-content` | Creation en masse |
| `/tools/schema-generator` | Generateur Schema |
| `/tools/intelligence` | Intelligence predictive |
| `/tools/canva-callback` | Callback Canva |

---

## 22. SETTINGS (10 pages) - `/settings/*`

| Route | Page |
|-------|------|
| `/settings` | Parametres generaux |
| `/settings/stores` | Boutiques |
| `/settings/api` | Gestion API |
| `/settings/billing` | Facturation |
| `/settings/security` | Securite |
| `/settings/white-label` | White Label |
| `/settings/domains` | Enregistrement domaines |
| `/settings/webhooks` | Gestion webhooks |
| `/settings/export` | Centre export |
| `/settings/notifications` | Preferences notifications |

---

## 23. ENTERPRISE (10 pages) - `/enterprise/*`

| Route | Page |
|-------|------|
| `/enterprise/commerce` | Commerce multi-canal |
| `/enterprise/multi-tenant` | Multi-tenant |
| `/enterprise/monitoring` | Monitoring |
| `/enterprise/platform` | Gestion plateforme |
| `/enterprise/tax` | Gestion fiscale |
| `/enterprise/team` | Collaboration equipe |
| `/enterprise/i18n` | Internationalisation |
| `/enterprise/quotas` | Gestion quotas |
| `/enterprise/subscriptions` | Abonnements |
| `/enterprise/compliance` | Conformite |

---

## 24. ADMIN (5 pages) - `/admin/*`

| Route | Page |
|-------|------|
| `/admin` | Panel Admin |
| `/admin/security` | Securite admin |
| `/admin/video-tutorials` | Tutoriels video |
| `/admin/suppliers` | Fournisseurs admin |
| `/admin/consumption` | Consommation admin |

---

## 25. PAGES STANDALONE PROTEGEES

| Route | Page |
|-------|------|
| `/notifications` | Centre notifications |
| `/notifications/create` | Creer notification |
| `/sync-manager` | Gestionnaire sync |
| `/reviews` | Avis clients |
| `/advanced` | Analytics avancees |
| `/monitoring` | Monitoring performance |
| `/catalog-intelligence` | Intelligence catalogue |
| `/coupons` | Gestion coupons |
| `/trial` | Activation essai gratuit |
| `/ab-testing` | A/B Testing |
| `/reports` | Rapports |
| `/profile` | Profil (-> Billing) |
| `/subscription` | Abonnement |
| `/choose-plan` | Choix de plan |
| `/api/documentation` | Documentation API |
| `/page-builder` | Constructeur de pages |
| `/page-builder/:pageId` | Editeur de page |
| `/help-center` | Centre d'aide |
| `/help-center/documentation` | Documentation modules |
| `/help-center/documentation/:moduleSlug` | Doc module specifique |
| `/support` | Support |
| `/sitemap` | Plan du site |

---

## Resume par Domaine Fonctionnel

| Domaine | Nb Pages Uniques | Status |
|---------|-----------------|--------|
| Public / Marketing | 22 | OK |
| Dashboard / Core | 24 | OK |
| Produits | 25 | OK |
| Catalogue | 7 | OK |
| Commandes | 8 | OK |
| Clients | 3 | OK |
| Import | 30+ | OK |
| Fournisseurs | 18 | OK |
| Boutiques/Canaux | 10 | OK |
| Feeds | 5 | OK |
| Analytics | 14 | OK |
| Audit | 6 | OK |
| Research | 7 | OK |
| Automation | 16 | OK |
| IA | 8 | OK |
| Marketing | 21 | OK |
| Pricing | 6 | OK |
| Integrations | 15 | OK |
| Extensions | 16 | OK |
| Stock | 4 | OK |
| Outils | 5 | OK |
| Settings | 10 | OK |
| Enterprise | 10 | OK |
| Admin | 5 | OK |
| Standalone | 22 | OK |
| **TOTAL** | **~280 routes** | **Fonctionnel** |

Toutes les routes sont mappees a des composants existants. Aucune page orpheline ni route cassee detectee dans l'architecture actuelle.

