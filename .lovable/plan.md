# DropCraft AI — Roadmap Stratégique Complète

## Vision
Transformer DropCraft AI en plateforme SaaS leader du dropshipping automatisé avec IA, surpassant AutoDS, DSers, Spocket, Zendrop et Dropship.io.

## État Actuel (Mars 2026)

### ✅ Déjà Implémenté
| Domaine | Détails |
|---------|---------|
| **Architecture** | 26 modules de routes, 120+ pages lazy-loaded, 145+ edge functions |
| **Sécurité** | RLS 100%, RBAC 4 niveaux, JWT, CORS sécurisé, audit logs immutables, XSS sanitization, rate limiting API |
| **Auth** | Email + Google OAuth (Lovable Cloud), 2FA infrastructure |
| **IA** | Lovable AI Gateway (GPT-5-nano, Gemini), AI product optimizer, content generator |
| **i18n** | 68+ langues, 58+ devises, conversion temps réel |
| **Intégrations** | Shopify, WooCommerce, Amazon, eBay, CJ, BigBuy, AliExpress, Mirakl, Rakuten, Zalando, Wish |
| **PWA** | Service Worker, push notifications, offline mode, Capacitor mobile |
| **Monitoring** | Sentry, logger centralisé (migration ~60%), console interceptor |
| **Paiement** | Stripe (checkout, webhooks, portail, plans Free/Standard/Pro/Ultra Pro) |
| **SEO** | Sitemap, robots.txt, JSON-LD, meta tags, scoring temps réel |
| **Design System** | shadcn/ui, tokens HSL, animations framer-motion |
| **Marketing** | GA4, Mixpanel, Hotjar (GDPR-gated), email marketing, automation |
| **Tests** | 23 fichiers de test, Vitest + Playwright configurés |
| **Feature Flags** | Système DB-driven par plan utilisateur |

---

## Phase 1 — Stabilisation & Qualité (Semaines 1-3)
*Objectif : Fondations solides avant d'ajouter des features*

### 1.1 Tests & CI/CD ⭐ PRIORITÉ HAUTE
- [ ] Lancer et corriger les 23 fichiers de test existants
- [ ] Ajouter tests unitaires pour les services critiques :
  - `ProductsUnifiedService`
  - `OrderService`
  - `ConnectorManager`
  - `ExportService`
- [ ] Tests E2E Playwright pour les parcours critiques :
  - Auth flow (signup → login → dashboard)
  - Import produit (URL → catalogue)
  - Tunnel commande
  - Connexion marketplace
- [ ] GitHub Actions pipeline : lint → typecheck → vitest → playwright
- [ ] Coverage minimale : 70% services, 50% hooks

### 1.2 Migration Logger (Finaliser)
- [ ] Migrer les ~1500 `console.*` restants dans 55+ fichiers services
- [ ] Migrer les hooks critiques
- [ ] Vérifier que le console interceptor couvre bien la production

### 1.3 Nettoyage Code
- [ ] Supprimer les routes mortes / pages vides
- [ ] Consolider les services dupliqués
- [ ] Auditer les dépendances inutilisées
- [ ] Corriger les erreurs TypeScript résiduelles

### 1.4 Sécurité Edge Functions
- [ ] Vérifier `SET search_path TO 'public'` sur toutes les DB functions
- [ ] Audit des edge functions sans validation JWT
- [ ] Vérifier qu'aucun `SERVICE_ROLE_KEY` n'est exposé côté client

---

## Phase 2 — Core Product Excellence (Semaines 4-8)
*Objectif : Rendre les fonctionnalités existantes production-ready*

### 2.1 Données Réelles Partout
- [ ] Remplacer toutes les données mockées par des appels API réels
- [ ] Dashboard KPIs depuis les tables réelles (orders, products, customers)
- [ ] Métriques de performance système réelles (latence, mémoire)
- [ ] Scoring produit basé sur complétude réelle des données

### 2.2 Product Sourcing Amélioré
- [ ] Fiabiliser le scraping Firecrawl (AliExpress, Amazon, eBay, Temu)
- [ ] Scoring "Winning Product" pondéré (marge 35%, note 25%, demande 20%)
- [ ] Import one-click depuis URL → catalogue avec enrichissement IA
- [ ] Comparateur de prix multi-fournisseurs

### 2.3 Order Fulfillment Robuste
- [ ] Auto-order placement (CJ, BigBuy, AliExpress)
- [ ] Auto-tracking sync
- [ ] Retry mechanism pour commandes échouées
- [ ] Queue de commandes avec monitoring

### 2.4 Sync Multi-Boutique Fiable
- [ ] Sync bidirectionnelle prix/stock (Shopify, WooCommerce)
- [ ] Résolution de conflits (local_wins, remote_wins, newest_wins)
- [ ] Webhooks entrants normalisés
- [ ] Dashboard sync avec historique et alertes

