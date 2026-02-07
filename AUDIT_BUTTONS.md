# 🔍 Audit des boutons et actions factices — ShopOpti+

> Généré le 2026-02-07 | Objectif : Identifier chaque action UI sans backend réel

---

## 🔴 CRITIQUE — Formulaires sans API backend

| # | Fichier | Action | Comportement actuel | Correction attendue |
|---|---------|--------|---------------------|---------------------|
| 1 | `src/pages/Contact.tsx` (L17-21) | Bouton "Envoyer" du formulaire contact | `toast.success()` sans requête HTTP | Créer Edge Function `contact-form` → insérer en DB `support_tickets` ou envoyer email |
| 2 | `src/pages/notifications/CreateNotification.tsx` (L99-100) | Bouton "Programmer notification" | `toast.success()` + `navigate('/dashboard')` | Appeler Edge Function pour créer la notification en DB |

---

## 🟠 HAUTE — Boutons "bientôt disponible" / Actions simulées

| # | Fichier | Action | Comportement actuel | Correction attendue |
|---|---------|--------|---------------------|---------------------|
| 3 | `src/components/extensions/ExtensionMarketplace.tsx` (L77-82) | Bouton "Installer" extension | `toast("Installation simulée")` | Appeler API d'installation réelle ou désactiver le bouton |
| 4 | `src/pages/extensions/ExtensionDeveloperPage.tsx` (L155, L171) | 2× Bouton "GitHub Repository" | `toast.info('Repository GitHub bientôt disponible')` | Lier à un vrai repo ou retirer le bouton |
| 5 | `src/components/suppliers/SupplierManagement.tsx` (L364-368) | Bouton connexion connecteur | `toast("Bientôt disponible")` | Implémenter la connexion ou marquer `coming_soon` avec badge |
| 6 | `src/pages/integrations/MarketplaceConnectorsPage.tsx` (L222-225) | Bouton "Connecter" (status coming_soon) | `toast.info('Cette intégration sera bientôt disponible')` | ✅ Acceptable si badge "Bientôt" visible — sinon ajouter badge |
| 7 | `src/pages/stores/ManageIntegrationPage.tsx` (L410-413) | Personnalisation des données | Texte "sera bientôt disponible" | Implémenter ou masquer la section |
| 8 | `src/pages/Reports.tsx` (L246-249) | Export format non disponible | `toast("L'export ${format} sera bientôt disponible")` | Implémenter les exports manquants ou masquer les options |

---

## 🟡 MOYENNE — `navigate('/dashboard')` sans logique métier

| # | Fichier | Contexte | Comportement actuel | Correction attendue |
|---|---------|----------|---------------------|---------------------|
| 9 | `src/pages/support/SupportCenterPage.tsx` (L21) | Bouton "Démarrer un chat" | `navigate('/dashboard')` | Ouvrir un widget de chat (Crisp/Intercom) ou créer un ticket support |
| 10 | `src/components/landing/StickyCtaBar.tsx` (L86) | Bouton "Voir démo" | `navigate('/dashboard')` | Naviguer vers une page démo dédiée ou une vidéo |
| 11 | `src/components/landing/LiveDemoPreview.tsx` (L200) | Bouton avec icône Play | `navigate('/dashboard')` | Ouvrir une démo interactive ou vidéo |
| 12 | `src/pages/Index.tsx` (L89) | Bouton "Voir la démo" | `navigate('/dashboard')` | Idem : page démo ou vidéo |

> **Cas légitimes (ne pas corriger)** : `PaymentSuccess.tsx`, `OnboardingFlow.tsx`, `EnhancedOnboardingFlow.tsx`, `FreeTrialActivationPage.tsx`, `PricingPlansPage.tsx`, `ChannableHeader.tsx`, `Header.tsx`, `NotFoundPage.tsx`, `SyncManagerPage.tsx`

---

## 🟡 MOYENNE — `navigate('/auth')` CTA sans workflow d'essai gratuit

