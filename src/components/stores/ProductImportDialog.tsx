import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, RefreshCw, Package, Check, X, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface Product {
  id: string
  name: string
  sku?: string
  price: number
  images?: string[]
  description?: string
  category?: string
  inventory_quantity?: number
  tags?: string[]
}

interface ProductImportDialogProps {
  storeId: string
  storeName: string
  platform: string
}

export function ProductImportDialog({ storeId, storeName, platform }: ProductImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [importProgress, setImportProgress] = useState(0)
  const { toast } = useToast()

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('store-product-fetch', {
        body: { 
          storeId,
          platform,
          action: 'fetch'
        }
      })

      if (error) throw error

      setProducts(data.products || [])
      toast({
        title: "Produits récupérés",
        description: `${data.products?.length || 0} produits trouvés dans ${storeName}`
      })
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les produits de la boutique",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const importSelectedProducts = async () => {
    if (selectedProducts.size === 0) return

    setImporting(true)
    setImportProgress(0)

    try {
      const selectedProductsList = products.filter(p => selectedProducts.has(p.id))
      
      for (let i = 0; i < selectedProductsList.length; i++) {
        const product = selectedProductsList[i]
        
        const { error } = await supabase.functions.invoke('store-product-import', {
          body: {
            storeId,
            platform,
            product,
            action: 'import'
          }
        })

        if (error) {
          console.error(`Error importing product ${product.name}:`, error)
        }
        
        setImportProgress(((i + 1) / selectedProductsList.length) * 100)
      }

      toast({
        title: "Import terminé",
        description: `${selectedProducts.size} produits importés avec succès`
      })
      
      setSelectedProducts(new Set())
      setOpen(false)
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Erreur d'import",
        description: "Certains produits n'ont pas pu être importés",
        variant: "destructive"
      })
    } finally {
      setImporting(false)
      setImportProgress(0)
    }
  }

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const selectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Importer produits
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Importer des produits depuis {storeName}</DialogTitle>
          <DialogDescription>
            Récupérez et importez les produits de votre boutique {platform}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Cliquez pour récupérer les produits de votre boutique
              </p>
              <Button onClick={fetchProducts} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Récupération...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Récupérer les produits
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedProducts.size === products.length && products.length > 0}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-sm">
                    {selectedProducts.size} / {products.length} sélectionnés
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  <Button 
                    onClick={importSelectedProducts} 
                    disabled={selectedProducts.size === 0 || importing}
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Importer ({selectedProducts.size})
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {importing && (
                <div className="space-y-2">
                  <Progress value={importProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    Import en cours... {Math.round(importProgress)}%
                  </p>
                </div>
              )}

              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Catégorie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.sku && (
                                <div className="text-sm text-muted-foreground">
                                  SKU: {product.sku}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.price.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            (product.inventory_quantity ?? 0) > 0 ? "default" : "destructive"
                          }>
                            {product.inventory_quantity ?? 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.category || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}