/**
 * PHASE 2: Gestion avancée des produits avec optimisation SEO et pricing IA
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Package, Search, TrendingUp, Eye, Edit, Trash2,
  Upload, Download, Filter, MoreHorizontal, Brain,
  DollarSign, BarChart3, Target, Zap, AlertTriangle,
  CheckCircle, Star, Globe, Image
} from 'lucide-react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { usePlanContext } from '@/components/plan'

interface Product {
  id: string
  name: string
  description: string
  price: number
  cost_price?: number
  profit_margin?: number
  sku: string
  category: string
  status: 'active' | 'inactive' | 'draft'
  stock_quantity: number
  image_url?: string
  seo: {
    title?: string
    description?: string
    keywords?: string[]
    score: number
  }
  performance: {
    views: number
    sales: number
    conversion_rate: number
    revenue: number
  }
  ai_suggestions?: {
    price_optimization: boolean
    seo_improvements: boolean
    content_enhancement: boolean
  }
  created_at: string
  updated_at: string
}

interface SEOAnalysis {
  score: number
  issues: Array<{
    type: 'warning' | 'error' | 'success'
    message: string
    suggestion: string
  }>
}

export const AdvancedProductManager: React.FC = () => {
  const { user } = useAuthOptimized()
  const { hasFeature } = usePlanContext()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTab, setSelectedTab] = useState('products')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    setLoading(true)
    
    // Mock data - en production, récupérer depuis l'API
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Chaise Gaming RGB Pro',
        description: 'Chaise gaming ergonomique avec éclairage RGB personnalisable et support lombaire ajustable.',
        price: 299.99,
        cost_price: 150.00,
        profit_margin: 50,
        sku: 'CHAIR-RGB-001',
        category: 'Gaming',
        status: 'active',
        stock_quantity: 25,
        image_url: '/placeholder-product.jpg',
        seo: {
          title: 'Chaise Gaming RGB Pro - Confort et Style',
          description: 'Découvrez notre chaise gaming RGB avec éclairage personnalisable. Ergonomique, confortable et stylée.',
          keywords: ['chaise gaming', 'RGB', 'ergonomique', 'pro'],
          score: 85
        },
        performance: {
          views: 1250,
          sales: 23,
          conversion_rate: 1.84,
          revenue: 6899.77
        },
        ai_suggestions: {
          price_optimization: true,
          seo_improvements: false,
          content_enhancement: true
        },
        created_at: '2024-01-10',
        updated_at: '2024-01-15'
      },
      {
        id: '2',
        name: 'Casque Audio Bluetooth Premium',
        description: 'Casque sans fil avec réduction de bruit active et autonomie 30h.',
        price: 159.99,
        cost_price: 80.00,
        profit_margin: 50,
        sku: 'HEADPHONES-BT-002',
        category: 'Audio',
        status: 'active',
        stock_quantity: 12,
        seo: {
          title: 'Casque Audio Bluetooth Premium',
          description: 'Casque bluetooth avec réduction de bruit.',
          keywords: ['casque', 'bluetooth', 'audio'],
          score: 65
        },
        performance: {
          views: 890,
          sales: 15,
          conversion_rate: 1.69,
          revenue: 2399.85
        },
        ai_suggestions: {
          price_optimization: false,
          seo_improvements: true,
          content_enhancement: true
        },
        created_at: '2024-01-12',
        updated_at: '2024-01-14'
      }
    ]

    setProducts(mockProducts)
    setLoading(false)
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action ${action} for products:`, selectedProducts)
    // Implémenter les actions en masse
  }

  const handleProductEdit = (product: Product) => {
    setEditingProduct(product)
  }

  const handlePriceOptimization = (productId: string) => {
    // Appeler l'API d'optimisation des prix par IA
    console.log('Optimizing price for product:', productId)
  }

  const handleSEOOptimization = (productId: string) => {
    // Appeler l'API d'optimisation SEO par IA
    console.log('Optimizing SEO for product:', productId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'inactive': return 'bg-red-500'
      case 'draft': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Package className="h-8 w-8 mr-3 text-primary" />
            Gestion Avancée des Produits
          </h1>
          <p className="text-muted-foreground">
            Optimisation IA, SEO avancé et analytics détaillés
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
        </div>
      </div>

      {/* Métriques rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits totaux</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter(p => p.status === 'active').length} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + p.performance.revenue, 0).toLocaleString()}€
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion moyenne</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.length > 0 ? (
                products.reduce((sum, p) => sum + p.performance.conversion_rate, 0) / products.length
              ).toFixed(2) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score SEO moyen</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.length > 0 ? (
                products.reduce((sum, p) => sum + p.seo.score, 0) / products.length
              ).toFixed(0) : 0}/100
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Rechercher par nom ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Gaming">Gaming</SelectItem>
                <SelectItem value="Audio">Audio</SelectItem>
                <SelectItem value="Tech">Tech</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedProducts.length > 0 && (
              <Select onValueChange={handleBulkAction}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Actions en masse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Activer</SelectItem>
                  <SelectItem value="deactivate">Désactiver</SelectItem>
                  <SelectItem value="delete">Supprimer</SelectItem>
                  <SelectItem value="export">Exporter</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Produits ({filteredProducts.length})</TabsTrigger>
          <TabsTrigger value="seo">Optimisation SEO</TabsTrigger>
          <TabsTrigger value="pricing">Pricing IA</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map(product => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product.id])
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                          }
                        }}
                      />
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(product.status)} text-white`}>
                      {product.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      SKU: {product.sku} • {product.category}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Prix et marge */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Prix de vente</div>
                      <div className="font-bold text-lg">{product.price.toFixed(2)}€</div>
                    </div>
                    {product.profit_margin && (
                      <div>
                        <div className="text-muted-foreground">Marge</div>
                        <div className="font-bold text-lg text-green-600">{product.profit_margin}%</div>
                      </div>
                    )}
                  </div>

                  {/* Performance */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Vues: {product.performance.views}</span>
                      <span>Ventes: {product.performance.sales}</span>
                    </div>
                    <Progress 
                      value={product.performance.conversion_rate} 
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      Conversion: {product.performance.conversion_rate}% • 
                      Revenus: {product.performance.revenue.toFixed(0)}€
                    </div>
                  </div>

                  {/* SEO Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Score SEO</span>
                    <div className="flex items-center gap-2">
                      <div className={`font-bold ${getSEOScoreColor(product.seo.score)}`}>
                        {product.seo.score}/100
                      </div>
                      {product.seo.score < 80 && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>

                  {/* Suggestions IA */}
                  {hasFeature('ai_optimization') && product.ai_suggestions && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg">
                      <div className="text-sm font-medium flex items-center mb-2">
                        <Brain className="h-4 w-4 mr-2 text-purple-600" />
                        Suggestions IA
                      </div>
                      <div className="space-y-1 text-xs">
                        {product.ai_suggestions.price_optimization && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            Optimisation prix recommandée
                          </div>
                        )}
                        {product.ai_suggestions.seo_improvements && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-blue-500" />
                            Améliorations SEO disponibles
                          </div>
                        )}
                        {product.ai_suggestions.content_enhancement && (
                          <div className="flex items-center gap-2">
                            <Edit className="h-3 w-3 text-orange-500" />
                            Contenu à améliorer
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleProductEdit(product)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                    {hasFeature('ai_optimization') && (
                      <Button size="sm" variant="outline">
                        <Brain className="h-3 w-3 mr-1" />
                        IA
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Optimisation SEO
              </CardTitle>
              <CardDescription>
                Améliorez le référencement de vos produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProducts.filter(p => p.seo.score < 80).map(product => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">Score actuel: {product.seo.score}/100</div>
                      </div>
                      <Button size="sm" onClick={() => handleSEOOptimization(product.id)}>
                        <Zap className="h-3 w-3 mr-1" />
                        Optimiser
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {product.seo.score < 80 && (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <AlertTriangle className="h-4 w-4" />
                          Titre SEO trop court (recommandé: 50-60 caractères)
                        </div>
                      )}
                      {product.seo.score < 70 && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          Description manquante ou trop courte
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Optimisation Pricing IA
              </CardTitle>
              <CardDescription>
                Optimisez vos prix avec l'intelligence artificielle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProducts.filter(p => p.ai_suggestions?.price_optimization).map(product => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">Prix actuel: {product.price.toFixed(2)}€</div>
                      </div>
                      <Button size="sm" onClick={() => handlePriceOptimization(product.id)}>
                        <Brain className="h-3 w-3 mr-1" />
                        Optimiser prix
                      </Button>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded text-sm">
                      <div className="font-medium text-green-800">Recommandation IA</div>
                      <div className="text-green-700">
                        Prix suggéré: {(product.price * 1.15).toFixed(2)}€ (+15%)
                      </div>
                      <div className="text-green-600 text-xs mt-1">
                        Revenus estimés: +{((product.price * 0.15) * product.performance.sales).toFixed(0)}€/mois
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Produits</CardTitle>
              <CardDescription>Performance détaillée par produit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Graphiques et analyses détaillées à implémenter
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}