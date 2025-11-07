# Synchronisation des Images de Variantes avec Shopify

## Vue d'ensemble

Le système de synchronisation des variantes inclut maintenant la gestion complète des images spécifiques par variante, permettant une synchronisation bidirectionnelle entre votre catalogue et Shopify.

## Fonctionnalités

### 1. Import depuis Shopify
- ✅ Récupération automatique des images de variantes depuis Shopify
- ✅ Stockage des URLs d'images dans le catalogue local
- ✅ Préservation des images lors des mises à jour

### 2. Export vers Shopify
- ✅ Envoi des images de variantes vers Shopify lors de la création
- ✅ Mise à jour des images lors de modifications de variantes existantes
- ✅ Support des URLs d'images externes

### 3. Interface de Gestion
- ✅ Upload d'images par fichier (max 5MB)
- ✅ Ajout d'images via URL externe
- ✅ Prévisualisation des images dans le tableau des variantes
- ✅ Suppression et remplacement d'images

## Utilisation

### Ajouter une image à une variante

1. Accédez à la page de gestion des produits
2. Cliquez sur "Variantes" pour un produit
3. Dans le tableau des variantes, cliquez sur l'icône "Modifier"
4. Dans la section "Image de la variante" :
   - **Option 1** : Cliquez sur "Choisir un fichier" pour uploader une image
   - **Option 2** : Cliquez sur l'icône de lien pour ajouter une URL d'image

### Synchroniser avec Shopify

#### Import (Shopify → Catalogue)
```bash
# Les images sont automatiquement importées avec les variantes
# Lors d'une synchronisation depuis Shopify
```

#### Export (Catalogue → Shopify)
```bash
# Les images sont automatiquement envoyées lors de :
# - La création de nouvelles variantes
# - La mise à jour de variantes existantes
```

## Structure des Données

### Table `product_variants`
```sql
{
  id: uuid,
  product_id: uuid,
  name: string,
  variant_sku: string,
  price: number,
  cost_price: number,
  stock_quantity: number,
  image_url: string,  -- URL de l'image de la variante
  shopify_variant_id: string,
  options: jsonb,
  is_active: boolean
}
```

## Formats d'Images Supportés

### Upload de Fichiers
- JPG / JPEG
- PNG
- WEBP
- GIF
- Taille maximale : 5MB

### URLs Externes
- Tout format d'image accessible via HTTP/HTTPS
- L'URL doit être publiquement accessible
- Shopify télécharge et héberge l'image automatiquement

## Bonnes Pratiques

1. **Nommage des Images**
   - Utilisez des noms descriptifs incluant le SKU de la variante
   - Exemple : `tshirt-rouge-M-123456.jpg`

2. **Optimisation**
   - Compressez les images avant upload
   - Résolution recommandée : 1024x1024px minimum
   - Ratio 1:1 pour une meilleure présentation

3. **URLs Externes**
   - Préférez HTTPS pour les URLs externes
   - Assurez-vous que l'URL reste stable dans le temps
   - Évitez les URLs temporaires ou signées

4. **Synchronisation**
   - Lancez une synchronisation après avoir ajouté des images
   - Vérifiez que les images s'affichent correctement sur Shopify
   - Les images manquantes utilisent l'image principale du produit

## Dépannage

### L'image ne s'affiche pas
1. Vérifiez que l'URL est accessible publiquement
2. Testez l'URL dans un navigateur
3. Vérifiez le format de l'image (JPG, PNG, WEBP)

### L'image n'est pas synchronisée avec Shopify
1. Vérifiez que la variante a un `shopify_variant_id`
2. Lancez une synchronisation manuelle
3. Consultez les logs de synchronisation pour les erreurs

### Erreur de taille de fichier
- Réduisez la résolution ou compressez l'image
- Utilisez un outil comme TinyPNG ou Squoosh
- Limite : 5MB par image

## API GraphQL Shopify

### Mutation pour mettre à jour une variante avec image
```graphql
mutation UpdateVariant($input: ProductVariantInput!) {
  productVariantUpdate(input: $input) {
    productVariant {
      id
      sku
      image {
        url
      }
    }
    userErrors {
      field
      message
    }
  }
}

# Variables
{
  "input": {
    "id": "gid://shopify/ProductVariant/123456",
    "imageSrc": "https://example.com/image.jpg"
  }
}
```

## Feuille de Route

- [ ] Upload direct vers Supabase Storage
- [ ] Édition/recadrage d'images dans l'interface
- [ ] Import en masse d'images via CSV
- [ ] Génération automatique de miniatures
- [ ] Support de multiples images par variante
