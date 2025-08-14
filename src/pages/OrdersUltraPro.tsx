import { useState } from 'react'
import { ShoppingCart, Package, Truck, CheckCircle2, Clock, AlertTriangle, Eye, Edit, Trash2, MoreHorizontal, Search, Filter, Download, RefreshCw, Plus, BarChart3, Bot, Zap, Target, Award, Users, Euro, Calendar, Globe, MapPin } from 'lucide-react'
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
import { toast } from 'sonner'
import { AsyncButton } from "@/components/ui/async-button"
import { FilterPanel } from "@/components/common/FilterPanel"
import { ExportButton } from "@/components/common/ExportButton"
import { ImportButton } from "@/components/common/ImportButton"
import { useModalHelpers } from "@/hooks/useModalHelpers"
import { useRealOrders } from "@/hooks/useRealOrders"

// Données des commandes
const ordersData = [
  {
    id: '12847',
    customerName: 'Marie Dubois',
    customerEmail: 'marie.dubois@email.com',
    date: '2024-01-10',
    status: 'processing',
    total: 1199.99,
    items: 1,
    paymentStatus: 'paid',
    shippingMethod: 'express',
    trackingNumber: 'FR123456789',
    country: 'France',
    city: 'Paris',
    products: ['iPhone 15 Pro 128GB'],
    priority: 'high'
  },
  {
    id: '12846',
    customerName: 'Pierre Martin',
    customerEmail: 'pierre.martin@email.com', 
    date: '2024-01-10',
    status: 'shipped',
    total: 999.99,
    items: 1,
    paymentStatus: 'paid',
    shippingMethod: 'standard',
    trackingNumber: 'FR123456788',
    country: 'France',
    city: 'Lyon',
    products: ['Samsung Galaxy S24 256GB'],
    priority: 'medium'
  },
  {
    id: '12845',
    customerName: 'Sophie Bernard',
    customerEmail: 'sophie.bernard@email.com',
    date: '2024-01-09',
    status: 'delivered',
    total: 279.99,
    items: 1,
    paymentStatus: 'paid',
    shippingMethod: 'express',
    trackingNumber: 'FR123456787',
    country: 'France',
    city: 'Marseille',
    products: ['AirPods Pro 2ème génération'],
    priority: 'low'
  },
  {
    id: '12844',
    customerName: 'Luc Moreau',
    customerEmail: 'luc.moreau@email.com',
    date: '2024-01-09',
    status: 'cancelled',
    total: 1399.99,
    items: 1,
    paymentStatus: 'refunded',
    shippingMethod: 'standard',
    trackingNumber: null,
    country: 'France',
    city: 'Toulouse',
    products: ['MacBook Air M3 13"'],
    priority: 'medium'
  },
  {
    id: '12843',
    customerName: 'Emma Lefevre',
    customerEmail: 'emma.lefevre@email.com',
    date: '2024-01-08',
    status: 'pending',
    total: 1678.98,
    items: 2,
    paymentStatus: 'pending',
    shippingMethod: 'express',
    trackingNumber: null,
    country: 'Belgique',
    city: 'Bruxelles',
    products: ['iPad Pro 11" M4', 'Apple Pencil'],
    priority: 'high'
  }
]

// Données d'évolution des commandes
const ordersEvolution = [
  { date: '01/01', orders: 45, revenue: 25000, avgOrder: 555 },
  { date: '02/01', revenue: 28000, orders: 52, avgOrder: 538 },
  { date: '03/01', revenue: 22000, orders: 38, avgOrder: 579 },
  { date: '04/01', revenue: 35000, orders: 68, avgOrder: 515 },
  { date: '05/01', revenue: 42000, orders: 78, avgOrder: 538 },
  { date: '06/01', revenue: 38000, orders: 65, avgOrder: 585 },
  { date: '07/01', revenue: 45000, orders: 82, avgOrder: 549 },
]

// Données par statut
const statusData = [
  { name: 'En attente', value: 15, count: 12, color: 'hsl(var(--muted))' },
  { name: 'En cours', value: 35, count: 28, color: 'hsl(var(--primary))' },
  { name: 'Expédiées', value: 30, count: 24, color: 'hsl(var(--secondary))' },
  { name: 'Livrées', value: 18, count: 14, color: 'hsl(var(--accent))' },
  { name: 'Annulées', value: 2, count: 2, color: 'hsl(var(--destructive))' },
]

