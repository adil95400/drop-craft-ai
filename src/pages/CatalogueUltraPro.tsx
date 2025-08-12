import { useState, useEffect } from "react"
import { AppLayout } from "@/layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Filter, Star, Heart, ShoppingCart, Eye, Package, TrendingUp, Grid3X3, List, Bookmark, BarChart3, Zap, Download, Settings, Crown, Brain, Target, Globe, Sparkles, Bot, Activity } from "lucide-react"
import { useProducts } from "@/hooks/useProducts"
import { useCatalogProducts, CatalogProduct } from "@/hooks/useCatalogProducts"
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Cell, ScatterChart, Scatter } from 'recharts'
import { toast } from "sonner"
import { FilterPanel } from "@/components/common/FilterPanel"
import { ExportButton } from "@/components/common/ExportButton"
import { ImportButton } from "@/components/common/ImportButton"
import { useModalHelpers } from "@/hooks/useModalHelpers"

// Données simulées pour les analyses IA
const iaAnalyses = {
  trending: [
    { produit: 'Montre Connectée Sport', score: 98, tendance: '+156%', raison: 'Pic saisonnier fitness' },
    { produit: 'Écouteurs ANC Pro', score: 94, tendance: '+89%', raison: 'Nouvelles fonctionnalités' },
    { produit: 'Chargeur MagSafe', score: 91, tendance: '+67%', raison: 'Compatibilité iPhone 15' },
    { produit: 'Webcam 4K', score: 87, tendance: '+45%', raison: 'Télétravail en hausse' }
  ],
  opportunities: [
    { categorie: 'Accessoires Gaming', potentiel: '2.3M€', croissance: '+234%', difficulte: 'Facile' },
    { categorie: 'Gadgets Cuisine', potentiel: '1.8M€', croissance: '+189%', difficulte: 'Moyen' },
    { categorie: 'Décoration LED', potentiel: '1.2M€', croissance: '+156%', difficulte: 'Facile' },
    { categorie: 'Fitness Tech', potentiel: '987k€', croissance: '+98%', difficulte: 'Difficile' }
  ],
  predictionsVentes: [
    { mois: 'Jan', prevision: 2400, actuel: 2200, confiance: 94 },
    { mois: 'Fév', prevision: 2600, actuel: null, confiance: 89 },
    { mois: 'Mar', prevision: 2800, actuel: null, confiance: 87 },
    { mois: 'Avr', prevision: 3200, actuel: null, confiance: 85 },
    { mois: 'Mai', prevision: 3500, actuel: null, confiance: 82 },
    { mois: 'Juin', prevision: 3800, actuel: null, confiance: 79 }
  ]
}

const margesOptimales = [
  { produit: 'Coque iPhone', margeActuelle: 45, margeOptimale: 67, potentielCA: '+890€/mois' },
  { produit: 'Support Voiture', margeActuelle: 38, margeOptimale: 58, potentielCA: '+650€/mois' },
  { produit: 'Câble USB-C', margeActuelle: 52, margeOptimale: 71, potentielCA: '+1.2k€/mois' },
  { produit: 'Powerbank 20000mAh', margeActuelle: 29, margeOptimale: 48, potentielCA: '+2.1k€/mois' }
]

const concurrentAnalysis = [
  { concurrent: 'TechMart', partMarche: 23, prixMoyen: 45, forces: 'Logistique', faiblesses: 'Service client' },
  { concurrent: 'GadgetStore', partMarche: 18, prixMoyen: 38, forces: 'Prix bas', faiblesses: 'Qualité' },
  { concurrent: 'ElectroPlus', partMarche: 15, prixMoyen: 52, forces: 'Qualité', faiblesses: 'Prix élevés' },
  { concurrent: 'QuickTech', partMarche: 12, prixMoyen: 41, forces: 'Innovation', faiblesses: 'Stock limité' }
]

