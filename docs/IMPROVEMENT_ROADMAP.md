# Shopopti - Plan d'Améliorations Prioritaires

## État actuel diagnostiqué

### Problème d'affichage des produits
- **5,844 produits** dans la table `imported_products`
- 2 utilisateurs différents : un avec 454 produits, un avec 5,390 produits
- Le filtrage par `user_id` fonctionne correctement
- Solution : vérifier que vous êtes connecté avec le bon compte

### Corrections appliquées
- Limite de produits augmentée de 50 à 100,000
- Logs de debug ajoutés pour tracer les chargements

---

## 📋 Roadmap d'Améliorations

### Phase 1 : Fondations (Semaine 1-2)

#### ✅ 1.1 Correction Import/Affichage Produits
- [x] Augmenter les limites de produits (50 → 100,000)
- [x] Ajouter panneau de diagnostic
- [ ] Vérifier RLS policies pour toutes les tables produits
- [ ] Ajouter option "Voir tous les produits" pour admin

#### 🔄 1.2 Refonte UX/UI Professionnelle
- [ ] Audit complet des composants visuels
- [ ] Harmonisation typographie (utiliser design tokens)
- [ ] Harmonisation couleurs (HSL semantic tokens)
- [ ] Correction responsive mobile (sidebar, navigation)
- [ ] Animations et micro-interactions (Framer Motion)

### Phase 2 : Onboarding & Documentation (Semaine 3-4)

#### 📚 2.1 Onboarding Interactif
- [ ] Intégrer Shepherd.js ou Intro.js
- [ ] Tour d'accueil pour nouveaux utilisateurs
- [ ] Tooltips contextuels sur les fonctionnalités clés
- [ ] Checklist de démarrage avec progression

#### 📖 2.2 Documentation API
- [ ] Swagger/Redoc pour endpoints Edge Functions
- [ ] Page /api-docs avec documentation interactive
- [ ] Exemples de code pour intégrations

### Phase 3 : PWA & Mobile (Semaine 5-6)

#### 📱 3.1 Progressive Web App
- [ ] Configuration vite-plugin-pwa complète
- [ ] Manifest avec icônes et configuration
- [ ] Service worker pour mode offline
- [ ] Page /install pour installation

#### 📱 3.2 Optimisation Mobile
- [ ] Audit responsive complet
- [ ] Navigation mobile optimisée
- [ ] Gestes tactiles (swipe, pull-to-refresh)

### Phase 4 : Monitoring & Analytics (Semaine 7-8)

#### 🔍 4.1 Monitoring Erreurs
- [x] Sentry déjà installé (@sentry/react)
- [ ] Configuration complète avec source maps
- [ ] Alertes email pour erreurs critiques
- [ ] Dashboard erreurs dans admin

#### 📊 4.2 Analytics Produit
- [ ] Intégrer PostHog ou Hotjar
- [ ] Tracking événements utilisateur
- [ ] Funnel d'utilisation
- [ ] Dashboard analytics admin

### Phase 5 : Branding & SEO (Semaine 9-10)

#### 🎨 5.1 Site Vitrine
- [ ] Landing page professionnelle
- [ ] Page pricing avec comparaison
- [ ] Page features avec screenshots
- [ ] Page contact/support

#### 🔍 5.2 SEO & Performance
- [ ] Optimisation meta tags (react-helmet-async)
- [ ] Génération sitemap
- [ ] Schema.org structured data
- [ ] Core Web Vitals optimization

---

## 🚀 Démarrage Rapide

Pour commencer avec les améliorations :

1. Vérifiez que vous êtes connecté avec le bon compte utilisateur
2. Utilisez le panneau "Debug Produits" (coin inférieur droit) pour diagnostiquer
3. Les logs console affichent maintenant le nombre de produits chargés par source

---

## 📝 Notes Techniques

### Tables de produits consolidées
1. `products` - Produits principaux utilisateur
2. `imported_products` - Produits importés CSV/API
3. `catalog_products` - Catalogue global
4. `shopify_products` - Sync Shopify
5. `supplier_products` - Fournisseurs
6. `published_products` - Publiés marketplace
7. `feed_products` - Flux Google Shopping, etc.

### Configuration actuelle
- Limite produits : 100,000 par table
- Cache React Query : 1 minute (stale), 5 minutes (gc)
- Consolidation : toutes sources en parallèle
