# Architecture Globale

## 🏗️ Vue d'ensemble

Drop Craft AI suit une architecture modulaire en couches avec séparation claire des responsabilités.

## 📐 Schéma d'Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Couche Présentation                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │   Layouts    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      Couche Business                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Hooks      │  │   Contexts   │  │   Domains    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                       Couche Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Services    │  │     Libs     │  │    Utils     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                        Couche Données                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Supabase    │  │     Cache    │  │  LocalStore  │      │
│  │  (PostgreSQL)│  │  (Unified)   │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Services Externes                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   OpenAI     │  │   Shopify    │  │  Firecrawl   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Principes Architecturaux

### 1. Séparation des Préoccupations
- **Pages**: Composition et routing
- **Components**: UI réutilisable
- **Hooks**: Logique métier réutilisable
- **Services**: Logique métier complexe
- **Domains**: Modules métier isolés

### 2. Inversion de Dépendances
Les couches supérieures dépendent des abstractions, pas des implémentations.

### 3. Single Responsibility
Chaque module a une responsabilité unique et bien définie.

### 4. DRY (Don't Repeat Yourself)
Réutilisation maximale du code via hooks, services et composants.

## 📦 Modules Principaux

### 1. Couche Présentation

#### Pages
Responsables du routing et de la composition des composants.

```typescript
// Exemple: ProductsPage.tsx
export const ProductsPage = () => {
  const { products, isLoading } = useProducts();
  
  return (
    <AppLayout>
      <ProductList products={products} loading={isLoading} />
    </AppLayout>
  );
};
```

#### Components
Composants UI réutilisables et isolés.

```typescript
// Composant simple
export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Card>
      <CardHeader>{product.name}</CardHeader>
      <CardContent>{product.description}</CardContent>
    </Card>
  );
};
```

#### Layouts
Structure de page réutilisable.

```typescript
// AppLayout avec sidebar
export const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
};
```

### 2. Couche Business

#### Hooks
Logique métier réutilisable avec React Query.

```typescript
// Hook de gestion produits
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll(),
    staleTime: 5 * 60 * 1000, // 5min
  });
};
```

#### Contexts
État global partagé.

```typescript
// UnifiedAuthContext
export const UnifiedAuthContext = createContext<AuthContextType>(null);

export const useAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (!context) throw new Error('useAuth must be within Provider');
  return context;
};
```

#### Domains
Modules métier isolés avec leur propre architecture.

```
src/domains/winners/
├── types.ts              # Types spécifiques
├── services/             # Services métier
├── hooks/                # Hooks spécifiques
├── components/           # Composants du module
└── README.md             # Documentation
```

### 3. Couche Services

#### Services Métier
Logique métier complexe et singleton.

```typescript
// UnifiedCacheService
class UnifiedCache {
  private static instance: UnifiedCache;
  
  static getInstance(): UnifiedCache {
    if (!UnifiedCache.instance) {
      UnifiedCache.instance = new UnifiedCache();
    }
    return UnifiedCache.instance;
  }
  
  set<T>(key: string, data: T, domain: CacheDomain): void {
    // Implementation
  }
}
```

#### Libs
Utilitaires et helpers.

```typescript
// Date helpers
export const formatDate = (date: Date): string => {
  return format(date, 'dd/MM/yyyy');
};
```

### 4. Couche Données

#### Supabase Client
Client unique pour toutes les opérations DB.

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
```

#### Cache Unifié
Système de cache centralisé.

```typescript
import { unifiedCache } from '@/services/UnifiedCacheService';

// Cache avec domaine
unifiedCache.set('products', data, 'user'); // TTL: 30min
const cached = unifiedCache.get('products');
```

## 🔄 Flux de Données

### 1. Lecture (GET)

```
User Action
    ↓
Page Component
    ↓
Custom Hook (useQuery)
    ↓
Service Layer
    ↓
[Cache Check] → Cache Hit? → Return Cached Data
    ↓ (Cache Miss)
Supabase Client
    ↓
PostgreSQL Database
    ↓
[Cache Set]
    ↓
Return to UI
```

### 2. Écriture (POST/PUT/DELETE)

```
User Action
    ↓
Page Component
    ↓
Custom Hook (useMutation)
    ↓
Service Layer
    ↓
Supabase Client
    ↓
PostgreSQL Database
    ↓
[Cache Invalidation]
    ↓
Refetch & Update UI
```

### 3. Opérations AI

```
User Request
    ↓
Edge Function Invocation
    ↓
Serverless Function
    ↓
OpenAI API Call
    ↓
Response Processing
    ↓
Database Update
    ↓
Client Notification
```

## 🔐 Sécurité

### Row Level Security (RLS)

Toutes les tables utilisent RLS:

```sql
-- Exemple de politique RLS
CREATE POLICY "Users can only access their own data"
ON products
FOR ALL
USING (user_id = auth.uid());
```

### Authentication Flow

```
Login Request
    ↓
Supabase Auth
    ↓
JWT Token Generation
    ↓
Store in HttpOnly Cookie
    ↓
Attach to All Requests
    ↓
RLS Verification
```

## 🚀 Performance

### Optimisations

1. **Code Splitting**: Lazy loading des routes
2. **Memoization**: React.memo, useMemo, useCallback
3. **Cache Strategy**: Multi-niveau (client, serveur, DB)
4. **Query Optimization**: Index, joins optimisés
5. **Bundle Optimization**: Tree shaking, minification

### Métriques Cibles

- **FCP** (First Contentful Paint): < 1.5s
- **LCP** (Largest Contentful Paint): < 2.5s
- **TTI** (Time to Interactive): < 3.5s
- **CLS** (Cumulative Layout Shift): < 0.1

## 🔄 État de l'Application

### React Query
Gestion des requêtes serveur avec cache intégré.

### Zustand
État client léger pour UI temporaire.

### React Context
État global pour auth et thème.

## 📱 Responsive Design

### Breakpoints

```typescript
// Tailwind breakpoints
sm: '640px'   // Mobile large
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large
```

### Mobile-First Approach
Design optimisé mobile puis étendu pour desktop.

## 🧪 Testing Strategy

### Unit Tests
Composants et hooks isolés (Vitest).

### Integration Tests
Flux utilisateur complets (Playwright).

### E2E Tests
Scénarios utilisateur réels (Cypress).

## 📊 Monitoring

### Logging
- Client: Console + Sentry
- Serveur: Edge Functions logs
- Database: Supabase analytics

### Métriques
- Performance: Web Vitals
- Business: Custom events
- Errors: Sentry tracking

---

**Note**: Cette architecture évolue continuellement selon les besoins métier.
