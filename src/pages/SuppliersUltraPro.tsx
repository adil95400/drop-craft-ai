import { useState } from 'react'
import { Building2, Star, TrendingUp, TrendingDown, Package, Euro, Globe, Phone, Mail, MapPin, Eye, Edit, Trash2, MoreHorizontal, Search, Filter, Download, RefreshCw, Plus, BarChart3, Bot, Zap, Target, Award, Users, AlertTriangle, CheckCircle2, Clock, Truck } from 'lucide-react'
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
import { AppLayout } from '@/layouts/AppLayout'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

// Données des fournisseurs
const suppliersData = [
  {
    id: '1',
    name: 'Apple Store',
    category: 'Électronique',
    country: 'États-Unis',
    city: 'Cupertino',
    email: 'business@apple.com',
    phone: '+1-800-275-2273',
    website: 'https://www.apple.com/business',
    rating: 4.8,
    products: 45,
    orders: 128,
    totalSpent: 245000,
    avgDelivery: 3,
    successRate: 98.5,
    status: 'active',
    lastOrder: '2024-01-10',
    contractType: 'premium',
    paymentTerms: '30 jours',
    quality: 4.9,
    communication: 4.7,
    reliability: 4.8
  },
  {
    id: '2',
    name: 'Samsung Direct',
    category: 'Électronique',
    country: 'Corée du Sud',
    city: 'Seoul',
    email: 'partners@samsung.com',
    phone: '+82-2-2255-0114',
    website: 'https://www.samsung.com/business',
    rating: 4.6,
    products: 38,
    orders: 96,
    totalSpent: 185000,
    avgDelivery: 5,
    successRate: 96.2,
    status: 'active',
    lastOrder: '2024-01-08',
    contractType: 'standard',
    paymentTerms: '45 jours',
    quality: 4.7,
    communication: 4.5,
    reliability: 4.6
  },
  {
    id: '3',
    name: 'TechDistrib Europe',
    category: 'Distribution',
    country: 'Allemagne',
    city: 'Munich',
    email: 'sales@techdistrib.eu',
    phone: '+49-89-123456789',
    website: 'https://www.techdistrib.eu',
    rating: 4.2,
    products: 156,
    orders: 245,
    totalSpent: 320000,
    avgDelivery: 2,
    successRate: 94.1,
    status: 'active',
    lastOrder: '2024-01-09',
    contractType: 'premium',
    paymentTerms: '15 jours',
    quality: 4.3,
    communication: 4.1,
    reliability: 4.2
  },
  {
    id: '4',
    name: 'Global Electronics',
    category: 'Grossiste',
    country: 'Chine',
    city: 'Shenzhen',
    email: 'business@globalelec.cn',
    phone: '+86-755-12345678',
    website: 'https://www.globalelec.cn',
    rating: 3.8,
    products: 234,
    orders: 89,
    totalSpent: 125000,
    avgDelivery: 12,
    successRate: 87.3,
    status: 'warning',
    lastOrder: '2024-01-05',
    contractType: 'standard',
    paymentTerms: '60 jours',
    quality: 3.9,
    communication: 3.7,
    reliability: 3.8
  },
  {
    id: '5',
    name: 'Premium Accessories',
    category: 'Accessoires',
    country: 'France',
    city: 'Paris',
    email: 'contact@premiumacc.fr',
    phone: '+33-1-42345678',
    website: 'https://www.premiumacc.fr',
    rating: 4.4,
    products: 67,
    orders: 156,
    totalSpent: 89000,
    avgDelivery: 1,
    successRate: 95.8,
    status: 'active',
    lastOrder: '2024-01-11',
    contractType: 'premium',
    paymentTerms: '30 jours',
    quality: 4.5,
    communication: 4.3,
    reliability: 4.4
  }
]

// Données d'évolution des achats
const purchaseEvolution = [
  { date: '01/01', totalSpent: 45000, orders: 28, avgOrder: 1607 },
  { date: '02/01', totalSpent: 52000, orders: 34, avgOrder: 1529 },
  { date: '03/01', totalSpent: 48000, orders: 31, avgOrder: 1548 },
  { date: '04/01', totalSpent: 61000, orders: 42, avgOrder: 1452 },
  { date: '05/01', totalSpent: 58000, orders: 38, avgOrder: 1526 },
  { date: '06/01', totalSpent: 65000, orders: 45, avgOrder: 1444 },
  { date: '07/01', totalSpent: 72000, orders: 48, avgOrder: 1500 },
]

