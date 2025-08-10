import { useState, useEffect } from "react"
import { AppLayout } from "@/layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { 
  Search, Filter, Star, Heart, ShoppingCart, Eye, Package, TrendingUp, 
  Grid3X3, List, Bookmark, BarChart3, Zap, Download, Settings, Crown, 
  Brain, Target, Globe, Sparkles, Bot, Activity, AlertTriangle, 
  CheckCircle, Clock, ArrowUpRight, ArrowDownRight, Layers,
  Smartphone, Monitor, Tablet, Users, MapPin, Calendar,
  RefreshCw, Play, Pause, SkipForward, Volume2, Headphones,
  Camera, Video, Mic, Speaker, Battery, Wifi, Bluetooth,
  Shield, Lock, Key, CreditCard, Wallet, Gift, Tag,
  ThumbsUp, MessageCircle, Share2, ExternalLink, Copy,
  PlusCircle, MinusCircle, RotateCcw, Maximize, Minimize
} from "lucide-react"
import { useProducts } from "@/hooks/useProducts"
import { useCatalogProducts, CatalogProduct } from "@/hooks/useCatalogProducts"
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts'
import { toast } from "sonner"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { FloatingElement } from "@/components/ui/floating-elements"

// Données simulées pour les analyses IA Ultra Pro
const iaAnalysesUltraPro = {
  realTimeAlerts: [
    { type: 'opportunity', message: 'Nouveau produit viral détecté: AirPods Max Clone', urgency: 'high', timeStamp: '2 min' },
    { type: 'warning', message: 'Stock faible détecté chez 3 fournisseurs principaux', urgency: 'medium', timeStamp: '5 min' },
    { type: 'success', message: '12 nouveaux winners ajoutés automatiquement', urgency: 'low', timeStamp: '8 min' },
    { type: 'trend', message: 'Pic de recherche +340% pour "Gaming RGB"', urgency: 'high', timeStamp: '12 min' }
  ],
  marketInsights: {
    totalVolume: 847200,
    growthRate: 23.4,
    competitiveIndex: 76,
    saturationLevel: 34,
    trendsCount: 89,
    opportunitiesValue: 2400000
  },
  aiPredictions: [
    { category: 'Electronics', nextWeek: '+89%', confidence: 94, aiScore: 98 },
    { category: 'Gaming', nextWeek: '+67%', confidence: 87, aiScore: 92 },
    { category: 'Home & Garden', nextWeek: '+45%', confidence: 79, aiScore: 85 },
    { category: 'Fashion', nextWeek: '+23%', confidence: 68, aiScore: 78 }
  ],
  smartRecommendations: [
    {
      title: "Import immédiat recommandé",
      products: ["iPhone 15 Case Transparent", "Gaming RGB Mousepad", "Wireless Charger Stand"],
      reason: "Pic de demande détecté + faible concurrence",
      urgency: "high",
      potential: "€8,400/mois"
    },
    {
      title: "Optimisation prix suggérée", 
      products: ["Bluetooth Earbuds Pro", "Phone Ring Holder", "Car Mount Magnetic"],
      reason: "Marge sous-optimale vs concurrence",
      urgency: "medium",
      potential: "€3,200/mois"
    },
    {
      title: "Nouveaux créneaux identifiés",
      products: ["Smart Pet Feeder", "LED Strip Gaming", "Portable Projector"],
      reason: "Tendances émergentes avec faible saturation",
      urgency: "low", 
      potential: "€12,000/mois"
    }
  ]
}

// Générateur de données produits avancées
const generateAdvancedProductData = (baseProduct: CatalogProduct) => ({
  ...baseProduct,
  aiScore: Math.floor(Math.random() * 20 + 80),
  trendingScore: Math.floor(Math.random() * 15 + 85),
  competitionLevel: ['Faible', 'Moyen', 'Élevé'][Math.floor(Math.random() * 3)],
  saturationIndex: Math.floor(Math.random() * 40 + 10),
  dailySales: Math.floor(Math.random() * 200 + 50),
  weeklyGrowth: (Math.random() * 100 - 20).toFixed(1),
  predictedDemand: Math.floor(Math.random() * 500 + 100),
  riskLevel: ['Très Faible', 'Faible', 'Moyen', 'Élevé'][Math.floor(Math.random() * 4)],
  marketCap: Math.floor(Math.random() * 50000 + 10000),
  supplierReliability: Math.floor(Math.random() * 20 + 80),
  shippingTime: Math.floor(Math.random() * 10 + 3),
  returnRate: (Math.random() * 5).toFixed(1),
  seasonalityIndex: Math.floor(Math.random() * 30 + 70),
  viralPotential: Math.floor(Math.random() * 40 + 60)
})

