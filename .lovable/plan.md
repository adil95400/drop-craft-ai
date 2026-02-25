
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
- [ ] `/marketing/automation` — Workflows marketing automatisés (séquences email, trigger-based)
- [ ] `/marketing/calendar` — Calendrier marketing interactif (drag & drop, vue mois/semaine)
- [ ] `/marketing/content-generation` — Templates IA (Gemini), preview live, bulk generation
- [ ] `/marketing/ab-testing` — Dashboard résultats A/B avec significance statistique

### 1.2 AI Assistant & Intelligence Hub
- [ ] `/ai/assistant` — Chat IA conversationnel (Gemini) : aide stratégique, analyse produits
- [ ] `/ai/optimization` — Hub d'optimisation IA : descriptions, SEO, images en batch
- [ ] `/ai/rewrite` — Réécriture intelligente de fiches produits (ton, style, langue)
- [ ] `/intelligence/predictions` — Prédictions avancées : demande, stock, tendances
- [ ] `/intelligence/opportunities` — Détection d'opportunités (marge + vélocité)

### 1.3 Workflow Builder Visuel
**Route** : `/automation/studio`
- [ ] Builder visuel drag & drop (nœuds : trigger → condition → action)
- [ ] Templates prédéfinis (post-commande, relance panier, alerte stock)
- [ ] Historique d'exécution et logs
- [ ] Intégration emails, webhooks, notifications

### 1.4 Business Intelligence & Advanced Analytics
- [ ] `/analytics/bi` — Créateur de rapports personnalisés (widgets drag & drop)
- [ ] `/analytics/predictive` — Analytics prédictifs avec visualisations
- [ ] `/analytics/real-data` — Dashboard temps réel (Supabase Realtime)
- [ ] `/analytics/reports` — Rapports planifiés avec export PDF/Excel

### 1.5 Import Avancé Multi-Source
- [ ] Consolider en interface à onglets (CSV, URL, API, Shopify, AliExpress)
- [ ] `/import/api` — Import via API avec mapping de champs
- [ ] Pipeline unifié : Ingestion → Normalisation → Enrichissement → QA → Publication

### 1.6 Inventory Predictor & Stock Avancé
- [ ] Prédictions de rupture (IA Gemini)
- [ ] Alertes intelligentes de réapprovisionnement
- [ ] Dashboard stock avec vue calendrier prévisionnel

---

## 🟠 SPRINT 2 — Performance, UX/UI & Design System (Semaines 4-5)

### 2.1 Performance Front-End
- [ ] Code splitting : lazy loading systématique de toutes les routes
- [ ] Bundle initial < 500 Ko
- [ ] Images WebP + lazy loading natif
- [ ] React.memo sur composants lourds

### 2.2 Design System Unifié
- [ ] Audit complet couleurs/spacing dans `index.css` et `tailwind.config.ts`
- [ ] Standardiser shadcn avec variants cohérentes
- [ ] Dark mode cohérent
- [ ] Bibliothèque d'animations Framer Motion

### 2.3 UX Améliorations
- [ ] Page d'accueil : Hero convaincant + social proof
- [ ] Skeleton loaders sur toutes les pages data
- [ ] Empty states avec illustrations et CTA
- [ ] Onboarding wizard enrichi avec tooltips contextuels

### 2.4 Nettoyage Routes
- [ ] Fusionner pages redondantes (Analytics + BI + Advanced)
- [ ] Supprimer pages obsolètes/UltraPro/duplicates
- [ ] Créer `routesRegistry.ts` comme source de vérité

---

## 🟡 SPRINT 3 — Sécurité, Monitoring, Tests & i18n (Semaines 6-8)

### 3.1 Sécurité
- [ ] Zod validation sur tous les formulaires/API inputs
- [ ] Rate limiting via edge function middleware
- [ ] Audit RLS complet
- [ ] CSP headers + input sanitization (DOMPurify)

### 3.2 Monitoring
- [ ] Sentry : configurer DSN (déjà installé)
- [ ] Error boundaries sur chaque module
- [ ] Edge function `/health`
- [ ] Alertes automatiques (erreurs, seuils)

### 3.3 Tests
- [ ] Vitest : hooks critiques (useProducts, useOrders, useAuth)
- [ ] Playwright : parcours critiques (auth, import, commandes)
- [ ] CI/CD GitHub Actions (lint → type-check → test → build)

### 3.4 Internationalisation
- [ ] Audit chaînes hardcodées restantes
- [ ] Traductions complètes EN, ES, DE
- [ ] Formats localisés (dates, devises)
- [ ] Sélecteur de langue UI

---

## 🟢 SPRINT 4 — Intégrations, Enterprise & Mobile (Semaines 9-12)

### 4.1 Intégrations Marketplace
- [ ] Amazon, eBay, Etsy, TikTok Shop — Connecteurs API
- [ ] AliExpress enrichi (auto-order, tracking)
- [ ] Moteur de règles feed + dynamic pricing (Channable-like)

### 4.2 Fournisseurs Premium
- [ ] Interface fournisseurs vérifiés (badge, scoring)
- [ ] Branded invoicing
- [ ] Catalogue premium haute marge

### 4.3 Enterprise
- [ ] Team Management (invitations, rôles, permissions)
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
