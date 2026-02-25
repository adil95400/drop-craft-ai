# Guide de nettoyage - Consolidation S3

## ✅ Nettoyages effectués (S3)

### Redirections Legacy (FAIT)
- `src/routes/legacy-redirects.ts` → **Supprimé** (fusionné dans `LegacyRedirectsHandler.tsx`)
- Source unique de vérité : `src/routes/LegacyRedirectsHandler.tsx`

### Routes Registry (FAIT)
- `src/config/routesRegistry.ts` → **Réécrit** (synchronisé avec les routes réelles)
- Supprimé `component` field inutile, nettoyé flags `implemented`

### ModuleRoutes (FAIT)
- `src/components/routing/ModuleRoutes.tsx` → **Supprimé** (doublon de `src/routes/index.tsx`)

### CoreRoutes (FAIT)
- `src/routes/CoreRoutes.tsx` → **Allégé** (retiré 13 imports dupliqués avec `index.tsx`)
- Pages standalone (billing, subscription, security, etc.) gérées directement dans `index.tsx`

## ✅ Nettoyages précédents

### Navigation Mobile
- Navigation principale : `src/components/mobile/MobileNav.tsx`
- Drawer : `src/components/mobile/MobileDrawerNav.tsx`

## Architecture actuelle des routes

```
src/routes/index.tsx          → Point d'entrée principal
src/routes/LegacyRedirectsHandler.tsx → Redirections centralisées
src/routes/*Routes.tsx        → Modules de routes (lazy loaded)
src/config/routesRegistry.ts  → Registre de référence
```

## Utilitaires disponibles

### Labels en français
```typescript
import { getStatusLabel, getStatusColorClass } from '@/utils/statusLabels'
import { StatusBadge } from '@/components/ui/status-badge'
<StatusBadge status="delivered" category="order" />
```

### Composants de chargement
```typescript
import { LoadingSpinner, LoadingOverlay, LoadingSkeleton, CardSkeleton, CardSkeletonGrid } from '@/components/ui/loading-spinner'
<LoadingOverlay isLoading={isLoading} text="Chargement...">
  {children}
</LoadingOverlay>
```

## Prochaines étapes recommandées

1. **Sécurité RLS** : Audit des politiques d'accès aux données
2. **Tests** : Couverture des routes principales
3. **Performance** : Audit bundle size, lazy loading verification
