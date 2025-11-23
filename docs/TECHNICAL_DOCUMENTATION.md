# Documentation Technique - Drop Craft AI

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système](#architecture-du-système)
3. [Stack technologique](#stack-technologique)
4. [Structure du projet](#structure-du-projet)
5. [Services et modules](#services-et-modules)
6. [Base de données](#base-de-données)
7. [Edge Functions](#edge-functions)
8. [Authentification et sécurité](#authentification-et-sécurité)
9. [Intégrations externes](#intégrations-externes)
10. [Performance et optimisation](#performance-et-optimisation)

---

## Vue d'ensemble

Drop Craft AI est une plateforme complète de dropshipping assistée par IA, permettant aux utilisateurs de :
- Importer et gérer des produits depuis diverses sources
- Optimiser les descriptions et images avec l'IA
- Synchroniser avec Shopify et d'autres plateformes
- Automatiser les workflows marketing
- Analyser les performances avec des insights IA

### Architecture globale

```
┌─────────────────┐
│   Frontend      │
│   React + TS    │
│   + Tailwind    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │
│  - Auth         │
│  - Database     │
│  - Storage      │
│  - Edge Funcs   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Intégrations   │
│  - Shopify      │
│  - AliExpress   │
│  - OpenAI       │
│  - Stripe       │
└─────────────────┘
```

---

## Architecture du système

### Architecture Frontend

**Modèle Domain-Driven Design (DDD)**

```
src/
├── domains/              # Domaines métier
│   ├── commerce/        # Gestion produits, commandes
│   ├── marketing/       # Campagnes, analytics
│   └── automation/      # Workflows automatisés
├── components/          # Composants UI réutilisables
├── hooks/              # React hooks personnalisés
├── lib/                # Utilitaires et helpers
└── integrations/       # Clients API (Supabase, etc.)
```

### Flux de données

```
User Action
    ↓
Component (React)
    ↓
Hook (useQuery/useMutation)
    ↓
Service Layer
    ↓
Supabase Client
    ↓
Database / Edge Function
```

---

## Stack technologique

### Frontend
- **React 18.3.1** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool et dev server
- **Tailwind CSS** - Framework CSS utilitaire
- **shadcn/ui** - Composants UI
- **TanStack Query** - Gestion d'état serveur
- **React Hook Form + Zod** - Gestion de formulaires
- **React Router** - Routing
- **Framer Motion** - Animations

### Backend (Supabase)
- **PostgreSQL** - Base de données
- **Supabase Auth** - Authentification
- **Supabase Storage** - Stockage fichiers
- **Edge Functions (Deno)** - Serverless functions
- **Row Level Security** - Sécurité au niveau ligne

### Outils de développement
- **Vitest** - Tests unitaires
- **Cypress** - Tests E2E
- **Playwright** - Tests d'intégration
- **ESLint + Prettier** - Linting et formatage
- **Husky** - Git hooks

---

## Structure du projet

### Détail des dossiers principaux

#### `/src/domains`
Organisation par domaine métier avec services, types et logique métier isolés.

```typescript
// Exemple: domains/commerce/services/catalogService.ts
export class CatalogService {
  async getProducts(filters?: CommerceFilters) {
    // Logique métier isolée
  }
}
```

#### `/src/components`
Composants UI réutilisables organisés par fonction.

```
components/
├── ui/               # shadcn components
├── forms/           # Composants de formulaires
├── layouts/         # Layouts de page
└── features/        # Composants feature-specific
```

#### `/src/hooks`
Hooks React personnalisés pour la logique réutilisable.

```typescript
// Exemple: hooks/useSupabaseData.ts
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => catalogService.getProducts()
  });
};
```

#### `/supabase/functions`
Edge Functions serverless pour la logique backend.

```
functions/
├── _shared/          # Code partagé
├── shopify-sync/     # Sync Shopify
├── ai-optimize/      # Optimisation IA
└── csv-import/       # Import CSV
```

---

## Services et modules

### CatalogService
Gestion du catalogue produits avec cache.

```typescript
class CatalogService {
  // Cache avec TTL de 10 minutes
  private cache: Map<string, CachedData>;
  
  async getProducts(filters?: CommerceFilters): Promise<{
    products: CatalogProduct[];
    total: number;
  }>;
  
  async getProduct(id: string): Promise<CatalogProduct | null>;
  async importProduct(productId: string): Promise<any>;
}
```

### ImportService
Gestion des imports de produits multi-sources.

```typescript
class ImportService {
  async startUrlImport(url: string, config?: Record<string, any>);
  async startSupplierImport(supplier: string, config?: Record<string, any>);
  async approveProduct(productId: string);
  async publishProduct(productId: string);
}
```

### AIScraperService
Scraping intelligent avec IA.

```typescript
class AIScraperService {
  async scrapeWithAI(url: string): Promise<{
    success: boolean;
    products: ScrapedProduct[];
  }>;
  
  async optimizeProduct(
    product: ScrapedProduct,
    options?: AIOptimizationOptions
  ): Promise<OptimizedProduct>;
  
  async detectPageType(url: string): Promise<PageType>;
}
```

### NotificationService
Système de notifications en temps réel.

```typescript
class NotificationService {
  init(userId: string): void;
  subscribe(callback: NotificationCallback): () => void;
  addNotification(notification: Notification): void;
  markAsRead(notificationId: string): Promise<void>;
}
```

---

## Base de données

### Tables principales

#### `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  sku TEXT,
  images JSONB,
  variants JSONB,
  supplier_info JSONB,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index de performance
CREATE INDEX idx_products_user_status ON products(user_id, status);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
```

#### `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10, 2),
  items JSONB NOT NULL,
  shipping_address JSONB,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

#### `import_jobs`
```sql
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  total_items INTEGER,
  imported_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  error_log JSONB,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security (RLS)

Toutes les tables sensibles ont des politiques RLS :

```sql
-- Politique pour products
CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id);
```

### Fonctions de base de données

#### `update_updated_at_column()`
Trigger automatique pour mettre à jour `updated_at`.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Edge Functions

### Architecture des Edge Functions

Toutes les Edge Functions suivent ce pattern :

```typescript
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization');
    }

    // Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Vérifier le token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }

    // Logique métier
    const body = await req.json();
    const result = await processRequest(body, user.id);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### Sécurité des Edge Functions

#### Authentication partagée
```typescript
// _shared/secure-auth.ts
export async function authenticateUser(req: Request, supabase: SupabaseClient) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user;
}

export async function requireAdmin(user: User, supabase: SupabaseClient) {
  const { data: isAdmin } = await supabase.rpc('is_user_admin', {
    user_id: user.id
  });

  if (!isAdmin) {
    throw new Error('Admin privileges required');
  }

  return true;
}
```

#### Helpers de base de données sécurisés
```typescript
// _shared/db-helpers.ts
export async function secureQuery(
  supabase: SupabaseClient,
  userId: string,
  table: string,
  query: any
) {
  // Force l'isolation par tenant
  return supabase
    .from(table)
    .select(query)
    .eq('user_id', userId);
}
```

---

## Authentification et sécurité

### Flux d'authentification

```
1. User Login → Supabase Auth
2. Get JWT Token
3. Store in localStorage
4. Include in API calls: Authorization: Bearer {token}
5. Backend validates token
6. Access granted if valid
```

### Gestion des sessions

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user };
};
```

### API Keys

Les clés API utilisateur sont gérées via la table `api_keys`.

### Sanitization des entrées

```typescript
// utils/input-sanitization.ts
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target']
  });
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 1000);
}

