# Guide de Contribution - Drop Craft AI

Merci de votre intérêt pour contribuer à Drop Craft AI ! Ce guide vous aidera à démarrer et à comprendre notre processus de développement.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- npm 9+
- Git
- Compte Supabase (pour les tests en local)

### Configuration du projet

1. **Fork et clone le repository**
   ```bash
   git clone https://github.com/[votre-username]/drop-craft-ai.git
   cd drop-craft-ai
   ```

2. **Installation des dépendances**
   ```bash
   npm install
   ```

3. **Configuration de l'environnement**
   ```bash
   cp .env.example .env
   # Éditez .env avec vos clés API de développement
   ```

4. **Lancement du projet**
   ```bash
   npm run dev
   ```

## 📋 Process de contribution

### 1. Créer une issue

Avant de commencer à coder, créez une issue pour :
- Signaler un bug
- Proposer une nouvelle fonctionnalité
- Suggérer une amélioration

### 2. Créer une branche

```bash
# Pour une nouvelle fonctionnalité
git checkout -b feature/nom-de-la-fonctionnalite

# Pour un bug fix
git checkout -b fix/description-du-bug

# Pour de la documentation
git checkout -b docs/sujet-documentation
```

### 3. Conventions de nommage

#### Branches
- `feature/` - Nouvelles fonctionnalités
- `fix/` - Corrections de bugs
- `refactor/` - Refactoring du code
- `docs/` - Documentation
- `test/` - Tests
- `chore/` - Tâches de maintenance

#### Commits
Nous utilisons la convention [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
# Format
type(scope): description

# Exemples
feat(catalog): add product import from AliExpress
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
refactor(components): optimize product card performance
test(integration): add Shopify API tests
chore(deps): update dependencies
```

Types de commits :
- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug
- `docs` - Documentation
- `style` - Formatting, style
- `refactor` - Refactoring
- `test` - Tests
- `chore` - Maintenance

### 4. Standards de code

#### Code Quality
- **ESLint** : Le code doit passer sans erreurs
- **Prettier** : Formatage automatique configuré
- **TypeScript** : Mode strict activé, pas d'`any`
- **Tests** : Ajouter des tests pour les nouvelles fonctionnalités

#### Vérifications pré-commit
```bash
# Ces commandes sont exécutées automatiquement
npm run lint
npm run typecheck
npm run format:check
```

### 5. Création d'une Pull Request

#### Checklist avant PR
- [ ] Le code compile sans erreurs
- [ ] Les tests passent
- [ ] La documentation est mise à jour si nécessaire
- [ ] Les types TypeScript sont corrects
- [ ] Le code suit les conventions du projet
- [ ] Les commits suivent la convention

#### Template de PR
```markdown
## Description
[Description claire des changements]

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests d'intégration vérifiés
- [ ] Tests manuels effectués

## Screenshots (si applicable)
[Captures d'écran des changements UI]

## Checklist
- [ ] Code review interne effectué
- [ ] Documentation mise à jour
- [ ] Changements testés en local
```

## 🏗️ Architecture du projet

### Structure des dossiers
```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants shadcn/ui
│   ├── catalog/        # Gestion produits
│   ├── import/         # Modules d'import
│   └── integrations/   # Connecteurs API
├── hooks/              # Hooks personnalisés
├── pages/              # Pages de l'application
├── layouts/            # Layouts
├── contexts/           # Contextes React
├── utils/              # Utilitaires
└── lib/                # Configuration librairies
```

### Conventions de développement

#### Composants React
```typescript
// ✅ Bon exemple
interface ProductCardProps {
  product: Product;
  onSelect?: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onSelect 
}) => {
  // Logique du composant
  return (
    <div className="product-card">
      {/* JSX */}
    </div>
  );
};
```

#### Hooks personnalisés
```typescript
// ✅ Bon exemple
interface UseProductsOptions {
  category?: string;
  limit?: number;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  // Logique du hook
  return {
    products,
    isLoading,
    error,
    refetch
  };
};
```

#### Types TypeScript
```typescript
// ✅ Placer les types dans des fichiers dédiés
export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  // Éviter any, utiliser des types spécifiques
}
```

## 🧪 Tests

### Tests unitaires
```bash
# Lancer les tests
npm run test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

### Tests d'intégration
```bash
# Tests E2E avec Cypress
npm run test:e2e
```

## 📝 Documentation

### Code documentation
- Documenter les fonctions complexes
- Ajouter des JSDoc pour les APIs publiques
- Maintenir le README à jour

### Exemples JSDoc
```typescript
/**
 * Import products from external API
 * @param source - The import source (aliexpress, shopify, etc.)
 * @param options - Import configuration options
 * @returns Promise resolving to import results
 * @throws {ImportError} When import fails
 */
export async function importProducts(
  source: ImportSource,
  options: ImportOptions
): Promise<ImportResult> {
  // Implementation
}
```

## 🐛 Debugging

### React Query DevTools
```bash
# Activer en développement
VITE_ENABLE_RQ_DEVTOOLS=true

# Raccourci clavier : Alt + D
```

### Supabase Edge Functions
```bash
# Logs des functions
supabase functions logs import-products

# Debug local
supabase functions serve --no-verify-jwt
```

## 🚀 Déploiement

### Environnements
- **Development** : Branche `develop`
- **Staging** : Branche `staging` 
- **Production** : Branche `main`

### Variables d'environnement
Voir `.env.example` pour la liste complète des variables requises.

## 🤝 Code Review

### Ce que nous recherchons
- Code lisible et maintenable
- Performance optimisée
- Sécurité respectée
- Tests appropriés
- Documentation à jour

### Process de review
1. Vérification automatique (CI/CD)
2. Review par un mainteneur
3. Tests manuels si nécessaire
4. Merge après approbation

## 📞 Support

### Où demander de l'aide
- **Issues GitHub** : Questions techniques
- **Discussions** : Idées et suggestions
- **Discord** : Chat en temps réel (lien dans README)

### Maintainers
- [@adil95400](https://github.com/adil95400) - Lead Developer

## 🎉 Reconnaissance

Tous les contributeurs sont reconnus dans notre fichier AUTHORS et dans les release notes.

Merci de contribuer à Drop Craft AI ! 🚀