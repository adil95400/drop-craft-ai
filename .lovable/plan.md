

# Plan de correction : Modal Import Shopify-Style

## Problemes identifies

1. **Suggestions IA categorie ne fonctionne pas** : L'edge function `ai-product-optimizer` n'a pas de cas pour `optimizationType === 'category'`. Elle tombe dans le cas par defaut `seo_meta`, qui retourne un JSON avec `meta_title`, `meta_description`, `keywords` -- pas de champ `suggestions`, `category` ou `subcategory`. Le frontend cherche `data.result.suggestions` ou `data.result.category` et ne trouve rien.

2. **Videos : scroll bloque** : Le `ScrollArea` avec `max-h-[300px]` est trop petit pour les grilles de videos. Sur 10 videos en grille 2 colonnes, ca fait 5 rangees de ~180px chacune = 900px. L'utilisateur ne peut pas scroller correctement car le parent `CollapsibleCard` peut aussi contraindre la hauteur.

3. **Avis : 0 extraits** : Le scraper `quick-import-url` extrait les avis dans `extracted_reviews`, mais sur Amazon.fr les avis sont charges dynamiquement (AJAX). Firecrawl ne les capture pas toujours. Le composant affiche correctement "0 extraits" car il n'y en a pas dans les donnees scrapees. Il faudrait ajouter au minimum l'extraction du rating/count depuis la page HTML (qui est deja faite via `reviews`) et mieux communiquer cette info.

4. **Prix 77.55 EUR vs 209 EUR** : Le prix 77.55 EUR est le prix extrait par le scraper (`productData.price`) qui correspond au **prix cout** (cost price). Le 209 EUR est le prix affiche sur Amazon. Le scraper a probablement capture un prix de variante moins chere ou un prix accessoire. Le champ "Prix cout" dans l'interface represente le prix source/fournisseur. Le label manque de clarte -- l'utilisateur ne comprend pas d'ou vient ce montant.

5. **Marque affiche `Marque&nbsp;; NIKE`** : Le HTML entity `&nbsp;` n'est pas nettoye dans l'extraction de la marque.

---

## Corrections prevues

### 1. Edge function `ai-product-optimizer` : Ajouter le type `category`

Ajouter un bloc `else if (optimizationType === 'category')` avec un prompt dedie qui retourne un JSON structure :
```json
{
  "suggestions": [
    { "category": "Chaussures", "subcategory": "Sneakers", "confidence": 0.95 },
    { "category": "Sport", "subcategory": "Running", "confidence": 0.85 }
  ]
}
```

Le parsing de la reponse sera ajoute dans la section de resultat (ligne ~226) pour extraire les suggestions.

### 2. Videos : Ameliorer le scroll et la gestion

- Augmenter le `max-h` du `ScrollArea` a `500px`
- Passer la grille en 1 colonne pour les videos (chaque video prend plus de place visuellement)
- S'assurer que le scroll fonctionne dans le contexte du `CollapsibleCard`

### 3. Avis : Meilleur affichage du rating existant

- Quand `extracted_reviews` est vide mais `reviews.rating` existe, afficher un message plus informatif avec le rating et le nombre d'avis
- Ajouter un indicateur visuel avec des etoiles dans la zone vide

### 4. Prix : Clarifier l'origine

- Ajouter un label explicatif sous le champ "Prix cout" : "Prix detecte sur le site source"
- Ajouter un avertissement si le prix semble anormalement bas par rapport au prix du marche
- Ajouter un lien/note indiquant que l'utilisateur peut verifier et corriger manuellement

### 5. Nettoyage marque

- Ajouter un nettoyage des entites HTML (`&nbsp;`, `&amp;`, etc.) dans le champ brand au moment de l'initialisation du composant

---

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/ai-product-optimizer/index.ts` | Ajouter le prompt et parsing pour `optimizationType === 'category'` |
| `src/components/import/ShopifyStyleProductPreview.tsx` | Fix scroll videos, affichage avis, nettoyage marque, label prix |

## Details techniques

### Edge function : Nouveau prompt category

```text
Systeme : "Tu es un expert en categorisation e-commerce. Tu analyses les produits et suggeres les categories les plus pertinentes."

User : "Categorise ce produit : Nom: {name}, Description: {desc}, Prix: {price}. Retourne UNIQUEMENT un JSON : { suggestions: [{ category, subcategory, confidence }] }"
```

Le parsing utilisera le meme pattern JSON que `attributes`/`seo_meta` (regex `\{[\s\S]*\}`), puis extraira `result.suggestions`.

### Nettoyage HTML entities

```typescript
const cleanHtmlEntities = (text: string) =>
  text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
```

Applique sur `brand` dans le `useEffect` d'initialisation.
