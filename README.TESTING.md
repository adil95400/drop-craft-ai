# 🧪 Guide de Tests Automatisés - DropCraft AI

## Vue d'ensemble

Cette application dispose d'une suite complète de tests automatisés couvrant:
- ✅ Tests unitaires (Vitest)
- ✅ Tests E2E (Cypress)
- ✅ Tests d'intégration (Playwright)
- ✅ Tests de performance

## 📋 Prérequis

```bash
npm install
```

## 🚀 Commandes de Test

### Tests Unitaires

```bash
# Exécuter tous les tests unitaires
npm run test:unit

# Mode watch (développement)
npm run test:watch

# Avec couverture de code
npm run test:coverage
```

### Tests E2E (Cypress)

```bash
# Mode headless
npm run test:e2e

# Interface interactive
npm run test:e2e:open
```

### Tests d'Intégration (Playwright)

```bash
# Tous les tests d'intégration
npm run test:integration

# Tests de performance
npm run test:performance
```

### Exécuter Tous les Tests

```bash
npm run test:all
```

## 📁 Structure des Tests

```
├── src/
│   ├── components/__tests__/     # Tests unitaires composants
│   ├── hooks/__tests__/          # Tests unitaires hooks
│   └── pages/__tests__/          # Tests unitaires pages
├── cypress/
│   ├── e2e/                      # Tests E2E Cypress
│   ├── fixtures/                 # Données de test
│   └── support/                  # Commandes personnalisées
├── tests/
│   ├── integration/              # Tests d'intégration Playwright
│   └── performance/              # Tests de performance
└── vitest.config.ts              # Configuration Vitest
```

## 🎯 Couverture des Tests

### Tests Unitaires
- ✅ Composants UI critiques
- ✅ Hooks personnalisés
- ✅ Fonctions utilitaires
- ✅ Services métier

**Objectif**: 70% de couverture minimum

### Tests E2E
- ✅ Flux d'authentification
- ✅ Import de produits (URL, CSV, Shopify)
- ✅ Gestion des produits (CRUD)
- ✅ Synchronisation Shopify
- ✅ Navigation et routage

### Tests d'Intégration
- ✅ Edge Functions Supabase
- ✅ Opérations base de données
- ✅ API externes (Shopify, etc.)
- ✅ Rate limiting

### Tests de Performance
- ✅ Temps de chargement pages
- ✅ Rendu de listes volumineuses
- ✅ Lazy loading images
- ✅ Taille des bundles

## 🔧 Configuration CI/CD

Les tests s'exécutent automatiquement via GitHub Actions:

- **À chaque push** sur `main` ou `develop`
- **À chaque Pull Request** vers `main`

Workflows:
- `.github/workflows/test.yml` - Suite complète de tests
- `.github/workflows/ci.yml` - Qualité et build
- `.github/workflows/cypress.yml` - Tests E2E spécifiques

## 📊 Rapports de Tests

### Vitest (Tests Unitaires)
```bash
npm run test:coverage
```
Rapports générés dans: `coverage/`

### Cypress (Tests E2E)
- Screenshots en cas d'échec: `cypress/screenshots/`
- Vidéos: `cypress/videos/`

### Playwright (Intégration)
- Rapport HTML: `playwright-report/`
- Résultats JSON: `test-results/`

## 🐛 Débogage

### Tests Unitaires
```bash
# Mode debug avec breakpoints
npm run test:watch

# Dans votre test:
import { vi } from 'vitest'
vi.debug() // Pause l'exécution
```

### Tests E2E Cypress
```bash
# Interface interactive pour déboguer
npm run test:e2e:open

# Dans votre test:
cy.debug() // Pause l'exécution
cy.pause() // Pause avec controls
```

### Tests Playwright
```bash
# Mode debug
npx playwright test --debug

# UI Mode
npx playwright test --ui
```

## ✅ Bonnes Pratiques

### 1. Tests Unitaires
- **Isolation**: Chaque test doit être indépendant
- **Mocking**: Mocker les dépendances externes
- **Nommage**: Descriptif et clair (`it('should...')`)

### 2. Tests E2E
- **Data attributes**: Utiliser `data-testid` pour les sélecteurs
- **Intercepteurs**: Mocker les appels API
- **Attente**: Utiliser `cy.wait()` pour les opérations async

### 3. Tests d'Intégration
- **Nettoyage**: Reset de l'état entre tests
- **Données réelles**: Tester avec vraies APIs quand possible
- **Timeout**: Augmenter pour opérations longues

## 🔍 Exemples

### Test Unitaire (Vitest)
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Test E2E (Cypress)
```typescript
describe('Import Flow', () => {
  it('imports product from URL', () => {
    cy.visit('/import/quick')
    cy.get('input[placeholder*="URL"]').type('https://...')
    cy.get('button').contains('Importer').click()
    cy.contains('Import réussi').should('be.visible')
  })
})
```

### Test d'Intégration (Playwright)
```typescript
test('edge function returns data', async ({ request }) => {
  const response = await request.post('/functions/v1/my-function')
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data).toHaveProperty('success', true)
})
```

## 🎓 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

## 🆘 Support

En cas de problème avec les tests:
1. Vérifier les logs CI/CD sur GitHub Actions
2. Consulter les artefacts (screenshots, vidéos)
3. Exécuter les tests localement pour déboguer
