import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  ShoppingCart, DollarSign, Users, Globe
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { formatCurrency } from '@/lib/utils'

export function AdvancedProductCatalog() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Fetch catalog products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['catalog-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  // Get unique categories and suppliers
  const categories = useMemo(() => 
    [...new Set(products.map(p => p.category).filter(Boolean))], [products])
  const suppliers = useMemo(() => 
    [...new Set(products.map(p => p.supplier_name).filter(Boolean))], [products])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      const matchesSupplier = supplierFilter === 'all' || product.supplier_name === supplierFilter
      const matchesStatus = statusFilter === 'all' || product.availability_status === statusFilter
      
      return matchesSearch && matchesCategory && matchesSupplier && matchesStatus
    })

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
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
      badges.push(<Badge key="bestseller" className="bg-gold-100 text-gold-800"><Star className="h-3 w-3 mr-1" />Bestseller</Badge>)
    }
    if (product.is_trending) {
      badges.push(<Badge key="trending" className="bg-blue-100 text-blue-800"><TrendingUp className="h-3 w-3 mr-1" />Tendance</Badge>)
    }
    if (product.is_winner) {
      badges.push(<Badge key="winner" className="bg-purple-100 text-purple-800"><Zap className="h-3 w-3 mr-1" />Gagnant</Badge>)
    }
    
    return badges
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
      value: products.filter(p => p.availability_status === 'in_stock').length.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Prix moyen',
      value: formatCurrency(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length || 0),
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
          <Button variant="outline">
            <Import className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
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
                                alt={product.name} 
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
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
                        <TableCell>{product.supplier_name}</TableCell>
                        <TableCell>{getStatusBadge(product.availability_status || 'unknown')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
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

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Catalogue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analyses et métriques détaillées de votre catalogue
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Optimisation IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Outils d'optimisation alimentés par l'IA
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-actions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Actions Groupées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Modifier plusieurs produits en une fois
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}