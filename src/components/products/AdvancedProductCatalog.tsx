import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  BarChart3, 
  Zap, 
  Bot, 
  Star,
  TrendingUp,
  Eye,
  Edit,
  Copy,
  Trash,
  Download,
  Upload,
  RefreshCw,
  Settings,
  ChevronDown,
  Tag,
  Package,
  DollarSign
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useProductsUnified } from '@/hooks/unified'

interface BulkAction {
  id: string
  label: string
  icon: React.ElementType
  description: string
  type: 'optimization' | 'pricing' | 'inventory' | 'content' | 'export'
}

const BULK_ACTIONS: BulkAction[] = [
  {
    id: 'ai-optimize',
    label: 'Optimisation IA',
    icon: Bot,
    description: 'SEO, descriptions, catégories automatiques',
    type: 'optimization'
  },
  {
    id: 'price-optimize',
    label: 'Prix Intelligents',
    icon: DollarSign,
    description: 'Analyse concurrentielle et ajustement des prix',
    type: 'pricing'
  },
  {
    id: 'content-generate',
    label: 'Contenu Automatique',
    icon: Edit,
    description: 'Génération de descriptions et titres optimisés',
    type: 'content'
  },
  {
    id: 'category-auto',
    label: 'Catégorisation Auto',
    icon: Tag,
    description: 'Classification intelligente par IA',
    type: 'optimization'
  },
  {
    id: 'inventory-sync',
    label: 'Sync Stock',
    icon: Package,
    description: 'Synchronisation avec les fournisseurs',
    type: 'inventory'
  },
  {
    id: 'export-advanced',
    label: 'Export Avancé',
    icon: Download,
    description: 'Export vers marketplaces multiples',
    type: 'export'
  }
]

const CATEGORIES_ANALYTICS = [
  { name: 'Électronique', count: 1247, revenue: '€124,750', growth: '+12%', color: 'bg-blue-500' },
  { name: 'Mode', count: 856, revenue: '€86,430', growth: '+8%', color: 'bg-purple-500' },
  { name: 'Maison', count: 2341, revenue: '€198,120', growth: '+15%', color: 'bg-green-500' },
  { name: 'Sport', count: 432, revenue: '€45,890', growth: '+5%', color: 'bg-orange-500' },
  { name: 'Beauté', count: 678, revenue: '€78,650', growth: '+18%', color: 'bg-pink-500' }
]

export function AdvancedProductCatalog() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showBulkActions, setShowBulkActions] = useState(false)

  const { products, isLoading, stats } = useProductsUnified()

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  const executeBulkAction = (actionId: string) => {
    console.log(`Executing ${actionId} on ${selectedProducts.length} products`)
    // Ici, implémentation des actions bulk
    setSelectedProducts([])
    setShowBulkActions(false)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Catalogue Produits Avancé</h2>
          <p className="text-muted-foreground">
            Gestion intelligente avec optimisations IA et operations en masse
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedProducts.length > 0 && (
            <Badge variant="secondary" className="mr-2">
              {selectedProducts.length} sélectionnés
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => setShowBulkActions(!showBulkActions)}
            disabled={selectedProducts.length === 0}
          >
            <Zap className="h-4 w-4 mr-2" />
            Actions Bulk
          </Button>
          
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Button>
            <Bot className="h-4 w-4 mr-2" />
            IA Assistant
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valeur Totale</p>
                <p className="text-2xl font-bold">€{stats.totalValue?.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Faible</p>
                <p className="text-2xl font-bold">{stats.lowStock}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimisés IA</p>
                <p className="text-2xl font-bold">{Math.round(stats.total * 0.73)}</p>
              </div>
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Rated</p>
                <p className="text-2xl font-bold">{Math.round(stats.total * 0.31)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bulk Panel */}
      {showBulkActions && selectedProducts.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Actions en Masse ({selectedProducts.length} produits)
            </CardTitle>
            <CardDescription>
              Appliquez des optimisations et modifications sur plusieurs produits simultanément
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {BULK_ACTIONS.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-3 justify-start"
                  onClick={() => executeBulkAction(action.id)}
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="optimization">Optimisation IA</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Filtres et recherche */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, SKU, catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                    Toutes les catégories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {CATEGORIES_ANALYTICS.map((cat) => (
                    <DropdownMenuItem 
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                    >
                      <div className={`w-3 h-3 rounded-full mr-2 ${cat.color}`} />
                      {cat.name} ({cat.count})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              <Button variant="outline" onClick={handleSelectAll}>
                {selectedProducts.length === products.length ? 'Désélectionner' : 'Tout sélectionner'}
              </Button>
            </div>
          </div>

          {/* Liste/Grille des produits */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedProducts.includes(product.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleProductSelect(product.id)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg mb-3 relative overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2 flex gap-1">
                        {product.status === 'active' && (
                          <Badge variant="outline" className="h-5 text-xs bg-green-50">
                            Actif
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">€{product.price}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>En stock</span>
                        <span>{product.category}</span>
                      </div>
                      
                      <div className="flex gap-1 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Éditer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id}
                      className={`p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer ${
                        selectedProducts.includes(product.id) ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => handleProductSelect(product.id)}
                    >
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div className="md:col-span-2">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                        </div>
                        
                        <div>
                          <Badge variant="outline">{product.category}</Badge>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold">€{product.price}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="font-medium">En stock</p>
                          <p className="text-xs text-muted-foreground">unités</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="h-5 text-xs">
                            Actif
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {CATEGORIES_ANALYTICS.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${category.color}`} />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">{category.count} produits</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{category.revenue}</p>
                        <p className={`text-sm ${category.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {category.growth}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Optimisations IA Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Titres SEO optimisés</span>
                    <Badge>124 produits</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Descriptions enrichies</span>
                    <Badge>89 produits</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Catégories auto-assignées</span>
                    <Badge>156 produits</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Prix optimisés</span>
                    <Badge>67 produits</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Images redimensionnées</span>
                    <Badge>203 produits</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Assistant IA Catalogue</CardTitle>
                <CardDescription>
                  Optimisations automatiques pour améliorer vos performances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg">
                  <Bot className="h-4 w-4 mr-2" />
                  Optimiser tout le catalogue
                </Button>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>SEO Score moyen</span>
                    <span className="font-bold">78/100</span>
                  </div>
                  <Progress value={78} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Descriptions manquantes</span>
                    <span className="font-bold text-orange-600">23%</span>
                  </div>
                  <Progress value={77} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Images de qualité</span>
                    <span className="font-bold text-green-600">91%</span>
                  </div>
                  <Progress value={91} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommandations IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { text: "Optimiser 67 titres pour le SEO", priority: "high" },
                    { text: "Ajouter des mots-clés à 34 produits", priority: "medium" },
                    { text: "Mettre à jour 12 prix non-compétitifs", priority: "high" },
                    { text: "Enrichir 45 descriptions courtes", priority: "medium" },
                    { text: "Categoriser 23 produits mal classés", priority: "low" }
                  ].map((rec, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">{rec.text}</span>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                        {rec.priority === 'high' ? 'Urgent' : rec.priority === 'medium' ? 'Important' : 'Optionnel'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}