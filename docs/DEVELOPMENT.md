# Guide de Développement

## 🚀 Getting Started

### Configuration Environnement

```bash
# Cloner le repo
git clone [repo-url]
cd drop-craft-ai

# Installer les dépendances
npm install

# Copier .env
cp .env.example .env

# Configurer Supabase
# Éditer .env avec vos credentials

# Démarrer le serveur
npm run dev
```

### Structure d'un Feature

Lorsque vous ajoutez un nouveau feature, suivez cette structure:

```
src/
├── pages/
│   └── my-feature/
│       └── MyFeaturePage.tsx          # Page principale
├── components/
│   └── my-feature/
│       ├── MyFeatureList.tsx          # Composant liste
│       ├── MyFeatureForm.tsx          # Formulaire
│       └── MyFeatureCard.tsx          # Card item
├── hooks/
│   └── my-feature/
│       ├── useMyFeature.ts            # Hook principal
│       └── useMyFeatureActions.ts     # Actions
└── services/
    └── MyFeatureService.ts            # Service métier
```

## 📝 Conventions de Code

### TypeScript

```typescript
// ✅ Bon: Interface pour les props
interface ProductCardProps {
  product: Product;
  onSelect: (id: string) => void;
  variant?: 'default' | 'compact';
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onSelect,
  variant = 'default'
}) => {
  // Implementation
};

// ✅ Bon: Type pour les données
type ProductStatus = 'active' | 'draft' | 'archived';

interface Product {
  id: string;
  name: string;
  status: ProductStatus;
  createdAt: Date;
}
```

### Naming

```typescript
// Components: PascalCase
export const ProductCard = () => {};

// Hooks: camelCase with 'use' prefix
export const useProducts = () => {};

// Services: PascalCase with 'Service' suffix
export class ProductService {}

// Constants: UPPER_SNAKE_CASE
export const MAX_PRODUCTS = 1000;
export const DEFAULT_PAGE_SIZE = 50;

// Functions: camelCase
export const formatPrice = (price: number) => {};
```

### File Organization

```typescript
// ✅ Bon: Exports nommés
export const ProductCard = () => {};
export const ProductList = () => {};

// ❌ Éviter: Export default
export default ProductCard;

// ✅ Bon: Index files pour barrel exports
// src/components/products/index.ts
export { ProductCard } from './ProductCard';
export { ProductList } from './ProductList';
export { ProductForm } from './ProductForm';
```

## 🎨 Composants

### Structure de Base

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  className,
  children
}) => {
  return (
    <div className={cn('base-classes', className)}>
      {children}
    </div>
  );
};
```

### Composants avec State

```typescript
import { useState } from 'react';

export const ProductSearch = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});

  const handleSearch = (value: string) => {
    setQuery(value);
    // Trigger search
  };

  return (
    <div>
      <SearchInput value={query} onChange={handleSearch} />
      <FilterPanel filters={filters} onChange={setFilters} />
    </div>
  );
};
```

### Composants avec Hooks

```typescript
import { useProducts } from '@/hooks/useProducts';

export const ProductsList = () => {
  const { products, isLoading, error } = useProducts();

  if (isLoading) return <Skeleton count={5} />;
  if (error) return <ErrorMessage error={error} />;
  if (!products.length) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

## 🎣 Hooks

### Hook de Lecture (Query)

```typescript
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/ProductService';

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => {
      // Optional: transform data
      return data.map(p => ({
        ...p,
        formattedPrice: formatPrice(p.price)
      }));
    },
  });
};
```

### Hook de Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/ProductService';
import { toast } from 'sonner';

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductInput) => 
      productService.create(data),
    
    onSuccess: (newProduct) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast.success('Produit créé avec succès');
    },
    
    onError: (error) => {
      toast.error('Erreur lors de la création');
      console.error(error);
    },
  });
};

// Usage
function CreateProductForm() {
  const { mutate, isLoading } = useCreateProduct();

  const handleSubmit = (data) => {
    mutate(data);
  };

  return <Form onSubmit={handleSubmit} loading={isLoading} />;
}
```

## 🔧 Services

### Service Pattern

```typescript
import { supabase } from '@/integrations/supabase/client';

export class ProductService {
  private static instance: ProductService;

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  async getAll(filters?: ProductFilters): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .eq('user_id', filters?.userId);

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async create(product: CreateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const productService = ProductService.getInstance();
```

## 🎨 Styling

### Tailwind Classes

```typescript
// ✅ Bon: Utiliser cn() pour combiner classes
import { cn } from '@/lib/utils';

<button className={cn(
  'px-4 py-2 rounded-lg',
  'bg-primary text-primary-foreground',
  'hover:bg-primary/90',
  'disabled:opacity-50',
  className
)}>
  Click me
</button>

// ✅ Bon: Utiliser les tokens sémantiques
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ Éviter: Couleurs hardcodées
<div className="bg-white text-black">
```

### Responsive Design

```typescript
// Mobile-first approach
<div className="
  flex flex-col           // Mobile: column
  md:flex-row            // Tablet+: row
  gap-4                  // Espacement
  p-4 md:p-6 lg:p-8     // Padding progressif
">
  <div className="w-full md:w-1/2 lg:w-1/3">
    Content
  </div>
</div>
```

### Animations

```typescript
// Utiliser Tailwind animate
<div className="animate-fade-in">
  Content appears smoothly
</div>

// Custom animations dans tailwind.config.ts
animation: {
  'fade-in': 'fadeIn 0.3s ease-in-out',
  'slide-up': 'slideUp 0.3s ease-out',
}
```

## 🧪 Testing

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
  };

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('99.99 €')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    render(<ProductCard product={mockProduct} onSelect={onSelect} />);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

### Hook Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from './useProducts';

describe('useProducts', () => {
  it('fetches products successfully', async () => {
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

## 🔐 Sécurité

### Validation des Entrées

```typescript
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  category: z.enum(['electronics', 'clothing', 'food']),
  description: z.string().optional(),
});

type CreateProductInput = z.infer<typeof productSchema>;

function handleCreate(data: unknown) {
  // Validate
  const validated = productSchema.parse(data);
  
  // Use validated data
  return productService.create(validated);
}
```

### Sanitization

```typescript
import DOMPurify from 'dompurify';

function ProductDescription({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html);
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### Authentification

```typescript
import { useAuth } from '@/contexts/UnifiedAuthContext';

function ProtectedComponent() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loader />;
  if (!user) return <Navigate to="/login" />;

  return <div>Protected content</div>;
}
```

## 📊 Performance

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

function ProductList({ products, onSelect }) {
  // Memoize expensive computations
  const sortedProducts = useMemo(() => {
    return products.sort((a, b) => b.price - a.price);
  }, [products]);

  // Memoize callbacks
  const handleSelect = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);

  return (
    <div>
      {sortedProducts.map(product => (
        <ProductCard 
          key={product.id}
          product={product}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
```

### Virtual Scrolling

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function LargeList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ProductCard product={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🐛 Debugging

### Console Logging

```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug data:', data);
}

// Better: Use a logger
import { logger } from '@/lib/logger';

logger.debug('User action', { userId, action });
logger.error('API Error', error);
```

### React Query Devtools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
}
```

## 📚 Ressources

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [Supabase Docs](https://supabase.com/docs)

---

**Happy Coding! 🚀**
