import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  TrendingUp, 
  Globe, 
  Package, 
  Star,
  ShoppingBag,
  Filter,
  Download,
  Eye,
  Heart
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ProductSourcingHub() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')

  const platforms = [
    { name: 'AliExpress', logo: '🛒', active: true, products: '200M+' },
    { name: 'Amazon', logo: '📦', active: true, products: '12M+' },
    { name: 'CJ Dropshipping', logo: '🚚', active: true, products: '500K+' },
    { name: 'Temu', logo: '🎁', active: false, products: '10M+' },
    { name: 'Alibaba', logo: '🏭', active: false, products: '50M+' },
    { name: '1688.com', logo: '🇨🇳', active: false, products: '80M+' }
  ]

  const [trendingProducts] = useState([
    {
      id: '1',
      name: 'Wireless Charging Pad Pro',
      image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=400',
      price: 24.99,
      supplierPrice: 8.50,
      margin: 65,
      sales: 1247,
      rating: 4.8,
      reviews: 342,
      source: 'AliExpress',
      trending: true
    },
    {
      id: '2',
      name: 'Smart Home LED Bulb Set',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      price: 34.99,
      supplierPrice: 12.00,
      margin: 66,
      sales: 892,
      rating: 4.6,
      reviews: 198,
      source: 'CJ Dropshipping',
      trending: true
    },
    {
      id: '3',
      name: 'Portable Mini Projector',
      image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400',
      price: 89.99,
      supplierPrice: 45.00,
      margin: 50,
      sales: 567,
      rating: 4.7,
      reviews: 234,
      source: 'Amazon',
      trending: false
    }
  ])

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
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher des produits gagnants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button size="lg" className="px-8">
                <Search className="h-5 w-5 mr-2" />
                Rechercher
              </Button>
              <Button size="lg" variant="outline">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
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
            <div className="grid grid-cols-3 gap-4">
              {platforms.map((platform) => (
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
          </CardContent>
        </Card>

        {/* Trending Products */}
        <Tabs defaultValue="trending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Tendances
            </TabsTrigger>
            <TabsTrigger value="bestsellers">
              <Star className="h-4 w-4 mr-2" />
              Best-sellers
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Heart className="h-4 w-4 mr-2" />
              Favoris
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trendingProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    {product.trending && (
                      <Badge className="absolute top-2 right-2">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                    
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.rating}</span>
                      <span className="text-sm text-muted-foreground">({product.reviews})</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground">Prix Vente</p>
                        <p className="font-bold text-primary">{product.price}€</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prix Coût</p>
                        <p className="font-medium">{product.supplierPrice}€</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Marge</p>
                        <p className="font-bold text-green-600">{product.margin}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ventes/mois</p>
                        <p className="font-medium">{product.sales}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-1" />
                        Importer
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        {product.source}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
            <Card>
              <CardContent className="p-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun produit favori</h3>
                <p className="text-muted-foreground">
                  Enregistrez vos produits préférés pour y accéder rapidement
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
