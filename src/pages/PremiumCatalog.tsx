import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Search, Package, TrendingUp, Filter, Download, ShoppingCart, Star, MapPin, Loader2, CheckCircle2 } from 'lucide-react'

interface PremiumProduct {
  id: string
  supplier_id: string
  external_id: string
  name: string
  description: string
  price: number
  cost_price: number
  currency: string
  stock_quantity: number
  images: string[]
  category: string
  brand: string
  profit_margin: number
  sku: string
  metadata: any
  supplier?: {
    name: string
    country: string
  }
}

export default function PremiumCatalog() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set())

  // Fetch premium products
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['premium-catalog', selectedCategory, selectedSupplier, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('premium_products')
        .select(`
          *,
          supplier:premium_suppliers(name, country)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      if (selectedSupplier !== 'all') {
        query = query.eq('supplier_id', selectedSupplier)
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query.limit(200)

      if (error) throw error
      return data as PremiumProduct[]
    }
  })

  // Get unique categories and suppliers
  const categories = [...new Set(products.map(p => p.category))].sort()
  const suppliers = [...new Set(products.map(p => p.supplier?.name).filter(Boolean))].sort()

  // Import product to user's catalog
  const importProduct = async (product: PremiumProduct) => {
    try {
      setImportingIds(prev => new Set(prev).add(product.id))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Import to user's products
      const { error } = await supabase
        .from('imported_products')
        .insert({
          user_id: user.id,
          name: product.name,
          description: product.description,
          price: product.price * 1.3, // 30% markup
          cost_price: product.cost_price,
          sku: product.sku,
          images: product.images,
          category: product.category,
          stock: product.stock_quantity,
          status: 'draft',
          supplier_info: {
            supplier_id: product.supplier_id,
            supplier_name: product.supplier?.name,
            external_id: product.external_id,
            profit_margin: product.profit_margin
          }
        })

      if (error) throw error

      toast({
        title: '✅ Produit importé',
        description: `${product.name} ajouté à votre catalogue`
      })

      refetch()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setImportingIds(prev => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }
  }

  // Bulk import
  const bulkImport = async () => {
    const selectedProducts = products.slice(0, 10)
    
    for (const product of selectedProducts) {
      await importProduct(product)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return (
    <>
      <Helmet>
        <title>Catalogue Premium - Produits Fournisseurs</title>
        <meta name="description" content="Parcourez et importez des milliers de produits premium de vos fournisseurs connectés" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Catalogue Premium</h1>
            <p className="text-muted-foreground mt-1">
              {products.length} produits disponibles
            </p>
          </div>
          <Button onClick={bulkImport} className="gap-2">
            <Download className="h-4 w-4" />
            Importer Top 10
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Produits</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Stock</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.stock_quantity > 0).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Catégories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fournisseurs</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {suppliers.map(sup => (
                  <SelectItem key={sup} value={sup}>{sup}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">
              Connectez des fournisseurs pour accéder à leur catalogue
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/premium-network'}>
              Voir les fournisseurs
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isImporting = importingIds.has(product.id)
              
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    {product.images?.[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {product.stock_quantity > 0 && (
                      <Badge className="absolute top-2 left-2 bg-green-500">
                        En stock
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{product.supplier?.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Prix d'achat</p>
                        <p className="font-bold text-lg">
                          {product.cost_price.toFixed(2)} {product.currency}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        +{product.profit_margin.toFixed(0)}% marge
                      </Badge>
                    </div>

                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{product.category}</Badge>
                      {product.brand && (
                        <Badge variant="outline">{product.brand}</Badge>
                      )}
                    </div>

                    <Button 
                      className="w-full gap-2" 
                      onClick={() => importProduct(product)}
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Import...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          Importer
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
