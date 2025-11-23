# 🧪 Stratégie de Tests - DropCraft AI

## Vue d'ensemble

Cette stratégie définit comment tester efficacement l'application DropCraft AI pour garantir la qualité, la fiabilité et la sécurité.

---

## 🎯 Objectifs de Couverture

### Couverture de Code Minimale

| Type de Test | Objectif | Actuel | Status |
|--------------|----------|--------|--------|
| Tests Unitaires | 70% | - | 🟡 À mesurer |
| Tests E2E | 80% parcours | - | 🟡 À mesurer |
| Tests Intégration | 60% | - | 🟡 À mesurer |
| Tests Sécurité | 100% endpoints | - | 🟡 À mesurer |

---

## 📊 Pyramide de Tests

```
         /\
        /  \  E2E Tests (15%)
       /____\  
      /      \  Integration Tests (25%)
     /________\
    /          \  Unit Tests (60%)
   /____________\
```

### Distribution Recommandée
- **60% Tests Unitaires**: Composants, hooks, utils
- **25% Tests d'Intégration**: Edge functions, API, database
- **15% Tests E2E**: Parcours utilisateur critiques

---

## 🧩 Tests Unitaires (Vitest)

### Composants Prioritaires

#### 1. Composants Critiques (✅ Obligatoire)
```typescript
// src/components/__tests__/ImportForm.test.tsx
describe('ImportForm', () => {
  it('validates required fields')
  it('handles file upload')
  it('submits form with valid data')
  it('displays error messages')
})
```

**Composants à tester**:
- ✅ `UnifiedImportInterface`
- ✅ `Button`, `Input`, `Select` (shadcn)
- 🟡 `ProductCard`, `OrderCard`
- 🟡 `DataTable`, `Pagination`

#### 2. Hooks Personnalisés (✅ Obligatoire)
```typescript
// src/hooks/__tests__/useProducts.test.ts
describe('useProducts', () => {
  it('fetches products successfully')
  it('handles loading state')
  it('handles error state')
  it('refetches on demand')
})
```

**Hooks à tester**:
- ✅ `useProducts`, `useOrders`, `useSuppliers`
- 🟡 `useAuth`, `usePermissions`
- 🟡 `useImport`, `useSync`

#### 3. Services & Utils (✅ Obligatoire)
```typescript
// src/utils/__tests__/formatters.test.ts
describe('formatPrice', () => {
  it('formats EUR correctly')
  it('formats USD correctly')
  it('handles null values')
})
```

**À tester**:
- ✅ Formatters (prix, dates, nombres)
- ✅ Validators (email, URL, SKU)
- 🟡 Calculateurs (profit, marge)

---

## 🌐 Tests E2E (Cypress)

### Parcours Utilisateur Critiques

#### 1. Authentification (✅ Obligatoire)
```typescript
describe('Authentication', () => {
  it('user can sign up')
  it('user can login')
  it('user can logout')
  it('handles invalid credentials')
  it('redirects unauthenticated users')
})
```

#### 2. Import de Produits (✅ Obligatoire)
```typescript
describe('Product Import', () => {
  it('imports from URL')
  it('imports from CSV')
  it('imports from Shopify store')
  it('validates import data')
  it('displays import results')
})
```

#### 3. Gestion des Produits (✅ Obligatoire)
```typescript
describe('Product Management', () => {
  it('displays product list')
  it('filters products')
  it('edits product')
  it('deletes product')
  it('bulk operations')
})
```

#### 4. Synchronisation (🟡 Important)
```typescript
describe('Shopify Sync', () => {
  it('syncs products to Shopify')
  it('handles sync errors')
  it('displays sync status')
  it('retries failed syncs')
})
```

#### 5. Commandes (🟡 Important)
```typescript
describe('Order Management', () => {
  it('creates new order')
  it('updates order status')
  it('tracks order')
  it('exports orders')
})
```

---

## 🔗 Tests d'Intégration (Playwright)

### Edge Functions (✅ Obligatoire)

#### 1. Import Functions
```typescript
test('shopify-store-import returns valid data', async ({ request }) => {
  const response = await request.post('/functions/v1/shopify-store-import', {
    data: {
      storeUrl: 'test-store.myshopify.com',
      importVariants: true
    }
  })
  
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data).toHaveProperty('success', true)
  expect(data.imported).toBeGreaterThan(0)
})
```

#### 2. Sync Functions
```typescript
test('shopify-sync handles updates', async ({ request }) => {
  // Tester la synchronisation bidirectionnelle
})
```

#### 3. Webhook Handlers
```typescript
test('webhook-handler processes Shopify webhooks', async ({ request }) => {
  // Tester la réception et traitement des webhooks
})
```

### Database Operations (✅ Obligatoire)

```typescript
test('CRUD operations with RLS', async ({ request }) => {
  // CREATE
  const createResponse = await request.post('/rest/v1/catalog_products', {
    data: { name: 'Test Product', price: 99.99 }
  })
  expect(createResponse.ok()).toBeTruthy()
  
  // READ
  const readResponse = await request.get('/rest/v1/catalog_products')
  expect(readResponse.ok()).toBeTruthy()
  
  // UPDATE
  // DELETE
})
```

---

## 🔒 Tests de Sécurité

### Tests Automatisés

#### 1. Injection SQL
```typescript
test('prevents SQL injection', async () => {
  const injections = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "admin'--",
    "<script>alert('xss')</script>"
  ]
  
  for (const injection of injections) {
    const response = await request.get(`/api/search?q=${injection}`)
    expect(response.status()).not.toBe(500)
  }
})
```

