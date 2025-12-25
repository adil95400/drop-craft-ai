import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  TrendingUp, 
  Globe, 
  Star,
  Filter,
  Download,
  Eye,
  Heart
} from 'lucide-react'
import { useProductSourcing } from '@/hooks/useProductSourcing'

export default function ProductSourcingHub() {
  const [searchQuery, setSearchQuery] = useState('')
  const { 
    catalogProducts, 
    isLoadingCatalog, 
    platforms, 
    isLoadingPlatforms,
    favorites,
    isLoadingFavorites,
    calculateMargin,
    importProduct,
    isImporting,
    addToFavorites 
  } = useProductSourcing()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by filtering the existing data
  }

  const filteredProducts = catalogProducts?.filter(p => 
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <>
      <Helmet>
        <title>Sourcing Produits - Drop Craft AI</title>
        <meta name="description" content="Trouvez les meilleurs produits à vendre depuis AliExpress, Amazon, CJ Dropshipping et plus" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Product Sourcing Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Trouvez les meilleurs produits depuis 6+ plateformes
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher des produits gagnants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button type="submit" size="lg" className="px-8">
                <Search className="h-5 w-5 mr-2" />
                Rechercher
              </Button>
              <Button size="lg" variant="outline" type="button">
                <Filter className="h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Platforms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Plateformes de Sourcing
            </CardTitle>
            <CardDescription>
              Connectez vos plateformes préférées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPlatforms ? (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {platforms?.map((platform) => (
                  <div
                    key={platform.name}
                    className={`p-4 border rounded-lg text-center ${
                      platform.active ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="text-4xl mb-2">{platform.logo}</div>
                    <h3 className="font-semibold mb-1">{platform.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{platform.products} produits</p>
                    <Badge variant={platform.active ? 'default' : 'secondary'}>
                      {platform.active ? 'Connecté' : 'Non connecté'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Tabs defaultValue="trending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Catalogue ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="bestsellers">
              <Star className="h-4 w-4 mr-2" />
              Best-sellers
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Heart className="h-4 w-4 mr-2" />
              Favoris ({favorites?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-4">
            {isLoadingCatalog ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="relative">
                      {product.image_urls && product.image_urls[0] ? (
                        <img
                          src={product.image_urls[0]}
                          alt={product.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground">Pas d'image</span>
                        </div>
                      )}
                      {product.status === 'trending' && (
                        <Badge className="absolute top-2 right-2">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
                      
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">4.5</span>
                        <span className="text-sm text-muted-foreground">(0)</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Prix Vente</p>
                          <p className="font-bold text-primary">{product.compare_at_price?.toFixed(2) || '0.00'}€</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Prix Coût</p>
                          <p className="font-medium">{product.price?.toFixed(2) || '0.00'}€</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Marge</p>
                          <p className="font-bold text-green-600">
                            {calculateMargin(product.compare_at_price, product.price)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fournisseur</p>
                          <p className="font-medium truncate">{product.supplier_name || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => importProduct(product.id)}
                          disabled={isImporting || product.is_imported}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {product.is_imported ? 'Importé' : 'Importer'}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => addToFavorites(product.id)}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <Badge variant="outline" className="text-xs">
                          {product.source_platform || 'Manuel'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground">
                    Ajoutez des produits au catalogue pour les voir ici
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bestsellers" className="space-y-4">
            <Card>
              <CardContent className="p-12 text-center">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Best-sellers par Catégorie</h3>
                <p className="text-muted-foreground mb-4">
                  Découvrez les produits les plus vendus par catégorie
                </p>
                <Button>
                  Explorer les Best-sellers
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {isLoadingFavorites ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {favorites.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="relative">
                      {product.image_urls && product.image_urls[0] ? (
                        <img
                          src={product.image_urls[0]}
                          alt={product.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground">Pas d'image</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => importProduct(product.id)}
                          disabled={isImporting || product.is_imported}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {product.is_imported ? 'Importé' : 'Importer'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit favori</h3>
                  <p className="text-muted-foreground">
                    Enregistrez vos produits préférés pour y accéder rapidement
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