Ces boutons redirigent vers `/auth` mais aucun **workflow d'essai gratuit automatique** n'est implémenté (pas de Stripe, pas de plan par défaut à l'inscription).

| # | Fichier | Bouton | Correction attendue |
|---|---------|--------|---------------------|
| 13 | `src/pages/Index.tsx` (L79, L491, L528, L663) | "Essai gratuit", "Commencer" | Implémenter workflow : inscription → plan gratuit auto → dashboard |
| 14 | `src/layouts/PublicLayout.tsx` (L69-73) | "Connexion" / "Essai Gratuit" | ✅ Navigation légitime vers auth |
| 15 | `src/pages/public/PricingPage.tsx` (L163, L305) | CTA plans pricing | Connecter à Stripe Checkout ou Edge Function de souscription |
| 16 | `src/pages/Features.tsx` (L130, L181) | "Essayer gratuitement" | Idem |
| 17 | `src/pages/academy/AcademyHomePage.tsx` (L214) | "Commencer gratuitement" | Idem |
| 18 | `src/pages/features/MultiMarketplacePage.tsx` (L124, L269) | "Connecter mes boutiques" | Idem |
| 19 | `src/pages/features/AIOptimizationPage.tsx` (L118) | "Essayer gratuitement" | Idem |
| 20 | `src/components/landing/StickyCtaBar.tsx` (L93) | CTA sticky | Idem |
| 21 | `src/components/landing/InteractiveDemo.tsx` (L311) | "Essayer gratuitement" | Idem |

---

## 🟠 HAUTE — Données simulées / mockées dans les composants

| # | Fichier | Type de mock | Correction attendue |
|---|---------|-------------|---------------------|
| 22 | `src/components/analytics/CohortAnalysis.tsx` (L42+) | `generateCohortData()` — données aléatoires | Requêter les vraies données analytics depuis la DB |
| 23 | `src/components/dashboard/widgets/AdsWidget.tsx` (L56-58) | KPIs statiques + "Données simulées" | Connecter aux vraies données `ad_campaigns` |
| 24 | `src/components/supplier/RealTimeSupplierStats.tsx` (L18+) | Objet `realSupplierData` codé en dur | Requêter depuis `premium_suppliers` |
| 25 | `src/components/integrations/SyncLogsTable.tsx` (L39-40) | Logs générés via `Math.random()` | Requêter les vrais logs de sync depuis la DB |
| 26 | `src/components/testing/TestRunner.tsx` (L70+) | `mockTestSuites` hardcodées | Connecter au vrai système de tests ou retirer |
| 27 | `src/components/catalog/ProductCard.tsx` (L142-145) | Rating "4.0 (Simulé)" | Afficher le vrai rating ou masquer si indisponible |
| 28 | `src/components/marketing/MarketingHub.tsx` (L395-398) | Graphique "Données simulées" | Connecter aux vraies métriques marketing |
| 29 | `src/components/integrations/WorkflowBuilder.tsx` (L194-197) | `"Trigger simulé avec succès"` | Exécuter le vrai trigger ou mode sandbox explicite |
| 30 | `src/components/orders/AutoOrderVerification.tsx` (L290-293) | `"Commande test simulée"` | ✅ Acceptable si c'est un mode test explicite |

---

## 📊 Résumé global

| Priorité | Catégorie | Items | Impact |
|----------|-----------|-------|--------|
| 🔴 Critique | Formulaires sans API | 2 | Utilisateurs pensent que leur message est envoyé |
| 🟠 Haute | Actions simulées / "bientôt" | 8 | Fonctionnalités annoncées mais inexistantes |
| 🟠 Haute | Données mockées en production | 8 | Métriques fausses affichées aux utilisateurs |
| 🟡 Moyenne | Navigate factice | 4 | UX confuse (boutons qui ne font rien d'utile) |
| 🟡 Moyenne | CTA sans workflow essai | 9 | Pas de conversion — l'essai gratuit n'existe pas |
| **Total** | | **31** | |

---

## 🎯 Ordre de correction recommandé

1. **Contact.tsx** → Créer Edge Function `contact-form` (impact immédiat, formulaire visible publiquement)
2. **Données simulées** → Nettoyer les 8 composants avec mocks (crédibilité du produit)
3. **SupportCenterPage** → Implémenter un vrai système de tickets/chat
4. **Boutons "bientôt"** → Ajouter des badges visuels `coming_soon` ou retirer
5. **Workflow essai gratuit** → Connecter inscription → plan gratuit → Stripe
6. **Boutons "Voir démo"** → Créer une vraie page démo ou vidéo

---

*Fichier généré automatiquement par l'audit ShopOpti+ — À maintenir à jour après chaque correction.*
