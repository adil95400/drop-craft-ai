# Guide de développement - Drop Craft AI

## Démarrage rapide

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte Supabase
- Git

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd drop-craft-ai

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Démarrer le serveur de développement
npm run dev
```

### Variables d'environnement

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Sentry
VITE_SENTRY_DSN=your-sentry-dsn

# Optional: API Keys (pour intégrations)
OPENAI_API_KEY=sk-...
SHOPIFY_API_KEY=...
ALIEXPRESS_API_KEY=...
```

---

## Structure de développement

### Organisation du code

```
src/
├── components/          # Composants UI
│   ├── ui/             # Composants shadcn/ui
│   ├── forms/          # Formulaires
│   └── layouts/        # Layouts
├── domains/            # Logique métier par domaine
│   ├── commerce/
│   ├── marketing/
│   └── automation/
├── hooks/              # React hooks personnalisés
├── lib/                # Utilitaires
├── pages/              # Pages de l'application
└── integrations/       # Clients API
```

### Convention de nommage

#### Fichiers
- Composants React: `PascalCase.tsx` (ex: `ProductCard.tsx`)
- Hooks: `camelCase.ts` avec préfixe `use` (ex: `useProducts.ts`)
- Services: `camelCase.ts` avec suffixe `Service` (ex: `catalogService.ts`)
- Types: `PascalCase.ts` ou dans le fichier principal
- Utils: `camelCase.ts` (ex: `formatCurrency.ts`)

#### Code
```typescript
// Composants React - PascalCase
function ProductCard({ product }: ProductCardProps) {}

// Hooks - camelCase avec préfixe 'use'
function useProducts() {}

// Services/Classes - PascalCase
class CatalogService {}

// Fonctions utilitaires - camelCase
function formatCurrency(amount: number) {}

// Constantes - UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Types/Interfaces - PascalCase
interface Product {}
type ProductStatus = 'draft' | 'published';
```

---

## Développement de composants

### Création d'un nouveau composant

```typescript
// src/components/products/ProductCard.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{product.name}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{product.description}</p>
        <div className="flex gap-2 mt-4">
          {onEdit && (
            <Button onClick={() => onEdit(product.id)}>
              Éditer
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" onClick={() => onDelete(product.id)}>
              Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Utilisation du système de design

**IMPORTANT**: Toujours utiliser les tokens sémantiques du design system.

```typescript
// ❌ MAUVAIS - Couleurs hardcodées
<div className="bg-blue-500 text-white">

// ✅ BON - Tokens sémantiques
<div className="bg-primary text-primary-foreground">

// ❌ MAUVAIS - Classes tailwind directes
<div className="border-gray-200 bg-gray-50">

// ✅ BON - Tokens du design system
<div className="border-border bg-muted">
```

Tokens disponibles (voir `src/index.css`) :
- `--background` / `--foreground`
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--muted` / `--muted-foreground`
- `--accent` / `--accent-foreground`
- `--destructive` / `--destructive-foreground`
- `--border`, `--input`, `--ring`

---

## Développement de hooks

### Hook avec TanStack Query

```typescript
// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogService } from '@/domains/commerce/services/catalogService';

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => catalogService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: NewProduct) => catalogService.createProduct(product),
    onSuccess: () => {
      // Invalider le cache pour recharger la liste
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      catalogService.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      // Invalider à la fois la liste et le détail
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });
}
```

### Hook personnalisé

```typescript
// src/hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const SearchInput = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data } = useProducts({ search: debouncedSearch });

  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
};
```

---

## Développement de services

### Service avec cache

```typescript
// src/domains/commerce/services/productService.ts
import { supabase } from '@/integrations/supabase/client';

interface CachedData<T> {
  data: T;
  timestamp: number;
}

class ProductService {
  private cache = new Map<string, CachedData<any>>();
  private CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async getProduct(id: string): Promise<Product | null> {
    const cacheKey = `product-${id}`;
    const cached = this.getCached<Product>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data) this.setCache(cacheKey, data);

    return data;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const productService = new ProductService();
```

---

## Développement d'Edge Functions

### Créer une nouvelle Edge Function

```bash
# Structure
supabase/functions/
├── my-function/
│   └── index.ts
└── _shared/
    ├── cors.ts
    ├── auth.ts
    └── db-helpers.ts
```

### Template de base

```typescript
// supabase/functions/my-function/index.ts
import { createClient } from '@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateUser } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Authenticate user
    const user = await authenticateUser(req, supabase);

    // Parse request body
    const body = await req.json();
    console.log('Request from user:', user.id, 'Body:', body);

    // Your business logic here
    const result = await processRequest(body, user.id);

    // Return success response
    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('authorization') ? 401 : 400,
      }
    );
  }
});

async function processRequest(body: any, userId: string) {
  // Your logic here
  return { message: 'Success' };
}
```

### Tester localement

```bash
# Démarrer Supabase localement
supabase start

# Servir la fonction
supabase functions serve my-function

# Tester avec curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/my-function' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"key":"value"}'
```

### Déployer

