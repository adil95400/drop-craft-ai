

## Ajouter une redirection `/products/vues` vers `/products/views`

Actuellement, la route pour les vues produits est configuree en anglais (`/products/views`), mais vous avez naturellement essaye `/products/vues`. Le fix consiste a ajouter une redirection dans le fichier de routes pour que les deux chemins fonctionnent.

### Modification

**Fichier : `src/routes/ProductRoutes.tsx`**

Ajouter une ligne de redirection juste apres la route `views` existante (ligne 88) :

```
<Route path="vues" element={<Navigate to="/products/views" replace />} />
```

Cela garantit que `/products/vues` redirige automatiquement vers `/products/views` sans casser la navigation existante.

### Details techniques

- Un seul fichier modifie : `src/routes/ProductRoutes.tsx`
- Utilise le composant `Navigate` deja importe dans le fichier
- Redirection avec `replace` pour ne pas polluer l'historique de navigation
- Zero impact sur les autres routes

