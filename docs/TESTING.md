# 🧪 Guide de Tests - Drop Craft AI

## Vue d'ensemble

Ce document décrit la stratégie de tests, les outils utilisés et les bonnes pratiques pour garantir la qualité du code.

## Stack de Tests

### Frontend
- **Vitest** - Framework de tests unitaires et d'intégration
- **React Testing Library** - Tests de composants React
- **Cypress** - Tests end-to-end
- **@testing-library/jest-dom** - Matchers Jest pour DOM

### Backend
- **Pytest** - Tests Python pour scripts
- **Supabase Edge Functions** - Tests locaux avec Deno

## Structure des Tests

```
src/
├── components/
│   └── __tests__/
│       └── Component.test.tsx
├── hooks/
│   └── __tests__/
│       └── useHook.test.ts
├── utils/
│   └── __tests__/
│       └── helper.test.ts
cypress/
├── e2e/
│   ├── auth.cy.ts
│   ├── products.cy.ts
│   └── orders.cy.ts
└── fixtures/
    └── test-data.json
```

## Types de Tests

### 1. Tests Unitaires

Tests de fonctions isolées et utilitaires.

```typescript
// src/utils/__tests__/formatPrice.test.ts
import { describe, it, expect } from 'vitest';
import { formatPrice } from '../formatPrice';

describe('formatPrice', () => {
  it('should format price with currency symbol', () => {
    expect(formatPrice(1999.99, 'EUR')).toBe('1 999,99 €');
  });

  it('should handle zero price', () => {
    expect(formatPrice(0, 'EUR')).toBe('0,00 €');
  });
});
```

### 2. Tests de Composants

Tests de rendu et d'interaction des composants React.

```typescript
// src/components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 3. Tests de Hooks

Tests de hooks React personnalisés.

```typescript
// src/hooks/__tests__/useAuth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    // Setup mock Supabase client
  });

  it('should return user when authenticated', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.user).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

### 4. Tests d'Intégration

Tests de flux complets impliquant plusieurs composants.

```typescript
// src/features/__tests__/checkout.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckoutFlow } from '../CheckoutFlow';

describe('CheckoutFlow', () => {
  it('should complete checkout process', async () => {
    render(<CheckoutFlow />);
    
    // Fill shipping form
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: '123 Main St' }
    });
    
    // Select payment method
    fireEvent.click(screen.getByText('Credit Card'));
    
    // Submit order
    fireEvent.click(screen.getByText('Place Order'));
    
    await waitFor(() => {
      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    });
  });
});
```

### 5. Tests E2E (Cypress)

Tests de scénarios utilisateur complets.

```typescript
// cypress/e2e/product-purchase.cy.ts
describe('Product Purchase Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login('test@example.com', 'password');
  });

  it('should allow user to purchase a product', () => {
    // Browse products
    cy.visit('/products');
    cy.get('[data-testid="product-card"]').first().click();
    
    // Add to cart
    cy.get('[data-testid="add-to-cart"]').click();
    cy.get('[data-testid="cart-badge"]').should('contain', '1');
    
    // Checkout
    cy.visit('/cart');
    cy.get('[data-testid="checkout-button"]').click();
    
    // Fill shipping info
    cy.get('[name="address"]').type('123 Main St');
    cy.get('[name="city"]').type('Paris');
    cy.get('[name="zipCode"]').type('75001');
    
    // Confirm order
    cy.get('[data-testid="confirm-order"]').click();
    
    // Verify success
    cy.url().should('include', '/order-success');
    cy.contains('Order Confirmed').should('be.visible');
  });
});
```

## Commandes de Tests

### Développement
```bash
# Tests unitaires en mode watch
npm run test

# Tests avec coverage
npm run test:coverage

# Tests E2E interactifs
npm run test:e2e

# Tests E2E headless
npm run test:e2e:headless
```

### CI/CD
```bash
# Tous les tests
npm run test:ci

# Tests avec rapport
npm run test:coverage -- --reporter=json --reporter=html
```

## Couverture de Code

### Objectifs de Couverture
- **Statements**: ≥ 80%
- **Branches**: ≥ 75%
- **Functions**: ≥ 80%
- **Lines**: ≥ 80%

### Configuration Vitest

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/integrations/supabase/types.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts'
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    }
  }
});
```

## Mocking

### Mock de Supabase Client

```typescript
// src/test/mocks/supabase.ts
import { vi } from 'vitest';

