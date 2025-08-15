# 🛒 Module Commerce

Module centralisé pour toutes les fonctionnalités e-commerce de Drop Craft AI.

## 🏗️ Architecture

```
src/domains/commerce/
├── types.ts              # Types TypeScript centralisés
├── services/             # Services métier
│   ├── catalogService.ts # Gestion catalogue et marketplace
│   └── importService.ts  # Gestion des imports
├── hooks/               # Hooks React Query optimisés
│   ├── useCatalog.ts    # Hook catalogue
│   └── useImport.ts     # Hook import
└── README.md           # Documentation
```

## 🚀 Fonctionnalités

### 📦 Catalogue
- **Produits catalogue** : Navigation et recherche
- **Marketplace** : Accès aux produits fournisseurs
- **Import rapide** : Ajout direct au catalogue utilisateur
- **Filtres avancés** : Catégorie, prix, fournisseur

### 📥 Import
- **Import URL** : Analyse automatique de pages produits
- **Import fournisseur** : BigBuy, AliExpress, etc.
- **IA optimisation** : Amélioration automatique des données
- **Workflow approbation** : Review avant publication

## 🔧 Utilisation

### Hook Catalogue
```tsx
import { useCatalog } from '@/domains/commerce/hooks/useCatalog'

const CatalogPage = () => {
  const { products, isLoading, importProduct } = useCatalog({
    category: 'electronics',
    search: 'smartphone'
  })

  return (
    <div>
      {products.map(product => (
        <ProductCard 
          key={product.id}
          product={product}
          onImport={() => importProduct(product.id)}
        />
      ))}
    </div>
  )
}
```

### Hook Import
```tsx
import { useImport } from '@/domains/commerce/hooks/useImport'

const ImportPage = () => {
  const { 
    jobs, 
    products, 
    importFromUrl, 
    approveProduct,
    publishProduct 
  } = useImport()

  const handleUrlImport = (url: string) => {
    importFromUrl({ 
      url,
      config: { ai_optimization: true }
    })
  }

  return (
    <div>
      <ImportForm onSubmit={handleUrlImport} />
      <ImportJobsList jobs={jobs} />
      <ImportedProductsList 
        products={products}
        onApprove={approveProduct}
        onPublish={publishProduct}
      />
    </div>
  )
}
```

## ⚡ Optimisations

### Cache Intelligent
- **TTL adaptatif** : 5-10min selon la fréquence de mise à jour
- **Invalidation sélective** : Mise à jour uniquement des données modifiées
- **Préchargement** : Données critiques chargées en arrière-plan

### Performance
- **Pagination** : Limitation à 50 produits par requête
- **Lazy loading** : Chargement marketplace sur demande
- **Debounced search** : Optimisation des recherches
- **Query deduplication** : Éviter les requêtes duplicatas

## 🔒 Sécurité

### RLS Policies
- **Accès utilisateur** : Données limitées à l'utilisateur connecté
- **Permissions admin** : Accès étendu pour les administrateurs
- **Audit trail** : Traçabilité des actions sensibles

### Validation
- **Types stricts** : Validation TypeScript complète
- **Sanitization** : Nettoyage des données entrantes
- **Error handling** : Gestion robuste des erreurs

## 📊 Métriques

### Performance Visées
- **Time to First Byte** : <200ms
- **Cache Hit Rate** : >85%
- **API Response Time** : <500ms
- **Memory Usage** : -40% vs ancienne version

### Monitoring
- **Error tracking** : Sentry intégration
- **Performance metrics** : Core Web Vitals
- **Business metrics** : Taux d'import, conversion

---

## 🔄 Migration depuis l'ancienne architecture

### Remplacement des hooks
```tsx
// ❌ Ancien
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useImport } from '@/hooks/useImport'

// ✅ Nouveau
import { useCatalog } from '@/domains/commerce/hooks/useCatalog'
import { useImport } from '@/domains/commerce/hooks/useImport'
```

### Unification des versions
Les versions standard/ultra-pro sont maintenant unifiées avec des feature flags automatiques basés sur le plan utilisateur.

### Simplification des états
Plus besoin de gérer manuellement les états de cache - tout est automatisé par React Query.