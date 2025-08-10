import { useState } from 'react'
import { Package, TrendingUp, AlertTriangle, CheckCircle2, Clock, Search, Filter, Download, RefreshCw, Plus, Eye, Edit, MoreHorizontal, AlertCircle, FileText, Settings, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AppLayout } from '@/layouts/AppLayout'
import { useRealProducts } from '@/hooks/useRealProducts'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ActionButton } from '@/components/common/ActionButton'
import { useToast } from '@/hooks/use-toast'

export default function CatalogueReal() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Actif</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Inactif</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const handleExport = () => {
    toast({
      title: "Export",
      description: "Export des données en cours...",
    })
  }

  const handleImport = () => {
    toast({
      title: "Import",
      description: "Fonctionnalité d'import à implémenter",
    })
  }

  const handleAddProduct = () => {
    toast({
      title: "Nouveau produit",
      description: "Fonctionnalité d'ajout de produit à implémenter",
    })
  }

  const handleUltraPro = () => {
    window.location.href = '/catalogue-ultra-pro'
  }

  if (products.length === 0) {
    return (
      <AppLayout>
        <EmptyState 
          title="Aucun produit dans le catalogue"
          description="Commencez par ajouter des produits à votre catalogue"
          action={{
            label: "Ajouter un produit",
            onClick: handleAddProduct
          }}
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Catalogue Produits</h1>
            <p className="text-muted-foreground">Gestion des produits avec données réelles</p>
          </div>
          
          <div className="flex items-center gap-3">
            <ActionButton 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              icon={<Download className="h-4 w-4" />}
            >
              Exporter
            </ActionButton>
            
            <ActionButton 
              variant="outline" 
              size="sm"
              onClick={handleImport}
              icon={<FileText className="h-4 w-4" />}
            >
              Importer
            </ActionButton>
            
            <ActionButton 
              size="sm"
              onClick={handleUltraPro}
              icon={<BarChart3 className="h-4 w-4" />}
            >
              Catalogue Ultra Pro
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

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">{stats.total}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total produits</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <Badge variant="default">{stats.active}</Badge>
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
                <AlertCircle className="h-5 w-5 text-red-500" />
                <Badge variant="outline">{stats.inactive}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Produits inactifs</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <Badge variant="outline">{formatCurrency(stats.totalValue)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                <p className="text-xs text-muted-foreground">Valeur totale</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des produits */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Produits ({products.length})</CardTitle>
                <CardDescription>Gestion du catalogue produits</CardDescription>
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
                    <TableHead>Date création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(product.status)}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {product.description || 'Aucune description'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.sku || 'N/A'}</TableCell>
                      <TableCell>{product.category || 'Non catégorisé'}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.stock_quantity || 0}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>{formatDate(product.created_at)}</TableCell>
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
                            icon={<MoreHorizontal className="h-4 w-4" />}
                          >
                            Actions
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
    </AppLayout>
  )
}