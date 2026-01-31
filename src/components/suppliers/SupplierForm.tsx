import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { UnifiedSupplier } from '@/hooks/unified'

type Supplier = UnifiedSupplier
type CreateSupplierData = {
  name: string
  supplier_type: 'api' | 'email' | 'csv' | 'xml' | 'ftp'
  country?: string | null
  sector?: string | null
  logo_url?: string | null
  website?: string | null
  description?: string | null
  api_endpoint?: string | null
  sync_frequency?: 'daily' | 'weekly' | 'manual' | 'hourly'
}
import { useTranslation } from 'react-i18next'

const supplierSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  supplier_type: z.enum(['api', 'csv', 'xml', 'ftp', 'email']),
  country: z.string().optional(),
  sector: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  api_endpoint: z.string().url().optional().or(z.literal('')),
  sync_frequency: z.enum(['manual', 'hourly', 'daily', 'weekly']).default('daily'),
})

type SupplierFormData = z.infer<typeof supplierSchema>

interface SupplierFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateSupplierData) => Promise<{ success: boolean }>
  supplier?: Supplier
  mode: 'create' | 'edit'
}

export const SupplierForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  supplier, 
  mode 
}: SupplierFormProps) => {
  const { t } = useTranslation(['common'])
  const [loading, setLoading] = useState(false)

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier ? {
      name: supplier.name,
      supplier_type: (supplier.supplier_type as 'api' | 'email' | 'csv' | 'xml' | 'ftp') || 'api',
      country: supplier.country || '',
      sector: supplier.sector || '',
      logo_url: supplier.logo_url || '',
      website: supplier.website || '',
      description: supplier.description || '',
      api_endpoint: supplier.api_endpoint || '',
      sync_frequency: (supplier.sync_frequency as 'daily' | 'weekly' | 'manual' | 'hourly') || 'daily',
    } : {
      name: '',
      supplier_type: 'api',
      sync_frequency: 'daily',
      country: '',
      sector: '',
      logo_url: '',
      website: '',
      description: '',
      api_endpoint: '',
    }
  })

  const handleSubmit = async (data: SupplierFormData) => {
    setLoading(true)
    try {
      // Convert empty strings to null for optional fields
      const cleanData: CreateSupplierData = {
        name: data.name,
        supplier_type: data.supplier_type,
        sync_frequency: data.sync_frequency,
        country: data.country || null,
        sector: data.sector || null,
        logo_url: data.logo_url || null,
        website: data.website || null,
        description: data.description || null,
        api_endpoint: data.api_endpoint || null,
      }
      
      const result = await onSubmit(cleanData)
      if (result.success) {
        onOpenChange(false)
        form.reset()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Ajouter un fournisseur' : 'Modifier le fournisseur'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Créez un nouveau fournisseur pour importer des produits'
              : 'Modifiez les informations du fournisseur'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du fournisseur</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: AliExpress, Amazon..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de connexion</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="csv">CSV/Excel</SelectItem>
                        <SelectItem value="xml">XML/RSS</SelectItem>
                        <SelectItem value="ftp">FTP</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: France, Chine..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secteur</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Électronique, Mode..." {...field} />
                    </FormControl>
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
                      placeholder="Décrivez ce fournisseur et ses produits..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site web</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL du logo</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="api_endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Point d'accès API</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com/products" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL de l'API pour récupérer les produits
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sync_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fréquence de synchronisation</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la fréquence" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual">Manuel</SelectItem>
                        <SelectItem value="hourly">Toutes les heures</SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : (mode === 'create' ? 'Créer' : 'Modifier')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}