```bash
# Déployer une fonction spécifique
supabase functions deploy my-function

# Déployer toutes les fonctions
supabase functions deploy
```

---

## Gestion des formulaires

### Avec React Hook Form + Zod

```typescript
// src/components/forms/ProductForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sanitizeProductData } from '@/lib/input-sanitization';

// Schema de validation
const productSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  price: z.number().positive('Le prix doit être positif'),
  cost_price: z.number().positive('Le prix de revient doit être positif').optional(),
  sku: z.string().regex(/^[A-Z0-9-]+$/, 'SKU invalide').optional(),
  category: z.string(),
  stock_quantity: z.number().int().min(0),
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductForm({ onSubmit, defaultValues }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const onSubmitForm = async (data: ProductFormData) => {
    // Sanitize les données avant envoi
    const sanitized = sanitizeProductData(data);
    await onSubmit(sanitized);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nom du produit
        </label>
        <input
          id="name"
          {...register('name')}
          className="mt-1 block w-full rounded-md border-border"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium">
          Prix
        </label>
        <input
          id="price"
          type="number"
          step="0.01"
          {...register('price', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-border"
        />
        {errors.price && (
          <p className="mt-1 text-sm text-destructive">{errors.price.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary"
      >
        {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}
```

---

## Tests

### Tests unitaires (Vitest)

```typescript
// src/components/__tests__/ProductCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: 29.99,
  };

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<ProductCard product={mockProduct} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Éditer'));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

### Tests E2E (Cypress)

```typescript
// cypress/e2e/products.cy.ts
describe('Product Management', () => {
  beforeEach(() => {
    cy.login(); // Custom command
    cy.visit('/products');
  });

  it('should create a new product', () => {
    cy.get('[data-testid="add-product-btn"]').click();
    
    cy.get('input[name="name"]').type('Test Product');
    cy.get('input[name="price"]').type('29.99');
    cy.get('select[name="category"]').select('Electronics');
    
    cy.get('button[type="submit"]').click();
    
    cy.contains('Product created successfully').should('be.visible');
    cy.contains('Test Product').should('be.visible');
  });

  it('should edit an existing product', () => {
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="edit-btn"]').click();
    });
    
    cy.get('input[name="name"]').clear().type('Updated Product');
    cy.get('button[type="submit"]').click();
    
    cy.contains('Updated Product').should('be.visible');
  });
});
```

### Lancer les tests

```bash
# Tests unitaires
npm run test

# Tests unitaires en mode watch
npm run test:watch

# Tests E2E
npm run test:e2e

# Tests E2E en mode interactif
npm run test:e2e:open

# Tous les tests
npm run test:all
```

---

## Debugging

### Console Logs

```typescript
// Development logging
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}

// Structured logging
console.group('User Action');
console.log('User ID:', userId);
console.log('Action:', action);
console.table(data);
console.groupEnd();
```

### React Query Devtools

```typescript
// src/main.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  {import.meta.env.DEV && <ReactQueryDevtools />}
</QueryClientProvider>
```

### Supabase Logs

```bash
# Voir les logs Edge Functions
supabase functions logs my-function

# Logs avec filtre
supabase functions logs my-function --filter "error"

# Logs en temps réel
supabase functions logs my-function --follow
```

---

## Bonnes pratiques

### Performance

1. **Lazy loading des routes**
```typescript
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
```

2. **Memoization**
```typescript
const MemoizedComponent = memo(ExpensiveComponent);

const memoizedValue = useMemo(() => 
  computeExpensiveValue(a, b), 
  [a, b]
);

const memoizedCallback = useCallback(() => 
  doSomething(a, b), 
  [a, b]
);
```

3. **Optimistic updates**
```typescript
const mutation = useMutation({
  mutationFn: updateProduct,
  onMutate: async (newProduct) => {
    // Annuler les requêtes en cours
    await queryClient.cancelQueries({ queryKey: ['products'] });

    // Snapshot de la valeur précédente
    const previousProducts = queryClient.getQueryData(['products']);

    // Optimistically update
    queryClient.setQueryData(['products'], (old) => 
      [...old, newProduct]
    );

    return { previousProducts };
  },
  onError: (err, newProduct, context) => {
    // Rollback en cas d'erreur
    queryClient.setQueryData(['products'], context.previousProducts);
  },
});
```

### Sécurité

1. **Toujours sanitizer les inputs utilisateur**
2. **Utiliser RLS pour la sécurité database**
3. **Valider côté backend ET frontend**
4. **Ne jamais exposer les secrets dans le code client**
5. **Utiliser HTTPS en production**

### Code Quality

1. **Typage strict**
```typescript
// ❌ Éviter 'any'
function process(data: any) {}

// ✅ Typer correctement
function process(data: Product) {}
```

2. **Gérer les erreurs**
```typescript
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  toast.error('Une erreur est survenue');
}
```

3. **Commentaires utiles**
```typescript
// ❌ Commentaire inutile
// Increment i
i++;

// ✅ Commentaire qui explique le "pourquoi"
// Reset counter after batch to prevent memory overflow
if (i >= BATCH_SIZE) i = 0;
```

---

## Ressources

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
