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

// Données des produits en stock
const inventoryData = [
  {
    id: '1',
    sku: 'IP15-PRO-128',
    name: 'iPhone 15 Pro 128GB',
    category: 'Smartphones',
    stock: 15,
    reserved: 3,
    available: 12,
    reorderPoint: 10,
    maxStock: 50,
    costPrice: 850,
    sellingPrice: 1199,
    supplier: 'Apple Store',
    lastRestocked: '2024-01-05',
    status: 'low_stock',
    avgSales: 5,
    daysRemaining: 3,
    location: 'A-15-03'
  },
  {
    id: '2',
    sku: 'SAM-S24-256',
    name: 'Samsung Galaxy S24 256GB',
    category: 'Smartphones',
    stock: 45,
    reserved: 8,
    available: 37,
    reorderPoint: 15,
    maxStock: 60,
    costPrice: 720,
    sellingPrice: 999,
    supplier: 'Samsung Direct',
    lastRestocked: '2024-01-08',
    status: 'in_stock',
    avgSales: 3,
    daysRemaining: 15,
    location: 'A-15-04'
  },
  {
    id: '3',
    sku: 'APP-PRO-2',
    name: 'AirPods Pro 2ème génération',
    category: 'Audio',
    stock: 2,
    reserved: 1,
    available: 1,
    reorderPoint: 20,
    maxStock: 100,
    costPrice: 180,
    sellingPrice: 279,
    supplier: 'Apple Store',
    lastRestocked: '2023-12-28',
    status: 'critical',
    avgSales: 8,
    daysRemaining: 0.5,
    location: 'B-08-15'
  },
  {
    id: '4',
    sku: 'MAC-AIR-M3',
    name: 'MacBook Air M3 13"',
    category: 'Ordinateurs',
    stock: 25,
    reserved: 2,
    available: 23,
    reorderPoint: 8,
    maxStock: 30,
    costPrice: 1050,
    sellingPrice: 1399,
    supplier: 'Apple Store',
    lastRestocked: '2024-01-10',
    status: 'in_stock',
    avgSales: 2,
    daysRemaining: 12,
    location: 'C-02-07'
  },
  {
    id: '5',
    sku: 'IPD-PRO-11',
    name: 'iPad Pro 11" M4',
    category: 'Tablettes',
    stock: 0,
    reserved: 0,
    available: 0,
    reorderPoint: 12,
    maxStock: 40,
    costPrice: 750,
    sellingPrice: 999,
    supplier: 'Apple Store',
    lastRestocked: '2023-12-20',
    status: 'out_of_stock',
    avgSales: 4,
    daysRemaining: 0,
    location: 'C-05-12'
  }
]

// Données d'évolution du stock
const stockEvolution = [
  { date: '01/01', totalValue: 125000, items: 456, movements: 15 },
  { date: '02/01', totalValue: 128000, items: 468, movements: 23 },
  { date: '03/01', totalValue: 122000, items: 445, movements: 18 },
  { date: '04/01', totalValue: 135000, items: 489, movements: 28 },
  { date: '05/01', totalValue: 142000, items: 512, movements: 31 },
  { date: '06/01', totalValue: 138000, items: 498, movements: 25 },
  { date: '07/01', totalValue: 145000, items: 524, movements: 19 },
]

// Données par catégorie
const categoryData = [
  { name: 'Smartphones', value: 45, stock: 125, value_euro: 85000 },
  { name: 'Audio', value: 25, stock: 89, value_euro: 35000 },
  { name: 'Ordinateurs', value: 15, stock: 45, value_euro: 95000 },
  { name: 'Tablettes', value: 10, stock: 32, value_euro: 28000 },
  { name: 'Accessoires', value: 5, stock: 156, value_euro: 12000 },
]

// Alertes de stock
const stockAlerts = [
  { type: 'critical', product: 'AirPods Pro 2ème génération', stock: 1, message: 'Stock critique - Rupture imminente' },
  { type: 'out_of_stock', product: 'iPad Pro 11" M4', stock: 0, message: 'Rupture de stock confirmée' },
  { type: 'low_stock', product: 'iPhone 15 Pro 128GB', stock: 12, message: 'Stock faible - Recommandé de commander' },
  { type: 'overstock', product: 'Chargeur USB-C', stock: 250, message: 'Surstock détecté - Optimisation possible' },
]

