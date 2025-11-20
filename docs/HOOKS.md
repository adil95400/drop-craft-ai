# Hooks Documentation

## 📋 Vue d'ensemble

Les hooks encapsulent la logique métier et permettent la réutilisation du code. Ce projet utilise **React Query** pour la gestion des données serveur.

## 🏗️ Architecture des Hooks

### Catégories de Hooks

```
src/hooks/
├── auth/              # Authentification
├── products/          # Gestion produits
├── integrations/      # Intégrations externes
├── analytics/         # Analytics & métriques
├── marketing/         # Campagnes & publicités
├── automation/        # Automatisation
└── ui/                # État UI
```

## 📦 Hooks Principaux

### 1. Authentification

#### useAuth

Hook principal d'authentification.

**Fichier**: Fourni par `UnifiedAuthContext`

```typescript
import { useAuth } from '@/contexts/UnifiedAuthContext';

function MyComponent() {
  const {
    user,              // Utilisateur connecté
    profile,           // Profil utilisateur
    role,              // 'admin' | 'user'
    isAdmin,           // Boolean
    plan,              // 'standard' | 'pro' | 'ultra_pro'
    isLoading,         // État de chargement
    signIn,            // (email, password) => Promise
    signUp,            // (email, password, metadata) => Promise
    signOut,           // () => Promise
    hasFeature,        // (feature) => boolean
  } = useAuth();

  if (isLoading) return <Loader />;

  return (
    <div>
      <h1>Bonjour {profile?.full_name}</h1>
      {isAdmin && <AdminPanel />}
      {hasFeature('ai_optimization') && <AITools />}
    </div>
  );
}
```

#### Feature Flags par Plan

```typescript
// Standard Plan
hasFeature('basic_import')        // ✅
hasFeature('ai_optimization')     // ❌
hasFeature('automation')          // ❌

// Pro Plan  
hasFeature('basic_import')        // ✅
hasFeature('ai_optimization')     // ✅
hasFeature('automation')          // ❌

// Ultra Pro Plan
hasFeature('basic_import')        // ✅
hasFeature('ai_optimization')     // ✅
hasFeature('automation')          // ✅
```

---

### 2. Produits

#### useProducts

Liste des produits avec filtres et pagination.

```typescript
import { useProducts } from '@/hooks/useProducts';

function ProductsPage() {
  const {
    products,          // Product[]
    isLoading,         // boolean
    error,             // Error | null
    refetch,           // () => Promise
    hasNextPage,       // boolean
    fetchNextPage,     // () => Promise
  } = useProducts({
    category: 'electronics',
    search: 'smartphone',
    minPrice: 100,
    maxPrice: 1000,
    limit: 50
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <ProductGrid products={products} />
      {hasNextPage && (
        <Button onClick={fetchNextPage}>Charger plus</Button>
      )}
    </div>
  );
}
```

#### useProduct

Détails d'un produit unique.

```typescript
import { useProduct } from '@/hooks/useProduct';

function ProductDetailPage({ productId }) {
  const {
    product,           // Product | undefined
    isLoading,
    error,
    update,            // (data) => Promise
    delete: remove,    // () => Promise
  } = useProduct(productId);

  const handleUpdate = async (updates) => {
    await update(updates);
    toast.success('Produit mis à jour');
  };

  return (
    <ProductForm 
      product={product}
      onSubmit={handleUpdate}
    />
  );
}
```

#### useCreateProduct

Création de produit.

```typescript
import { useCreateProduct } from '@/hooks/useCreateProduct';

function CreateProductForm() {
  const { mutate, isLoading } = useCreateProduct();

  const handleSubmit = (data) => {
    mutate(data, {
      onSuccess: (newProduct) => {
        toast.success('Produit créé');
        navigate(`/products/${newProduct.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };

  return <ProductForm onSubmit={handleSubmit} loading={isLoading} />;
}
```

#### useImportProducts

Import de produits multi-sources.

```typescript
import { useImportProducts } from '@/hooks/useImportProducts';

function ImportPage() {
  const {
    importFromUrl,     // (url, config) => Promise
    importFromCsv,     // (file, config) => Promise
    importJobs,        // ImportJob[]
    isImporting,       // boolean
  } = useImportProducts();

  const handleUrlImport = async (url) => {
    await importFromUrl(url, {
      ai_optimization: true,
      auto_categorize: true
    });
  };

  return (
    <div>
      <ImportForm onSubmit={handleUrlImport} />
      <ImportJobsList jobs={importJobs} />
    </div>
  );
}
```

---

### 3. Intégrations

#### useIntegrations

Gestion des intégrations e-commerce.

```typescript
import { useIntegrations } from '@/hooks/useIntegrations';

