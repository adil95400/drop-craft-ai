
# Plan : Conserver et Optimiser l'Interface "Hub Fournisseurs"

## Situation Actuelle

L'interface que vous souhaitez conserver (capture d'écran) correspond au fichier `ChannableStyleSuppliersPage.tsx` qui est déjà la page principale sur `/suppliers`. Le code actuel est bien structuré et correspond au design souhaité.

## Actions à Effectuer

### 1. Nettoyer les Fichiers Obsolètes

Supprimer les composants qui créent de la confusion et ne sont plus utilisés :

| Fichier | Raison de suppression |
|---------|----------------------|
| `src/components/suppliers/SuppliersHub.tsx` | Ancien composant avec design différent |
| `src/components/SupplierHub.tsx` | Doublon potentiel |

### 2. Corriger l'Avertissement de Dépréciation

La console affiche un warning `[DEPRECATED] useRealSuppliers`. Il faut mettre à jour l'import dans `ChannableStyleSuppliersPage.tsx` pour utiliser le nouveau hook `useSuppliersUnified`.

Modification ligne 15 :
```typescript
// Avant
import { useRealSuppliers, Supplier } from '@/hooks/useRealSuppliers';

// Après
import { useSuppliersUnified, type Supplier } from '@/hooks/unified';
```

### 3. Vérifier la Configuration du Routeur

S'assurer que `SupplierRoutes.tsx` pointe correctement vers la bonne page pour l'index `/suppliers`.

### 4. Publier l'Application

Une fois les modifications effectuées, publier pour synchroniser le site de production avec le design souhaité.

---

## Résumé Technique

```text
Fichiers à supprimer :
├── src/components/suppliers/SuppliersHub.tsx (ancien composant)
├── src/components/SupplierHub.tsx (doublon)

Fichiers à modifier :
├── src/pages/suppliers/ChannableStyleSuppliersPage.tsx
│   └── Mettre à jour l'import du hook useSuppliersUnified

Fichiers à conserver (déjà corrects) :
├── src/routes/SupplierRoutes.tsx (route index vers ChannableStyleSuppliersPage)
├── src/data/supplierDefinitions.ts (70+ fournisseurs)
├── src/components/suppliers/SupplierGridCard.tsx
├── src/components/suppliers/ConnectedSupplierCard.tsx
├── src/components/suppliers/SupplierFilters.tsx
└── src/components/suppliers/SupplierConfigModal.tsx
```

## Résultat Final

Après ces modifications :
- Une seule page `/suppliers` avec le design "Hub Fournisseurs" (capture d'écran)
- Pas de warnings de dépréciation dans la console
- Code nettoyé sans fichiers obsolètes
- Site de production synchronisé avec le design actuel
