import { useState } from 'react'
import { Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, Eye, Edit, Trash2, MoreHorizontal, Search, Filter, Download, RefreshCw, Plus, BarChart3, Bot, Zap, Target, Award, ShoppingCart, Truck, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { useRealProducts } from '@/hooks/useRealProducts'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ActionButton } from '@/components/common/ActionButton'
import { useToast } from '@/hooks/use-toast'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))']

export default function InventoryUltraProReal() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const { 
    products, 
    stats, 
    isLoading, 
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    isAdding,
    isUpdating,
    isDeleting
  } = useRealProducts({ 
    search: searchTerm,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    status: statusFilter === 'all' ? undefined : statusFilter
  })

  if (isLoading) return <LoadingState />
  if (error) return <div>Erreur lors du chargement des produits</div>

  // Filtrage local supplémentaire si nécessaire
  const filteredData = products.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">En stock</Badge>
      case 'low_stock':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Stock faible</Badge>
      case 'inactive':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Inactif</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const handleSyncStock = () => {
    toast({
      title: "Synchronisation",
      description: "Synchronisation du stock en cours...",
    })
  }

  const handleExportData = () => {
    toast({
      title: "Export",
      description: "Export des données en cours...",
    })
  }

  const handleAIPredictions = () => {
    toast({
      title: "IA Prédictions",
      description: "Génération des prédictions IA en cours...",
    })
  }

  const handleAddProduct = () => {
    toast({
      title: "Nouveau produit",
      description: "Fonctionnalité d'ajout de produit à implémenter",
    })
  }

  if (products.length === 0) {
    return (
      <EmptyState 
        title="Aucun produit en inventaire"
        description="Commencez par ajouter des produits à votre inventaire"
        action={{
          label: "Ajouter un produit",
          onClick: handleAddProduct
        }}
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header avec contrôles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Inventaire Ultra Pro</h1>
            <p className="text-muted-foreground">Gestion avancée des stocks avec données réelles</p>
          </div>
          
          <div className="flex items-center gap-3">
            <ActionButton 
              variant="outline" 
              size="sm"
              onClick={handleSyncStock}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Sync temps réel
            </ActionButton>
            
            <ActionButton 
              variant="outline" 
              size="sm"
              onClick={handleExportData}
              icon={<Download className="h-4 w-4" />}
            >
              Export
            </ActionButton>
            
            <ActionButton 
              size="sm"
              onClick={handleAIPredictions}
              icon={<Bot className="h-4 w-4" />}
            >
              Prédictions IA
            </ActionButton>

            <ActionButton 
              size="sm"
              onClick={handleAddProduct}
              icon={<Plus className="h-4 w-4" />}
              loading={isAdding}
            >
              Nouveau produit
            </ActionButton>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">{stats.total} produits</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                <p className="text-xs text-muted-foreground">Valeur totale du stock</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <Badge variant="default">{stats.active} actifs</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Produits actifs</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <Badge variant="secondary">{stats.lowStock} alertes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.lowStock}</p>
                <p className="text-xs text-muted-foreground">Stock faible</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <Badge variant="outline">{stats.inactive} inactifs</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Produits inactifs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des produits */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Inventaire complet ({filteredData.length} produits)</CardTitle>
                <CardDescription>Gestion détaillée des produits en stock</CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher un produit..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.sku || 'N/A'}</TableCell>
                      <TableCell>{product.category || 'Non catégorisé'}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStockIcon(product.status)}
                          <span>{product.stock_quantity || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <ActionButton 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                            loading={isDeleting}
                            icon={<Trash2 className="h-4 w-4" />}
                          >
                            Supprimer
                          </ActionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}