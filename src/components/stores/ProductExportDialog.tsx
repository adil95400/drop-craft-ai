import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, RefreshCw, Package, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface Product {
  id: string
  name: string
  sku?: string
  price: number
  image_url?: string
  description?: string
  category?: string
  tags?: string[]
  status: string
  created_at: string
}

interface ProductExportDialogProps {
  storeId: string
  storeName: string
  platform: string
}

export function ProductExportDialog({ storeId, storeName, platform }: ProductExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [exportProgress, setExportProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const { toast } = useToast()

  const fetchLocalProducts = async () => {
    setLoading(true)
    try {
      // Récupérer les produits depuis la table products
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(100)

      if (error) throw error

      // Mapper les données pour correspondre à l'interface Product
      const mappedProducts = (data || []).map((item) => ({
        id: item.id,
        name: item.name || item.title,
        sku: item.sku,
        price: item.price || 0,
        image_url: item.image_url,
        description: item.description,
        category: item.category,
        tags: item.tags,
        status: item.status === 'active' ? 'active' : 'draft',
        created_at: item.created_at || ''
      }))
      
      setProducts(mappedProducts)
      
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos produits",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchLocalProducts()
    }
  }, [open])

  const exportSelectedProducts = async () => {
    if (selectedProducts.size === 0) return

    setExporting(true)
    setExportProgress(0)

    try {
      const selectedProductsList = products.filter(p => selectedProducts.has(p.id))
      
      for (let i = 0; i < selectedProductsList.length; i++) {
        const product = selectedProductsList[i]
        
        const { error } = await supabase.functions.invoke('store-product-export', {
          body: {
            storeId,
            platform,
            product: {
              name: product.name,
              description: product.description,
              price: product.price,
              sku: product.sku,
              images: product.image_url ? [product.image_url] : [],
              category: product.category,
              tags: product.tags || [],
              inventory_quantity: 100
            },
            action: 'export'
          }
        })

        if (error) {
          console.error(`Error exporting product ${product.name}:`, error)
        }
        
        setExportProgress(((i + 1) / selectedProductsList.length) * 100)
      }

      toast({
        title: "Export terminé",
        description: `${selectedProducts.size} produits exportés vers ${storeName}`
      })
      
      setSelectedProducts(new Set())
      setOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Erreur d'export",
        description: "Certains produits n'ont pas pu être exportés",
        variant: "destructive"
      })
    } finally {
      setExporting(false)
      setExportProgress(0)
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
    const filtered = filteredProducts
    if (selectedProducts.size === filtered.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filtered.map(p => p.id)))
    }
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Envoyer produits
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Envoyer des produits vers {storeName}</DialogTitle>
          <DialogDescription>
            Exportez vos produits vers votre boutique {platform}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'Toutes catégories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                onCheckedChange={selectAll}
              />
              <span className="text-sm">
                {selectedProducts.size} / {filteredProducts.length} sélectionnés
              </span>
            </div>
            <Button 
              onClick={exportSelectedProducts} 
              disabled={selectedProducts.size === 0 || exporting}
            >
              {exporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Envoyer ({selectedProducts.size})
                </>
              )}
            </Button>
          </div>

          {exporting && (
            <div className="space-y-2">
              <Progress value={exportProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Export en cours... {Math.round(exportProgress)}%
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
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Chargement des produits...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      Aucun produit trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {product.image_url && (
                            <img
                              src={product.image_url}
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
                        {product.price?.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </TableCell>
                      <TableCell>
                        {product.category || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          product.status === 'active' ? "default" : "secondary"
                        }>
                          {product.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}