---

## Phase 3 — Différenciation IA (Semaines 9-14)
*Objectif : Devenir une AI-first platform*

### 3.1 IA Produit
- [ ] AI Product Research : analyse tendances + scoring automatique
- [ ] AI Product Description : génération multi-langue optimisée SEO
- [ ] AI Image Enhancement : amélioration automatique des visuels produit
- [ ] AI Ad Creative Generator : créatifs pub automatiques

### 3.2 IA Marketing
- [ ] AI Campaign Generator : campagnes email/SMS automatiques
- [ ] AI Funnel Builder : tunnels de vente pré-optimisés
- [ ] AI SEO Optimizer : suggestions de mots-clés et méta-données
- [ ] AI Copywriter : descriptions, titres, bullet points

### 3.3 IA Prédictive
- [ ] Product Trend Prediction : analyse de tendances marché
- [ ] Revenue Forecasting : prévisions de CA basées sur historique
- [ ] Demand Prediction : anticipation des ruptures de stock
- [ ] Dynamic Pricing : ajustement automatique des prix selon la demande

---

## Phase 4 — Parité Concurrentielle (Semaines 15-20)
*Objectif : Fonctionnalités attendues par le marché*

### 4.1 Pricing Intelligence
- [ ] Competitor price monitoring
- [ ] Margin calculator avec simulateur temps réel
- [ ] Price history avec graphiques de tendance
- [ ] Règles de pricing automatiques (arrondis psychologiques)

### 4.2 Shipping System
- [ ] Intégrations : UPS, DHL, FedEx, Colissimo
- [ ] Shipping rules engine (par poids, destination, valeur)
- [ ] Shipping calculator intégré
- [ ] Label generation

### 4.3 Customer Service
- [ ] Ticket system avec historique client
- [ ] Live chat widget
- [ ] Returns portal (RMA automatisé)
- [ ] Refund automation avec règles configurables

### 4.4 Ads Manager
- [ ] Facebook Ads : campagnes, audiences, reporting
- [ ] Google Ads : search, shopping, display
- [ ] TikTok Ads : créatifs, audiences
- [ ] ROI tracking cross-platform

---

## Phase 5 — Scale & Enterprise (Semaines 21-28)
*Objectif : Prêt pour la croissance*

### 5.1 Performance & Architecture
- [ ] Bundle splitting optimisé (vendor, core, features)
- [ ] React Query cache strategy par entité
- [ ] Virtual scrolling pour listes de produits (>10K)
- [ ] Image optimization pipeline (WebP, lazy, blur-up)

### 5.2 Social Commerce
- [ ] Instagram Shop sync
- [ ] TikTok Shop sync
- [ ] Facebook Shop sync
- [ ] Multi-channel listing management

### 5.3 Advanced Analytics
- [ ] Custom dashboards builder (drag & drop widgets)
- [ ] Cohort analysis
- [ ] Attribution modeling
- [ ] Export automatisé (PDF, Excel schedulé)

### 5.4 Enterprise Features
- [ ] Multi-workspace (organisations)
- [ ] SSO (SAML/OIDC)
- [ ] API marketplace (webhooks sortants)
- [ ] White-label option

---

## Phase 6 — Go-to-Market (Semaines 29-32)
*Objectif : Lancement public*

### 6.1 Onboarding
- [ ] Wizard de configuration (3 étapes : boutique → fournisseur → premier produit)
- [ ] Templates pré-configurés par niche
- [ ] Vidéos tutorielles intégrées
- [ ] Checklist de démarrage interactive

### 6.2 Documentation
- [ ] Centre d'aide complet
- [ ] API documentation interactive
- [ ] SDK examples (JS, Python, PHP)
- [ ] Blog avec guides de dropshipping

### 6.3 Conformité Production
- [ ] Headers sécurité (_headers file)
- [ ] RGPD complet (CGU, CGV, cookies, suppression, export)
- [ ] Stripe webhooks production
- [ ] Sentry DSN production
- [ ] DNS + domaine custom

---

## Métriques de Succès

| Phase | KPI | Cible |
|-------|-----|-------|
| Phase 1 | Test coverage | >70% services |
| Phase 1 | Console.* restants | 0 |
| Phase 2 | Données mockées | 0 |
| Phase 3 | Features IA actives | 8+ |
| Phase 4 | Parité AutoDS | >80% |
| Phase 5 | Lighthouse score | >90 |
| Phase 6 | Temps onboarding | <5 min |

---

## Dépendances & Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| APIs fournisseurs instables | Fulfillment bloqué | Retry + fallback fournisseur |
| Coûts IA élevés | Marge réduite | Quotas par plan + caching |
| Rate limiting plateformes | Sync lente | Queues + batch processing |
| Complexité croissante | Bugs | Tests automatisés + CI/CD |

---

*Dernière mise à jour : 6 mars 2026*