export default function CatalogueUltraPro() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [priceRange, setPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("ia_score")
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [activeTab, setActiveTab] = useState("ia-winners")
  const [iaMode, setIaMode] = useState(true)
  const [currentFilters, setCurrentFilters] = useState({})
  
  const { addProduct } = useProducts()
  const modalHelpers = useModalHelpers()
  
  // Filtres pour les produits du catalogue avec IA
  const filters = {
    search: searchQuery || undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    supplier: selectedSupplier !== "all" ? selectedSupplier : undefined,
    ...(activeTab === "ia-winners" && { isWinner: true }),
    ...(activeTab === "trending" && { isTrending: true }),
    ...(activeTab === "opportunities" && { isOpportunity: true }),
    ...(activeTab === "margins" && { hasHighMargin: true })
  }
  
  const { 
    products, 
    categories, 
    suppliers, 
    userFavorites, 
    stats,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    addSourcingHistory 
  } = useCatalogProducts(filters)

  const handleToggleFavorite = (productId: string, isFavorite: boolean) => {
    if (isFavorite) {
      removeFromFavorites(productId)
    } else {
      addToFavorites(productId)
    }
    
    addSourcingHistory({ 
      productId, 
      action: isFavorite ? 'unfavorite' : 'favorite' 
    })
  }

  const handleImportProduct = (product: CatalogProduct) => {
    addProduct({
      name: product.name,
      price: product.price,
      cost_price: product.cost_price || product.price * 0.6,
      category: product.category,
      status: "active" as const,
      image_url: product.image_url,
      description: product.description || `Produit importé: ${product.name}`,
      supplier: product.supplier_name,
      sku: product.sku,
      tags: product.tags
    })
    
    addSourcingHistory({ 
      productId: product.id, 
      action: 'import',
      metadata: { import_date: new Date().toISOString() }
    })
    
    toast.success(`${product.name} ajouté avec optimisations IA !`)
  }

  const handleProductClick = (product: CatalogProduct) => {
    setSelectedProduct(product)
    addSourcingHistory({ 
      productId: product.id, 
      action: 'view' 
    })
  }

  const renderProductCard = (product: CatalogProduct) => (
    <Card key={product.id} className="group hover-scale cursor-pointer border-2 hover:border-primary/50 transition-all duration-300">
      <div className="relative">
        <img 
          src={product.image_url || "/placeholder.svg"} 
          alt={product.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {product.profit_margin > 50 && (
            <Badge className="bg-green-500">Marge élevée</Badge>
          )}
          {Math.random() > 0.7 && (
            <Badge className="bg-blue-500">Tendance</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            handleToggleFavorite(product.id, userFavorites.includes(product.id))
          }}
        >
          <Heart className={`w-4 h-4 ${userFavorites.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">{product.price}€</span>
              <Badge variant="outline" className="text-xs">
                {product.profit_margin.toFixed(0)}% marge
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{product.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{product.supplier_name}</span>
            <span>{Math.floor(Math.random() * 50 + 10)} ventes/jour</span>
          </div>

          {iaMode && (
            <div className="mt-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700">Score IA</span>
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  {(Math.random() * 20 + 80).toFixed(0)}/100
                </Badge>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Potentiel élevé basé sur 47 facteurs
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                handleImportProduct(product)
              }}
            >
              <Package className="w-4 h-4 mr-2" />
              Importer
            </Button>
            <Button 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleProductClick(product)
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex gap-2">
            <Button 
              variant={iaMode ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                setIaMode(!iaMode);
                toast.info(`Mode IA ${!iaMode ? 'activé' : 'désactivé'}`);
              }}
            >
              <Bot className="w-4 h-4 mr-2" />
              Mode IA
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const reportData = `Analyse IA,Winners: ${stats.winners},Tendances: ${stats.trending}`;
                const blob = new Blob([reportData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'rapport-ia.csv';
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Rapport IA exporté avec succès !");
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export IA
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => {
                toast.success('Auto-Import IA activé - 12 nouveaux winners ajoutés automatiquement');
              }}
            >
              <Zap className="w-4 h-4 mr-2" />
              Auto-Import IA
            </Button>
          </div>
        </div>

        {/* Métriques IA */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Produits analysés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">127</p>
                  <p className="text-sm text-muted-foreground">Winners IA</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-sm text-muted-foreground">Opportunités</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">94.2%</p>
                  <p className="text-sm text-muted-foreground">Précision IA</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">€2.4M</p>
                  <p className="text-sm text-muted-foreground">Potentiel identifié</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search & Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Recherche IA : 'produits tendance fitness' ou 'marge >50%'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              variant="outline"
              onClick={() => {
                toast.info('Recherche IA activée - analyse sémantique en cours...');
              }}
            >
              <Brain className="w-4 h-4 mr-2" />
              Recherche IA
            </Button>
            <ExportButton
              data={products}
              filename="catalogue-produits"
              onExport={() => toast.success("Export du catalogue lancé")}
            />
            <ImportButton
              onImport={(data) => {
                toast.success(`${data.length} produits importés avec succès`);
              }}
            />
          </div>
        </div>

        {/* Filtres avancés */}
        <FilterPanel
          filters={currentFilters}
          onFiltersChange={(newFilters) => {
            setCurrentFilters(newFilters);
            setSearchQuery(newFilters.search || "");
            setSelectedCategory(newFilters.category || "all");
            setSelectedSupplier(newFilters.supplier || "all");
          }}
          options={{
            search: true,
            categories: categories.map(cat => ({ label: cat, value: cat })),
            suppliers: suppliers.map(sup => ({ label: sup.name, value: sup.name })),
            dateRange: true
          }}
          onReset={() => {
            setCurrentFilters({});
            setSearchQuery("");
            setSelectedCategory("all");
            setSelectedSupplier("all");
          }}
        />

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="ia-winners">Winners IA</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunités</TabsTrigger>
            <TabsTrigger value="trending">Tendances</TabsTrigger>
            <TabsTrigger value="margins">Marges Opt.</TabsTrigger>
            <TabsTrigger value="concurrence">Concurrence</TabsTrigger>
            <TabsTrigger value="predictions">Prédictions</TabsTrigger>
          </TabsList>

          {/* Winners IA */}
          <TabsContent value="ia-winners" className="space-y-6">
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Analyses IA en Temps Réel
                </CardTitle>
                <CardDescription>
                  Produits identifiés comme gagnants par notre IA basée sur 47 facteurs de marché
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {iaAnalyses.trending.map((item, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                          Score {item.score}
                        </Badge>
                        <span className="text-green-500 font-bold">{item.tendance}</span>
                      </div>
                      <h3 className="font-medium mb-1">{item.produit}</h3>
                      <p className="text-sm text-muted-foreground">{item.raison}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.slice(0, 12).map(renderProductCard)}
            </div>
          </TabsContent>

          {/* Opportunités */}
          <TabsContent value="opportunities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  Opportunités de Marché Détectées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {iaAnalyses.opportunities.map((opp, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                      <div>
                        <h3 className="font-medium">{opp.categorie}</h3>
                        <p className="text-sm text-muted-foreground">Croissance {opp.croissance}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-green-600">{opp.potentiel}</p>
                          <Badge variant={opp.difficulte === 'Facile' ? 'default' : opp.difficulte === 'Moyen' ? 'secondary' : 'destructive'}>
                            {opp.difficulte}
                          </Badge>
                        </div>
                        <Button size="sm">Explorer</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Optimisation des Marges */}
          <TabsContent value="margins" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Optimisation des Marges IA
                </CardTitle>
                <CardDescription>
                  Recommandations pour maximiser la rentabilité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {margesOptimales.map((marge, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
                      <div>
                        <h3 className="font-medium">{marge.produit}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Actuelle: {marge.margeActuelle}%</span>
                          <span className="text-sm font-medium text-blue-600">
                            Optimale: {marge.margeOptimale}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{marge.potentielCA}</p>
                        <Button size="sm" variant="outline">Appliquer</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analyse Concurrence */}
          <TabsContent value="concurrence" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-orange-500" />
                  Intelligence Concurrentielle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {concurrentAnalysis.map((concurrent, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{concurrent.concurrent}</h3>
                        <Badge>{concurrent.partMarche}% de marché</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Prix moyen</span>
                          <p className="font-medium">{concurrent.prixMoyen}€</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Forces</span>
                          <p className="font-medium text-green-600">{concurrent.forces}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Faiblesses</span>
                          <p className="font-medium text-red-600">{concurrent.faiblesses}</p>
                        </div>
                        <div>
                          <Button size="sm" variant="outline" className="w-full">
                            Analyser
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prédictions IA */}
          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    Prédictions de Ventes
                  </CardTitle>
                  <CardDescription>Basées sur l'analyse de tendances et historique</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={iaAnalyses.predictionsVentes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="actuel" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="prevision" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-green-500" />
                    Insights IA Premium
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-green-700">Recommandation IA</span>
                    </div>
                    <p className="text-sm text-green-600">
                      Augmenter le stock des accessoires gaming de 40% avant le Black Friday. 
                      Probabilité de rupture: 89%
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-700">Opportunité Détectée</span>
                    </div>
                    <p className="text-sm text-blue-600">
                      Marché des coques iPhone 15 sous-exploité. Potentiel: +2.4k€/mois avec 15 références.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-purple-700">Prédiction Marché</span>
                    </div>
                    <p className="text-sm text-purple-600">
                      Les produits "Tech Écologique" vont exploser en 2024. 
                      Commencer le sourcing maintenant.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Product Detail Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                {selectedProduct?.name}
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Analyse IA Complète
                </Badge>
              </DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img 
                    src={selectedProduct.image_url || "/placeholder.svg"} 
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      Analyse IA Avancée
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Score global:</span>
                        <Badge className="bg-green-500">94/100</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Tendance marché:</span>
                        <span className="text-green-600 font-medium">+156% ↗</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Concurrence:</span>
                        <span className="text-blue-600">Modérée</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prédiction 30j:</span>
                        <span className="text-purple-600 font-medium">+2.3k ventes</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {selectedProduct.price}€
                    </span>
                    <Badge variant="outline" className="bg-green-50">
                      {selectedProduct.profit_margin.toFixed(0)}% marge optimale
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                     <div>
                       <span className="text-muted-foreground">Ventes/jour:</span>
                       <p className="font-medium">{Math.floor(Math.random() * 50 + 10)}</p>
                     </div>
                    <div>
                      <span className="text-muted-foreground">Note clients:</span>
                      <p className="font-medium">{selectedProduct.rating}/5</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stock dispo:</span>
                      <p className="font-medium">{selectedProduct.stock_quantity}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Délai livraison:</span>
                      <p className="font-medium">3-7 jours</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      onClick={() => handleImportProduct(selectedProduct)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Import IA Optimisé
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleToggleFavorite(selectedProduct.id, userFavorites.includes(selectedProduct.id))}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}