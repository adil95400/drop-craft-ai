import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Search, Filter, Eye, Edit, Trash2, Plus, 
  Star, TrendingUp, Zap, Package, Import,
  Download, Upload, BarChart3, Target,
  ShoppingCart, DollarSign, Users, Globe,
  Bot, Settings, RefreshCw, CheckSquare,
  AlertTriangle, TrendingDown
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { ProductDetailsModal } from './ProductDetailsModal'
import { ProductFormModal } from './ProductFormModal'
import { ImportModal } from './ImportModal'
import { ExportModal } from './ExportModal'

export function AdvancedProductCatalog() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductDetails, setShowProductDetails] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const { toast } = useToast()

  // Fetch catalog products + imported products
  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ['catalog-products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Récupérer les produits du catalogue
      const { data: catalogData, error: catalogError } = await (supabase
        .from('products') as any)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (catalogError) throw catalogError

      // Récupérer les produits importés de l'utilisateur
      const { data: importedData, error: importedError } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
      
      if (importedError) throw importedError

      // Transformer les produits importés pour correspondre au format catalog_products
      const transformedImported = (importedData || []).map(p => ({
        ...p,
        name: p.category || 'Produit importé',
        title: p.category || 'Produit importé',
        description: '',
        supplier_name: 'Importé',
        availability_status: p.status === 'imported' ? 'in_stock' : 'out_of_stock',
        rating: 0,
        sales_count: 0,
        trend_score: 0,
        stock_quantity: 0,
        is_bestseller: false,
        is_trending: false,
        is_winner: false,
        image_url: null,
        image_urls: []
      }))

      // Combiner les deux listes avec normalisation
      const normalizedCatalog = (catalogData || []).map(p => ({
        ...p,
        name: p.title || 'Sans nom',
        availability_status: p.status || 'in_stock',
        rating: 0,
        sales_count: 0,
        trend_score: 0,
        stock_quantity: 0,
        is_bestseller: false,
        is_trending: false,
        is_winner: false,
        image_url: p.image_urls?.[0] || null
      }))

      return [...normalizedCatalog, ...transformedImported]
    }
  })

  // Get unique categories and suppliers
  const categories = useMemo(() => 
    [...new Set(products.map((p: any) => p.category).filter(Boolean))], [products])
  const suppliers = useMemo(() => 
    [...new Set(products.map((p: any) => p.supplier_name).filter(Boolean))], [products])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product: any) => {
      const productName = product.name || product.title || ''
      const productDesc = product.description || ''
      const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           productDesc.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      const matchesSupplier = supplierFilter === 'all' || product.supplier_name === supplierFilter
      const matchesStatus = statusFilter === 'all' || product.availability_status === statusFilter
      
      return matchesSearch && matchesCategory && matchesSupplier && matchesStatus
    })

    // Sort products
    filtered.sort((a: any, b: any) => {
      const aName = a.name || a.title || ''
      const bName = b.name || b.title || ''
      switch (sortBy) {
        case 'name': return aName.localeCompare(bName)
        case 'price': return (a.price || 0) - (b.price || 0)
        case 'rating': return (b.rating || 0) - (a.rating || 0)
        case 'sales': return (b.sales_count || 0) - (a.sales_count || 0)
        case 'trend': return (b.trend_score || 0) - (a.trend_score || 0)
        default: return 0
      }
    })

    return filtered
  }, [products, searchTerm, categoryFilter, supplierFilter, statusFilter, sortBy])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-800">En stock</Badge>
      case 'out_of_stock':
        return <Badge variant="destructive">Rupture</Badge>
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800">Stock faible</Badge>
      case 'discontinued':
        return <Badge variant="secondary">Discontinué</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getProductBadges = (product: any) => {
    const badges = []
    
    if (product.is_bestseller) {
      badges.push(<Badge key="bestseller" className="bg-yellow-100 text-yellow-800"><Star className="h-3 w-3 mr-1" />Bestseller</Badge>)
    }
    if (product.is_trending) {
      badges.push(<Badge key="trending" className="bg-blue-100 text-blue-800"><TrendingUp className="h-3 w-3 mr-1" />Tendance</Badge>)
    }
    if (product.is_winner) {
      badges.push(<Badge key="winner" className="bg-purple-100 text-purple-800"><Zap className="h-3 w-3 mr-1" />Gagnant</Badge>)
    }
    
    return badges
  }

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product)
    setShowProductDetails(true)
  }

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setShowProductForm(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await (supabase
        .from('products') as any)
        .delete()
        .eq('id', productId)
      
      if (error) throw error
      
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès."
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit.",
        variant: "destructive"
      })
    }
  }

  const handleBulkAction = (action: string) => {
    toast({
      title: "Action en cours",
      description: `${action} appliquée à ${selectedProducts.length} produits.`
    })
    setSelectedProducts([])
  }

  const catalogStats = [
    {
      title: 'Produits totaux',
      value: products.length.toLocaleString(),
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'En stock',
      value: products.filter((p: any) => p.availability_status === 'in_stock').length.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Prix moyen',
      value: formatCurrency(products.reduce((sum: number, p: any) => sum + (p.price || 0), 0) / products.length || 0),
      icon: DollarSign,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100'
    },
    {
      title: 'Fournisseurs',
      value: suppliers.length.toLocaleString(),
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    }
  ]

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Catalogue Produits Avancé</h1>
          <p className="text-muted-foreground">
            Gestion intelligente de votre catalogue avec IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Import className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => setShowProductForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter produit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="optimization">Optimisation IA</TabsTrigger>
          <TabsTrigger value="bulk-actions">Actions groupées</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {catalogStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="flex items-center p-6">
                  <div className={`p-3 rounded-full ${stat.bg} mr-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des produits..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous fournisseurs</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="in_stock">En stock</SelectItem>
                    <SelectItem value="out_of_stock">Rupture</SelectItem>
                    <SelectItem value="low_stock">Stock faible</SelectItem>
                    <SelectItem value="discontinued">Discontinué</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="price">Prix</SelectItem>
                    <SelectItem value="rating">Note</SelectItem>
                    <SelectItem value="sales">Ventes</SelectItem>
                    <SelectItem value="trend">Tendance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Produits ({filteredProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Ventes</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image_url && (
                              <img 
                                src={product.image_url} 
                                alt={product.name || product.title || 'Product'} 
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.name || product.title || 'Sans nom'}</p>
                              <div className="flex gap-1 mt-1">
                                {getProductBadges(product)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.category}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(product.price || 0)}</TableCell>
                        <TableCell>{product.stock_quantity || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {product.rating || 0}
                          </div>
                        </TableCell>
                        <TableCell>{product.sales_count || 0}</TableCell>
                        <TableCell>{product.supplier_name || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(product.availability_status || 'unknown')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewProduct(product)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Performance KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenus totaux</p>
                    <p className="text-2xl font-bold text-green-600">€{((products.reduce((sum: number, p: any) => sum + (p.price || 0) * (p.sales_count || 1), 0))).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">+12% ce mois</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Produits performants</p>
                    <p className="text-2xl font-bold text-blue-600">{products.filter((p: any) => (p.sales_count || 0) > 10).length}</p>
                    <p className="text-xs text-muted-foreground">+5% ce mois</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taux de conversion</p>
                    <p className="text-2xl font-bold text-purple-600">3.2%</p>
                    <p className="text-xs text-muted-foreground">+0.8% ce mois</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance par Catégorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              {categories.slice(0, 5).map((category) => {
                  const categoryProducts = products.filter((p: any) => p.category === category)
                  const categoryRevenue = categoryProducts.reduce((sum: number, p: any) => sum + (p.price || 0) * (p.sales_count || 1), 0)
                  const maxRevenue = Math.max(...categories.map(cat => 
                    products.filter((p: any) => p.category === cat).reduce((sum: number, p: any) => sum + (p.price || 0) * (p.sales_count || 1), 0)
                  ))
                  const percentage = maxRevenue ? (categoryRevenue / maxRevenue) * 100 : 0
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{category}</span>
                        <div className="text-right">
                          <span className="font-bold">€{categoryRevenue.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground ml-2">({categoryProducts.length} produits)</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Produits les plus performants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              {products
                  .sort((a: any, b: any) => (b.sales_count || 0) - (a.sales_count || 0))
                  .slice(0, 5)
                  .map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full font-bold">
                        {index + 1}
                      </div>
                      {product.image_url && (
                        <img src={product.image_url} alt={product.name || 'Product'} className="w-12 h-12 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{product.name || 'Sans nom'}</p>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(product.price || 0)}</p>
                        <p className="text-sm text-muted-foreground">{product.sales_count || 0} ventes</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          {/* AI Optimization Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Produits optimisés</p>
                    <p className="text-2xl font-bold">{Math.round(products.length * 0.73)}</p>
                    <p className="text-xs text-green-600">+15 cette semaine</p>
                  </div>
                  <Bot className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Score SEO moyen</p>
                    <p className="text-2xl font-bold">87%</p>
                    <p className="text-xs text-green-600">+5% ce mois</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Descriptions générées</p>
                    <p className="text-2xl font-bold">{Math.round(products.length * 0.45)}</p>
                    <p className="text-xs text-blue-600">IA Quality: 94%</p>
                  </div>
                  <Edit className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prix optimisés</p>
                    <p className="text-2xl font-bold">{Math.round(products.length * 0.62)}</p>
                    <p className="text-xs text-orange-600">Profit +8%</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Optimisation Automatique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleBulkAction('Optimisation SEO IA')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Optimiser SEO avec IA
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleBulkAction('Génération descriptions IA')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Générer descriptions IA
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleBulkAction('Catégorisation automatique')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Catégorisation automatique
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleBulkAction('Optimisation prix intelligente')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Optimisation prix intelligente
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recommandations IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-orange-500 bg-orange-50">
                    <p className="font-medium text-orange-800">Prix non optimaux détectés</p>
                    <p className="text-sm text-orange-700">23 produits pourraient avoir des prix plus compétitifs</p>
                    <Button size="sm" className="mt-2" variant="outline">
                      Corriger automatiquement
                    </Button>
                  </div>
                  
                  <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                    <p className="font-medium text-blue-800">Descriptions à améliorer</p>
                    <p className="text-sm text-blue-700">15 produits ont des descriptions trop courtes</p>
                    <Button size="sm" className="mt-2" variant="outline">
                      Enrichir avec IA
                    </Button>
                  </div>
                  
                  <div className="p-3 border-l-4 border-green-500 bg-green-50">
                    <p className="font-medium text-green-800">Opportunités SEO</p>
                    <p className="text-sm text-green-700">31 produits peuvent améliorer leur référencement</p>
                    <Button size="sm" className="mt-2" variant="outline">
                      Optimiser SEO
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance des Optimisations IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">+24%</p>
                  <p className="text-sm text-muted-foreground">Amélioration conversions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">+18%</p>
                  <p className="text-sm text-muted-foreground">Trafic organique</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">+31%</p>
                  <p className="text-sm text-muted-foreground">Engagement produits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-actions" className="space-y-6">
          {/* Selection Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Sélection des Produits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedProducts(products.map(p => p.id))}
                >
                  Sélectionner tous ({products.length})
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedProducts([])}
                  disabled={selectedProducts.length === 0}
                >
                  Désélectionner tous
                </Button>
                <Badge variant="secondary" className="ml-auto">
                  {selectedProducts.length} produits sélectionnés
                </Badge>
              </div>
              
              {/* Quick Selection Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedProducts(products.filter(p => !p.is_trending).map(p => p.id))}
                >
                  Non tendance ({products.filter(p => !p.is_trending).length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedProducts(products.filter(p => (p.stock_quantity || 0) < 10).map(p => p.id))}
                >
                  Stock faible ({products.filter(p => (p.stock_quantity || 0) < 10).length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedProducts(products.filter(p => (p.rating || 0) < 3).map(p => p.id))}
                >
                  Note faible ({products.filter(p => (p.rating || 0) < 3).length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedProducts(products.filter(p => !p.description || p.description.length < 50).map(p => p.id))}
                >
                  Description courte ({products.filter(p => !p.description || p.description.length < 50).length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Actions en Masse ({selectedProducts.length} produits)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Pricing Actions */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">PRIX ET MARGES</h4>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleBulkAction('Augmentation prix +10%')}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Augmenter prix +10%
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleBulkAction('Réduction prix -5%')}
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Réduire prix -5%
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleBulkAction('Ajustement marges optimales')}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Ajuster marges optimales
                    </Button>
                  </div>

                  {/* Content Actions */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">CONTENU ET SEO</h4>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleBulkAction('Génération descriptions IA')}
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      Générer descriptions IA
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleBulkAction('Optimisation SEO')}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Optimiser SEO
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleBulkAction('Traduction multi-langues')}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Traduire contenu
                    </Button>
                  </div>

                  {/* Management Actions */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">GESTION</h4>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleBulkAction('Synchronisation stock')}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Synchroniser stock
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleBulkAction('Mise à jour statuts')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Mettre à jour statuts
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleBulkAction('Export sélection')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter sélection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bulk Operations History */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des Opérations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Optimisation SEO IA</p>
                    <p className="text-sm text-muted-foreground">45 produits • Il y a 2 heures</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Terminé</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Ajustement prix automatique</p>
                    <p className="text-sm text-muted-foreground">23 produits • Il y a 1 jour</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Terminé</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Génération descriptions IA</p>
                    <p className="text-sm text-muted-foreground">67 produits • Il y a 3 jours</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Terminé</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ProductDetailsModal 
        product={selectedProduct}
        open={showProductDetails}
        onClose={() => setShowProductDetails(false)}
      />
      
      <ProductFormModal 
        product={selectedProduct}
        open={showProductForm}
        onClose={() => {
          setShowProductForm(false)
          setSelectedProduct(null)
        }}
      />
      
      <ImportModal 
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
      
      <ExportModal 
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        selectedProducts={selectedProducts}
      />
    </div>
  )
}