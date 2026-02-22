

## Ajouter "Vues Produits" dans le menu principal (sidebar)

### Ce qui sera fait

Un nouveau lien "Vues Produits" sera ajoute dans le groupe **Catalogue** de la sidebar principale, juste apres "Sante du Catalogue". Il apparaitra sur toutes les pages de l'application (desktop et mobile).

### Modifications

**1. `src/config/modules.ts`** - Ajouter un nouveau module `productViews`

- Ajouter une entree dans `MODULE_REGISTRY` avec :
  - `id: 'productViews'`
  - `name: 'Vues Produits'`
  - `icon: 'BookmarkCheck'`
  - `route: '/products/views'`
  - `groupId: 'catalog'`
  - `order: 8` (apres Sante du Catalogue qui est en order 7)

**2. `src/config/navigation-constants.ts`** - Ajouter l'icone `BookmarkCheck`

- Importer `BookmarkCheck` depuis `lucide-react`
- Ajouter l'entree `'BookmarkCheck': BookmarkCheck` dans `ICON_MAP`

### Resultat

Le lien sera visible dans la sidebar sous le groupe "Catalogue", accessible depuis n'importe quelle page du dashboard. Il menera directement a la page des filtres predefinies et vues enregistrees.