function IntegrationsPage() {
  const {
    integrations,      // Integration[]
    connect,           // (platform, credentials) => Promise
    disconnect,        // (id) => Promise
    sync,              // (id) => Promise
    isLoading,
  } = useIntegrations();

  const handleShopifyConnect = async (credentials) => {
    await connect('shopify', credentials);
    toast.success('Shopify connecté');
  };

  return (
    <IntegrationsList 
      integrations={integrations}
      onConnect={handleShopifyConnect}
      onSync={sync}
    />
  );
}
```

#### useShopify

Hook spécifique Shopify.

```typescript
import { useShopify } from '@/hooks/useShopify';

function ShopifyManagement() {
  const {
    products,          // Shopify products
    orders,            // Shopify orders
    syncProducts,      // () => Promise
    syncOrders,        // () => Promise
    isConnected,       // boolean
  } = useShopify();

  return (
    <div>
      {isConnected ? (
        <>
          <ShopifyProducts products={products} />
          <Button onClick={syncProducts}>
            Synchroniser produits
          </Button>
        </>
      ) : (
        <ShopifyConnectButton />
      )}
    </div>
  );
}
```

---

### 4. Analytics

#### useAnalytics

Métriques et statistiques.

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function AnalyticsDashboard() {
  const {
    metrics,           // DashboardMetrics
    timeRange,         // TimeRange
    setTimeRange,      // (range) => void
    isLoading,
  } = useAnalytics();

  return (
    <div>
      <TimeRangeSelector 
        value={timeRange}
        onChange={setTimeRange}
      />
      <MetricsGrid metrics={metrics} />
    </div>
  );
}
```

#### useAIInsights

Insights IA personnalisés.

```typescript
import { useAIInsights } from '@/hooks/useAIInsights';

function InsightsPanel() {
  const {
    insights,          // AIInsight[]
    dismissInsight,    // (id) => Promise
    actOnInsight,      // (id, action) => Promise
    isLoading,
  } = useAIInsights();

  return (
    <InsightsList 
      insights={insights}
      onDismiss={dismissInsight}
      onAction={actOnInsight}
    />
  );
}
```

---

### 5. Marketing

#### useCampaigns

Gestion des campagnes publicitaires.

```typescript
import { useCampaigns } from '@/hooks/useCampaigns';

function CampaignsPage() {
  const {
    campaigns,         // Campaign[]
    create,            // (data) => Promise
    update,            // (id, data) => Promise
    pause,             // (id) => Promise
    resume,            // (id) => Promise
    isLoading,
  } = useCampaigns();

  const handleCreateCampaign = async (data) => {
    await create({
      name: 'Campagne Été',
      platform: 'meta',
      budget: 500,
      target_audience: {
        age: [25, 45],
        interests: ['tech', 'gadgets']
      }
    });
  };

  return (
    <CampaignsList 
      campaigns={campaigns}
      onCreate={handleCreateCampaign}
    />
  );
}
```

#### useABTesting

Tests A/B automatisés.

```typescript
import { useABTesting } from '@/hooks/useABTesting';

function ABTestPage() {
  const {
    experiments,       // Experiment[]
    createExperiment,  // (config) => Promise
    getResults,        // (id) => ExperimentResults
    declareWinner,     // (id, variantId) => Promise
  } = useABTesting();

  const handleCreateTest = async () => {
    await createExperiment({
      name: 'Test Titre Produit',
      variants: [
        { name: 'A', title: 'Smartphone Premium' },
        { name: 'B', title: 'Le Meilleur Smartphone' }
      ],
      traffic_split: [50, 50],
      success_metric: 'conversion_rate'
    });
  };

  return <ABTestDashboard experiments={experiments} />;
}
```

---

### 6. Automation

#### useAutomationRules

Règles d'automatisation.

```typescript
import { useAutomationRules } from '@/hooks/useAutomationRules';

function AutomationPage() {
  const {
    rules,             // AutomationRule[]
    create,            // (rule) => Promise
    update,            // (id, updates) => Promise
    toggle,            // (id) => Promise
    delete: remove,    // (id) => Promise
    executionLogs,     // ExecutionLog[]
  } = useAutomationRules();

  const handleCreateRule = async () => {
    await create({
      name: 'Auto-réapprovisionner',
      trigger: {
        type: 'stock_level',
        condition: 'less_than',
        value: 10
      },
      actions: [
        {
          type: 'place_order',
          supplier: 'bigbuy',
          quantity: 50
        },
        {
          type: 'send_notification',
          channel: 'email'
        }
      ]
    });
  };

  return (
    <AutomationRulesList 
      rules={rules}
      onCreate={handleCreateRule}
    />
  );
}
```

