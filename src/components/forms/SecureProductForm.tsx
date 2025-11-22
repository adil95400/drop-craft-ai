import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { productFormSchema, sanitizeProductData } from '@/utils/input-sanitization'
import { z } from 'zod'

type ProductFormData = z.infer<typeof productFormSchema>

interface SecureProductFormProps {
  onSubmit: (data: any) => Promise<void>
  defaultValues?: Partial<ProductFormData>
  isLoading?: boolean
}

export const SecureProductForm = ({ onSubmit, defaultValues, isLoading }: SecureProductFormProps) => {
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues
  })

  const handleSecureSubmit = async (data: ProductFormData) => {
    try {
      // Sanitize all inputs before submission
      const sanitizedData = sanitizeProductData(data)
      await onSubmit(sanitizedData)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive'
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(handleSecureSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom du produit *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ex: iPhone 15 Pro"
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="sku">SKU *</Label>
        <Input
          id="sku"
          {...register('sku')}
          placeholder="Ex: IPH15-256GB"
        />
        {errors.sku && (
          <p className="text-sm text-destructive mt-1">{errors.sku.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={4}
          placeholder="Description détaillée du produit..."
        />
        {errors.description && (
          <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Prix (€) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.price && (
            <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="cost_price">Prix de revient (€)</Label>
          <Input
            id="cost_price"
            type="number"
            step="0.01"
            {...register('cost_price', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.cost_price && (
            <p className="text-sm text-destructive mt-1">{errors.cost_price.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="category">Catégorie</Label>
        <Input
          id="category"
          {...register('category')}
          placeholder="Ex: Électronique"
        />
      </div>

      <div>
        <Label htmlFor="brand">Marque</Label>
        <Input
          id="brand"
          {...register('brand')}
          placeholder="Ex: Apple"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </form>
  )
}
