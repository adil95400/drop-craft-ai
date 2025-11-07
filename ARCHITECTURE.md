# 🏗️ Architecture de l'Application

## 📁 Structure Modulaire Hiérarchique

L'application suit une architecture modulaire organisée par domaines métier pour une meilleure maintenabilité et scalabilité.

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
│   ├── auth/                  # Pages authentification
│   ├── admin/                 # Pages admin
│   ├── import/                # Pages import
│   ├── suppliers/             # Pages fournisseurs
│   ├── stores/                # Pages boutiques
│   └── ...                    # Autres pages organisées
│
├── layouts/                    # Layouts réutilisables
│   ├── AppLayout.tsx          # Layout principal app
│   ├── AdminLayout.tsx        # Layout admin
│   └── PublicLayout.tsx       # Layout pages publiques
│
└── components/                 # Composants réutilisables
    ├── common/                # Composants communs
    ├── ui/                    # Composants UI Shadcn
    └── ...
```

## 🛣️ Architecture de Routing

### Hiérarchie des Routes

L'application utilise un système de routing hiérarchique avec lazy loading optimisé:

```typescript
<Routes>
  {/* Public */}
  <Route path="/*" element={<PublicRoutes />} />
  
  {/* Protected App */}
  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route path="/dashboard/*" element={<CoreRoutes />} />
    <Route path="/products/*" element={<ProductRoutes />} />
    <Route path="/analytics/*" element={<AnalyticsRoutes />} />
    <Route path="/automation/*" element={<AutomationRoutes />} />
    <Route path="/marketing/*" element={<MarketingRoutes />} />
    <Route path="/integrations/*" element={<IntegrationRoutes />} />
  </Route>
  
  {/* Admin */}
  <Route path="/admin/*" element={<AdminRoute><AdminLayout><EnterpriseRoutes /></AdminLayout></AdminRoute>} />
