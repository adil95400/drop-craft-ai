# Composants Documentation

## 📋 Vue d'ensemble

Le projet utilise une bibliothèque de composants basée sur **Radix UI** et **shadcn/ui**, personnalisés avec notre design system.

## 🎨 Design System

### Tokens Sémantiques

Tous les composants utilisent des tokens CSS définis dans `src/index.css`:

```css
/* Couleurs principales */
--background: 0 0% 100%;
--foreground: 240 10% 3.9%;
--primary: 346.8 77.2% 49.8%;
--primary-foreground: 355.7 100% 97.3%;
--secondary: 240 4.8% 95.9%;
--muted: 240 4.8% 95.9%;
--accent: 240 4.8% 95.9%;

/* Couleurs de bordure */
--border: 240 5.9% 90%;
--input: 240 5.9% 90%;
--ring: 346.8 77.2% 49.8%;

/* États */
--destructive: 0 84.2% 60.2%;
--success: 142 76% 36%;
--warning: 38 92% 50%;
```

### Mode Sombre

Support automatique avec `next-themes`:

```tsx
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </button>
  );
}
```

## 📦 Composants UI de Base

### Button

Composant bouton avec variantes et tailles.

**Fichier**: `src/components/ui/button.tsx`

```tsx
import { Button } from '@/components/ui/button';

// Variantes
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tailles
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>

// États
<Button disabled>Disabled</Button>
<Button loading>Loading</Button>

// Avec icône
<Button>
  <Mail className="mr-2 h-4 w-4" />
  Envoyer
</Button>
```

### Card

Conteneur de contenu avec header, content et footer.

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input

Champ de saisie avec validation.

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email"
    type="email"
    placeholder="email@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

### Select

Menu déroulant de sélection.

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select value={category} onValueChange={setCategory}>
  <SelectTrigger>
    <SelectValue placeholder="Sélectionner une catégorie" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="electronics">Électronique</SelectItem>
    <SelectItem value="clothing">Vêtements</SelectItem>
    <SelectItem value="food">Alimentation</SelectItem>
  </SelectContent>
</Select>
```

### Dialog

Fenêtre modale.

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Ouvrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Titre du dialogue</DialogTitle>
      <DialogDescription>
        Description du dialogue
      </DialogDescription>
    </DialogHeader>
    <div>
      Contenu du dialogue
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Annuler
      </Button>
      <Button onClick={handleSubmit}>
        Confirmer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toast

Notifications temporaires.

```tsx
import { toast } from 'sonner';

// Success
toast.success('Produit créé avec succès');

// Error
toast.error('Une erreur est survenue');

// Loading
toast.loading('Chargement...');

// Promise
toast.promise(
  createProduct(data),
  {
    loading: 'Création en cours...',
    success: 'Produit créé !',
    error: 'Erreur lors de la création',
  }
);

// Custom
toast.custom((t) => (
  <div className="bg-primary text-primary-foreground p-4 rounded-lg">
    Custom toast content
  </div>
));
```

### Badge

Indicateur de statut.

```tsx
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>

// Status badges
<Badge variant={
  status === 'active' ? 'success' :
  status === 'pending' ? 'warning' :
  'destructive'
}>
  {status}
</Badge>
```

### Table

Tableau de données.

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nom</TableHead>
      <TableHead>Prix</TableHead>
      <TableHead>Stock</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {products.map(product => (
      <TableRow key={product.id}>
        <TableCell>{product.name}</TableCell>
        <TableCell>{formatPrice(product.price)}</TableCell>
        <TableCell>{product.stock}</TableCell>
        <TableCell>
          <Button size="sm">Modifier</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## 🏗️ Composants Layout

### AppLayout

Layout principal de l'application avec sidebar.

**Fichier**: `src/components/layout/AppLayout.tsx`

```tsx
import { AppLayout } from '@/components/layout/AppLayout';

