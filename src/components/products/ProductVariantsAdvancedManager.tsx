import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProductVariants } from '@/hooks/useProductVariants'
import { useToast } from '@/hooks/use-toast'
import { Trash2, Download, Upload, Package } from 'lucide-react'
import Papa from 'papaparse'

interface ProductVariantsAdvancedManagerProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProductVariantsAdvancedManager = ({ 
  productId, 
  open, 
  onOpenChange 
}: ProductVariantsAdvancedManagerProps) => {
  const { toast } = useToast()
  const { 
    variants, 
    variantsLoading,
    createVariant,
    updateVariant,
    deleteVariant
  } = useProductVariants(productId)

  const [editingId, setEditingId] = useState<string | null>(null)

  // Parse options for display
  const formatOptions = (optionsJson: any): string => {
    if (!optionsJson) return '-'
    try {
      const opts = typeof optionsJson === 'string' ? JSON.parse(optionsJson) : optionsJson
      if (Array.isArray(opts)) {
        return opts.map((o: any) => `${o.name}: ${o.value}`).join(' / ')
      }
      return JSON.stringify(opts)
    } catch {
      return String(optionsJson)
    }
  }

  // CSV Export
  const handleExportCSV = () => {
    if (!variants || variants.length === 0) {
      toast({
        title: "Aucune variante",
        description: "Il n'y a pas de variantes à exporter",
        variant: "destructive"
      })
      return
    }

    const csvData = variants.map(v => ({
      name: v.name,
      variant_sku: v.variant_sku || '',
      options: v.options ? JSON.stringify(v.options) : '',
      price: v.price,
      cost_price: v.cost_price || '',
      stock_quantity: v.stock_quantity || 0,
      image_url: v.image_url || '',
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `variants_product_${productId}.csv`
    link.click()

    toast({
      title: "Export réussi",
      description: `${variants.length} variante(s) exportée(s)`
    })
  }

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          for (const row of results.data as any[]) {
            if (!row.name || !row.price) continue

            const options = row.options ? JSON.parse(row.options) : null
            
            createVariant({
              product_id: productId,
              name: row.name,
              variant_sku: row.variant_sku || null,
              options: options,
              price: parseFloat(row.price) || 0,
              cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
              stock_quantity: parseInt(row.stock_quantity) || 0,
              image_url: row.image_url || null,
              parent_sku: row.parent_sku || null,
            })
          }

          toast({
            title: "Import réussi",
            description: `${results.data.length} variante(s) importée(s)`
          })
        } catch (error) {
          toast({
            title: "Erreur d'import",
            description: "Vérifiez le format du fichier CSV",
            variant: "destructive"
          })
        }
      }
    })

    e.target.value = ''
  }

  // Handle inline edit
  const handleFieldUpdate = (variantId: string, field: string, value: any) => {
    updateVariant({
      id: variantId,
      updates: { [field]: value }
    })
  }

  // Handle delete
  const handleDelete = (variantId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette variante ?')) {
      deleteVariant(variantId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestion avancée des variantes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={!variants || variants.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('csv-import')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer CSV
                <input
                  id="csv-import"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportCSV}
                />
              </Button>
            </div>

            <Badge variant="secondary">
              {variants?.length || 0} variante(s)
            </Badge>
          </div>

          {/* Variants Table */}
          {variantsLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : !variants || variants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune variante. Créez-en via la page produit ou importez un CSV.
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Prix (€)</TableHead>
                    <TableHead>Coût (€)</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => (
                    <TableRow key={variant.id}>
                      {/* Image */}
                      <TableCell>
                        {variant.image_url ? (
                          <img
                            src={variant.image_url}
                            alt={variant.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        {editingId === variant.id ? (
                          <Input
                            defaultValue={variant.name}
                            onBlur={(e) => {
                              handleFieldUpdate(variant.id, 'name', e.target.value)
                              setEditingId(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleFieldUpdate(variant.id, 'name', e.currentTarget.value)
                                setEditingId(null)
                              }
                            }}
                            autoFocus
                            className="w-full min-w-[150px]"
                          />
                        ) : (
                          <div 
                            onClick={() => setEditingId(variant.id)}
                            className="cursor-pointer hover:text-primary"
                          >
                            {variant.name}
                          </div>
                        )}
                      </TableCell>

                      {/* Options */}
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {formatOptions(variant.options)}
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell>
                        <Input
                          defaultValue={variant.variant_sku || ''}
                          onBlur={(e) => handleFieldUpdate(variant.id, 'variant_sku', e.target.value || null)}
                          className="w-28"
                        />
                      </TableCell>

                      {/* Price */}
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={variant.price}
                          onBlur={(e) => handleFieldUpdate(variant.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>

                      {/* Cost Price */}
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={variant.cost_price || ''}
                          onBlur={(e) => handleFieldUpdate(variant.id, 'cost_price', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-24"
                        />
                      </TableCell>

                      {/* Stock */}
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={variant.stock_quantity || 0}
                          onBlur={(e) => handleFieldUpdate(variant.id, 'stock_quantity', parseInt(e.target.value) || 0)}
                          className={`w-20 ${
                            (variant.stock_quantity || 0) < 5 ? 'border-destructive' : ''
                          }`}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={variant.is_active ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => handleFieldUpdate(variant.id, 'is_active', !variant.is_active)}
                        >
                          {variant.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(variant.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
