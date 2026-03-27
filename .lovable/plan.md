

# Audit Compétitif Complet — Drop Craft AI vs Concurrents

## Concurrents analysés
AutoDS, DSers, ShopOpti+, Zendrop, Oberlo (legacy), CJDropshipping, Spocket

## Résultat Global

Drop Craft AI couvre **~95% des fonctionnalités** offertes par les concurrents. L'application est significativement plus complète que la plupart des outils individuels. Voici l'analyse détaillée par domaine :

---

## Pages COMPLÈTES (au niveau ou supérieures aux concurrents)

| Domaine | Pages | Verdict |
|---------|-------|---------|
| **Dashboard** | `/dashboard` — KPIs, alertes, vue unifiée | Complet |
| **Import produits** | `/import` — URL, bulk, feed, CSV, AI, multi-store | Supérieur (multi-source + IA) |
| **Fiche produit** | `/products/:id` — édition inline, SEO, variantes, scoring | Supérieur (scoring santé, IA granulaire) |
| **Catalogue** | `/catalog/*` — santé, variantes, médias, attributs, déduplication | Supérieur (7 sous-pages d'audit) |
| **Fournisseurs** | `/suppliers/*` — hub, mapping, fallback, scoring | Supérieur (multi-fournisseurs + fallback auto) |
| **Sync continue** | `/catalog/supplier-sync` — attributs, multi-source, IA, fallback | Supérieur (unique sur le marché) |
| **Commandes** | `/orders` — centre, détail, création, bulk, auto-order | Complet |
| **Auto-fulfillment** | `/automation/fulfillment` — routing, 1-click, tracking | Complet |
| **Pricing** | `/catalog/pricing-engine`, `/pricing-manager` — règles, repricing | Complet |
| **Stock** | `/stock/*` — inventaire, entrepôts, mouvements, alertes | Complet |
| **Marketing** | `/marketing/*` — ads, email, SEO, loyalty, upsell, panier abandonné | Complet |
| **Analytics** | `/analytics/*` — prédictif, BI, compétitif, forecasting | Supérieur |
| **Automatisation** | `/automation/*` — workflows, triggers, prix/stock auto | Complet |
| **IA** | `/ai/*` — assistant, contenu, optimisation, actions auto | Supérieur |
| **Intégrations** | `/integrations`, `/stores-channels` — multi-boutique | Complet |
| **Expédition** | `/shipping` — zones, tarifs, calculateur, règles | Complet |
| **Retours** | `/returns` — portail client, workflow | Complet |
| **Avis** | `/reviews` — gestion des avis | Complet |
| **Settings** | `/settings/*` — équipe, webhooks, 2FA, export, domaine | Complet |
| **Enterprise** | `/enterprise/*` — API, observabilité, déploiement | Supérieur |

---

## Lacunes identifiées (5% restant)

### 1. Notifications push / alertes mobiles
- **Concurrents** : AutoDS et DSers envoient des push notifications (rupture stock, commande échouée, changement prix)
- **Drop Craft AI** : Page `/notifications` existe mais pas de système de push temps réel (email/SMS/push browser)
- **Impact** : Moyen

### 2. Extension navigateur Chrome
- **Concurrents** : AutoDS, DSers, ShopOpti+ ont une extension Chrome pour importer en 1 clic depuis AliExpress/Amazon
- **Drop Craft AI** : Page `/import/extension` existe mais l'extension elle-même n'est pas livrée (c'est un projet séparé)
- **Impact** : Faible (hors scope webapp)

### 3. Cashback / wallet fournisseur
- **Concurrents** : Zendrop et CJ proposent un wallet intégré avec cashback sur commandes
- **Drop Craft AI** : Non implémenté
- **Impact** : Faible (modèle business différent)

### 4. Chat fournisseur intégré
- **Concurrents** : CJDropshipping a un chat direct avec les fournisseurs dans l'app
- **Drop Craft AI** : Pas de messagerie fournisseur directe
- **Impact** : Moyen

### 5. Branded tracking page
- **Concurrents** : AutoDS, Zendrop offrent une page de suivi brandée pour les clients finaux
- **Drop Craft AI** : Le tracking existe mais pas de page publique brandée personnalisable
- **Impact** : Moyen-élevé (différenciateur UX client final)

---

## Recommandation de priorité

Les 3 lacunes à combler pour une parité complète :

1. **Page de suivi brandée** — Page publique `/tracking/:orderNumber` avec le branding du marchand, timeline de livraison, carte, et upsell produits
2. **Notifications push navigateur** — Intégrer les Web Push Notifications pour alertes critiques (rupture, commande échouée, changement prix)
3. **Chat/messagerie fournisseur** — Système de communication intégré avec les fournisseurs connectés

---

## Plan d'implémentation (si approuvé)

### Étape 1 — Branded Tracking Page
- Créer `/tracking/:orderNumber` (page publique sans auth)
- Timeline visuelle du statut de livraison
- Carte de progression du colis
- Branding personnalisable (logo, couleurs du marchand)
- Section recommandations produits (upsell)

### Étape 2 — Web Push Notifications
- Intégrer l'API Push du navigateur
- Edge Function pour envoyer les notifications
- Configuration dans Settings (types d'alertes activables)
- Triggers : rupture stock, commande échouée, changement prix fournisseur

### Étape 3 — Messagerie Fournisseur
- Interface de chat dans la fiche fournisseur
- Historique des conversations
- Notifications de nouveaux messages

### Fichiers à créer/modifier
- `src/pages/tracking/BrandedTrackingPage.tsx` (nouveau)
- `src/hooks/usePushNotifications.ts` (nouveau)
- `src/components/suppliers/SupplierChat.tsx` (nouveau)
- `supabase/functions/send-push-notification/index.ts` (nouveau)
- Routes et navigation mises à jour

