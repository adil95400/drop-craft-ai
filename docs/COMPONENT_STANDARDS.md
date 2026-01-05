# Standards de Composants ShopOpti+

## Composants de chargement

### LoadingState
Utilisé pour les chargements de page complète :

```tsx
import { LoadingState } from '@/components/common/LoadingState';

// Usage
if (isLoading) {
  return <LoadingState message="Chargement des produits..." />;
}
```

### Skeleton
Utilisé pour les chargements partiels inline :

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Usage
{isLoading ? (
  <Skeleton className="h-8 w-32" />
) : (
  <span>{data.title}</span>
)}
```

### Loader inline
Pour les boutons et actions :

```tsx
import { Loader2 } from 'lucide-react';

<Button disabled={isPending}>
  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Sauvegarder
</Button>
```

## États vides

### EmptyState
Composant standard pour les listes vides :

```tsx
import { EmptyState } from '@/components/common/EmptyState';

<EmptyState
  icon={Package}
  title="Aucun produit"
  description="Commencez par importer vos premiers produits"
  action={
    <Button onClick={onImport}>Importer</Button>
  }
/>
```

## Feedback utilisateur

### Toast notifications
Toujours utiliser des toasts pour les actions utilisateur :

```tsx
import { toast } from 'sonner';

// Succès
toast.success('Produit créé avec succès');

// Erreur
toast.error('Échec de la création du produit');

// Info
toast.info('Synchronisation en cours...');

// Avec action
toast('Produit supprimé', {
  action: {
    label: 'Annuler',
    onClick: () => undoDelete(),
  },
});
```

### Dans les mutations
Toujours ajouter onSuccess et onError :

```tsx
const mutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.success('Produit créé');
  },
  onError: (error) => {
    toast.error(`Erreur: ${error.message}`);
  },
});
```

## Formulaires

### Structure standard

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  price: z.number().positive('Prix invalide'),
});

type FormData = z.infer<typeof schema>;

export function ProductForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    // ...
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Créer
        </Button>
      </form>
    </Form>
  );
}
```

## Accessibilité

### Labels obligatoires
Tous les inputs doivent avoir un label :

```tsx
// ✅ Correct
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// ✅ Correct avec aria-label
<Input aria-label="Rechercher" placeholder="Rechercher..." />

// ❌ Incorrect
<Input placeholder="Email" />
```

### Boutons avec icônes seules
Toujours ajouter un aria-label :

```tsx
<Button size="icon" aria-label="Supprimer">
  <Trash className="h-4 w-4" />
</Button>
```

### Focus visible
Ne jamais supprimer les outlines de focus :

```css
/* ❌ Ne jamais faire */
*:focus { outline: none; }

/* ✅ Utiliser les classes Tailwind */
focus-visible:ring-2 focus-visible:ring-primary
```

## Responsive Design

### Mobile-first
Toujours commencer par le mobile :

```tsx
<div className="
  grid grid-cols-1      // Mobile: 1 colonne
  sm:grid-cols-2        // Tablet: 2 colonnes
  lg:grid-cols-3        // Desktop: 3 colonnes
  gap-4
">
```

### Texte responsive
Utiliser les classes de taille responsive :

```tsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Titre
</h1>
```

### Navigation mobile
Toujours prévoir une version mobile de la navigation avec menu hamburger.

## Performance

### Lazy loading des images

```tsx
<img
  src={imageUrl}
  alt="Description"
  loading="lazy"
  decoding="async"
/>
```

### Memoization des composants coûteux

```tsx
const ExpensiveList = memo(({ items }) => {
  return items.map(item => <ListItem key={item.id} item={item} />);
});
```

### Debounce des inputs de recherche

```tsx
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

useQuery({
  queryKey: ['products', debouncedSearch],
  queryFn: () => searchProducts(debouncedSearch),
});
```
