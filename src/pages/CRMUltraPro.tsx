import { useState } from 'react'
import { Users, User, Phone, Mail, Calendar, MessageSquare, Target, TrendingUp, TrendingDown, Plus, Eye, Edit, Trash2, MoreHorizontal, Search, Filter, Download, RefreshCw, Bot, Zap, BarChart3, Award, Star, MapPin, Building, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
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

// Données des clients
const customersData = [
  {
    id: '1',
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'marie.dubois@email.com',
    phone: '+33 6 12 34 56 78',
    company: 'TechCorp',
    position: 'Directrice Achats',
    country: 'France',
    city: 'Paris',
    registrationDate: '2023-08-15',
    lastOrder: '2024-01-10',
    totalOrders: 8,
    totalSpent: 4250.99,
    avgOrderValue: 531.37,
    status: 'active',
    segment: 'vip',
    source: 'organic',
    tags: ['Enterprise', 'Mobile'],
    notes: 'Client fidèle avec commandes régulières',
    birthday: '1985-03-22',
    preferences: ['iOS', 'Premium'],
    communicationPreference: 'email',
    lifetimeValue: 8500,
    acquisitionCost: 85,
    riskScore: 0.15
  },
  {
    id: '2',
    firstName: 'Pierre',
    lastName: 'Martin',
    email: 'pierre.martin@email.com',
    phone: '+33 6 98 76 54 32',
    company: 'StartupXYZ',
    position: 'CEO',
    country: 'France',
    city: 'Lyon',
    registrationDate: '2023-11-02',
    lastOrder: '2024-01-08',
    totalOrders: 6,
    totalSpent: 3200.45,
    avgOrderValue: 533.41,
    status: 'active',
    segment: 'loyal',
    source: 'referral',
    tags: ['Startup', 'Tech'],
    notes: 'Intéressé par les innovations',
    birthday: '1988-07-14',
    preferences: ['Android', 'Business'],
    communicationPreference: 'phone',
    lifetimeValue: 6500,
    acquisitionCost: 45,
    riskScore: 0.25
  },
  {
    id: '3',
    firstName: 'Sophie',
    lastName: 'Bernard',
    email: 'sophie.bernard@email.com',
    phone: '+33 6 45 67 89 12',
    company: 'MediaPro',
    position: 'Responsable IT',
    country: 'France',
    city: 'Marseille',
    registrationDate: '2023-06-20',
    lastOrder: '2024-01-05',
    totalOrders: 5,
    totalSpent: 2800.75,
    avgOrderValue: 560.15,
    status: 'active',
    segment: 'regular',
    source: 'social',
    tags: ['Media', 'Creative'],
    notes: 'Préfère les produits haut de gamme',
    birthday: '1990-12-08',
    preferences: ['Design', 'Professional'],
    communicationPreference: 'email',
    lifetimeValue: 4200,
    acquisitionCost: 95,
    riskScore: 0.35
  },
  {
    id: '4',
    firstName: 'Luc',
    lastName: 'Moreau',
    email: 'luc.moreau@email.com',
    phone: '+33 6 23 45 67 89',
    company: 'ConseilPlus',
    position: 'Consultant',
    country: 'France',
    city: 'Toulouse',
    registrationDate: '2023-09-12',
    lastOrder: '2023-12-20',
    totalOrders: 4,
    totalSpent: 2100.30,
    avgOrderValue: 525.08,
    status: 'at_risk',
    segment: 'new',
    source: 'paid',
    tags: ['Consulting', 'Services'],
    notes: 'N\'a pas commandé depuis 3 semaines',
    birthday: '1982-05-17',
    preferences: ['Business', 'Portable'],
    communicationPreference: 'sms',
    lifetimeValue: 3800,
    acquisitionCost: 120,
    riskScore: 0.75
  },
  {
    id: '5',
    firstName: 'Emma',
    lastName: 'Lefevre',
    email: 'emma.lefevre@email.com',
    phone: '+32 4 87 65 43 21',
    company: 'EuroTech',
    position: 'Acheteuse',
    country: 'Belgique',
    city: 'Bruxelles',
    registrationDate: '2024-01-03',
    lastOrder: '2024-01-08',
    totalOrders: 3,
    totalSpent: 1850.60,
    avgOrderValue: 616.87,
    status: 'new',
    segment: 'new',
    source: 'organic',
    tags: ['International', 'B2B'],
    notes: 'Nouveau client prometteur',
    birthday: '1987-11-25',
    preferences: ['European', 'Quality'],
    communicationPreference: 'email',
    lifetimeValue: 2500,
    acquisitionCost: 75,
    riskScore: 0.45
  }
]

// Données d'évolution des clients
const customersEvolution = [
  { date: '01/01', newCustomers: 25, totalCustomers: 1245, churn: 8, retention: 94.2 },
  { date: '02/01', newCustomers: 32, totalCustomers: 1268, churn: 9, retention: 94.5 },
  { date: '03/01', newCustomers: 28, totalCustomers: 1287, churn: 6, retention: 95.1 },
  { date: '04/01', newCustomers: 41, totalCustomers: 1322, churn: 7, retention: 94.8 },
  { date: '05/01', newCustomers: 38, totalCustomers: 1353, churn: 5, retention: 95.5 },
  { date: '06/01', newCustomers: 45, totalCustomers: 1391, churn: 8, retention: 94.9 },
  { date: '07/01', newCustomers: 52, totalCustomers: 1435, churn: 6, retention: 95.2 },
]

// Segmentation des clients
const segmentData = [
  { name: 'VIP', value: 15, customers: 215, revenue: 125000, color: 'hsl(var(--primary))' },
  { name: 'Fidèles', value: 35, customers: 502, revenue: 180000, color: 'hsl(var(--secondary))' },
  { name: 'Réguliers', value: 30, customers: 430, revenue: 95000, color: 'hsl(var(--accent))' },
  { name: 'Nouveaux', value: 15, customers: 216, revenue: 45000, color: 'hsl(var(--muted))' },
  { name: 'À risque', value: 5, customers: 72, revenue: 15000, color: 'hsl(var(--destructive))' },
]

// Sources d'acquisition
const acquisitionData = [
  { source: 'Organique', customers: 485, cost: 45, conversion: 8.5 },
  { source: 'Publicité payante', customers: 320, cost: 125, conversion: 6.2 },
  { source: 'Référencement', customers: 280, cost: 35, conversion: 12.1 },
  { source: 'Réseaux sociaux', customers: 195, cost: 85, conversion: 4.8 },
  { source: 'Email marketing', customers: 155, cost: 25, conversion: 15.2 },
]

// Métriques de satisfaction
const satisfactionData = [
  { category: 'Support client', score: 4.6, responses: 245 },
  { category: 'Qualité produits', score: 4.4, responses: 412 },
  { category: 'Livraison', score: 4.2, responses: 385 },
  { category: 'Prix', score: 3.9, responses: 298 },
  { category: 'Site web', score: 4.3, responses: 356 },
]

// Alertes clients
const customerAlerts = [
  { type: 'churn_risk', customer: 'Luc Moreau', message: 'Aucune commande depuis 21 jours', severity: 'warning' },
  { type: 'vip_complaint', customer: 'Marie Dubois', message: 'Réclamation sur dernière commande', severity: 'error' },
  { type: 'high_value', customer: 'Emma Lefevre', message: 'Nouveau client à fort potentiel', severity: 'info' },
  { type: 'birthday', customer: 'Sophie Bernard', message: 'Anniversaire dans 3 jours', severity: 'info' },
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))']