</Routes>
```

### Catégories de Routes

#### 1. **Public Routes** (`/`)
- Landing page, features, pricing
- Authentication
- Blog, documentation, support
- Legal (privacy, terms)

#### 2. **Core Routes** (`/dashboard`)
- Dashboard principal
- Gestion stores
- Orders & customers
- Settings & profile

#### 3. **Product Routes** (`/products`)
- Catalogue & gestion produits
- Import (quick, advanced, bulk)
- Suppliers & marketplace
- Winners & research
- Tools (calculator, predictor)

#### 4. **Analytics Routes** (`/analytics`)
- Analytics dashboard
- Advanced analytics
- AI Intelligence
- Competitive analysis
- Reports

#### 5. **Automation Routes** (`/automation`)
- Workflow builder
- AI automation hub
- Auto-fulfillment
- Optimization tools

#### 6. **Marketing Routes** (`/marketing`)
- CRM (leads, activity, emails, calls)
- SEO manager
- Ads manager
- Campaigns

#### 7. **Enterprise Routes** (`/admin`)
- Admin dashboard
- Supplier admin (CRUD)
- Multi-tenant management
- Security dashboard
- Monitoring & observability

#### 8. **Integration Routes** (`/integrations`)
- Integrations hub
- Marketplace connectors
- Extensions & plugins
- API documentation
- Support & academy

## 🔄 Redirections Legacy

Les anciennes routes sont automatiquement redirigées vers les nouvelles pour maintenir la compatibilité:

```typescript
// Exemples de redirections
'/dashboard-super' → '/dashboard'
'/catalogue-ultra-pro' → '/products/catalogue'
'/import-advanced' → '/products/import/advanced'
'/crm-ultra-pro' → '/marketing/crm'
'/admin-panel' → '/admin/dashboard'
```

Voir `src/routes/legacy-redirects.ts` pour la liste complète.

## 🔐 Protection des Routes

### ProtectedRoute
Routes nécessitant une authentification utilisateur.

### AdminRoute
Routes nécessitant des privilèges administrateur.

### ModuleGuard
Protection basée sur le plan utilisateur (Standard/Pro/Ultra Pro).

## 📦 Lazy Loading & Code Splitting

Toutes les pages non-critiques sont chargées avec lazy loading pour optimiser les performances:

```typescript
const Analytics = lazy(() => import('@/pages/Analytics'));
```

### Stratégie de Chargement

1. **Immédiat**: Pages critiques (Index, Auth, NotFound)
2. **Lazy**: Toutes les autres pages
3. **Prefetch**: Routes susceptibles d'être visitées
4. **Code Splitting**: Par module de routing

## 🎨 Layouts

### AppLayout
Layout principal pour toutes les pages authentifiées avec:
- Navigation sidebar
- Header avec user menu
- Breadcrumbs automatiques
- Quick actions

### AdminLayout
Layout spécialisé pour l'administration avec:
- Navigation admin spécifique
- Metrics dashboard
- System status

### PublicLayout
Layout pour pages publiques avec:
- Marketing header
- Footer
- Call-to-action sections

## 📊 State Management

### Global State
- **Auth**: UnifiedAuthContext
- **Plan**: PlanContext avec feature flags
- **Cache**: React Query avec strategies optimisées

### Module State
Chaque domaine gère son propre état local via:
- React Query pour les données serveur
- Context API pour l'état partagé du module
- Local state pour l'UI

## 🔧 Configuration des Modules

Les modules sont configurés via `src/config/modules.ts`:

```typescript
interface ModuleConfig {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  minPlan: PlanType;
  route: string;
  features: string[];
  category: string;
  order: number;
}
```

## 🚀 Performance

### Optimisations

1. **Bundle Splitting**: Par route principale
2. **Lazy Loading**: Toutes les pages non-critiques
3. **Memoization**: Hooks optimisés avec useMemo/useCallback
4. **Cache Strategy**: React Query avec TTL adaptatifs
5. **Code Elimination**: Tree shaking automatique

### Métriques Cibles

- Bundle initial: < 200KB gzipped
- Time to Interactive: < 2s
- First Contentful Paint: < 1s
- Route transition: < 300ms

## 🧪 Testing Strategy

### Types de Tests

1. **Unit Tests**: Composants isolés (Jest + Testing Library)
2. **Integration Tests**: Modules complets (Cypress)
3. **E2E Tests**: Parcours utilisateur critiques (Playwright)
4. **Performance Tests**: Lighthouse CI

### Coverage Targets

- Unit tests: 80%+
- Critical paths: 100%
- Integration: 70%+

## 📝 Conventions de Nommage

### Fichiers
- **Pages**: PascalCase (DashboardHome.tsx)
- **Components**: PascalCase (ProductCard.tsx)
- **Hooks**: camelCase avec prefix use (useProducts.ts)
- **Utils**: camelCase (formatPrice.ts)
- **Types**: PascalCase (ProductType.ts)

### Routes
- **URLs**: kebab-case (/product-research)
- **Params**: camelCase (?sortBy=price)

## 🔄 Migration Guide

### Ajout d'une Nouvelle Route

1. Identifier la catégorie (Core, Product, Analytics, etc.)
2. Ajouter la route dans le fichier approprié (ex: ProductRoutes.tsx)
3. Créer la page dans le dossier correspondant
4. Lazy load si non-critique
5. Ajouter les guards nécessaires (auth, plan)

### Suppression d'une Route Obsolète

1. Ajouter une redirection dans `legacy-redirects.ts`
2. Supprimer la route du fichier de routing
3. Marquer la page comme deprecated
4. Après 2 sprints, supprimer la page

## 📚 Ressources

- [React Router v6](https://reactrouter.com/)
- [React Query](https://tanstack.com/query/)
- [Code Splitting](https://react.dev/reference/react/lazy)
- [Performance Best Practices](https://web.dev/performance/)

---

**Dernière mise à jour**: Sprint 3 - Unification Standard/Ultra-Pro
**Responsable**: Équipe Architecture
