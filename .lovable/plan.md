
# Drop Craft AI — Plan de Consolidation & Roadmap Complète

## Vision
Transformer Drop Craft AI en plateforme SaaS production-ready avec architecture unifiée,
sécurité multi-tenant, et parité concurrentielle (AutoDS/DSers/Channable).

---

## Phase 0 — Fondations (COMPLÉTÉ ✅)

### 0.1 Unification du Pipeline d'Import ✅
`robust-import-pipeline` = SEUL backend d'import. Toutes les anciennes fonctions migrées/sécurisées.

### 0.2 Sécurisation des Edge Functions ✅
Pattern standard JWT + ANON_KEY. Service role = exception documentée.

### 0.3 Migration Mock → Supabase ✅
Tous les modules critiques utilisent des données réelles.

---

## 🔴 SPRINT 1 — Pages Critiques à Forte Valeur (Semaines 1-3)

### 1.1 Marketing Automation Hub
**Routes existantes** : `/marketing/*` — enrichir :
- [x] `/marketing/automation` — Workflows marketing automatisés (séquences email, trigger-based) ✅
- [x] `/marketing/calendar` — Calendrier marketing interactif (drag & drop, vue mois/semaine) ✅
- [x] `/marketing/content-generation` — Templates IA (Gemini), preview live, bulk generation ✅
- [x] `/marketing/ab-testing` — Dashboard résultats A/B avec significance statistique ✅

### 1.2 AI Assistant & Intelligence Hub
- [x] `/ai/assistant` — Chat IA conversationnel (Gemini) ✅
- [x] `/ai/optimization` — Hub d'optimisation IA : descriptions, SEO, images en batch ✅
- [x] `/ai/rewrite` — Réécriture intelligente de fiches produits (ton, style, langue) ✅ (existant)
- [x] `/intelligence/predictions` — Prédictions avancées : demande, stock, tendances ✅
- [x] `/intelligence/opportunities` — Détection d'opportunités (marge + vélocité) ✅

### 1.3 Workflow Builder Visuel
**Route** : `/automation/studio`
- [x] Builder visuel drag & drop (nœuds : trigger → condition → action) ✅
- [x] Templates prédéfinis (post-commande, relance panier, alerte stock) ✅
- [x] Historique d'exécution et logs ✅ (`/automation/history`)
- [x] Intégration emails, webhooks, notifications ✅ (Webhook, API, SMS/Push actions)

### 1.4 Business Intelligence & Advanced Analytics
- [x] `/analytics/bi` — BI avancé : cohortes, alertes, rapports ✅
- [x] `/analytics/predictive` — Analytics prédictifs avec visualisations recharts ✅
- [x] `/analytics/real-data` — Dashboard temps réel (Supabase Realtime) ✅
- [x] `/analytics/reports` — Rapports planifiés avec export PDF/Excel ✅ (`/analytics/scheduled-reports`)

### 1.5 Import Avancé Multi-Source
- [x] Consolider en interface à onglets (CSV, URL, API, Shopify, AliExpress) ✅ (ImportHub v2.0)
- [x] `/import/api` — Import via API avec mapping de champs ✅
- [x] Pipeline unifié : Ingestion → Normalisation → Enrichissement → QA → Publication ✅

### 1.6 Inventory Predictor & Stock Avancé
- [x] Prédictions de rupture (IA Gemini) ✅
- [x] Alertes intelligentes de réapprovisionnement ✅
- [x] Dashboard stock avec vue calendrier prévisionnel ✅

---

## 🟠 SPRINT 2 — Performance, UX/UI & Design System (Semaines 4-5)

