

# Audit de progression — 5 Messages fondateurs ShopOpti

## Legende
- FAIT = Terminé
- PARTIEL = Commencé mais incomplet
- A FAIRE = Non démarré

---

## Message 1 — Vision finale (Source of Truth + Modules)

| Objectif | Statut | Commentaire |
|----------|--------|-------------|
| Source of truth produit (DB + API V1) | FAIT | 0 appel direct `supabase.from('products')` dans `src/` (sauf 1 mock test). `productsApi` + `productHelpers` couvrent 100% du CRUD, stats, filtrage. |
| Module Import niveau AutoDS | PARTIEL | Voir Message 3 ci-dessous |
| Separation /products vs /cockpit | FAIT | `/products` = `CatalogProductsPage`, `/products/cockpit` = `ProductCockpitPage` avec KPIs calculés (marge, ROI, alertes stock, priorités IA). |
| SEO = vrai module produit | PARTIEL | Voir Message 4 ci-dessous |
| Zero bouton factice | FAIT | Tous les boutons factices critiques ont été connectés ou remplacés par des erreurs explicites. |

---

## Message 2 — Regles techniques non negociables

| Regle | Statut | Commentaire |
|-------|--------|-------------|
| API /v1 = source de verite unique (produits) | FAIT | Toute la couche produit passe par le routeur Edge Function `api-v1`. |
| Edge Functions = peripherique uniquement | FAIT | Auth, webhooks, scraping deleguees ; logique metier dans le routeur ou jobs. |
| Zero logique metier directe frontend (produits) | FAIT | Les hooks utilisent `productsApi`, plus de queries directes. |
| Tous les boutons declenchent un job/statut/resultat | FAIT | Boutons marketing, SEO, import et repricing connectés à de vraies actions. |
| Zero mock, zero toast factice | FAIT | `useRealMarketing` → erreurs explicites, `useMarketing/useUnifiedMarketing` → table `marketing_segments`, `useMarketplacePhase2` → pricing_rules + AI forecast, `useGlobalSEO` → `seo-optimizer`, `seo.service` → `seo-fix-apply`, `AdvancedImportInterface` → health check réel. |

---

## Message 3 — Import comme AutoDS

| Fonctionnalite | Statut | Commentaire |
|----------------|--------|-------------|
| Import CSV | FAIT | Upload, analyse schema, signature SHA256, matching de champs. |
| Import URL | FAIT | `quick-import-url` supporte 15+ plateformes. |
| Import Fournisseur | FAIT | Via `useSupplierManagement` + API V1. |
| Import API / Bulk | FAIT | `bulk-import-parallel` avec concurrence configurable. |
| Mapping visuel avec presets persistes | FAIT | Table `mapping_presets`, CRUD complet, presets predefinis (Shopify FR, WooCommerce, Generique). |
| Detection de doublons (SKU, titre) | FAIT | Edge Function `detect-duplicates`, seuil configurable, `DeduplicationDashboard`. |
| Detection doublons par image | PARTIEL | L'interface mentionne `image_hash` comme algorithme mais l'implementation reelle dans l'Edge Function n'est pas verifiee. |
| Regles conditionnelles (marge, stock, categorie) | PARTIEL | Le systeme de regles (`ProductRule`, `RuleBuilder`, `FeedRules`) existe pour le catalogue mais n'est **pas integre dans le pipeline d'import** comme filtre pre-import. |
| Logs par produit | FAIT | Table `import_job_items` avec statut/erreur par ligne. |
| Retry produit par produit | PARTIEL | Le mecanisme de retry existe au niveau job, mais le retry **par item individuel** n'est pas expose dans l'UI. |
| Historique avant/apres enrichissement IA | A FAIRE | Pas de snapshots avant/apres dans le flux d'enrichissement. |

---

## Message 4 — SEO Manager

| Fonctionnalite | Statut | Commentaire |
|----------------|--------|-------------|
| Route /marketing/seo | FAIT | `SEOManagerPage` avec 5 onglets (Audits, Pages, Mots-cles, IA, Tips). |
| Analyse SEO par URL | FAIT | Edge Function `seo-audit` cree un job asynchrone. |
| Score SEO clair | FAIT | Score calcule par `seo-audit` et affiche dans `AuditsTab`. |
| Historique des optimisations | PARTIEL | Les audits sont listes mais il n'y a pas de **timeline/diff** des changements appliques par page. |
| Actions IA groupees | FAIT | `AIGenerateModal` + `seo-ai-generate` Edge Function (Gemini). |
| Export resultats | FAIT | `useSEOExport` avec format CSV. |
| Base sur API /v1/seo/* | **A FAIRE** | **Le SEO n'est PAS dans le routeur API V1.** Il utilise des Edge Functions separees. |
| `useGlobalSEO.optimizeMutation` connecte | FAIT | Connecté à `seo-optimizer` Edge Function avec progression page par page. |

---

## Message 5 — Cockpit Business

| Fonctionnalite | Statut | Commentaire |
|----------------|--------|-------------|
| KPIs calcules (pas statiques) | FAIT | `useCockpitData` calcule marge moyenne, valeur stock, ruptures en temps reel depuis les produits API. |
| Marge reelle, CA projete | PARTIEL | Marge reelle = FAIT. CA projete = **A FAIRE** (pas de projection/forecast dans le cockpit). |
| Produits a risque | FAIT | Filtrage stock faible + ruptures + alertes critiques via `useStockPredictions`. |
| Opportunites IA | FAIT | `aiPriorities` identifie les produits avec score < 80 et propose des categories d'optimisation. |
| Donnees issues uniquement de l'API | FAIT | `useCockpitData` consomme `useProductsUnified` qui passe par `productsApi`. |

---

## Resume — Ce qui reste a faire (par priorite)

### Priorite 1 — Boutons factices (Zero mock) ✅ FAIT

### Priorite 2 — SEO centralise sur API V1
- Migrer les 5 Edge Functions SEO separees vers des routes `/v1/seo/*` dans le routeur `api-v1`
- Creer un `seoApi` dans le client frontend (comme `productsApi`)
- Ajouter un historique diff des corrections par page

### Priorite 3 — Import : fonctionnalites avancees manquantes
- Integrer les regles conditionnelles comme filtre pre-import (marge min, stock min, categorie exclue)
- Exposer le retry par item individuel dans l'UI
- Persister des snapshots avant/apres pour l'enrichissement IA
- Verifier l'implementation reelle du hash d'image pour la deduplication

### Priorite 4 — Cockpit Business : completer
- Ajouter une projection de CA (forecast simple base sur les ventes recentes)
- Les autres KPIs sont operationnels