export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  })),
  auth: {
    getUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn()
  }
};
```

### Mock de React Query

```typescript
// src/test/mocks/react-query.ts
import { QueryClient } from '@tanstack/react-query';

export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});
```

## Fixtures et Données de Test

```typescript
// cypress/fixtures/products.json
{
  "products": [
    {
      "id": "prod-1",
      "name": "Test Product",
      "price": 29.99,
      "stock": 100
    }
  ]
}

// cypress/support/commands.ts
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[name="email"]').type(email);
    cy.get('[name="password"]').type(password);
    cy.get('[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## Tests de Performance

### Web Vitals Testing

```typescript
// src/utils/__tests__/performance.test.ts
import { describe, it, expect } from 'vitest';
import { measurePerformance } from '../performance';

describe('Performance Metrics', () => {
  it('should load homepage under 2 seconds', async () => {
    const metrics = await measurePerformance('/');
    expect(metrics.loadTime).toBeLessThan(2000);
  });

  it('should have good LCP score', async () => {
    const metrics = await measurePerformance('/');
    expect(metrics.lcp).toBeLessThan(2500); // Good LCP < 2.5s
  });
});
```

## Tests d'Accessibilité

```typescript
// cypress/e2e/accessibility.cy.ts
import 'cypress-axe';

describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('should have no accessibility violations', () => {
    cy.checkA11y();
  });

  it('should be keyboard navigable', () => {
    cy.get('body').tab();
    cy.focused().should('have.attr', 'role', 'button');
  });
});
```

## Bonnes Pratiques

### ✅ À Faire

1. **Test Driven Development (TDD)**
   - Écrire les tests avant le code
   - Définir le comportement attendu

2. **Tests Indépendants**
   - Chaque test doit pouvoir s'exécuter seul
   - Pas de dépendances entre tests

3. **Nommage Descriptif**
   ```typescript
   // ✅ Bon
   it('should display error message when email is invalid', () => {});
   
   // ❌ Mauvais
   it('test email', () => {});
   ```

4. **Arrange-Act-Assert (AAA)**
   ```typescript
   it('should add product to cart', () => {
     // Arrange
     const product = { id: '1', name: 'Test' };
     
     // Act
     addToCart(product);
     
     // Assert
     expect(getCartItems()).toContain(product);
   });
   ```

5. **Mock des Dépendances Externes**
   - APIs, services tiers
   - Bases de données
   - Timers et dates

### ❌ À Éviter

1. **Tests Trop Longs**
   - Diviser en tests plus petits
   - Un seul concept par test

2. **Tests Fragiles**
   - Éviter les sélecteurs CSS complexes
   - Utiliser `data-testid` pour stabilité

3. **Tests Redondants**
   - Ne pas tester les librairies tierces
   - Focuser sur la logique métier

4. **Snapshots Abusifs**
   - Limiter aux composants stables
   - Préférer assertions spécifiques

## Debugging des Tests

### Vitest UI

```bash
npm run test:ui
```

### Cypress Debug

```typescript
cy.debug(); // Pause execution
cy.pause(); // Interactive pause
cy.screenshot('debug-state');
```

### Test Logs

```typescript
import { debug } from '@testing-library/react';

render(<Component />);
debug(); // Print current DOM
```

## Tests de Régression

### Visual Regression Testing

```typescript
// cypress/e2e/visual-regression.cy.ts
describe('Visual Regression', () => {
  it('should match homepage snapshot', () => {
    cy.visit('/');
    cy.matchImageSnapshot('homepage');
  });
});
```

## Stratégie de Tests par Fonctionnalité

### Authentification
- ✅ Login/Logout
- ✅ Password reset
- ✅ Session persistence
- ✅ Protected routes

### Catalogue Produits
- ✅ Product listing
- ✅ Filters & search
- ✅ Product details
- ✅ Add to cart

### Commandes
- ✅ Cart management
- ✅ Checkout flow
- ✅ Payment processing
- ✅ Order confirmation

### CRM
- ✅ Contact management
- ✅ Lead scoring
- ✅ Email campaigns
- ✅ Analytics

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
      - run: npm run test:e2e:headless
```

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

---

**Dernière mise à jour**: 2024-01-XX  
**Prochaine révision**: Tous les trimestres