---

## 🎨 Patterns Avancés

### 1. Optimistic Updates

Mise à jour optimiste pour UX rapide:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.updateProduct(data),
    
    // Optimistic update
    onMutate: async (newData) => {
      await queryClient.cancelQueries(['product', newData.id]);
      
      const previousData = queryClient.getQueryData(['product', newData.id]);
      
      queryClient.setQueryData(['product', newData.id], newData);
      
      return { previousData };
    },
    
    // Rollback on error
    onError: (err, newData, context) => {
      queryClient.setQueryData(
        ['product', newData.id],
        context.previousData
      );
    },
    
    // Refetch on success
    onSettled: (data) => {
      queryClient.invalidateQueries(['product', data.id]);
    }
  });
}
```

### 2. Infinite Scroll

Pagination infinie:

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function useInfiniteProducts() {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite'],
    queryFn: ({ pageParam = 0 }) => 
      api.getProducts({ offset: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length * 20 : undefined;
    },
  });
}

// Usage
function ProductsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteProducts();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </React.Fragment>
      ))}
      
      {hasNextPage && (
        <Button 
          onClick={fetchNextPage}
          loading={isFetchingNextPage}
        >
          Charger plus
        </Button>
      )}
    </div>
  );
}
```

### 3. Dependent Queries

Requêtes dépendantes:

```typescript
function useProductWithReviews(productId: string) {
  // Query 1: Get product
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProduct(productId),
  });

  // Query 2: Get reviews (depends on product)
  const { data: reviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => api.getReviews(productId),
    enabled: !!product, // Only run if product exists
  });

  return { product, reviews };
}
```

### 4. Parallel Queries

Requêtes parallèles:

```typescript
function useDashboardData() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['metrics'],
        queryFn: api.getMetrics,
      },
      {
        queryKey: ['recent-orders'],
        queryFn: api.getRecentOrders,
      },
      {
        queryKey: ['top-products'],
        queryFn: api.getTopProducts,
      }
    ]
  });

  return {
    metrics: queries[0].data,
    recentOrders: queries[1].data,
    topProducts: queries[2].data,
    isLoading: queries.some(q => q.isLoading),
  };
}
```

---

## 🔧 Bonnes Pratiques

### 1. Naming Convention

```typescript
// ✅ Bon
useProducts()          // Liste
useProduct(id)         // Un seul
useCreateProduct()     // Création
useUpdateProduct()     // Mise à jour
useDeleteProduct()     // Suppression

// ❌ Éviter
getProducts()
fetchProduct()
```

### 2. Query Keys

Utiliser des query keys structurées:

```typescript
// ✅ Bon
['products']                          // Tous les produits
['products', { category: 'tech' }]    // Produits filtrés
['product', id]                       // Un produit
['product', id, 'reviews']            // Reviews d'un produit

// ❌ Éviter
['allProducts']
['productList']
['getProduct']
```

### 3. Error Handling

Toujours gérer les erreurs:

```typescript
function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: api.getProducts,
    onError: (error) => {
      console.error('Failed to fetch products:', error);
      toast.error('Erreur de chargement des produits');
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

### 4. Cache Configuration

Configurer le cache selon le type de données:

```typescript
// Données statiques (1h)
useQuery({
  queryKey: ['categories'],
  queryFn: api.getCategories,
  staleTime: 60 * 60 * 1000,
  cacheTime: 60 * 60 * 1000,
});

// Données utilisateur (5min)
useQuery({
  queryKey: ['user-products'],
  queryFn: api.getUserProducts,
  staleTime: 5 * 60 * 1000,
});

// Données temps réel (30s)
useQuery({
  queryKey: ['stock-levels'],
  queryFn: api.getStockLevels,
  staleTime: 30 * 1000,
  refetchInterval: 30 * 1000,
});
```

---

## 🧪 Testing

Tester les hooks avec React Testing Library:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from './useProducts';

describe('useProducts', () => {
  it('should fetch products', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.products).toHaveLength(5);
  });
});
```

---

**Note**: Tous les hooks doivent suivre ces patterns pour maintenir une base de code cohérente et maintenable.
