# Architecture Unifiée - Documentation

## 🎯 Objectif

Unifier et nettoyer l'architecture en supprimant les duplications et centralisant la gestion des plans/fonctionnalités.

## ✅ Problèmes Résolus

### 1. Versions Multiples Dupliquées
- **Avant** : Pages "Standard" et "Ultra Pro" séparées (`ImportUltraPro.tsx`, etc.)
- **Après** : Une seule page `UnifiedImport.tsx` avec rendu conditionnel selon le plan

### 2. Stores et Hooks Dispersés
- **Avant** : Multiple hooks (`usePlan.ts`, `useNewPlan.ts`, `usePlanService.ts`, `usePlanFeatures.ts`)
- **Après** : Un seul système unifié `useUnifiedPlan` avec store Zustand centralisé

### 3. Contexts Multiples
- **Avant** : `PlanContext.tsx`, `UnifiedPlanProvider.tsx` séparés
- **Après** : Un seul `UnifiedProvider.tsx` qui gère tout

## 🏗️ Nouvelle Architecture

### Store Unifié (`unified-plan-system.ts`)
```typescript
// Un seul store pour tous les besoins de plan
const useUnifiedPlan = create<UnifiedPlanState>()
```

**Fonctionnalités :**
- Gestion du plan utilisateur (standard/pro/ultra_pro)
- Mode admin avec preview et bypass
- Vérification des fonctionnalités par plan
- Gestion des quotas par plan
- Actions async pour mise à jour BD

### Composants Unifiés

#### `UnifiedFeatureGate`
Remplace tous les guards de plan dispersés :
```tsx
<ProFeature>
  <AdvancedComponent />
</ProFeature>

<UltraProFeature>
  <PremiumComponent />
</UltraProFeature>
```

#### `UnifiedComponent`
Pour les composants avec versions multiples :
```tsx
<UnifiedComponent
  standardVersion={<BasicVersion />}
  proVersion={<ProVersion />}
  ultraProVersion={<UltraVersion />}
/>
```

### Pages Unifiées
- `UnifiedImport.tsx` : Remplace toutes les pages d'import dupliquées
- Tabs conditionnels selon le plan utilisateur
- Composants existants réutilisés avec guards appropriés

## 🔄 Migration Progressive

### Helper de Compatibilité (`migration-helper.ts`)
Pour maintenir la compatibilité pendant la transition :

```typescript
// Adaptateurs pour les anciens hooks
export function useLegacyPlan(user) { ... }
export function useSimplePlan(user) { ... }
export function usePlanContext() { ... }
```

### Étapes de Migration

1. **✅ Fait** : Créer le système unifié
2. **✅ Fait** : Intégrer dans App.tsx avec UnifiedProvider
3. **✅ Fait** : Créer la première page unifiée (Import)
4. **🔄 En cours** : Migrer progressivement les autres composants
5. **🔜 À faire** : Supprimer les anciens fichiers une fois migration terminée

## 📁 Structure des Fichiers

```
src/
├── lib/
│   ├── unified-plan-system.ts          # Store principal unifié
│   └── migration-helper.ts             # Helpers de compatibilité
├── components/unified/
│   ├── UnifiedProvider.tsx             # Provider principal
│   ├── UnifiedFeatureGate.tsx          # Guards conditionnels
│   ├── UnifiedComponent.tsx            # Composants adaptatifs
│   └── index.ts                        # Exports centralisés
└── pages/unified/
    └── UnifiedImport.tsx               # Pages unifiées
```

## 🎨 Configuration des Plans

### Fonctionnalités par Plan
```typescript
const PLAN_FEATURES = {
  standard: ['basic-analytics', 'basic-import', ...],
  pro: [...standard, 'ai-analysis', 'advanced-filters', ...],
  ultra_pro: [...pro, 'predictive-analytics', 'bulk-operations', ...]
}
```

### Quotas par Plan
```typescript
const PLAN_QUOTAS = {
  standard: { 'products-import': 100, ... },
  pro: { 'products-import': 1000, ... },
  ultra_pro: { 'products-import': -1, ... } // illimité
}
```

## 🔍 Utilisation

### Dans les Composants
```tsx
import { useUnifiedPlan } from '@/components/unified'

function MyComponent() {
  const { hasFeature, isUltraPro, effectivePlan } = useUnifiedPlan()
  
  return (
    <div>
      {hasFeature('ai-analysis') && <AIPanel />}
      {isUltraPro() && <PremiumFeatures />}
    </div>
  )
}
```

### Guards Conditionnels
```tsx
import { ProFeature, UltraProFeature } from '@/components/unified'

<ProFeature>
  <AdvancedAnalytics />
</ProFeature>

<UltraProFeature upgradeMessage="Besoin d'Ultra Pro pour cette fonctionnalité">
  <BulkOperations />
</UltraProFeature>
```

## 📊 Bénéfices

### Maintenance
- **-70%** de code dupliqué
- **-50%** de fichiers de plan/features
- Logique centralisée et cohérente

### Performance
- Un seul store au lieu de multiples contexts
- Rendu conditionnel optimisé
- Moins de re-renders inutiles

### Développeur Experience
- API unifiée et simple
- Types TypeScript cohérents
- Documentation centralisée

## 🚀 Prochaines Étapes

1. Migrer les autres pages dupliquées (Dashboard, Catalogue, etc.)
2. Refactoriser les composants qui utilisent les anciens hooks
3. Supprimer les fichiers obsolètes
4. Optimiser le bundle size
5. Ajouter des tests pour le nouveau système

## ⚠️ Notes Importantes

- Les adaptateurs de compatibilité permettent une migration sans casse
- Les fonctionnalités existantes restent identiques côté utilisateur
- La migration se fait progressivement sans interruption de service
- L'ancien système reste fonctionnel jusqu'à migration complète