#### 2. Autorisation
```typescript
test('enforces role-based access', async () => {
  // Tenter d'accéder à une route admin en tant qu'user
  const response = await request.get('/api/admin/users', {
    headers: { 'Authorization': 'Bearer user-token' }
  })
  
  expect(response.status()).toBe(403)
})
```

#### 3. Rate Limiting
```typescript
test('blocks excessive requests', async () => {
  const requests = Array(100).fill(null).map(() =>
    request.get('/api/catalog')
  )
  
  const responses = await Promise.all(requests)
  const blocked = responses.filter(r => r.status() === 429)
  
  expect(blocked.length).toBeGreaterThan(0)
})
```

#### 4. Data Leakage
```typescript
test('masks sensitive data for non-admin', async () => {
  const response = await request.get('/api/products', {
    headers: { 'Authorization': 'Bearer user-token' }
  })
  
  const products = await response.json()
  
  products.forEach(product => {
    expect(product.cost_price).toBeNull()
    expect(product.supplier_url).toBeNull()
    expect(product.profit_margin).toBeNull()
  })
})
```

---

## ⚡ Tests de Performance

### Métriques à Surveiller

#### 1. Temps de Chargement
```typescript
test('pages load within 3 seconds', async ({ page }) => {
  const start = Date.now()
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  const loadTime = Date.now() - start
  
  expect(loadTime).toBeLessThan(3000)
})
```

**Seuils**:
- Homepage: < 2s
- Dashboard: < 3s
- Product list: < 2s
- Import form: < 1.5s

#### 2. Bundle Size
```typescript
test('main bundle under 500KB', async () => {
  const stats = await getBuildStats()
  expect(stats.mainBundle.size).toBeLessThan(512 * 1024)
})
```

**Limites**:
- Main bundle: < 500KB
- Vendor bundle: < 800KB
- Total initial: < 1.5MB

#### 3. Rendu de Listes
```typescript
test('renders 1000+ products efficiently', async ({ page }) => {
  await page.goto('/products')
  
  const start = Date.now()
  await page.waitForSelector('[data-testid="product-item"]')
  const renderTime = Date.now() - start
  
  expect(renderTime).toBeLessThan(2000)
  
  // Virtual scrolling: ne render que le visible
  const visibleItems = await page.locator('[data-testid="product-item"]').count()
  expect(visibleItems).toBeLessThan(50)
})
```

---

## 🔄 Tests de Régression

### Scénarios à Tester Après Chaque Release

#### 1. Happy Path Complet
```gherkin
Given un utilisateur authentifié
When il importe un produit depuis URL
And il synchronise avec Shopify
And il crée une commande
Then toutes les opérations réussissent
And les données sont cohérentes
```

#### 2. Edge Cases
- Import avec URL invalide
- Sync avec store déconnecté
- Upload fichier corrompu
- Création produit avec données manquantes

#### 3. Performance
- Import de 1000 produits
- Sync de 500 produits
- Recherche dans 10000+ produits
- Export CSV de 5000+ lignes

---

## 🎓 Bonnes Pratiques

### DO ✅
- Tester un comportement, pas l'implémentation
- Mocker les dépendances externes
- Utiliser des data-testid pour les sélecteurs
- Nettoyer l'état entre les tests
- Tester les cas limites

### DON'T ❌
- Tester les détails d'implémentation
- Dépendre de l'ordre des tests
- Utiliser des sleeps/timeouts arbitraires
- Ignorer les tests qui échouent
- Tester plusieurs choses dans un test

---

## 📈 Métriques de Qualité

### KPIs à Suivre

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| Code Coverage | > 70% | - |
| Test Pass Rate | > 95% | - |
| Build Success | > 98% | - |
| Security Scan | 0 critical | 0 |
| Performance Score | > 90 | - |

### Reporting

```bash
# Générer le rapport complet
npm run test:all -- --reporter=html

# Voir la couverture
npm run test:coverage
open coverage/index.html

# Résultats E2E
open cypress/reports/index.html
```

---

## 🚀 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Quality Gate
on: [push, pull_request]

jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - name: Unit Tests
        run: npm run test:unit
        
      - name: E2E Tests
        run: npm run test:e2e
        
      - name: Security Scan
        run: npm audit --audit-level=moderate
        
      - name: Performance Tests
        run: npm run test:performance
```

### Quality Gates

**Bloquer le merge si**:
- ❌ Tests unitaires < 70% couverture
- ❌ Tests E2E échouent
- ❌ Vulnérabilités critiques détectées
- ❌ Performance dégradée > 20%

---

## 📝 Checklist de Test

### Avant Chaque Commit
- [ ] Tests unitaires passent localement
- [ ] Pas de console.log/debugger
- [ ] Pas de code commenté
- [ ] ESLint sans erreurs

### Avant Chaque PR
- [ ] Tous les tests passent (unit + E2E)
- [ ] Couverture >= 70%
- [ ] Tests ajoutés pour nouveau code
- [ ] Documentation mise à jour

### Avant Chaque Release
- [ ] Suite complète de tests passée
- [ ] Tests de régression OK
- [ ] Tests de performance OK
- [ ] Audit de sécurité OK
- [ ] Tests manuels sur staging

---

**Prochaine revue**: Décembre 2025  
**Responsable**: Équipe QA  
**Version**: 1.0
