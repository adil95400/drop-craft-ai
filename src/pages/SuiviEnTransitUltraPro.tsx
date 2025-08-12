import { useState } from 'react'
import { Truck, Package, MapPin, Clock, CheckCircle2, AlertTriangle, Eye, Search, Filter, Download, RefreshCw, Bot, Zap, BarChart3, Star, TrendingUp, TrendingDown, Phone, Mail, MessageSquare, Navigation } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

// Données des colis en transit
const transitPackages = [
  {
    id: 'TR001',
    orderId: '12847',
    customer: 'Marie Dubois',
    destination: 'Paris, France',
    carrier: 'Chronopost',
    trackingNumber: 'CP123456789FR',
    status: 'in_transit',
    currentLocation: 'Centre de tri Lyon',
    estimatedDelivery: '2024-01-12',
    departureDate: '2024-01-10',
    progress: 75,
    distance: 465,
    remainingDistance: 125,
    priority: 'express',
    value: 1199.99,
    weight: 0.5,
    dimensions: '15x10x5cm',
    service: 'Express 24h',
    route: ['Paris (Dépôt)', 'Centre Lyon', 'Centre Paris', 'Livraison'],
    currentStep: 2,
    delays: 0,
    temperature: null,
    humidity: null,
    notifications: ['Colis scanné à Lyon', 'En cours de transport'],
    customerPhone: '+33 6 12 34 56 78',
    deliveryInstructions: 'Sonnez à l\'interphone, code 1234A'
  },
  {
    id: 'TR002',
    orderId: '12846',
    customer: 'Pierre Martin',
    destination: 'Lyon, France',
    carrier: 'Colissimo',
    trackingNumber: 'CO987654321FR',
    status: 'delayed',
    currentLocation: 'Centre de tri Marseille',
    estimatedDelivery: '2024-01-13',
    departureDate: '2024-01-09',
    progress: 60,
    distance: 315,
    remainingDistance: 126,
    priority: 'standard',
    value: 999.99,
    weight: 0.8,
    dimensions: '20x15x8cm',
    service: 'Standard 48h',
    route: ['Marseille (Dépôt)', 'Centre Marseille', 'Centre Lyon', 'Livraison'],
    currentStep: 1,
    delays: 1,
    temperature: null,
    humidity: null,
    notifications: ['Retard détecté', 'Nouveau délai: 13/01'],
    customerPhone: '+33 6 98 76 54 32',
    deliveryInstructions: 'Laisser chez le gardien si absent'
  },
  {
    id: 'TR003',
    orderId: '12845',
    customer: 'Sophie Bernard',
    destination: 'Marseille, France',
    carrier: 'UPS',
    trackingNumber: 'UPS789123456FR',
    status: 'out_for_delivery',
    currentLocation: 'Véhicule de livraison',
    estimatedDelivery: '2024-01-12',
    departureDate: '2024-01-10',
    progress: 95,
    distance: 280,
    remainingDistance: 5,
    priority: 'express',
    value: 279.99,
    weight: 0.3,
    dimensions: '12x8x6cm',
    service: 'Express 24h',
    route: ['Marseille (Dépôt)', 'Centre Marseille', 'Tournée', 'Livraison'],
    currentStep: 3,
    delays: 0,
    temperature: null,
    humidity: null,
    notifications: ['Sortie pour livraison', 'Livraison avant 18h'],
    customerPhone: '+33 6 45 67 89 12',
    deliveryInstructions: 'Appartement 3ème étage, ascenseur'
  },
  {
    id: 'TR004',
    orderId: '12844',
    customer: 'Luc Moreau',
    destination: 'Toulouse, France',
    carrier: 'DPD',
    trackingNumber: 'DPD456789123FR',
    status: 'exception',
    currentLocation: 'Centre de tri Toulouse',
    estimatedDelivery: '2024-01-15',
    departureDate: '2024-01-08',
    progress: 85,
    distance: 245,
    remainingDistance: 15,
    priority: 'standard',
    value: 1399.99,
    weight: 2.1,
    dimensions: '35x25x5cm',
    service: 'Standard 72h',
    route: ['Toulouse (Dépôt)', 'Centre Toulouse', 'Centre local', 'Livraison'],
    currentStep: 2,
    delays: 2,
    temperature: null,
    humidity: null,
    notifications: ['Exception: adresse incomplète', 'Contact client requis'],
    customerPhone: '+33 6 23 45 67 89',
    deliveryInstructions: 'Bureau, horaires 9h-17h'
  },
  {
    id: 'TR005',
    orderId: '12843',
    customer: 'Emma Lefevre',
    destination: 'Bruxelles, Belgique',
    carrier: 'Fedex',
    trackingNumber: 'FX123789456BE',
    status: 'customs',
    currentLocation: 'Douane Bruxelles',
    estimatedDelivery: '2024-01-14',
    departureDate: '2024-01-09',
    progress: 70,
    distance: 520,
    remainingDistance: 125,
    priority: 'international',
    value: 1678.98,
    weight: 1.5,
    dimensions: '28x20x10cm',
    service: 'International Express',
    route: ['Paris (Dépôt)', 'Douane Paris', 'Douane Bruxelles', 'Livraison'],
    currentStep: 2,
    delays: 1,
    temperature: null,
    humidity: null,
    notifications: ['En cours de dédouanement', 'Documents conformes'],
    customerPhone: '+32 4 87 65 43 21',
    deliveryInstructions: 'Entreprise EuroTech, réception'
  }
]