// Mouvements récents
const recentMovements = [
  { id: '1', type: 'in', product: 'Samsung Galaxy S24', quantity: 20, date: '2024-01-10 14:30', user: 'Marie Dubois' },
  { id: '2', type: 'out', product: 'iPhone 15 Pro', quantity: 2, date: '2024-01-10 11:15', user: 'Commande #12847' },
  { id: '3', type: 'adjustment', product: 'AirPods Pro', quantity: -1, date: '2024-01-10 09:45', user: 'Pierre Martin' },
  { id: '4', type: 'in', product: 'MacBook Air M3', quantity: 5, date: '2024-01-09 16:20', user: 'Réception fournisseur' },
  { id: '5', type: 'out', product: 'iPad Pro', quantity: 3, date: '2024-01-09 13:10', user: 'Commande #12834' },
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))']

export default function InventoryUltraPro() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Calcul des métriques
  const totalValue = inventoryData.reduce((sum, item) => sum + (item.stock * item.costPrice), 0)
  const totalItems = inventoryData.reduce((sum, item) => sum + item.stock, 0)
  const lowStockItems = inventoryData.filter(item => item.status === 'low_stock' || item.status === 'critical').length
  const outOfStockItems = inventoryData.filter(item => item.status === 'out_of_stock').length

  // Filtrage des données
  const filteredData = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">En stock</Badge>
      case 'low_stock':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Stock faible</Badge>
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>
      case 'out_of_stock':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rupture</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'out_of_stock':
        return <Package className="h-4 w-4 text-gray-500" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'adjustment':
        return <Edit className="h-4 w-4 text-blue-500" />
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

  return (
    <div className="p-6 space-y-6">
        {/* Header avec contrôles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Inventaire Ultra Pro</h1>
            <p className="text-muted-foreground">Gestion avancée des stocks et prévisions IA</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync temps réel
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button size="sm">
              <Bot className="h-4 w-4 mr-2" />
              Prédictions IA
            </Button>

            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </Button>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">{totalItems} unités</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-muted-foreground">Valeur totale du stock</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <Badge variant="secondary">{lowStockItems} alertes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{lowStockItems}</p>
                <p className="text-xs text-muted-foreground">Produits en stock faible</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <Badge variant="destructive">{outOfStockItems} ruptures</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{outOfStockItems}</p>
                <p className="text-xs text-muted-foreground">Produits en rupture</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Truck className="h-5 w-5 text-blue-500" />
                <Badge variant="outline">5 en cours</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Commandes fournisseurs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes critiques */}
        <Card className="border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes de stock critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    {getStockIcon(alert.type)}
                    <div>
                      <p className="font-medium">{alert.product}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{alert.stock} unités</p>
                    <Button size="sm" variant="outline">
                      Commander
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analyses et graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution de la valeur du stock */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la valeur du stock</CardTitle>
              <CardDescription>Derniers 7 jours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stockEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area 
                    type="monotone" 
                    dataKey="totalValue" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition par catégorie */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par catégorie</CardTitle>
              <CardDescription>Valeur en stock</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Liste des produits */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Inventaire complet</CardTitle>
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
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="Smartphones">Smartphones</SelectItem>
                    <SelectItem value="Audio">Audio</SelectItem>
                    <SelectItem value="Ordinateurs">Ordinateurs</SelectItem>
                    <SelectItem value="Tablettes">Tablettes</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="in_stock">En stock</SelectItem>
                    <SelectItem value="low_stock">Stock faible</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                    <SelectItem value="out_of_stock">Rupture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Rotation</TableHead>
                  <TableHead>Emplacement</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold">{product.available}/{product.stock}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.reserved} réservés
                        </p>
                        <Progress 
                          value={(product.stock / product.maxStock) * 100} 
                          className="w-16 h-2 mt-1"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(product.stock * product.costPrice)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(product.costPrice)}/unité
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.avgSales}/jour</p>
                        <p className="text-sm text-muted-foreground">
                          {product.daysRemaining} jours restants
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.location}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mouvements récents */}
        <Card>
          <CardHeader>
            <CardTitle>Mouvements récents</CardTitle>
            <CardDescription>Historique des entrées et sorties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    {getMovementIcon(movement.type)}
                    <div>
                      <p className="font-medium">{movement.product}</p>
                      <p className="text-sm text-muted-foreground">{movement.user}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {movement.type === 'out' || movement.type === 'adjustment' ? '-' : '+'}
                      {Math.abs(movement.quantity)} unités
                    </p>
                    <p className="text-sm text-muted-foreground">{movement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}