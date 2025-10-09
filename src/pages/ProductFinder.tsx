import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Search, TrendingUp, Zap, Target, Star, DollarSign, Package, AlertCircle } from 'lucide-react'

export default function ProductFinder() {
  const { toast } = useToast()
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')

  const handleSearch = async () => {
    setSearching(true)
    try {
      // Simuler une recherche AI
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({
        title: "Recherche terminée",
        description: "Produits gagnants trouvés avec l'IA"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la recherche",
        variant: "destructive"
      })
    } finally {
      setSearching(false)
    }
  }

  const winningProducts = [
    {
      id: 1,
      name: "Smart LED Light Strip",
      image: "/placeholder.svg",
      score: 98,
      trend: "+145%",
      competition: "Faible",
      profit: "45-60%",
      source: "AliExpress",
      price: 12.99,
      suggestedPrice: 39.99,
      orders: "5.2K/mois",
      rating: 4.8,
      tags: ["Trending", "High Profit", "Low Competition"]
    },
    {
      id: 2,
      name: "Portable Blender",
      image: "/placeholder.svg",
      score: 95,
      trend: "+120%",
      competition: "Moyenne",
      profit: "40-55%",
      source: "AliExpress",
      price: 15.50,
      suggestedPrice: 42.99,
      orders: "4.8K/mois",
      rating: 4.7,
      tags: ["Trending", "High Demand"]
    },
    {
      id: 3,
      name: "Wireless Car Charger",
      image: "/placeholder.svg",
      score: 92,
      trend: "+98%",
      competition: "Faible",
      profit: "50-65%",
      source: "CJDropshipping",
      price: 8.99,
      suggestedPrice: 29.99,
      orders: "3.9K/mois",
      rating: 4.9,
      tags: ["Hot", "Quick Ship"]
    }
  ]

  const aiInsights = [
    {
      icon: TrendingUp,
      title: "Tendance du marché",
      value: "+127% cette semaine",
      color: "text-success"
    },
    {
      icon: Target,
      title: "Opportunités détectées",
      value: "23 niches rentables",
      color: "text-primary"
    },
    {
      icon: Zap,
      title: "Vitesse de vente",
      value: "92% de conversion",
      color: "text-warning"
    },
    {
      icon: DollarSign,
      title: "Marge moyenne",
      value: "55% de profit",
      color: "text-success"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Product Finder AI</h1>
        <p className="text-muted-foreground">Trouvez des produits gagnants avec l'intelligence artificielle</p>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {aiInsights.map((insight, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${insight.color}`}>
                  <insight.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{insight.title}</p>
                  <p className="text-lg font-bold">{insight.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche intelligente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Mot-clé ou niche</Label>
              <Input
                placeholder="Ex: fitness, tech, beauty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="electronics">Électronique</SelectItem>
                  <SelectItem value="fashion">Mode</SelectItem>
                  <SelectItem value="home">Maison</SelectItem>
                  <SelectItem value="beauty">Beauté</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plateforme source</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les plateformes</SelectItem>
                  <SelectItem value="aliexpress">AliExpress</SelectItem>
                  <SelectItem value="cj">CJ Dropshipping</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="temu">Temu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSearch} disabled={searching} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {searching ? "Recherche en cours..." : "Rechercher avec l'IA"}
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="winning">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="winning">
            <Star className="h-4 w-4 mr-2" />
            Produits gagnants
          </TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Tendances
          </TabsTrigger>
          <TabsTrigger value="saturated">
            <AlertCircle className="h-4 w-4 mr-2" />
            Produits saturés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="winning" className="space-y-4">
          {winningProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{product.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {product.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-success">
                          Score: {product.score}/100
                        </div>
                        <div className="text-sm text-success">{product.trend}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Prix fournisseur</p>
                        <p className="font-bold">${product.price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Prix suggéré</p>
                        <p className="font-bold text-success">${product.suggestedPrice}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Marge profit</p>
                        <p className="font-bold">{product.profit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Commandes/mois</p>
                        <p className="font-bold">{product.orders}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="font-semibold">{product.rating}</span>
                        </div>
                        <Badge variant="outline">{product.source}</Badge>
                        <Badge variant="outline">Compétition: {product.competition}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Package className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>
                        <Button size="sm">
                          Importer
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="trending">
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Analyse des tendances en cours...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saturated">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-warning" />
              <p className="text-muted-foreground">
                Produits à éviter en raison de la saturation du marché
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