// Performance par catégorie
const categoryData = [
  { name: 'Électronique', suppliers: 15, orders: 245, spent: 325000, avgDelivery: 4 },
  { name: 'Distribution', suppliers: 8, orders: 156, spent: 185000, avgDelivery: 3 },
  { name: 'Grossiste', suppliers: 12, orders: 89, spent: 145000, avgDelivery: 8 },
  { name: 'Accessoires', suppliers: 25, orders: 312, spent: 95000, avgDelivery: 2 },
  { name: 'Logiciel', suppliers: 6, orders: 45, spent: 65000, avgDelivery: 1 },
]

// Top fournisseurs par volume
const topSuppliers = [
  { name: 'TechDistrib Europe', volume: 320000, orders: 245, growth: 15.3 },
  { name: 'Apple Store', volume: 245000, orders: 128, growth: 8.7 },
  { name: 'Samsung Direct', volume: 185000, orders: 96, growth: 12.1 },
  { name: 'Global Electronics', volume: 125000, orders: 89, growth: -3.2 },
  { name: 'Premium Accessories', volume: 89000, orders: 156, growth: 22.5 },
]

// Données géographiques
const regionData = [
  { region: 'Europe', suppliers: 35, volume: 450000, avgDelivery: 3 },
  { region: 'Asie', suppliers: 28, volume: 380000, avgDelivery: 10 },
  { region: 'Amérique du Nord', suppliers: 15, volume: 295000, avgDelivery: 5 },
  { region: 'Autres', suppliers: 8, volume: 125000, avgDelivery: 7 },
]

// Alertes fournisseurs
const supplierAlerts = [
  { type: 'delivery', supplier: 'Global Electronics', message: 'Retards de livraison récurrents (+5 jours)', severity: 'warning' },
  { type: 'quality', supplier: 'Budget Tech Co', message: 'Baisse de qualité détectée (3.2/5)', severity: 'error' },
  { type: 'price', supplier: 'Premium Accessories', message: 'Augmentation tarifaire prévue (+8%)', severity: 'info' },
  { type: 'contract', supplier: 'Samsung Direct', message: 'Renouvellement contrat dans 30 jours', severity: 'info' },
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))']