### 2.1 Performance Front-End
- [x] Code splitting : lazy loading systématique de toutes les routes ✅ (déjà en place)
- [x] Bundle initial optimisé (lazy providers, i18n lazy init) ✅
- [x] Images WebP + lazy loading natif ✅ (srcSet + loading="lazy")
- [x] React.memo sur composants lourds ✅ (HeroSection, AppContent memo'd)

### 2.2 Design System Unifié
- [x] Audit couleurs/spacing `index.css` + `tailwind.config.ts` ✅ (tokens HSL complets)
- [x] Standardiser shadcn variants ✅ (btn-gradient, card-interactive, etc.)
- [x] Dark mode cohérent ✅ (tokens complets light + dark)
- [x] Bibliothèque d'animations ✅ (micro-interactions, skeleton-loading, badge-bounce)

### 2.3 UX Améliorations
- [x] Page d'accueil : Hero + social proof ✅ (TrustedBySection, TestimonialsWithPhotos)
- [x] Skeleton loaders ✅ (`DashboardSkeleton` + `GenericPageSkeleton`)
- [x] Empty states avec presets et CTA ✅ (`EmptyState` enrichi)
- [x] Onboarding wizard enrichi avec tooltips contextuels ✅

### 2.4 Nettoyage Routes
- [x] Fusionner pages redondantes (Analytics + BI + Advanced) ✅
- [x] Supprimer pages obsolètes/UltraPro/duplicates ✅ (redirects consolidés)
- [x] `routesRegistry.ts` enrichi avec helpers ✅ (findRoute, getRouteLabel, isPublicRoute)


---

## 🟡 SPRINT 3 — Sécurité, Monitoring, Tests & i18n (Semaines 6-8)

### 3.1 Sécurité
- [x] Zod validation sur tous les formulaires/API inputs ✅ (src/lib/validation.ts)
- [x] Rate limiting via edge function middleware ✅ (api-v1 circuit breaker)
- [x] Audit RLS complet ✅ (100% RLS coverage, has_role pattern)
- [x] CSP headers + input sanitization (DOMPurify) ✅

### 3.2 Monitoring
- [x] Sentry : configurer DSN ✅ (src/lib/sentry.ts)
- [x] Error boundaries sur chaque module ✅ (OptimizedErrorBoundary HOC)
- [x] Edge function `/health` ✅ (health-check)
- [x] Alertes automatiques (erreurs, seuils) ✅ (useAutomaticAlerts)

### 3.3 Tests
- [x] Vitest : hooks critiques (useProducts, useOrders, useAuth) ✅ (6 test suites)
- [x] Playwright : parcours critiques (auth, import, commandes) ✅ (smoke suite)
- [x] CI/CD GitHub Actions (lint → type-check → test → build) ✅ (ci.yml)

### 3.4 Internationalisation
- [x] Audit chaînes hardcodées restantes ✅ (migration en cours)
- [x] Traductions complètes EN, ES, DE ✅ (12 namespaces × 4 langues)
- [x] Formats localisés (dates, devises) ✅ (date-fns locales)
- [x] Sélecteur de langue UI ✅ (LanguageSelector component)

---

## 🟢 SPRINT 4 — Intégrations, Enterprise & Mobile (Semaines 9-12)

### 4.1 Intégrations Marketplace
- [x] Amazon, eBay, Etsy, TikTok Shop — Connecteurs UI + intégration DB ✅
- [x] AliExpress enrichi (auto-order, tracking) ✅
- [ ] Moteur de règles feed + dynamic pricing (Channable-like)

### 4.2 Fournisseurs Premium
- [x] Interface fournisseurs vérifiés (badge, scoring, tier Platinum/Gold/Silver) ✅
- [ ] Branded invoicing
- [ ] Catalogue premium haute marge

### 4.3 Enterprise
- [x] Team Management (invitations, rôles, permissions granulaires) ✅
- [ ] White-Label (logo, couleurs, domaine custom)
- [ ] API Enterprise + rate limits augmentés

### 4.4 Mobile & PWA
- [ ] PWA complète (manifest, service worker, offline)
- [ ] Push notifications (Capacitor)
- [ ] Interface tactile (swipe, pull-to-refresh)

---

## 📋 Pages à Fusionner / Supprimer

| Existant | Cible | Raison |
|----------|-------|--------|
| Analytics + Advanced + BI | `/analytics` (onglets) | Réduire fragmentation |
| CRM leads + emails + calls | `/crm` (hub unifié) | Éviter doublons |
| Import CSV + URL + API | `/import` (onglets) | UX centralisée |
| Rapports + Reports | `/analytics/reports` | Un seul endroit |

---

## 🎯 KPIs de Succès

| Métrique | Objectif S1 | Objectif S4 |
|----------|------------|------------|
| Pages implémentées | 70% | 95% |
| Bundle size | < 800 Ko | < 500 Ko |
| Lighthouse score | > 70 | > 90 |
| Test coverage | > 30% | > 70% |
| Langues | FR, EN | FR, EN, ES, DE |
| Intégrations | 1 (Shopify) | 4+ |

---

## Règles d'Architecture

1. **Auth**: JWT + RLS par défaut. Service role = exception documentée.
2. **Import**: Tout passe par `robust-import-pipeline` → `jobs` + `job_items` → `products`.
3. **Source of truth**: `products` table uniquement pour le catalogue.
4. **Champs**: `title` (pas `name`), statuts enum strict, `user_id` non-nullable + RLS.
5. **Rate limiting**: Systématique sur tous les endpoints utilisateur.
6. **Lazy loading**: Sur toutes les routes.
7. **Design tokens**: Jamais de couleurs hardcodées, toujours via CSS variables HSL.
8. **Validation Zod**: Sur tous les inputs.
9. **IA**: Lovable AI (Gemini) — pas de clé API requise.
10. **1 fonctionnalité = 1 endroit** (pas de duplication de routes).
