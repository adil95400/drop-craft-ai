
# Correction : Produit importé introuvable dans /products

## Probleme identifie

Il y a **deux problemes distincts** qui empechent le produit d'apparaitre dans `/products` :

### 1. Tables differentes
- L'edge function `quick-import-url` insere le produit dans la table **`imported_products`**
- La page `/products` lit les donnees depuis la table **`products`** via l'API V1 (`productsApi.list()`)
- Ce sont deux tables separees. Un produit importe n'apparait jamais automatiquement dans le catalogue principal.

### 2. Etat perdu apres navigation
- Quand l'utilisateur confirme l'import depuis la page preview (`/import/preview`), le composant navigue vers `/import/autods` avec `confirmedProduct` dans le `location.state`
- Le `useEffect` dans `AutoDSImportPage` cherche l'item dans `queuedUrls` via `queuedUrls.find(q => q.id === locationState.queuedItemId)`
- Mais `queuedUrls` est un etat React local qui a ete reinitialise a `[]` lors du remontage du composant -- donc `find()` retourne `undefined` et l'import ne se lance jamais

## Solution

### Correction 1 : Import direct depuis la page preview

Au lieu de naviguer vers AutoDSImportPage pour lancer l'import, la page preview appellera directement l'edge function `quick-import-url` avec `action: 'import'`. Cela elimine le probleme de perte d'etat.

Fichier : `src/pages/import/ProductPreviewPage.tsx`
- Ajouter une fonction `handleImportDirect()` qui appelle `supabase.functions.invoke('quick-import-url', { body: { url, action: 'import', override_data, price_multiplier } })`
- Le bouton "Confirmer l'import" appellera cette fonction au lieu de naviguer
- Apres succes, naviguer vers `/products` ou `/import` avec un toast de confirmation

### Correction 2 : Copier aussi dans la table `products`

Apres l'insertion dans `imported_products`, ajouter une insertion miroir dans la table `products` (via l'API V1) pour que le produit apparaisse immediatement dans `/products`.

Fichier : `supabase/functions/quick-import-url/index.ts`
- Apres l'insert dans `imported_products` (ligne 2158-2200), ajouter un insert dans la table `products` avec les memes donnees mappees au schema `products`

### Correction 3 : Navigation post-import

Apres un import reussi depuis la page preview :
- Afficher un toast de succes
- Proposer deux boutons : "Voir dans le catalogue" (navigue vers `/products`) et "Continuer l'import" (retour vers `/import/autods`)

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/pages/import/ProductPreviewPage.tsx` | Import direct via edge function au lieu de naviguer, navigation post-succes |
| `supabase/functions/quick-import-url/index.ts` | Double insertion : `imported_products` + `products` |

## Detail technique

```text
Flux actuel (casse) :
  Preview -> navigate(autods, {confirmedProduct}) -> useEffect -> find queuedItem -> UNDEFINED -> rien

Flux corrige :
  Preview -> appel direct edge function -> insert imported_products + products -> toast succes -> navigate /products
```

L'insertion dans `products` utilisera le meme `supabaseClient` deja disponible dans l'edge function, avec un mapping des champs (`name`, `price`, `cost_price`, `images`, `status`, etc.).