export default function CatalogueUltraProAdvanced() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [priceRange, setPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("ai_score")
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [activeTab, setActiveTab] = useState("ai-dashboard")
  const [aiMode, setAiMode] = useState(true)
  const [autoMode, setAutoMode] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [realTimeAlerts, setRealTimeAlerts] = useState(iaAnalysesUltraPro.realTimeAlerts)
  
  const { addProduct } = useProducts()
  
  // Filtres avancés pour les produits
  const filters = {
    search: searchQuery || undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    supplier: selectedSupplier !== "all" ? selectedSupplier : undefined,
    ...(activeTab === "ai-winners" && { isWinner: true }),
    ...(activeTab === "trending-now" && { isTrending: true }),
    ...(activeTab === "opportunities" && { isOpportunity: true }),
    ...(activeTab === "smart-import" && { hasHighMargin: true })
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

  // Simulation de mises à jour temps réel
  useEffect(() => {
    if (autoMode) {
      const interval = setInterval(() => {
        setRealTimeAlerts(prev => [
          {
            type: 'trend',
            message: `Nouveau pic détecté: +${Math.floor(Math.random() * 200 + 100)}% recherches`,
            urgency: 'high',
            timeStamp: 'maintenant'
          },
          ...prev.slice(0, 3)
        ])
      }, 15000)

      return () => clearInterval(interval)
    }
  }, [autoMode])

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

  const handleSmartImport = (product: CatalogProduct) => {
    const advancedData = generateAdvancedProductData(product)
    
    addProduct({
      name: product.name,
      price: product.price,
      cost_price: product.cost_price || product.price * 0.6,
      category: product.category,
      status: "active" as const,
      image_url: product.image_url,
      description: product.description || `Import IA Ultra Pro: ${product.name}`,
      supplier: product.supplier_name,
      sku: product.sku,
      tags: [...(product.tags || []), 'AI-Optimized', 'Ultra-Pro']
    })
    
    addSourcingHistory({ 
      productId: product.id, 
      action: 'smart_import',
      metadata: { 
        ai_score: advancedData.aiScore,
        import_type: 'ultra_pro',
        optimization_applied: true
      }
    })
    
    toast.success(`${product.name} importé avec optimisations IA Ultra Pro !`, {
      description: `Score IA: ${advancedData.aiScore}/100 • Marge optimisée automatiquement`
    })
  }

  const handleProductClick = (product: CatalogProduct) => {
    setSelectedProduct(product)
    addSourcingHistory({ 
      productId: product.id, 
      action: 'detailed_view' 
    })
  }

  const renderAdvancedProductCard = (product: CatalogProduct) => {
    const advancedData = generateAdvancedProductData(product)
    
    return (
      <EnhancedCard 
        key={product.id} 
        className="group cursor-pointer transition-all duration-500 hover:shadow-xl border-2 hover:border-primary/30"
        onClick={() => handleProductClick(product)}
      >
        <div className="relative overflow-hidden">
          <img 
            src={product.image_url || "/placeholder.svg"} 
            alt={product.name}
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Overlays et badges flottants */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {advancedData.aiScore >= 90 && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse">
                <Brain className="w-3 h-3 mr-1" />
                Winner IA
              </Badge>
            )}
            {parseFloat(advancedData.weeklyGrowth) > 50 && (
              <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Viral
              </Badge>
            )}
            {advancedData.competitionLevel === 'Faible' && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <Target className="w-3 h-3 mr-1" />
                Low Comp
              </Badge>
            )}
          </div>
          
          <div className="absolute top-2 left-2 flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(product.id, userFavorites.includes(product.id))
                    }}
                  >
                    <Heart className={`w-4 h-4 ${userFavorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </EnhancedButton>
                </TooltipTrigger>
                <TooltipContent>
                  {userFavorites.includes(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Score IA flottant */}
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-white text-sm font-bold">{advancedData.aiScore}/100</span>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          {/* Titre et description */}
          <div>
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {product.supplier_name} • SKU: {product.sku}
            </p>
          </div>
          
          {/* Prix et métriques principales */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">{product.price}€</span>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                {product.profit_margin.toFixed(0)}% marge
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Métriques avancées IA */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ventes/jour:</span>
              <span className="font-medium text-green-600">{advancedData.dailySales}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Croissance:</span>
              <span className={`font-medium ${parseFloat(advancedData.weeklyGrowth) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {advancedData.weeklyGrowth}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Concurrence:</span>
              <Badge 
                variant={advancedData.competitionLevel === 'Faible' ? 'default' : advancedData.competitionLevel === 'Moyen' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {advancedData.competitionLevel}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Potentiel viral:</span>
              <div className="flex items-center gap-1">
                <Progress value={advancedData.viralPotential} className="w-8 h-1" />
                <span className="text-xs">{advancedData.viralPotential}%</span>
              </div>
            </div>
          </div>

          {/* Analyse IA détaillée */}
          {aiMode && (
            <div className="mt-3 p-3 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">Analyse IA Ultra Pro</span>
                </div>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                  Score {advancedData.aiScore}/100
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-700">Fiabilité fournisseur:</span>
                  <div className="flex items-center gap-1">
                    <Progress value={advancedData.supplierReliability} className="w-12 h-1" />
                    <span className="font-medium">{advancedData.supplierReliability}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-700">Demande prédite:</span>
                  <span className="font-medium text-purple-900">{advancedData.predictedDemand} unités/mois</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-700">Risque investissement:</span>
                  <Badge 
                    variant={advancedData.riskLevel === 'Très Faible' || advancedData.riskLevel === 'Faible' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {advancedData.riskLevel}
                  </Badge>
                </div>
              </div>
              
              <p className="text-xs text-purple-600 mt-2 italic">
                Recommandation basée sur 73 facteurs de marché analysés en temps réel
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <EnhancedButton 
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={(e) => {
                e.stopPropagation()
                handleSmartImport(product)
              }}
              loading={false}
            >
              <Zap className="w-4 h-4 mr-2" />
              Import IA
            </EnhancedButton>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <EnhancedButton 
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleProductClick(product)
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </EnhancedButton>
                </TooltipTrigger>
                <TooltipContent>Voir détails complets</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <EnhancedButton 
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(`${product.name} - Score IA: ${advancedData.aiScore}/100`)
                      toast.success('Informations copiées !')
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </EnhancedButton>
                </TooltipTrigger>
                <TooltipContent>Copier les détails</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </EnhancedCard>
    )
  }

  return (
    <AppLayout>
      <FloatingElement>
        <div className="floating-bg" />
      </FloatingElement>
      
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header Ultra Pro */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 rounded-xl blur-xl" />
          <div className="relative bg-gradient-to-r from-background via-background to-background rounded-xl border border-primary/20 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                  <Brain className="w-10 h-10 text-purple-600" />
                  Catalogue Ultra Pro Advanced
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 animate-pulse">
                    <Sparkles className="w-3 h-3 mr-1" />
                    IA NextGen
                  </Badge>
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Plateforme de sourcing intelligente avec IA prédictive avancée et analyses de marché en temps réel
                </p>
                
                {/* Métriques temps réel */}
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-muted-foreground">IA Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Mis à jour il y a 12s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Sources: 47 marketplaces</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mode IA:</span>
                  <Switch checked={aiMode} onCheckedChange={setAiMode} />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Auto-Import:</span>
                  <Switch checked={autoMode} onCheckedChange={setAutoMode} />
                </div>
                
                <EnhancedButton variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Rapport IA
                </EnhancedButton>
                
                <EnhancedButton className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Bot className="w-4 h-4 mr-2" />
                  Assistant IA
                </EnhancedButton>
              </div>
            </div>
          </div>
        </div>

        {/* Alertes temps réel */}
        {realTimeAlerts.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Activity className="w-5 h-5" />
                Alertes Temps Réel
                <Badge className="bg-orange-500 text-white animate-pulse">Live</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {realTimeAlerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      {alert.type === 'opportunity' && <Target className="w-4 h-4 text-green-500" />}
                      {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      {alert.type === 'success' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                      {alert.type === 'trend' && <TrendingUp className="w-4 h-4 text-purple-500" />}
                      <span className="text-sm font-medium">{alert.message}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={alert.urgency === 'high' ? 'destructive' : alert.urgency === 'medium' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {alert.urgency === 'high' ? 'Urgent' : alert.urgency === 'medium' ? 'Important' : 'Info'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{alert.timeStamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métriques IA Ultra Pro */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <EnhancedCard className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-500" />
                <div>
                  <AnimatedCounter value={iaAnalysesUltraPro.marketInsights.totalVolume} className="text-2xl font-bold" />
                  <p className="text-sm text-muted-foreground">Produits analysés</p>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
          
          <EnhancedCard className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <AnimatedCounter value={iaAnalysesUltraPro.marketInsights.growthRate} className="text-2xl font-bold" /><span className="text-2xl font-bold">%</span>
                  <p className="text-sm text-muted-foreground">Croissance marché</p>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
          
          <EnhancedCard className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-500" />
                <div>
                  <AnimatedCounter value={iaAnalysesUltraPro.marketInsights.competitiveIndex} className="text-2xl font-bold" />
                  <p className="text-sm text-muted-foreground">Index concurrentiel</p>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
          
          <EnhancedCard className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-orange-500" />
                <div>
                  <AnimatedCounter value={iaAnalysesUltraPro.marketInsights.saturationLevel} className="text-2xl font-bold" /><span className="text-2xl font-bold">%</span>
                  <p className="text-sm text-muted-foreground">Saturation moyenne</p>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
          
          <EnhancedCard className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                <div>
                  <AnimatedCounter value={iaAnalysesUltraPro.marketInsights.trendsCount} className="text-2xl font-bold" />
                  <p className="text-sm text-muted-foreground">Tendances actives</p>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
          
          <EnhancedCard className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-pink-500" />
                <div>
                  <AnimatedCounter value={iaAnalysesUltraPro.marketInsights.opportunitiesValue / 1000000} className="text-2xl font-bold" /><span className="text-2xl font-bold">M€</span>
                  <p className="text-sm text-muted-foreground">Potentiel identifié</p>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
        </div>

        {/* Recherche avancée */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Recherche IA Ultra Pro : 'produits viral gaming', 'marge >60%', 'croissance +100%'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <EnhancedButton variant="outline" size="sm">
                  <Brain className="w-4 h-4 mr-2" />
                  Recherche IA
                </EnhancedButton>
                
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation par onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-7 gap-1 h-auto p-1">
            <TabsTrigger value="ai-dashboard" className="flex flex-col gap-1 h-auto py-3">
              <Bot className="w-4 h-4" />
              <span className="text-xs">Dashboard IA</span>
            </TabsTrigger>
            <TabsTrigger value="ai-winners" className="flex flex-col gap-1 h-auto py-3">
              <Crown className="w-4 h-4" />
              <span className="text-xs">Winners IA</span>
            </TabsTrigger>
            <TabsTrigger value="trending-now" className="flex flex-col gap-1 h-auto py-3">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Tendances</span>
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex flex-col gap-1 h-auto py-3">
              <Target className="w-4 h-4" />
              <span className="text-xs">Opportunités</span>
            </TabsTrigger>
            <TabsTrigger value="smart-import" className="flex flex-col gap-1 h-auto py-3">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Import IA</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex flex-col gap-1 h-auto py-3">
              <Activity className="w-4 h-4" />
              <span className="text-xs">Prédictions</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col gap-1 h-auto py-3">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard IA */}
          <TabsContent value="ai-dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recommandations intelligentes */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-500" />
                    Recommandations IA Ultra Pro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {iaAnalysesUltraPro.smartRecommendations.map((rec, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{rec.title}</h3>
                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          </div>
                          <Badge 
                            variant={rec.urgency === 'high' ? 'destructive' : rec.urgency === 'medium' ? 'secondary' : 'outline'}
                          >
                            {rec.urgency === 'high' ? 'Urgent' : rec.urgency === 'medium' ? 'Important' : 'Standard'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {rec.products.map((product, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {product}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">{rec.potential}</span>
                            <EnhancedButton size="sm">
                              Appliquer
                            </EnhancedButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Prédictions IA */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Prédictions 7 Jours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {iaAnalysesUltraPro.aiPredictions.map((pred, index) => (
                      <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{pred.category}</span>
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            Score {pred.aiScore}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">{pred.nextWeek}</span>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Confiance</div>
                            <Progress value={pred.confidence} className="w-16 h-1 mt-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Winners IA */}
          <TabsContent value="ai-winners" className="space-y-6">
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {products.slice(0, 16).map(renderAdvancedProductCard)}
            </div>
          </TabsContent>

          {/* Autres onglets */}
          <TabsContent value="trending-now" className="space-y-6">
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {products.filter(p => Math.random() > 0.6).slice(0, 12).map(renderAdvancedProductCard)}
            </div>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {products.filter(p => Math.random() > 0.7).slice(0, 8).map(renderAdvancedProductCard)}
            </div>
          </TabsContent>

          <TabsContent value="smart-import" className="space-y-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Import Intelligent Automatisé
                </CardTitle>
                <CardDescription>
                  L'IA sélectionne et optimise automatiquement les meilleurs produits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <EnhancedButton className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                    <Bot className="w-4 h-4 mr-2" />
                    Lancer Import Auto
                  </EnhancedButton>
                  <div className="text-sm text-muted-foreground">
                    Dernière exécution: il y a 2h • 12 produits importés
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {products.filter(p => p.profit_margin > 40).slice(0, 12).map(renderAdvancedProductCard)}
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prédictions de Marché IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { mois: 'Jan', demande: 120, prix: 45 },
                      { mois: 'Fév', demande: 190, prix: 48 },
                      { mois: 'Mar', demande: 280, prix: 52 },
                      { mois: 'Avr', demande: 340, prix: 55 },
                      { mois: 'Mai', demande: 420, prix: 58 },
                      { mois: 'Juin', demande: 480, prix: 62 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="demande" stroke="#8884d8" />
                      <Line type="monotone" dataKey="prix" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance par Catégorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { category: 'Electronics', score: 94 },
                        { category: 'Gaming', score: 87 },
                        { category: 'Home', score: 76 },
                        { category: 'Fashion', score: 65 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="score" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition des Scores IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <RechartsTooltip />
                        <Pie
                          dataKey="value"
                          data={[
                            { name: '90-100 (Excellent)', value: 23, fill: '#00C49F' },
                            { name: '80-90 (Très bon)', value: 35, fill: '#0088FE' },
                            { name: '70-80 (Bon)', value: 28, fill: '#FFBB28' },
                            { name: '60-70 (Moyen)', value: 14, fill: '#FF8042' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog produit détaillé */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedProduct?.name}
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Analyse IA Complète
                </Badge>
              </DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <img 
                    src={selectedProduct.image_url || "/placeholder.svg"} 
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{selectedProduct.price}€</div>
                        <div className="text-sm text-muted-foreground">Prix de vente</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedProduct.profit_margin.toFixed(0)}%</div>
                        <div className="text-sm text-muted-foreground">Marge bénéficiaire</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Description du produit</h3>
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Analyse IA Ultra Pro</h3>
                    <div className="space-y-3">
                      {generateAdvancedProductData(selectedProduct) && (() => {
                        const data = generateAdvancedProductData(selectedProduct)
                        return (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <div className="text-lg font-bold text-purple-600">{data.aiScore}/100</div>
                              <div className="text-sm text-purple-700">Score IA Global</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="text-lg font-bold text-green-600">{data.dailySales}</div>
                              <div className="text-sm text-green-700">Ventes/jour estimées</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="text-lg font-bold text-blue-600">{data.predictedDemand}</div>
                              <div className="text-sm text-blue-700">Demande prédite (mois)</div>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg">
                              <div className="text-lg font-bold text-orange-600">{data.viralPotential}%</div>
                              <div className="text-sm text-orange-700">Potentiel viral</div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <EnhancedButton 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={() => handleSmartImport(selectedProduct)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Import avec IA
                    </EnhancedButton>
                    <EnhancedButton 
                      variant="outline"
                      onClick={() => handleToggleFavorite(selectedProduct.id, userFavorites.includes(selectedProduct.id))}
                    >
                      <Heart className={`w-4 h-4 ${userFavorites.includes(selectedProduct.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </EnhancedButton>
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