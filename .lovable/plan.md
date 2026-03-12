

# Ajouter le lien Fulfillment Hub dans la navigation

## Problème
La page `/automation/fulfillment-hub` existe et est routée, mais n'apparaît pas dans le menu latéral car elle n'est pas déclarée comme sous-module du module `automation` dans `src/config/modules.ts`.

## Plan

**Fichier : `src/config/modules.ts`** (ligne ~471)

Ajouter un nouveau sous-module après `automation-ai-hub` :

```typescript
{ id: 'automation-fulfillment-hub', name: 'Fulfillment Hub', route: '/automation/fulfillment-hub', icon: 'PackageCheck', description: 'Commandes par lots, split orders, bordereaux', features: ['fulfillment', 'split-orders', 'packing-slips'], order: 6 },
```

C'est la seule modification nécessaire — le sidebar (`ChannableSidebar`) lit dynamiquement les `subModules` depuis `modules.ts`.

