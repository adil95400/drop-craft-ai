# Guide de nettoyage - Composants et Pages obsolètes

Ce document identifie les éléments potentiellement redondants à consolider.

## ✅ Nettoyages effectués

### Navigation Mobile (FAIT)
- ~~`src/components/layout/MobileNav.tsx`~~ → Supprimé (doublon de mobile/)
- ~~`src/components/layout/MobileBottomNav.tsx`~~ → Recréé en version minimale
- Navigation principale: `src/components/mobile/MobileNav.tsx`

## Composants Analytics (Doublons identifiés)

### À conserver (principaux)
- `src/pages/AdvancedAnalyticsPage.tsx` - Page principale analytics
- `src/pages/UnifiedAnalyticsDashboard.tsx` - Dashboard unifié
- `src/components/analytics/AdvancedAnalyticsDashboard.tsx` - Composant dashboard

### À évaluer pour fusion/suppression
- `src/components/dashboard/AdvancedAnalytics.tsx` - Possiblement doublon
- `src/components/analytics/AdvancedAnalytics.tsx` - Autre implémentation

## Pages avec fonctionnalités similaires

### Import
- `/import` - Hub principal (CONSERVER)
- `/import/advanced` - Import avancé
- `/import/simplified` - Import simplifié  
- `/import/shopify` - Import Shopify

**Recommandation**: Consolider dans `/import` avec tabs

### Marketing
- `/marketing` - Hub marketing (CONSERVER)
- `/marketing/ads` - Gestionnaire publicités
- Plusieurs pages Email/Ads séparées

**Recommandation**: Unifier sous `/marketing/*`

### CRM
- `/dashboard/customers` - Page clients principale
- `/crm/*` - Anciennes pages CRM

**Recommandation**: Rediriger `/crm` vers `/dashboard/customers`

## Utilitaires créés pour uniformisation

### Labels en français
```typescript
import { getStatusLabel, getStatusColorClass } from '@/utils/statusLabels'
import { StatusBadge } from '@/components/ui/status-badge'

// Usage simple
<StatusBadge status="delivered" category="order" />
```

### Composants de chargement
```typescript
import { LoadingSpinner, LoadingOverlay, LoadingSkeleton, CardSkeleton, CardSkeletonGrid } from '@/components/ui/loading-spinner'

// Overlay sur opérations longues
<LoadingOverlay isLoading={isLoading} text="Chargement des données...">
  {children}
</LoadingOverlay>

// Skeleton pour listes
<LoadingSkeleton rows={5} />

// Skeleton pour grilles de cards
<CardSkeletonGrid count={4} />
```

## Navigation mobile
- `src/components/mobile/MobileNav.tsx` - Navigation complète avec bottom bar et drawer
- `src/components/mobile/MobileDrawerNav.tsx` - Drawer de navigation complet
- `src/components/layout/MobileBottomNav.tsx` - Barre de navigation inférieure

## Prochaines étapes recommandées

1. **Phase 1**: Utiliser `StatusBadge` partout au lieu de badges personnalisés
2. **Phase 2**: Ajouter `LoadingOverlay` sur les formulaires et opérations longues
3. **Phase 3**: Consolider les pages Analytics en une seule avec tabs
4. **Phase 4**: Nettoyer les imports/exports inutilisés

## Fichiers à ne PAS supprimer
- Tout dans `supabase/functions/` sauf ceux documentés dans `_DEPRECATED_FUNCTIONS.md`
- Composants UI de base dans `src/components/ui/`
- Hooks partagés dans `src/hooks/` et `src/shared/hooks/`
