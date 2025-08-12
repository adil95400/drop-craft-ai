import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Search, Download, Star, Settings, Zap, Puzzle, Crown, Sparkles } from "lucide-react"

export default function Plugins() {
  const [searchQuery, setSearchQuery] = useState("")

  const installedPlugins = [
    {
      id: 1,
      name: "Shopify Sync Pro",
      description: "Synchronisation avancée avec Shopify",
      category: "E-commerce",
      version: "2.1.4",
      active: true,
      premium: true,
      rating: 4.8,
      reviews: 234
    },
    {
      id: 2,
      name: "Email Marketing AI",
      description: "Automatisation email avec IA",
      category: "Marketing",
      version: "1.5.2",
      active: true,
      premium: false,
      rating: 4.6,
      reviews: 189
    },
    {
      id: 3,
      name: "Analytics Dashboard",
      description: "Tableau de bord analytics avancé",
      category: "Analytics",
      version: "3.0.1",
      active: false,
      premium: false,
      rating: 4.4,
      reviews: 156
    }
  ]

  const availablePlugins = [
    {
      id: 4,
      name: "WooCommerce Connect",
      description: "Intégration complète avec WooCommerce",
      category: "E-commerce",
      price: "€29/mois",
      premium: true,
      rating: 4.9,
      reviews: 512,
      featured: true
    },
    {
      id: 5,
      name: "SEO Optimizer",
      description: "Optimisation SEO automatique",
      category: "SEO",
      price: "Gratuit",
      premium: false,
      rating: 4.3,
      reviews: 298,
      featured: false
    },
    {
      id: 6,
      name: "Social Media Manager",
      description: "Gestion des réseaux sociaux",
      category: "Marketing",
      price: "€19/mois",
      premium: true,
      rating: 4.7,
      reviews: 423,
      featured: true
    }
  ]

  const categories = [
    { name: "E-commerce", count: 25, icon: "🛒" },
    { name: "Marketing", count: 18, icon: "📢" },
    { name: "Analytics", count: 12, icon: "📊" },
    { name: "SEO", count: 8, icon: "🔍" },
    { name: "Automation", count: 15, icon: "🤖" },
    { name: "Social Media", count: 10, icon: "📱" }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Plugins & App Store</h1>
            <p className="text-muted-foreground mt-2">
              Étendez les fonctionnalités de Shopopti avec des plugins
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Gérer Plugins
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Parcourir Store
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher des plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {categories.map((category, index) => (
            <Card key={index} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-2xl mb-2">{category.icon}</div>
                <h3 className="font-semibold text-sm">{category.name}</h3>
                <p className="text-xs text-muted-foreground">{category.count} plugins</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="installed" className="space-y-6">
          <TabsList>
            <TabsTrigger value="installed">Plugins Installés</TabsTrigger>
            <TabsTrigger value="browse">Parcourir</TabsTrigger>
            <TabsTrigger value="featured">Recommandés</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
          </TabsList>

          <TabsContent value="installed">
            <Card>
              <CardHeader>
                <CardTitle>Plugins Installés</CardTitle>
                <CardDescription>
                  Gérez vos plugins actifs et inactifs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {installedPlugins.map((plugin) => (
                    <div key={plugin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Puzzle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{plugin.name}</h3>
                            {plugin.premium && (
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                <Crown className="w-3 h-3 mr-1" />
                                Pro
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{plugin.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <Badge variant="outline">{plugin.category}</Badge>
                            <span className="text-xs text-muted-foreground">v{plugin.version}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{plugin.rating} ({plugin.reviews})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch checked={plugin.active} />
                          <span className="text-sm text-muted-foreground">
                            {plugin.active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">Configurer</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="browse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePlugins.map((plugin) => (
                <Card key={plugin.id} className="group hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Puzzle className="w-6 h-6 text-primary" />
                      </div>
                      {plugin.featured && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Recommandé
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{plugin.name}</CardTitle>
                        {plugin.premium && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{plugin.description}</CardDescription>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{plugin.category}</Badge>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{plugin.rating} ({plugin.reviews})</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">{plugin.price}</span>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          <Download className="w-3 h-3 mr-1" />
                          Installer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="featured">
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-primary" />
                    Plugins Recommandés
                  </CardTitle>
                  <CardDescription>
                    Sélection des meilleurs plugins pour votre activité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availablePlugins.filter(p => p.featured).map((plugin) => (
                      <div key={plugin.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Puzzle className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{plugin.name}</h3>
                            <p className="text-sm text-muted-foreground">{plugin.description}</p>
                          </div>
                        </div>
                        <Button size="sm">Installer</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="premium">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                  Plugins Premium
                </CardTitle>
                <CardDescription>
                  Débloquez des fonctionnalités avancées avec nos plugins premium
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availablePlugins.filter(p => p.premium).map((plugin) => (
                    <Card key={plugin.id} className="border-2 border-yellow-200">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                            <Crown className="w-6 h-6 text-white" />
                          </div>
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                            Premium
                          </Badge>
                        </div>
                        
                        <div>
                          <CardTitle className="text-lg">{plugin.name}</CardTitle>
                          <CardDescription>{plugin.description}</CardDescription>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">{plugin.price}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{plugin.rating}</span>
                            </div>
                          </div>
                          
                          <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600">
                            <Zap className="w-4 h-4 mr-2" />
                            Installer Premium
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}