function MyPage() {
  return (
    <AppLayout>
      <div>
        Your page content
      </div>
    </AppLayout>
  );
}
```

**Fonctionnalités**:
- Sidebar collapsible
- Navigation responsive
- Breadcrumbs automatiques
- Header avec actions

### AdminLayout

Layout dédié admin.

**Fichier**: `src/components/layout/AdminLayout.tsx`

```tsx
import { AdminLayout } from '@/components/layout/AdminLayout';

function AdminPage() {
  return (
    <AdminLayout>
      <div>
        Admin content
      </div>
    </AdminLayout>
  );
}
```

## 📊 Composants Métier

### ProductCard

Card produit réutilisable.

```tsx
import { ProductCard } from '@/components/products/ProductCard';

<ProductCard 
  product={product}
  onSelect={() => navigate(`/products/${product.id}`)}
  onEdit={() => setEditingProduct(product)}
  onDelete={() => handleDelete(product.id)}
  variant="compact"
/>
```

**Props**:
- `product`: Objet produit
- `onSelect?`: Callback sélection
- `onEdit?`: Callback édition
- `onDelete?`: Callback suppression
- `variant?`: 'default' | 'compact'

### ProductList

Liste de produits avec filtres.

```tsx
import { ProductList } from '@/components/products/ProductList';

<ProductList
  products={products}
  isLoading={isLoading}
  onProductSelect={handleSelect}
  filters={filters}
  onFiltersChange={setFilters}
  view="grid" // or 'list'
/>
```

### DataTable

Table de données avec tri, filtres et pagination.

```tsx
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Nom',
  },
  {
    accessorKey: 'price',
    header: 'Prix',
    cell: ({ row }) => formatPrice(row.getValue('price')),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button onClick={() => handleEdit(row.original)}>
        Modifier
      </Button>
    ),
  },
];

<DataTable 
  columns={columns}
  data={products}
  searchKey="name"
  searchPlaceholder="Rechercher un produit..."
/>
```

### MetricCard

Card de métrique.

```tsx
import { MetricCard } from '@/components/analytics/MetricCard';

<MetricCard
  title="Revenus"
  value="12 345 €"
  change="+12.5%"
  trend="up"
  icon={DollarSign}
/>
```

### Chart

Graphiques avec Recharts.

```tsx
import { LineChart } from '@/components/analytics/LineChart';

<LineChart
  data={salesData}
  xKey="date"
  yKey="sales"
  title="Ventes mensuelles"
  color="primary"
/>
```

## 🎭 Composants Form

### FormField

Champ de formulaire avec validation.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  price: z.number().positive('Le prix doit être positif'),
});

function ProductForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du produit</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Le nom affiché publiquement
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prix</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">
          Enregistrer
        </Button>
      </form>
    </Form>
  );
}
```

## 🔧 Utility Components

### Skeleton

Placeholder de chargement.

```tsx
import { Skeleton } from '@/components/ui/skeleton';

function ProductCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  );
}
```

### LoadingSpinner

Indicateur de chargement.

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

<LoadingSpinner size="lg" />
<LoadingSpinner size="md" />
<LoadingSpinner size="sm" />
```

### EmptyState

État vide avec CTA.

```tsx
import { EmptyState } from '@/components/ui/empty-state';

<EmptyState
  icon={Package}
  title="Aucun produit"
  description="Commencez par ajouter votre premier produit"
  action={
    <Button onClick={() => navigate('/products/new')}>
      Ajouter un produit
    </Button>
  }
/>
```

## 🎨 Customisation

### Créer un Variant

```tsx
// button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Ajouter votre variant
        custom: "bg-gradient-to-r from-primary to-secondary text-white",
      },
    },
  }
);

// Usage
<Button variant="custom">Custom Button</Button>
```

### Thème Custom

```tsx
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        custom: {
          light: 'hsl(var(--custom-light))',
          DEFAULT: 'hsl(var(--custom))',
          dark: 'hsl(var(--custom-dark))',
        },
      },
    },
  },
};

// index.css
:root {
  --custom-light: 200 100% 70%;
  --custom: 200 100% 50%;
  --custom-dark: 200 100% 30%;
}
```

---

**Note**: Tous les composants suivent le design system et sont entièrement personnalisables via Tailwind.
