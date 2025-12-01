# ShopOpti Coding Standards

## TypeScript Guidelines

### Type Safety
- Always define proper TypeScript types
- Avoid `any` - use `unknown` or proper types
- Use interfaces for data structures
- Export types for reusability

```tsx
// ✅ Good
interface Product {
  id: string;
  name: string;
  price: number;
}

// ❌ Bad
const product: any = {};
```

### Naming Conventions
- **Components**: PascalCase (`ProductCard`, `UserProfile`)
- **Hooks**: camelCase with `use` prefix (`useProducts`, `useAuth`)
- **Utilities**: camelCase (`formatCurrency`, `validateEmail`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `MAX_RETRY_COUNT`)
- **Files**: Match component/function name (`ProductCard.tsx`, `useProducts.ts`)

## React Best Practices

### Component Structure
```tsx
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';

// 2. Types
interface ProductCardProps {
  product: Product;
  onEdit: (id: string) => void;
}

// 3. Component
export function ProductCard({ product, onEdit }: ProductCardProps) {
  // 4. Hooks
  const [isExpanded, setIsExpanded] = useState(false);
  const { updateProduct } = useProducts();

  // 5. Event handlers
  const handleEdit = () => {
    onEdit(product.id);
  };

  // 6. Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Custom Hooks
```tsx
export function useProductOperations() {
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const { data: result, error } = await supabase
        .from('products')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { createProduct: createProduct.mutate, isCreating: createProduct.isPending };
}
```

## Database Operations

### Supabase Queries
```tsx
// ✅ Good - Proper error handling
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('user_id', userId);

if (error) {
  console.error('Error fetching products:', error);
  throw error;
}

// ❌ Bad - No error handling
const { data } = await supabase.from('products').select('*');
```

### React Query Integration
```tsx
export function useProducts(userId: string) {
  return useQuery({
    queryKey: ['products', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

## Edge Functions

### Structure
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request
    const { action, ...params } = await req.json();

    // Handle actions
    let result;
    switch (action) {
      case 'sync':
        result = await handleSync(supabase, user.id, params);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Return response
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

## Error Handling

### Try-Catch Pattern
```tsx
try {
  const result = await riskyOperation();
  toast({ title: 'Success', description: 'Operation completed' });
} catch (error) {
  console.error('Operation failed:', error);
  toast({
    title: 'Error',
    description: error instanceof Error ? error.message : 'Operation failed',
    variant: 'destructive',
  });
}
```

### Form Validation
```tsx
const handleSubmit = async (values: FormValues) => {
  // Validate
  const errors: Record<string, string> = {};
  
  if (!values.name) {
    errors.name = 'Name is required';
  }
  
  if (!isValidEmail(values.email)) {
    errors.email = 'Invalid email address';
  }
  
  if (Object.keys(errors).length > 0) {
    // Show errors
    return;
  }
  
  // Submit
  await submitForm(values);
};
```

## Performance Optimization

### Memoization
```tsx
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize components
const MemoizedComponent = React.memo(ExpensiveComponent);
```

### Virtualization
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

## Testing

### Unit Tests
```tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders product name', () => {
    const product = { id: '1', name: 'Test Product', price: 10 };
    render(<ProductCard product={product} onEdit={() => {}} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});
```

## Documentation

### Component Documentation
```tsx
/**
 * ProductCard displays a product with actions
 * 
 * @param product - The product to display
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 * 
 * @example
 * <ProductCard
 *   product={product}
 *   onEdit={(id) => navigate(`/products/${id}/edit`)}
 *   onDelete={(id) => deleteProduct(id)}
 * />
 */
export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  // ...
}
```

## Git Commit Messages

### Format
```
type(scope): subject

body

footer
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **refactor**: Code refactoring
- **style**: Code style changes
- **docs**: Documentation
- **test**: Tests
- **chore**: Maintenance

### Examples
```
feat(products): add bulk import functionality

- Implement CSV parser
- Add progress tracking
- Update UI with import status

Closes #123
```

## Code Review Checklist

- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Loading states are shown
- [ ] Toast notifications work
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No unused imports
- [ ] Code follows naming conventions
- [ ] Tests pass
- [ ] Documentation updated
