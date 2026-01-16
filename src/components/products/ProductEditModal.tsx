/**
 * Modal d'édition produit avec validation et feedback utilisateur
 */
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Save, X, CheckCircle, Package, DollarSign, Tag, Box } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// Schema de validation Zod
const productSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  description: z.string().max(5000, 'La description ne peut pas dépasser 5000 caractères').optional(),
  price: z.coerce.number()
    .min(0, 'Le prix doit être positif')
    .max(1000000, 'Le prix est trop élevé'),
  cost_price: z.coerce.number()
    .min(0, 'Le coût doit être positif')
    .max(1000000, 'Le coût est trop élevé')
    .optional()
    .nullable(),
  sku: z.string().max(100, 'Le SKU ne peut pas dépasser 100 caractères').optional(),
  category: z.string().max(100, 'La catégorie ne peut pas dépasser 100 caractères').optional(),
  brand: z.string().max(100, 'La marque ne peut pas dépasser 100 caractères').optional(),
  stock_quantity: z.coerce.number()
    .int('Le stock doit être un nombre entier')
    .min(0, 'Le stock ne peut pas être négatif')
    .max(1000000, 'Stock trop élevé')
    .optional()
    .nullable(),
  status: z.enum(['active', 'draft', 'archived', 'pending', 'published']),
  image_url: z.string().url('URL d\'image invalide').optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  price?: number;
  cost_price?: number;
  sku?: string;
  category?: string;
  brand?: string;
  stock_quantity?: number;
  status?: string;
  image_url?: string;
  source?: string;
}

interface ProductEditModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  'Vêtements',
  'Électronique',
  'Accessoires',
  'Maison',
  'Beauté',
  'Sport',
  'Jouets',
  'Alimentation',
  'Autre'
];

export function ProductEditModal({ product, open, onOpenChange, onSuccess }: ProductEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      cost_price: null,
      sku: '',
      category: '',
      brand: '',
      stock_quantity: 0,
      status: 'draft',
      image_url: '',
    }
  });

  // Remplir le formulaire quand le produit change
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || product.title || '',
        description: product.description || '',
        price: product.price || 0,
        cost_price: product.cost_price || null,
        sku: product.sku || '',
        category: product.category || '',
        brand: product.brand || '',
        stock_quantity: product.stock_quantity || 0,
        status: (product.status as any) || 'draft',
        image_url: product.image_url || '',
      });
    }
  }, [product, form]);

  const onSubmit = async (data: ProductFormData) => {
    if (!product) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Déterminer la table en fonction de la source
      const tableName = product.source === 'products' ? 'products' : 'imported_products';

      const updateData: any = {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        status: data.status,
        updated_at: new Date().toISOString()
      };

      // Ajouter les champs optionnels selon la table
      if (tableName === 'products') {
        updateData.sku = data.sku;
        updateData.brand = data.brand;
        updateData.stock_quantity = data.stock_quantity;
        updateData.cost_price = data.cost_price;
        updateData.image_url = data.image_url;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Produit mis à jour avec succès', {
        description: `${data.name} a été modifié`,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />
      });

      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erreur de mise à jour', {
        description: error.message || 'Impossible de modifier le produit'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateMargin = (): string => {
    const price = Number(form.watch('price')) || 0;
    const cost = Number(form.watch('cost_price')) || 0;
    if (price === 0) return '0';
    return (((price - cost) / price) * 100).toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Modifier le produit
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations du produit. Les champs marqués * sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section Informations générales */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4" />
                Informations générales
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nom du produit *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ex: T-shirt Premium Bio"
                          className={cn(form.formState.errors.name && "border-red-500")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU / Référence</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SKU-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''}
                        placeholder="Description détaillée du produit..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section Prix et Stock */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Prix et Inventaire
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix de vente *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01"
                            min="0"
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix d'achat</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            value={field.value ?? ''}
                            type="number" 
                            step="0.01"
                            min="0"
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Marge</Label>
                  <div className={cn(
                    "h-10 px-3 flex items-center rounded-md border text-sm font-medium",
                    parseFloat(calculateMargin()) > 30 ? "bg-green-50 text-green-700 border-green-200" :
                    parseFloat(calculateMargin()) > 15 ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-red-50 text-red-700 border-red-200"
                  )}>
                    {calculateMargin()}%
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value ?? ''}
                          type="number" 
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="archived">Archivé</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="published">Publié</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section Image */}
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de l'image</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ''}
                      placeholder="https://example.com/image.jpg"
                    />
                  </FormControl>
                  <FormMessage />
                  {field.value && (
                    <div className="mt-2">
                      <img 
                        src={field.value} 
                        alt="Aperçu" 
                        className="h-20 w-20 object-cover rounded-lg border"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
