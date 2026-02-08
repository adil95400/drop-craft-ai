# 🏗️ ShopOpti — Architecture Hybride Stricte

## Gouvernance Backend

### Supabase (Edge Functions) — Périphérique uniquement

**Autorisé :**
- Auth (Supabase Auth + JWT)
- Webhooks légers : réception, validation, push en queue
- Realtime / présence
- Emails simples (support, contact)
- Tâches < 2s (validation, ping, token exchange)
- Extension hub (install, health, version-check)

**Interdit :**
- SEO crawl / sitemap
- Scraping
- IA génération (gros)
- Import massif (CSV, XML, ZIP)
- Pricing rules calcul
- Fulfillment / orders logic
- Jobs orchestration complexe

### FastAPI (apps/api/) — Source de vérité métier

**Doit gérer :**
- Catalogue (products, variants, product_store_links)
- Imports (CSV / sitemap / providers)
- SEO (audit, issues, exports)
- IA (générations, quotas, coûts)
- Pricing / stock sync
- Orders / Fulfillment
- Jobs + job_items (résultats par produit/page)

**Statut actuel :** Code local uniquement (non déployé).  
Les Edge Functions assurent temporairement ces rôles pour le Happy Path,
mais toute nouvelle logique métier lourde doit être conçue pour FastAPI.

### Base de données — Supabase Postgres (unique)

- FastAPI utilise `service_role` (serveur)
- Frontend ne lit/écrit jamais de tables métier directement
  (sauf tables "UI realtime" comme `background_jobs` pour la progression)
- RLS activé sur toutes les tables

---

## Happy Path (priorité absolue)

```
Import → Publication Boutique → Réception Commande → Traitement
```

### Definition of Done par page :
1. UI utilise `ChannablePageWrapper`
2. Toutes les actions déclenchent des tâches backend réelles (Jobs)
3. Aucun mock, donnée statique ou `setTimeout` simulé
4. Auth JWT obligatoire sur chaque Edge Function

---

## Sécurité

- `user_id` extrait exclusivement du JWT (`auth.getUser(token)`)
- Jamais de `user_id` dans le body de la requête
- RLS strict sur toutes les tables
- Validation Zod contre injections XSS/SQL

---

## Conventions techniques

- Edge Functions : `npm:` imports (pas `https://esm.sh/`)
- Consolidation via "hubs" thématiques (ex: `extension-hub`)
- Réponses API standardisées : `{ ok: true, data, meta }` / `{ ok: false, code, message }`

---

## 📁 Structure Modulaire Hiérarchique

L'application suit une architecture modulaire organisée par domaines métier.

### Structure des Dossiers

```
src/
├── routes/                     # Système de routing modulaire
│   ├── index.tsx              # Point d'entrée principal
│   ├── PublicRoutes.tsx       # Routes publiques
│   ├── CoreRoutes.tsx         # Dashboard, stores, orders, customers
│   ├── ProductRoutes.tsx      # Catalogue, import, suppliers, winners
│   ├── AnalyticsRoutes.tsx    # Analytics, intelligence, insights
│   ├── AutomationRoutes.tsx   # Automation, AI, fulfillment
│   ├── MarketingRoutes.tsx    # CRM, SEO, ads
│   ├── EnterpriseRoutes.tsx   # Admin, multi-tenant, security
│   ├── IntegrationRoutes.tsx  # APIs, marketplace, extensions
│   └── legacy-redirects.ts    # Mapping anciennes routes
│
├── domains/                    # Logique métier par domaine
│   ├── core/                  # Fonctionnalités core
│   ├── products/              # Gestion produits
│   ├── commerce/              # Orders, customers, payments
│   ├── analytics/             # Analytics et rapports
│   ├── automation/            # Workflows et automation
│   ├── marketing/             # CRM, SEO, campaigns
│   ├── enterprise/            # Admin, multi-tenant
│   └── integrations/          # APIs, connectors
│
├── pages/                      # Composants page (simplifiés)
├── layouts/                    # Layouts réutilisables
└── components/                 # Composants réutilisables
```

## 🛣️ Routing

Hiérarchie : Public → Protected (Core, Product, Analytics, Automation, Marketing, Integration) → Admin (Enterprise).  
Lazy loading sur toutes les pages non-critiques.

## 🔐 Protection des Routes

- **ProtectedRoute** : authentification requise
- **AdminRoute** : privilèges admin
- **ModuleGuard** : plan utilisateur (Standard/Pro/Ultra Pro)

## 📊 State Management

- **Auth** : UnifiedAuthContext  
- **Plan** : PlanContext avec feature flags  
- **Cache** : React Query  
- **Module** : état local par domaine

---

**Dernière mise à jour** : Février 2026 — Architecture Hybride Stricte