export default function SuppliersUltraPro() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  // Calcul des métriques
  const totalSuppliers = suppliersData.length
  const totalSpent = suppliersData.reduce((sum, supplier) => sum + supplier.totalSpent, 0)
  const avgRating = suppliersData.reduce((sum, supplier) => sum + supplier.rating, 0) / totalSuppliers
  const activeSuppliers = suppliersData.filter(supplier => supplier.status === 'active').length

  // Filtrage des données
  const filteredSuppliers = suppliersData.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Actif</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Attention</Badge>
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactif</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspendu</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getContractBadge = (contractType: string) => {
    switch (contractType) {
      case 'premium':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Premium</Badge>
      case 'standard':
        return <Badge variant="secondary">Standard</Badge>
      case 'basic':
        return <Badge variant="outline">Basic</Badge>
      default:
        return <Badge variant="outline">{contractType}</Badge>
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ))
  }

  const getPerformanceColor = (value: number, max: number = 5) => {
    const percentage = (value / max) * 100
    if (percentage >= 80) return 'text-emerald-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive'
      case 'warning': return 'secondary'
      case 'info': return 'outline'
      default: return 'outline'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header avec contrôles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fournisseurs Ultra Pro</h1>
            <p className="text-muted-foreground">Gestion avancée des partenaires et analyses de performance</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync données
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export rapport
            </Button>
            
            <Button size="sm">
              <Bot className="h-4 w-4 mr-2" />
              Recommandations IA
            </Button>

            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau fournisseur
            </Button>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">{activeSuppliers} actifs</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{totalSuppliers}</p>
                <p className="text-xs text-muted-foreground">Fournisseurs totaux</p>
                <p className="text-xs text-muted-foreground">dans {new Set(suppliersData.map(s => s.country)).size} pays</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Euro className="h-5 w-5 text-muted-foreground" />
                <Badge variant="default">+12.5%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-muted-foreground">Volume d'achats</p>
                <p className="text-xs text-muted-foreground">vs mois dernier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Star className="h-5 w-5 text-yellow-500" />
                <Badge variant="default">+0.2</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}/5</p>
                <p className="text-xs text-muted-foreground">Note moyenne</p>
                <p className="text-xs text-muted-foreground">vs mois dernier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Truck className="h-5 w-5 text-blue-500" />
                <Badge variant="secondary">4.2 jours</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">95.8%</p>
                <p className="text-xs text-muted-foreground">Taux de livraison</p>
                <p className="text-xs text-muted-foreground">Délai moyen: 4.2j</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes fournisseurs */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes fournisseurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supplierAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{alert.supplier}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <Badge variant={getAlertColor(alert.severity)}>{alert.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Graphiques et analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des achats */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des achats</CardTitle>
              <CardDescription>Volume d'achats et commandes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={purchaseEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => typeof value === 'number' && value > 1000 ? formatCurrency(value) : value} />
                  <Area 
                    type="monotone" 
                    dataKey="totalSpent" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition géographique */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition géographique</CardTitle>
              <CardDescription>Volume par région</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="volume"
                    label={({ region, percent }) => `${region} ${(percent * 100).toFixed(0)}%`}
                  >
                    {regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Analyses détaillées */}
        <Tabs defaultValue="suppliers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Liste des fournisseurs</CardTitle>
                    <CardDescription>Gestion complète de vos partenaires</CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Rechercher un fournisseur..." 
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
                        <SelectItem value="Électronique">Électronique</SelectItem>
                        <SelectItem value="Distribution">Distribution</SelectItem>
                        <SelectItem value="Grossiste">Grossiste</SelectItem>
                        <SelectItem value="Accessoires">Accessoires</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="warning">Attention</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Livraison</TableHead>
                      <TableHead>Contrat</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">{supplier.email}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {getRatingStars(supplier.rating)}
                              <span className="text-sm text-muted-foreground ml-1">({supplier.rating})</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {getStatusBadge(supplier.status)}
                            <p className="text-sm text-muted-foreground mt-1">
                              {supplier.successRate}% succès
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold">{formatCurrency(supplier.totalSpent)}</p>
                            <p className="text-sm text-muted-foreground">{supplier.orders} commandes</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{supplier.avgDelivery} jours</p>
                            <p className="text-sm text-muted-foreground">Délai moyen</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {getContractBadge(supplier.contractType)}
                            <p className="text-sm text-muted-foreground mt-1">{supplier.paymentTerms}</p>
                          </div>
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
                              <Mail className="h-4 w-4" />
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

          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top fournisseurs par volume</CardTitle>
                  <CardDescription>Classement par volume d'achats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topSuppliers.map((supplier, index) => {
                      const GrowthIcon = supplier.growth > 0 ? TrendingUp : TrendingDown
                      const growthColor = supplier.growth > 0 ? 'text-emerald-600' : 'text-red-600'
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{supplier.name}</p>
                              <p className="text-sm text-muted-foreground">{supplier.orders} commandes</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(supplier.volume)}</p>
                            <div className={`flex items-center gap-1 text-sm ${growthColor}`}>
                              <GrowthIcon className="h-3 w-3" />
                              {Math.abs(supplier.growth)}%
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analyse de performance</CardTitle>
                  <CardDescription>Métriques qualité fournisseurs</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={suppliersData.slice(0, 5).map(s => ({
                      name: s.name.split(' ')[0],
                      Qualité: s.quality,
                      Communication: s.communication,
                      Fiabilité: s.reliability,
                      Note: s.rating
                    }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} />
                      <Radar 
                        name="Performance" 
                        dataKey="Qualité" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.1}
                      />
                      <Radar 
                        name="Communication" 
                        dataKey="Communication" 
                        stroke="hsl(var(--secondary))" 
                        fill="hsl(var(--secondary))" 
                        fillOpacity={0.1}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Performance par catégorie</CardTitle>
                <CardDescription>Analyse des secteurs d'activité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-4">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.suppliers} fournisseurs • {category.orders} commandes
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(category.spent)}</p>
                        <p className="text-sm text-muted-foreground">
                          Délai: {category.avgDelivery} jours
                        </p>
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
                  <CardTitle>Prédictions IA</CardTitle>
                  <CardDescription>Recommandations pour optimiser vos achats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-emerald-800">Optimisation budget</span>
                      </div>
                      <p className="text-sm text-emerald-700">
                        Économie potentielle de {formatCurrency(25000)} en renégociant avec TechDistrib Europe
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Nouveau fournisseur</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Considérer "EliteTech Solutions" pour diversifier les accessoires
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Risque identifié</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        Global Electronics montre des signes de détérioration qualité
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Indicateurs clés</CardTitle>
                  <CardDescription>Métriques de performance globale</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Diversification géographique</span>
                        <span className="text-sm text-muted-foreground">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Qualité moyenne</span>
                        <span className="text-sm text-muted-foreground">4.3/5</span>
                      </div>
                      <Progress value={86} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Respect des délais</span>
                        <span className="text-sm text-muted-foreground">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Dépendance maximale</span>
                        <span className="text-sm text-muted-foreground">28%</span>
                      </div>
                      <Progress value={28} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Contrats Premium</span>
                        <span className="text-sm text-muted-foreground">60%</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}