export function sanitizeProductData(data: any) {
  return {
    ...data,
    name: sanitizeText(data.name),
    description: sanitizeHtml(data.description),
    sku: sanitizeSKU(data.sku)
  };
}
```

---

## Intégrations externes

### Shopify

Configuration du client :

```typescript
// integrations/shopify/client.ts
import Shopify from '@shopify/shopify-api';

export async function getShopifyClient(userId: string) {
  const { data: config } = await supabase
    .from('shopify_integrations')
    .select('*')
    .eq('user_id', userId)
    .single();

  return new Shopify.Clients.Rest(
    config.shop_domain,
    config.access_token
  );
}
```

### AliExpress (via API Affiliate)

```typescript
// integrations/aliexpress/api.ts
export async function searchProducts(keyword: string) {
  const response = await fetch(
    `https://api.aliexpress.com/v1/products/search`,
    {
      headers: {
        'Authorization': `Bearer ${ALIEXPRESS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ keyword, page_size: 50 })
    }
  );

  return response.json();
}
```

### OpenAI

Utilisé pour l'optimisation de contenu :

```typescript
// integrations/openai/client.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateDescription(product: any) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: 'Generate compelling product descriptions for e-commerce.'
    }, {
      role: 'user',
      content: `Product: ${product.name}\nFeatures: ${product.features}`
    }],
    temperature: 0.7,
    max_tokens: 500
  });

  return completion.choices[0].message.content;
}
```

---

## Performance et optimisation

### Caching Strategy

#### Frontend Cache (TanStack Query)

```typescript
// Configuration globale
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
```

### Index de base de données

```sql
-- Produits
CREATE INDEX idx_products_user_status ON products(user_id, status);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_category ON products(category) WHERE category IS NOT NULL;

-- Commandes
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id, created_at DESC);
```

### Lazy Loading

```typescript
// Router avec lazy loading
import { lazy, Suspense } from 'react';

const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
      </Routes>
    </Suspense>
  );
}
```

---

## Références

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation React](https://react.dev)
- [Documentation TanStack Query](https://tanstack.com/query)
- [Documentation Shopify API](https://shopify.dev/docs)
- [Guides de sécurité](./SECURITY_GUIDELINES.md)
- [Stratégie de tests](./TESTING_STRATEGY.md)
