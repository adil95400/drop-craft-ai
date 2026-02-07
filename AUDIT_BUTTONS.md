# 🔍 Audit des boutons et actions factices — ShopOpti+

> Généré le 2026-02-07 | Dernière mise à jour : 2026-02-07 | Objectif : Identifier chaque action UI sans backend réel

---

## 🔴 CRITIQUE — Formulaires sans API backend

| # | Fichier | Action | Statut |
|---|---------|--------|--------|
| 1 | `src/pages/Contact.tsx` | Bouton "Envoyer" du formulaire contact | ✅ **CORRIGÉ** — Edge Function `contact-form` + table `contact_messages` |
| 2 | `src/pages/notifications/CreateNotification.tsx` | Bouton "Programmer notification" | ❌ À corriger — `toast.success()` sans requête |

---

## 🟠 HAUTE — Boutons "bientôt disponible" / Actions simulées

| # | Fichier | Action | Statut |
|---|---------|--------|--------|
| 3 | `src/components/extensions/ExtensionMarketplace.tsx` | Bouton "Installer" extension | ❌ À corriger — `toast("Installation simulée")` |
| 4 | `src/pages/extensions/ExtensionDeveloperPage.tsx` | 2× Bouton "GitHub Repository" | ❌ À corriger — `toast.info('bientôt disponible')` |
| 5 | `src/components/suppliers/SupplierManagement.tsx` | Bouton connexion connecteur | ❌ À corriger — `toast("Bientôt disponible")` |
| 6 | `src/pages/integrations/MarketplaceConnectorsPage.tsx` | Bouton "Connecter" (coming_soon) | ⚠️ Acceptable si badge visible |
| 7 | `src/pages/stores/ManageIntegrationPage.tsx` | Personnalisation des données | ❌ À corriger — texte "bientôt disponible" |
| 8 | `src/pages/Reports.tsx` | Export format non disponible | ❌ À corriger — toast sans action |

---

## 🟡 MOYENNE — `navigate('/dashboard')` sans logique métier

| # | Fichier | Contexte | Statut |
|---|---------|----------|--------|
| 9 | `src/pages/support/SupportCenterPage.tsx` | Bouton "Démarrer un chat" | ✅ **CORRIGÉ** — Redirige vers `/contact` |
| 10 | `src/components/landing/StickyCtaBar.tsx` | Bouton "Voir démo" | ✅ **CORRIGÉ** — `navigate('/features')` |
| 11 | `src/components/landing/LiveDemoPreview.tsx` | Bouton avec icône Play | ✅ **CORRIGÉ** — `navigate('/features')` |
| 12 | `src/pages/Index.tsx` | Bouton "Voir la démo" | ✅ **CORRIGÉ** — `navigate('/features')` |

---

## 🟡 MOYENNE — `navigate('/auth')` CTA sans workflow d'essai gratuit

| # | Fichier | Bouton | Statut |
|---|---------|--------|--------|
| 13 | `src/pages/Index.tsx` | "Essai gratuit", "Commencer" | ❌ À corriger — pas de `?trial=true` |
| 14 | `src/layouts/PublicLayout.tsx` | "Connexion" / "Essai Gratuit" | ✅ Navigation légitime |
| 15 | `src/pages/public/PricingPage.tsx` | CTA plans pricing | ❌ À corriger — pas lié à Stripe |
| 16 | `src/pages/Features.tsx` | "Essayer gratuitement" | ❌ À corriger |
| 17 | `src/pages/academy/AcademyHomePage.tsx` | "Commencer gratuitement" | ❌ À corriger |
| 18 | `src/pages/features/MultiMarketplacePage.tsx` | "Connecter mes boutiques" | ❌ À corriger |
| 19 | `src/pages/features/AIOptimizationPage.tsx` | "Essayer gratuitement" | ❌ À corriger |
| 20 | `src/components/landing/StickyCtaBar.tsx` | CTA sticky "Essai gratuit" | ✅ **CORRIGÉ** — `localStorage('pending_trial')` + `navigate('/auth?trial=true')` |
| 21 | `src/components/landing/InteractiveDemo.tsx` | "Essayer gratuitement" | ❌ À corriger |

