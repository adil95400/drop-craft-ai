# Script de Nettoyage des Duplications

## Fichiers à Supprimer Après Migration Complète

### Hooks de Plan Redondants
```bash
# Hooks dispersés - à supprimer une fois migration terminée
src/hooks/usePlanService.ts
src/hooks/usePlanFeatures.ts  
src/hooks/useNewPlan.ts
src/hooks/useUnifiedModules.ts
```

### Contexts Redondants
```bash
# Contexts multiples - remplacés par UnifiedProvider
src/contexts/PlanContext.tsx
src/components/plan/UnifiedPlanProvider.tsx (ancien)
src/stores/planStore.ts (si existe)
```

### Composants Dupliqués à Unifier

#### Pages d'Import
```bash
# Versions spécialisées - remplacées par UnifiedImport
src/pages/ImportUltraPro.tsx
src/pages/ImportStandard.tsx (si existe)
src/pages/ImportPro.tsx (si existe)
```

#### Guards/Gates Multiples
```bash
# Guards dispersés - remplacés par UnifiedFeatureGate
src/components/common/FeatureGate.tsx (ancien)
src/components/plan/PlanGuard.tsx
src/components/plan/NewPlanGuard.tsx
src/components/plan/EnhancedPlanGuard.tsx
src/components/common/ModuleGuard.tsx (parties redondantes)
```

#### Composants de Plan
```bash
# Composants spécialisés - à consolider
src/components/plan/PlanGatedButton.tsx
src/components/plan/RequirePlan.tsx (si redondant)
```

### Composants Ultra Pro Spécialisés
```bash
# Composants avec versions dupliquées
src/components/ai/AIUltraProInterface.tsx → Unifier avec version standard
src/components/catalog/CatalogUltraProInterface.tsx → Unifier avec version standard
src/components/import/ImportUltraProInterface.tsx → Déjà unifié
src/components/import/BulkImportUltraPro.tsx → Garder avec guard UltraProFeature
src/components/import/AIImportUltraPro.tsx → Garder avec guard ProFeature
```

## Commandes de Nettoyage (À EXECUTER APRÈS MIGRATION)

### Étape 1 : Vérifier les références
```bash
# Chercher toutes les références aux anciens fichiers
grep -r "usePlanService\|usePlanFeatures\|useNewPlan" src/
grep -r "PlanContext\|UnifiedPlanProvider" src/
grep -r "ImportUltraPro" src/
```

### Étape 2 : Remplacer les imports
```bash
# Script sed pour remplacer les imports (exemple)
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/hooks/usePlan|@/components/unified|g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/contexts/PlanContext|@/lib/migration-helper|g'
```

### Étape 3 : Supprimer les fichiers obsolètes
```bash
# ⚠️ NE PAS EXECUTER MAINTENANT - Attendre fin de migration
rm src/hooks/usePlanService.ts
rm src/hooks/usePlanFeatures.ts
rm src/hooks/useNewPlan.ts
rm src/contexts/PlanContext.tsx
rm src/pages/ImportUltraPro.tsx
# etc...
```

## Checklist de Validation

Avant de supprimer un fichier, vérifier :

- [ ] Aucune référence dans le code (`grep -r "filename" src/`)
- [ ] Fonctionnalité recréée dans le système unifié
- [ ] Tests mis à jour
- [ ] Build sans erreurs
- [ ] Tests e2e passants

## Processus de Migration par Composant

### Pour chaque composant dupliqué :

1. **Identifier** les différences entre les versions
2. **Créer** une version unifiée avec conditional rendering
3. **Tester** que toutes les fonctionnalités marchent
4. **Remplacer** les imports dans tous les fichiers
5. **Supprimer** l'ancien fichier
6. **Valider** avec tests

### Exemple - Migration d'un composant :
```typescript
// Avant (2 fichiers)
// DashboardStandard.tsx
// DashboardUltraPro.tsx

// Après (1 fichier unifié)
// UnifiedDashboard.tsx
function UnifiedDashboard() {
  const { renderByPlan } = usePlanConditionalRender()
  
  return renderByPlan({
    standard: <StandardDashboard />,
    pro: <ProDashboard />,
    ultra_pro: <UltraProDashboard />
  })
}
```

## Métriques de Succès

### Objectifs quantifiés :
- **-70%** de fichiers de plan/features
- **-50%** de lignes de code dupliquées  
- **-30%** de bundle size pour les modules plan
- **+100%** de couverture de tests sur le système unifié

### Avant/Après :
```
Avant:
- 12 hooks/contexts de plan
- 8 pages dupliquées
- 15 guards/gates spécialisés
- ~2000 LOC redondantes

Après:
- 1 système unifié
- Pages conditionnelles  
- 3 composants de guard
- ~600 LOC total
```