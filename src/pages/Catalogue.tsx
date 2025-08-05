import { useState } from "react"
import { AppLayout } from "@/layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Star, Heart, ShoppingCart, Eye, Package, TrendingUp } from "lucide-react"

export default function Catalogue() {
  const [searchQuery, setSearchQuery] = useState("")

  const products = [
    {
      id: 1,
      name: "Montre intelligente Sport Pro",
      price: "89.99",
      originalPrice: "159.99",
      image: "/placeholder.svg",
      rating: 4.8,
      reviews: 234,
      category: "Électronique",
      supplier: "Tech Supplies",
      inStock: true,
      trending: true
    },
    {
      id: 2,
      name: "Écouteurs Bluetooth Premium",
      price: "45.99",
      originalPrice: "79.99",
      image: "/placeholder.svg",
      rating: 4.6,
      reviews: 189,
      category: "Audio",
      supplier: "AudioTech",
      inStock: true,
      trending: false
    }
  ]

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Catalogue & Sourcing</h1>
            <p className="text-muted-foreground mt-2">
              Découvrez et importez des produits gagnants pour votre boutique
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Package className="w-4 h-4 mr-2" />
              Importer Sélection
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des produits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Tous les produits</TabsTrigger>
            <TabsTrigger value="trending">Tendances</TabsTrigger>
            <TabsTrigger value="favorites">Favoris</TabsTrigger>
            <TabsTrigger value="compared">Comparés</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-200">
                  <CardHeader className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg bg-muted">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        {product.trending && (
                          <Badge className="bg-red-500">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                        {product.inStock && (
                          <Badge variant="secondary">En stock</Badge>
                        )}
                      </div>
                      <div className="absolute top-2 right-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 bg-white/80 hover:bg-white">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                      <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                      
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(product.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {product.rating} ({product.reviews})
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">€{product.price}</span>
                          <span className="text-sm text-muted-foreground line-through">
                            €{product.originalPrice}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Fournisseur: {product.supplier}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-3 h-3 mr-1" />
                          Détails
                        </Button>
                        <Button size="sm" className="flex-1">
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending">
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Produits Tendances</h3>
              <p className="text-muted-foreground">Découvrez les produits qui cartonnent actuellement</p>
            </div>
          </TabsContent>

          <TabsContent value="favorites">
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Favoris</h3>
              <p className="text-muted-foreground">Vos produits favoris apparaîtront ici</p>
            </div>
          </TabsContent>

          <TabsContent value="compared">
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Comparaison</h3>
              <p className="text-muted-foreground">Comparez les produits pour faire le meilleur choix</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}