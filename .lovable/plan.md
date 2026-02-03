
# Plan de Résolution - Ancienne Navigation Persistante

## Problème
L'utilisateur voit l'ancienne structure de navigation (9+ groupes) au lieu de la nouvelle architecture consolidée en 6 pôles.

## Analyse Technique
| Composant | État | Action Requise |
|-----------|------|----------------|
| `ChannableSidebar.tsx` | ✅ Migré | Utilise NAV_GROUPS (6 pôles) |
| `MobileNav.tsx` | ❌ Non migré | Contient 12 groupes hardcodés |
| `Service Worker` | ⚠️ Cache actif | Peut servir ancienne version |

## Actions à Implémenter

### 1. Aligner la Navigation Mobile (MobileNav.tsx)
Remplacer le tableau `mobileNavGroups` hardcodé par l'import dynamique de `NAV_GROUPS` depuis `src/config/modules.ts` :
- Supprimer les lignes 88-205 (anciens groupes)
- Importer et utiliser `NAV_GROUPS` et `MODULE_REGISTRY`
- Adapter le rendu pour mapper les modules par `groupId`

### 2. Forcer le Rafraîchissement du Cache
Ajouter un mécanisme de cache-busting au Service Worker :
- Incrémenter la version du cache dans `sw.js`
- Ajouter un composant `UpdateNotification` pour informer l'utilisateur

### 3. Nettoyage Documentation
Mettre à jour les fichiers markdown avec la nouvelle nomenclature :
- `docs/NAVIGATION_GUIDE.md`
- `SIDEBAR_OPTIMIZATION.md`

## Fichiers à Modifier
1. `src/components/mobile/MobileNav.tsx` - Refonte complète pour utiliser NAV_GROUPS
2. `public/sw.js` - Vérifier la version du cache
3. `src/data/documentation/types.ts` - Aligner les catégories

## Résultat Attendu
Navigation cohérente sur desktop ET mobile avec les 6 pôles :
- Accueil
- Catalogue  
- Sourcing
- Ventes
- Performance
- Configuration