// Données d'évolution des livraisons
const deliveryEvolution = [
  { date: '01/01', inTransit: 45, delivered: 28, delayed: 3, exceptions: 1 },
  { date: '02/01', inTransit: 52, delivered: 34, delayed: 4, exceptions: 2 },
  { date: '03/01', inTransit: 48, delivered: 31, delayed: 2, exceptions: 1 },
  { date: '04/01', inTransit: 61, delivered: 42, delayed: 5, exceptions: 3 },
  { date: '05/01', inTransit: 58, delivered: 38, delayed: 3, exceptions: 2 },
  { date: '06/01', inTransit: 65, delivered: 45, delayed: 4, exceptions: 1 },
  { date: '07/01', inTransit: 72, delivered: 48, delayed: 6, exceptions: 2 },
]

// Performance par transporteur
const carrierData = [
  { 
    name: 'Chronopost', 
    packages: 145, 
    onTime: 96.5, 
    delayed: 2.8, 
    lost: 0.7,
    avgDelivery: 1.2,
    cost: 8.50,
    rating: 4.6
  },
  { 
    name: 'Colissimo', 
    packages: 98, 
    onTime: 94.2, 
    delayed: 4.5, 
    lost: 1.3,
    avgDelivery: 2.1,
    cost: 6.20,
    rating: 4.2
  },
  { 
    name: 'UPS', 
    packages: 78, 
    onTime: 97.8, 
    delayed: 1.8, 
    lost: 0.4,
    avgDelivery: 1.1,
    cost: 12.80,
    rating: 4.8
  },
  { 
    name: 'DPD', 
    packages: 65, 
    onTime: 93.1, 
    delayed: 5.2, 
    lost: 1.7,
    avgDelivery: 2.3,
    cost: 7.90,
    rating: 4.1
  },
  { 
    name: 'FedEx', 
    packages: 42, 
    onTime: 98.5, 
    delayed: 1.2, 
    lost: 0.3,
    avgDelivery: 0.9,
    cost: 15.60,
    rating: 4.9
  }
]

// Statuts des colis
const statusData = [
  { name: 'En transit', value: 45, count: 185, color: 'hsl(var(--primary))' },
  { name: 'Sortie livraison', value: 25, count: 98, color: 'hsl(var(--secondary))' },
  { name: 'Retardés', value: 15, count: 62, color: 'hsl(var(--destructive))' },
  { name: 'Douane', value: 10, count: 38, color: 'hsl(var(--muted))' },
  { name: 'Exceptions', value: 5, count: 18, color: 'hsl(var(--accent))' },
]