export default function CRMUltraPro() {
  const [searchTerm, setSearchTerm] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Calcul des métriques
  const totalCustomers = customersData.length
  const totalRevenue = customersData.reduce((sum, customer) => sum + customer.totalSpent, 0)
  const avgCustomerValue = totalRevenue / totalCustomers
  const atRiskCustomers = customersData.filter(customer => customer.status === 'at_risk').length

  // Filtrage des données
  const filteredCustomers = customersData.filter(customer => {
    const matchesSearch = customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
    
    return matchesSearch && matchesSegment && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Actif</Badge>
      case 'new':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Nouveau</Badge>
      case 'at_risk':
        return <Badge variant="destructive">À risque</Badge>
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactif</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case 'vip':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">VIP</Badge>
      case 'loyal':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Fidèle</Badge>
      case 'regular':
        return <Badge variant="secondary">Régulier</Badge>
      case 'new':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Nouveau</Badge>
      default:
        return <Badge variant="outline">{segment}</Badge>
    }
  }

  const getRiskScore = (score: number) => {
    if (score <= 0.3) return 'Faible'
    if (score <= 0.6) return 'Moyen'
    return 'Élevé'
  }

  const getRiskColor = (score: number) => {
    if (score <= 0.3) return 'text-emerald-600'
    if (score <= 0.6) return 'text-orange-600'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header avec contrôles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">CRM Ultra Pro</h1>
            <p className="text-muted-foreground">Gestion avancée des clients et prédictions comportementales IA</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync données
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export clients
            </Button>
            
            <Button size="sm">
              <Bot className="h-4 w-4 mr-2" />
              Prédictions IA
            </Button>

            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">+8.3%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{totalCustomers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Clients totaux</p>
                <p className="text-xs text-muted-foreground">vs mois dernier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-muted-foreground" />
                <Badge variant="default">+12.5%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(avgCustomerValue)}</p>
                <p className="text-xs text-muted-foreground">Valeur client moyenne</p>
                <p className="text-xs text-muted-foreground">vs mois dernier</p>
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
                <p className="text-xs text-muted-foreground">Taux de rétention</p>
                <p className="text-xs text-muted-foreground">+0.8% vs mois dernier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <Badge variant="secondary">{atRiskCustomers} clients</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{atRiskCustomers}</p>
                <p className="text-xs text-muted-foreground">Clients à risque</p>
                <p className="text-xs text-muted-foreground">Action requise</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes clients */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Alertes clients prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{alert.customer}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getAlertColor(alert.severity)}>{alert.severity}</Badge>
                    <Button size="sm" variant="outline">Action</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Graphiques et analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des clients */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la base clients</CardTitle>
              <CardDescription>Nouveaux clients et rétention</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={customersEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="newCustomers" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    name="Nouveaux clients"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="churn" 
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive))" 
                    fillOpacity={0.3}
                    name="Churn"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Segmentation des clients */}
          <Card>
            <CardHeader>
              <CardTitle>Segmentation des clients</CardTitle>
              <CardDescription>Répartition par valeur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={segmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {segmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {segmentData.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="text-sm font-medium">{segment.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{segment.customers}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(segment.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analyses détaillées */}
        <Tabs defaultValue="customers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="customers">Clients</TabsTrigger>
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
            <TabsTrigger value="analytics">Analytics IA</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Base de données clients</CardTitle>
                    <CardDescription>Gestion complète de vos clients</CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Rechercher un client..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Segment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="loyal">Fidèles</SelectItem>
                        <SelectItem value="regular">Réguliers</SelectItem>
                        <SelectItem value="new">Nouveaux</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="new">Nouveau</SelectItem>
                        <SelectItem value="at_risk">À risque</SelectItem>
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
                      <TableHead>Client</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead>Commandes</TableHead>
                      <TableHead>Valeur</TableHead>
                      <TableHead>Risque</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                            <p className="text-xs text-muted-foreground">{customer.company} • {customer.city}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getSegmentBadge(customer.segment)}
                            {getStatusBadge(customer.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold">{customer.totalOrders}</p>
                            <p className="text-sm text-muted-foreground">
                              Dernière: {formatDate(customer.lastOrder)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold">{formatCurrency(customer.totalSpent)}</p>
                            <p className="text-sm text-muted-foreground">
                              LTV: {formatCurrency(customer.lifetimeValue)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className={`font-medium ${getRiskColor(customer.riskScore)}`}>
                              {getRiskScore(customer.riskScore)}
                            </p>
                            <Progress value={(1 - customer.riskScore) * 100} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4" />
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

          <TabsContent value="acquisition">
            <Card>
              <CardHeader>
                <CardTitle>Canaux d'acquisition</CardTitle>
                <CardDescription>Performance des sources de trafic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {acquisitionData.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-4">
                        <Target className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{source.source}</p>
                          <p className="text-sm text-muted-foreground">
                            {source.customers} clients • {formatCurrency(source.cost)} CAC
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{source.conversion}%</p>
                        <p className="text-sm text-muted-foreground">Conversion</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="satisfaction">
            <Card>
              <CardHeader>
                <CardTitle>Satisfaction client</CardTitle>
                <CardDescription>Scores par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {satisfactionData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.category}</span>
                        <div className="text-right">
                          <span className="font-bold">{item.score}/5</span>
                          <span className="text-sm text-muted-foreground ml-2">({item.responses} avis)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={(item.score / 5) * 100} className="flex-1" />
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < Math.floor(item.score) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
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
                  <CardDescription>Insights comportementaux avancés</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-emerald-800">Opportunité upsell</span>
                      </div>
                      <p className="text-sm text-emerald-700">
                        Marie Dubois est prête pour une offre premium (+40% de probabilité)
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Rétention prédictive</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        15 clients à fort risque de churn identifiés pour campagne de rétention
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-800">Nouveau segment</span>
                      </div>
                      <p className="text-sm text-purple-700">
                        Segment "Tech Innovators" détecté (28 clients, LTV +65%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métriques prédictives</CardTitle>
                  <CardDescription>Performances attendues 30 jours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Nouveaux clients</span>
                        <span className="text-sm text-muted-foreground">+125 prévus</span>
                      </div>
                      <Progress value={78} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">+18% vs mois dernier</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Rétention</span>
                        <span className="text-sm text-muted-foreground">95.8%</span>
                      </div>
                      <Progress value={95.8} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">+0.6% vs mois dernier</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Valeur client moyenne</span>
                        <span className="text-sm text-muted-foreground">{formatCurrency(892)}</span>
                      </div>
                      <Progress value={68} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">+12% vs mois dernier</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Satisfaction</span>
                        <span className="text-sm text-muted-foreground">4.5/5</span>
                      </div>
                      <Progress value={90} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">+0.1 vs mois dernier</p>
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