---

## 🟠 HAUTE — Données simulées / mockées dans les composants

| # | Fichier | Type de mock | Statut |
|---|---------|-------------|--------|
| 22 | `src/components/analytics/CohortAnalysis.tsx` | `generateCohortData()` — données aléatoires | ❌ À corriger |
| 23 | `src/components/dashboard/widgets/AdsWidget.tsx` | KPIs statiques | ✅ **CORRIGÉ** — Connecté à `ad_campaigns` |
| 24 | `src/components/supplier/RealTimeSupplierStats.tsx` | Objet hardcodé | ❌ À corriger |
| 25 | `src/components/integrations/SyncLogsTable.tsx` | Logs `Math.random()` | ✅ **CORRIGÉ** — Connecté à `background_jobs` |
| 26 | `src/components/testing/TestRunner.tsx` | `mockTestSuites` | ❌ À corriger |
| 27 | `src/components/catalog/ProductCard.tsx` | Rating simulé | ✅ **CORRIGÉ** — Score marge dynamique |
| 28 | `src/components/marketing/MarketingHub.tsx` | Graphique simulé | ❌ À corriger |
| 29 | `src/components/integrations/WorkflowBuilder.tsx` | Trigger simulé | ❌ À corriger |
| 30 | `src/components/orders/AutoOrderVerification.tsx` | Commande test simulée | ⚠️ Acceptable (mode test explicite) |

---

## ✅ Corrections réalisées — Workflow essai gratuit

| Composant | Correction |
|-----------|------------|
| `supabase/functions/trial-activate/index.ts` | ✅ **Sécurisé** — `user_id` extrait du JWT, plus du body |
| `src/hooks/useFreeTrial.ts` | ✅ **Connecté** — Requête table `free_trial_subscriptions`, `convertTrial` → Stripe Checkout |
| `src/contexts/UnifiedAuthContext.tsx` | ✅ **Auto-activation** — Détecte `pending_trial` dans localStorage après `SIGNED_IN` |
| `src/components/landing/StickyCtaBar.tsx` | ✅ **Lié** — `localStorage('pending_trial')` + `navigate('/auth?trial=true')` |
| `src/components/landing/LiveDemoPreview.tsx` | ✅ **Lié** — Idem |
| Table `free_trial_subscriptions` | ✅ **Créée** — RLS : lecture user, écriture service_role |

---

## 📊 Résumé global

| Priorité | Catégorie | Total | Corrigés | Restants |
|----------|-----------|-------|----------|----------|
| 🔴 Critique | Formulaires sans API | 2 | 1 | 1 |
| 🟠 Haute | Actions simulées / "bientôt" | 6 | 0 | 6 |
| 🟠 Haute | Données mockées | 9 | 3 | 6 |
| 🟡 Moyenne | Navigate factice | 4 | 4 | 0 |
| 🟡 Moyenne | CTA sans workflow essai | 9 | 2 | 7 |
| **Total** | | **30** | **10** | **20** |

---

## 🎯 Prochaines corrections recommandées

1. ~~**Contact.tsx** → Edge Function `contact-form`~~ ✅ Fait
2. **Données simulées restantes** → CohortAnalysis, RealTimeSupplierStats, MarketingHub, WorkflowBuilder, TestRunner (5 composants)
3. **CreateNotification.tsx** → Edge Function pour programmer la notification
4. **Boutons "bientôt"** → Ajouter badges `coming_soon` ou retirer
5. ~~**Workflow essai gratuit** → Inscription → trial auto → Stripe~~ ✅ Fait
6. **CTA "Essai gratuit" restants** → Ajouter `?trial=true` + `pending_trial` sur Index, Features, etc.
7. **Boutons "Voir démo"** → Page démo ou vidéo

---

*Fichier généré automatiquement par l'audit ShopOpti+ — Maintenu à jour après chaque correction.*