// Régions de livraison
const regionData = [
  { region: 'Île-de-France', packages: 156, onTime: 95.2, avgTime: 1.3 },
  { region: 'Auvergne-Rhône-Alpes', packages: 89, onTime: 93.8, avgTime: 1.8 },
  { region: 'PACA', packages: 67, onTime: 94.5, avgTime: 1.6 },
  { region: 'International', packages: 45, onTime: 89.2, avgTime: 3.2 },
  { region: 'Autres régions', packages: 124, onTime: 92.7, avgTime: 2.1 },
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--destructive))', 'hsl(var(--muted))', 'hsl(var(--accent))']

export default function SuiviEnTransitUltraPro() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [carrierFilter, setCarrierFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  // Calcul des métriques
  const totalPackages = transitPackages.length
  const delayedPackages = transitPackages.filter(pkg => pkg.status === 'delayed' || pkg.delays > 0).length
  const avgProgress = transitPackages.reduce((sum, pkg) => sum + pkg.progress, 0) / totalPackages
  const exceptionsCount = transitPackages.filter(pkg => pkg.status === 'exception').length

  // Filtrage des données
  const filteredPackages = transitPackages.filter(pkg => {
    const matchesSearch = pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         pkg.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.orderId.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter
    const matchesCarrier = carrierFilter === 'all' || pkg.carrier === carrierFilter
    const matchesPriority = priorityFilter === 'all' || pkg.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesCarrier && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_transit':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">🚛 En transit</Badge>
      case 'out_for_delivery':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">🚚 En livraison</Badge>
      case 'delayed':
        return <Badge variant="destructive">⏰ Retardé</Badge>
      case 'exception':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">⚠️ Exception</Badge>
      case 'customs':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">🛃 Douane</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'express':
        return <Badge variant="destructive">⚡ Express</Badge>
      case 'standard':
        return <Badge variant="secondary">📦 Standard</Badge>
      case 'international':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">🌍 International</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-emerald-500'
    if (progress >= 70) return 'bg-blue-500'
    if (progress >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header avec contrôles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Suivi En Transit Ultra Pro</h1>
            <p className="text-muted-foreground">Tracking intelligent en temps réel avec prédictions de livraison IA</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync temps réel
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export rapport
            </Button>
            
            <Button size="sm">
              <Bot className="h-4 w-4 mr-2" />
              Prédictions IA
            </Button>

            <Button size="sm">
              <Navigation className="h-4 w-4 mr-2" />
              Carte en temps réel
            </Button>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">{Math.round(avgProgress)}% moyen</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{totalPackages}</p>
                <p className="text-xs text-muted-foreground">Colis en transit</p>
                <p className="text-xs text-muted-foreground">Progression: {Math.round(avgProgress)}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-orange-500" />
                <Badge variant="secondary">{delayedPackages} retards</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{delayedPackages}</p>
                <p className="text-xs text-muted-foreground">Colis retardés</p>
                <p className="text-xs text-muted-foreground">{Math.round((delayedPackages/totalPackages)*100)}% du total</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <Badge variant="destructive">{exceptionsCount} exceptions</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{exceptionsCount}</p>
                <p className="text-xs text-muted-foreground">Exceptions actives</p>
                <p className="text-xs text-muted-foreground">Action requise</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <Badge variant="default">95.2%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">95.2%</p>
                <p className="text-xs text-muted-foreground">Taux de livraison</p>
                <p className="text-xs text-muted-foreground">vs objectif 94%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques et analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des livraisons */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution du transport</CardTitle>
              <CardDescription>Suivi des colis par statut</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={deliveryEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="inTransit" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6}
                    name="En transit"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="delivered" 
                    stackId="1"
                    stroke="hsl(var(--secondary))" 
                    fill="hsl(var(--secondary))" 
                    fillOpacity={0.6}
                    name="Livrés"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="delayed" 
                    stackId="1"
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive))" 
                    fillOpacity={0.6}
                    name="Retardés"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition par statut */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par statut</CardTitle>
              <CardDescription>État actuel des colis</CardDescription>
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
                        <span className="text-sm font-medium">{status.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{status.count}</p>
                        <p className="text-xs text-muted-foreground">{status.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des colis en transit */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Colis en transit</CardTitle>
                <CardDescription>Suivi détaillé avec localisation en temps réel</CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher un colis..." 
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
                    <SelectItem value="in_transit">En transit</SelectItem>
                    <SelectItem value="out_for_delivery">En livraison</SelectItem>
                    <SelectItem value="delayed">Retardé</SelectItem>
                    <SelectItem value="exception">Exception</SelectItem>
                    <SelectItem value="customs">Douane</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Transporteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Chronopost">Chronopost</SelectItem>
                    <SelectItem value="Colissimo">Colissimo</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="DPD">DPD</SelectItem>
                    <SelectItem value="Fedex">FedEx</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colis</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Livraison estimée</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pkg.trackingNumber}</p>
                        <p className="text-sm text-muted-foreground">Commande #{pkg.orderId}</p>
                        <p className="text-xs text-muted-foreground">
                          {pkg.customer} • {pkg.carrier}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(pkg.status)}
                        {getPriorityBadge(pkg.priority)}
                        {pkg.delays > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {pkg.delays} retard(s)
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Progress value={pkg.progress} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{pkg.progress}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {pkg.remainingDistance}km restants
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {pkg.currentLocation}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          → {pkg.destination}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Étape {pkg.currentStep}/{pkg.route.length}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatDate(pkg.estimatedDelivery)}</p>
                        <p className="text-sm text-muted-foreground">{pkg.service}</p>
                        <p className="text-xs text-muted-foreground">
                          Valeur: {formatCurrency(pkg.value)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" title="Voir détails">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" title="Contacter client">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" title="Localisation">
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" title="Notifications">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Analyses détaillées */}
        <Tabs defaultValue="carriers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="carriers">Transporteurs</TabsTrigger>
            <TabsTrigger value="regions">Régions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics IA</TabsTrigger>
          </TabsList>

          <TabsContent value="carriers">
            <Card>
              <CardHeader>
                <CardTitle>Performance des transporteurs</CardTitle>
                <CardDescription>Comparaison des KPIs par transporteur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {carrierData.map((carrier, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-4">
                        <Truck className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{carrier.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {carrier.packages} colis • Note: {carrier.rating}/5
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${i < Math.floor(carrier.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-bold text-emerald-600">{carrier.onTime}%</p>
                            <p className="text-xs text-muted-foreground">À l'heure</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-orange-600">{carrier.delayed}%</p>
                            <p className="text-xs text-muted-foreground">Retards</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold">{carrier.avgDelivery}j</p>
                            <p className="text-xs text-muted-foreground">Délai moyen</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold">{formatCurrency(carrier.cost)}</p>
                            <p className="text-xs text-muted-foreground">Coût moyen</p>
                          </div>
                        </div>
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
                <CardDescription>Analyse géographique des livraisons</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionData.map((region, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-4">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{region.region}</p>
                          <p className="text-sm text-muted-foreground">{region.packages} colis</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="font-bold text-emerald-600">{region.onTime}%</p>
                            <p className="text-xs text-muted-foreground">À l'heure</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold">{region.avgTime}j</p>
                            <p className="text-xs text-muted-foreground">Délai moyen</p>
                          </div>
                        </div>
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
                  <CardDescription>Insights avancés sur les livraisons</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-emerald-800">Optimisation détectée</span>
                      </div>
                      <p className="text-sm text-emerald-700">
                        Basculer 15% du trafic vers UPS pourrait réduire les retards de 40%
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Prévision charge</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Pic de livraisons prévu vendredi (+45%) - Renforcer équipes
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Alerte météo</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        Risque de retards région PACA (neige) - 12 colis impactés
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métriques prédictives</CardTitle>
                  <CardDescription>Estimations 7 prochains jours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Livraisons à l'heure</span>
                        <span className="text-sm text-muted-foreground">96.2%</span>
                      </div>
                      <Progress value={96.2} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">+1.0% vs semaine dernière</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Volume livraisons</span>
                        <span className="text-sm text-muted-foreground">+18%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">485 colis attendus</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Satisfaction client</span>
                        <span className="text-sm text-muted-foreground">4.6/5</span>
                      </div>
                      <Progress value={92} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">+0.2 vs mois dernier</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Coût moyen livraison</span>
                        <span className="text-sm text-muted-foreground">{formatCurrency(8.95)}</span>
                      </div>
                      <Progress value={65} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">-3% optimisation prévue</p>
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