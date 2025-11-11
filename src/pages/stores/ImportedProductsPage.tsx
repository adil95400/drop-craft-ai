import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Package, Search, ExternalLink, RefreshCw, Filter } from 'lucide-react'
import { BackButton } from '@/components/navigation/BackButton'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface ImportedProduct {
  id: string
  name: string
  description: string
  price: number
  cost_price: number
  currency: string
  sku: string
  category: string
  brand: string
  stock_quantity: number
  status: string
  platform: string
  image_url: string
  image_urls: string[]
  tags: string[]
  created_at: string
  updated_at: string
}

export default function ImportedProductsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['imported-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as any[]
    },
    enabled: !!user?.id
  })

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPlatform = platformFilter === 'all' || product.platform === platformFilter
    
    return matchesSearch && matchesPlatform
  })

  const platforms = Array.from(new Set(products.map(p => p.platform).filter(Boolean)))

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    outOfStock: products.filter(p => (p.stock_quantity || 0) === 0).length,
    totalValue: products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock_quantity || 0)), 0)
  }

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const handleRefresh = async () => {
    await refetch()
    toast({
      title: "Actualisation réussie",
      description: "La liste des produits a été mise à jour"
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="mb-4">
        <BackButton to="/dashboard/stores/integrations" label="Retour aux intégrations" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Produits Importés
            </h1>
            <p className="text-muted-foreground mt-2">
              {filteredProducts.length} produits synchronisés depuis vos intégrations
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">En rupture</p>
                <p className="text-3xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Valeur Stock</p>
                <p className="text-2xl font-bold text-foreground">{formatPrice(stats.totalValue)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, SKU ou marque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={platformFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlatformFilter('all')}
            >
              Toutes
            </Button>
            {platforms.map(platform => (
              <Button
                key={platform}
                variant={platformFilter === platform ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlatformFilter(platform)}
                className="capitalize"
              >
                {platform}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {products.length === 0 ? 'Aucun produit importé' : 'Aucun résultat'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {products.length === 0 
                ? 'Synchronisez vos intégrations pour importer des produits' 
                : 'Essayez de modifier vos critères de recherche'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                {product.image_url && (
                  <div className="w-full h-48 mb-3 overflow-hidden rounded-lg bg-muted">
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg'
                      }}
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{product.name || 'Sans nom'}</CardTitle>
                  <Badge 
                    variant={product.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize shrink-0"
                  >
                    {product.status || 'inconnu'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prix:</span>
                  <span className="font-semibold">{formatPrice(product.price || 0, product.currency || 'EUR')}</span>
                </div>
                
                {product.cost_price && product.cost_price > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Coût:</span>
                    <span>{formatPrice(product.cost_price, product.currency || 'EUR')}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stock:</span>
                  <Badge variant={(product.stock_quantity || 0) > 0 ? 'default' : 'destructive'}>
                    {product.stock_quantity || 0} unités
                  </Badge>
                </div>

                {product.sku && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-mono text-xs">{product.sku}</span>
                  </div>
                )}

                {product.platform && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Plateforme:</span>
                    <Badge variant="outline" className="capitalize">
                      {product.platform}
                    </Badge>
                  </div>
                )}

                {product.category && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Catégorie:</span>
                    <span className="text-xs">{product.category}</span>
                  </div>
                )}

                {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