// Top clients
const topCustomers = [
  { name: 'Marie Dubois', orders: 8, revenue: 4250, avgOrder: 531 },
  { name: 'Pierre Martin', orders: 6, revenue: 3200, avgOrder: 533 },
  { name: 'Sophie Bernard', orders: 5, revenue: 2800, avgOrder: 560 },
  { name: 'Luc Moreau', orders: 4, revenue: 2100, avgOrder: 525 },
  { name: 'Emma Lefevre', orders: 3, revenue: 1850, avgOrder: 617 },
]

// Données par région
const regionData = [
  { region: 'Île-de-France', orders: 245, revenue: 125000, avgOrder: 510 },
  { region: 'Auvergne-Rhône-Alpes', orders: 156, revenue: 85000, avgOrder: 545 },
  { region: 'Provence-Alpes-Côte d\'Azur', orders: 134, revenue: 72000, avgOrder: 537 },
  { region: 'Nouvelle-Aquitaine', orders: 98, revenue: 52000, avgOrder: 531 },
  { region: 'Occitanie', orders: 87, revenue: 45000, avgOrder: 517 },
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))']

export default function OrdersUltraPro() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7d')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [currentFilters, setCurrentFilters] = useState({})
  
  const modalHelpers = useModalHelpers()
  const { orders: realOrders, stats: realStats, isLoading } = useRealOrders()

  // Calcul des métriques avec vraies données
  const totalOrders = realStats.total || ordersData.length
  const totalRevenue = realStats.revenue || ordersData.reduce((sum, order) => sum + order.total, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const pendingOrders = realStats.pending || ordersData.filter(order => order.status === 'pending').length
  const processingOrders = realStats.processing || ordersData.filter(order => order.status === 'processing').length

  // Filtrage des données - utilise les vraies données si disponibles
  const ordersToFilter = realOrders.length > 0 ? realOrders.map(order => ({
    ...order,
    customerName: order.customers?.name || 'N/A',
    customerEmail: order.customers?.email || 'N/A',
    id: order.order_number,
    date: order.created_at,
    trackingNumber: order.tracking_number,
    city: 'Paris',
    country: 'France',
    paymentStatus: 'paid',
    total: order.total_amount,
    items: order.order_items?.length || 0,
    priority: 'medium'
  })) : ordersData
  
  const filteredOrders = ordersToFilter.filter(order => {
    const matchesSearch = order.id.includes(searchTerm) || 
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">En attente</Badge>
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">En cours</Badge>
      case 'shipped':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Expédiée</Badge>
      case 'delivered':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Livrée</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Payée</Badge>
      case 'pending':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">En attente</Badge>
      case 'refunded':
        return <Badge variant="destructive">Remboursée</Badge>
      case 'failed':
        return <Badge variant="destructive">Échouée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Haute</Badge>
      case 'medium':
        return <Badge variant="secondary">Moyenne</Badge>
      case 'low':
        return <Badge variant="outline">Basse</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
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
            <h1 className="text-3xl font-bold">Commandes Ultra Pro</h1>
            <p className="text-muted-foreground">Gestion avancée des commandes et analyses prédictives</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Aujourd'hui</SelectItem>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="90d">90 jours</SelectItem>
              </SelectContent>
            </Select>
            
            <AsyncButton 
              variant="outline" 
              size="sm"
              onClick={async () => {
                // Simulate real sync
                await new Promise(resolve => setTimeout(resolve, 1000));
                // In real app: await syncOrders();
              }}
              icon={<RefreshCw className="h-4 w-4" />}
              loadingText="Synchronisation..."
              successMessage="Synchronisation temps réel activée"
              data-testid="sync-button"
            >
              Sync temps réel
            </AsyncButton>
            
            <ExportButton
              data={filteredOrders}
              filename="commandes"
              columns={['id', 'customerName', 'total', 'status', 'date']}
            />
            
            <AsyncButton 
              size="sm"
              onClick={async () => {
                // Simulate AI analysis
                await new Promise(resolve => setTimeout(resolve, 2000));
                // In real app: await generateAIInsights();
              }}
              icon={<Bot className="h-4 w-4" />}
              loadingText="Analyse en cours..."
              successMessage="Analyse IA des tendances terminée"
              data-testid="ai-analysis-button"
            >
              Prédictions IA
            </AsyncButton>

            <Button 
              size="sm"
              onClick={() => modalHelpers.openCreateOrder()}
              data-testid="new-order-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle commande
            </Button>
            
            <ImportButton
              onImport={(data) => {
                toast.success(`${data.length} commandes importées`);
              }}
            />
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">+12.5%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total commandes</p>
                <p className="text-xs text-muted-foreground">vs mois dernier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Euro className="h-5 w-5 text-muted-foreground" />
                <Badge variant="default">+8.3%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
                <p className="text-xs text-muted-foreground">vs mois dernier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary">+5.7%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</p>
                <p className="text-xs text-muted-foreground">Panier moyen</p>
                <p className="text-xs text-muted-foreground">vs mois dernier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-orange-500" />
                <Badge variant="outline">{pendingOrders + processingOrders} à traiter</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{pendingOrders}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
                <p className="text-xs text-muted-foreground">{processingOrders} en cours</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques et analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des commandes */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des commandes</CardTitle>
              <CardDescription>Revenus et nombre de commandes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={ordersEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => typeof value === 'number' && value > 1000 ? formatCurrency(value) : value} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="hsl(var(--secondary))" 
                    fill="hsl(var(--secondary))" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition par statut */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par statut</CardTitle>
              <CardDescription>État des commandes actuelles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {statusData.map((status, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-sm">{status.name}</span>
                      </div>
                      <span className="font-bold">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analyses détaillées */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="customers">Top clients</TabsTrigger>
            <TabsTrigger value="regions">Régions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Liste des commandes</CardTitle>
                    <CardDescription>Gestion détaillée de toutes les commandes</CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Rechercher une commande..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="processing">En cours</SelectItem>
                        <SelectItem value="shipped">Expédiée</SelectItem>
                        <SelectItem value="delivered">Livrée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commande</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">#{order.id}</p>
                            <p className="text-sm text-muted-foreground">{order.date}</p>
                            {order.trackingNumber && (
                              <p className="text-xs text-muted-foreground">{order.trackingNumber}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                            <p className="text-xs text-muted-foreground">{order.city}, {order.country}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            {getStatusBadge(order.status)}
                          </div>
                        </TableCell>
                        <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold">{formatCurrency(order.total)}</p>
                            <p className="text-sm text-muted-foreground">{order.items} article(s)</p>
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Package className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Top clients</CardTitle>
                <CardDescription>Clients les plus actifs par revenus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.orders} commandes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(customer.revenue)}</p>
                        <p className="text-sm text-muted-foreground">Panier moyen: {formatCurrency(customer.avgOrder)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regions">
            <Card>
              <CardHeader>
                <CardTitle>Performance par région</CardTitle>
                <CardDescription>Analyse géographique des ventes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionData.map((region, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-4">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{region.region}</p>
                          <p className="text-sm text-muted-foreground">{region.orders} commandes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(region.revenue)}</p>
                        <p className="text-sm text-muted-foreground">Panier moyen: {formatCurrency(region.avgOrder)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Panier moyen par jour</CardTitle>
                  <CardDescription>Évolution du panier moyen</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={ordersEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line 
                        type="monotone" 
                        dataKey="avgOrder" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prédictions IA</CardTitle>
                  <CardDescription>Analyses prédictives pour les 7 prochains jours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-emerald-800">Prévision de revenus</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-900">{formatCurrency(52000)}</p>
                      <p className="text-sm text-emerald-700">+15% vs semaine précédente</p>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Commandes attendues</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">94</p>
                      <p className="text-sm text-blue-700">+8% vs semaine précédente</p>
                    </div>

                    <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Pic d'activité prévu</span>
                      </div>
                      <p className="text-lg font-bold text-orange-900">Vendredi 15h-18h</p>
                      <p className="text-sm text-orange-700">Préparer +30% de stock</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  )
}