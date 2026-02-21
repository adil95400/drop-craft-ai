import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useProductsUnified } from '@/hooks/unified';
import { productSchema, ProductFormData } from '@/lib/validation/productSchema';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateProductDialog({ open, onOpenChange, onSuccess }: CreateProductDialogProps) {
  const { add: addProduct, isAdding } = useProductsUnified();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      cost_price: undefined,
      sku: '',
      category: '',
      stock_quantity: 0,
      status: 'active',
      image_url: '',
      seo_title: '',
      seo_description: '',
    },
  });

  const handleSubmit = async (data: ProductFormData) => {
    try {
      setSubmitError(null);
      
      await addProduct({
        name: data.name,
        description: data.description,
        price: data.price,
        cost_price: data.cost_price,
        sku: data.sku,
        category: data.category,
        stock_quantity: data.stock_quantity,
        status: data.status,
      });

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du produit'
      );
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      form.reset();
      setSubmitError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Créer un nouveau produit
          </DialogTitle>
        </DialogHeader>

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Nom */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nom du produit *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: iPhone 15 Pro"
                        maxLength={200}
                        disabled={isAdding}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Décrivez votre produit..."
                        rows={3}
                        maxLength={5000}
                        disabled={isAdding}
                        className="bg-background resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0} / 5000 caractères
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prix de vente */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix de vente (€) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        max="999999.99"
                        placeholder="0.00"
                        disabled={isAdding}
                        className="bg-background"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prix de revient */}
              <FormField
                control={form.control}
                name="cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix de revient (€)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        max="999999.99"
                        placeholder="0.00"
                        disabled={isAdding}
                        className="bg-background"
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Marge: {form.watch('price') > 0 && form.watch('cost_price') 
                        ? `${(((form.watch('price') - (form.watch('cost_price') || 0)) / form.watch('price')) * 100).toFixed(1)}%`
                        : '-'
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SKU */}
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: IPH15-PRO-256"
                        maxLength={100}
                        disabled={isAdding}
                        className="bg-background font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Catégorie */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Électronique"
                        maxLength={100}
                        disabled={isAdding}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stock */}
              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité en stock</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="999999"
                        placeholder="0"
                        disabled={isAdding}
                        className="bg-background"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Statut */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isAdding}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[100] bg-popover">
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="paused">En pause</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isAdding}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isAdding || !form.formState.isValid}>
                {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer le produit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
