import { useState, useEffect } from 'react'
import { Package, Truck, MapPin, Clock, Search, Filter, Eye, TrendingUp, AlertTriangle, Globe, Zap, BarChart3, PieChart, Activity, RefreshCw, Download, Bell, Star, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts'
import { AppLayout } from '@/layouts/AppLayout'
import { useOrders } from '@/hooks/useOrders'

// Données simulées pour le tracking avancé
const trackingEvolution = [
  { date: '01/12', total: 156, enTransit: 45, livrees: 98, retards: 13 },
  { date: '02/12', total: 178, enTransit: 52, livrees: 112, retards: 14 },
  { date: '03/12', total: 134, enTransit: 38, livrees: 89, retards: 7 },
  { date: '04/12', total: 189, enTransit: 67, livrees: 115, retards: 7 },
  { date: '05/12', total: 201, enTransit: 78, livrees: 118, retards: 5 },
  { date: '06/12', total: 167, enTransit: 45, livrees: 116, retards: 6 },
  { date: '07/12', total: 198, enTransit: 89, livrees: 102, retards: 7 }
]

const transporteursData = [
  { name: 'Colissimo', performances: 94, livraisons: 1250, retards: 78, note: 4.2 },
  { name: 'Chronopost', performances: 97, livraisons: 890, retards: 27, note: 4.6 },
  { name: 'UPS', performances: 92, livraisons: 567, retards: 45, note: 4.1 },
  { name: 'DHL', performances: 98, livraisons: 434, retards: 9, note: 4.8 },
  { name: 'GLS', performances: 89, livraisons: 623, retards: 68, note: 3.9 }
]

const zonesGeographiques = [
  { name: 'Île-de-France', value: 35 },
  { name: 'Auvergne-Rhône-Alpes', value: 18 },
  { name: 'Occitanie', value: 12 },
  { name: 'Nouvelle-Aquitaine', value: 11 },
  { name: 'Provence-Alpes-Côte d\'Azur', value: 10 },
  { name: 'Autres', value: 14 }
]

const alertesPredictives = [
  { id: 1, type: 'retard_probable', commande: 'CMD-2024-1567', transporteur: 'Colissimo', risque: 85, action: 'Contacter client' },
  { id: 2, type: 'livraison_echec', commande: 'CMD-2024-1523', transporteur: 'GLS', risque: 92, action: 'Programmer relivraison' },
  { id: 3, type: 'colis_bloque', commande: 'CMD-2024-1498', transporteur: 'UPS', risque: 78, action: 'Vérifier douanes' },
  { id: 4, type: 'destinataire_absent', commande: 'CMD-2024-1445', transporteur: 'Chronopost', risque: 67, action: 'Point relais' }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function TrackingUltraPro() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [transporteurFilter, setTransporteurFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState('7days')
  const { orders, stats, isLoading } = useOrders()

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusProgress = (status: string): number => {
    const statusMap: { [key: string]: number } = {
      'pending': 25,
      'processing': 50,
      'shipped': 75,
      'delivered': 100,
      'cancelled': 0
    }
    return statusMap[status] || 0
  }

  const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
      'pending': 'bg-yellow-500',
      'processing': 'bg-blue-500',
      'shipped': 'bg-purple-500',
      'delivered': 'bg-green-500',
      'cancelled': 'bg-red-500'
    }
    return colorMap[status] || 'bg-gray-500'
  }

  const getRisqueColor = (risque: number) => {
    if (risque >= 80) return 'text-red-500'
    if (risque >= 60) return 'text-yellow-500'
    return 'text-green-500'
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Chargement du suivi avancé...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Truck className="w-8 h-8 text-primary" />
              Tracking Ultra Pro
              <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                <Zap className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-2">
              Suivi intelligent avec IA prédictive et analytics avancées
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Bell className="w-4 h-4 mr-2" />
              Alertes IA
            </Button>
          </div>
        </div>

        {/* Métriques Temps Réel */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Colis</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex items-center text-xs text-green-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12% vs hier
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Transit</CardTitle>
              <Truck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.shipped || 0}</div>
              <Progress value={65} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livrées Aujourd'hui</CardTitle>
              <MapPin className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <div className="flex items-center text-xs text-green-500">
                <Star className="w-3 h-3 mr-1" />
                98% réussite
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retards</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <div className="flex items-center text-xs text-red-500">
                <AlertTriangle className="w-3 h-3 mr-1" />
                +3 vs hier
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance IA</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <div className="flex items-center text-xs text-green-500">
                <Activity className="w-3 h-3 mr-1" />
                Prédictions exactes
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="transporteurs">Transporteurs</TabsTrigger>
            <TabsTrigger value="ia-predictive">IA Prédictive</TabsTrigger>
            <TabsTrigger value="suivi-temps-reel">Temps Réel</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des Livraisons</CardTitle>
                  <CardDescription>Tendances des 7 derniers jours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trackingEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="livrees" stackId="1" stroke="#10b981" fill="#10b981" />
                      <Area type="monotone" dataKey="enTransit" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                      <Area type="monotone" dataKey="retards" stackId="1" stroke="#ef4444" fill="#ef4444" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition Géographique</CardTitle>
                  <CardDescription>Livraisons par région</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={zonesGeographiques}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {zonesGeographiques.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance par Transporteur</CardTitle>
                  <CardDescription>Taux de réussite des livraisons</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={transporteursData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="performances" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Temps de Livraison Moyen</CardTitle>
                  <CardDescription>Évolution sur 30 jours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trackingEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transporteurs */}
          <TabsContent value="transporteurs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparatif Transporteurs</CardTitle>
                <CardDescription>Performances détaillées par partenaire</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transporteur</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Livraisons</TableHead>
                      <TableHead>Retards</TableHead>
                      <TableHead>Note Clients</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transporteursData.map((transporteur) => (
                      <TableRow key={transporteur.name}>
                        <TableCell className="font-medium">{transporteur.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={transporteur.performances} className="w-20" />
                            <span className="text-sm">{transporteur.performances}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{transporteur.livraisons}</TableCell>
                        <TableCell className="text-red-500">{transporteur.retards}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{transporteur.note}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IA Prédictive */}
          <TabsContent value="ia-predictive" className="space-y-6">
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-500" />
                  Alertes Prédictives IA
                </CardTitle>
                <CardDescription>
                  Intelligence artificielle pour anticiper les problèmes de livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertesPredictives.map((alerte) => (
                    <div key={alerte.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${alerte.risque >= 80 ? 'bg-red-500' : alerte.risque >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                        <div>
                          <p className="font-medium">{alerte.commande}</p>
                          <p className="text-sm text-muted-foreground">{alerte.transporteur}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-medium ${getRisqueColor(alerte.risque)}`}>
                            {alerte.risque}% risque
                          </p>
                          <p className="text-sm text-muted-foreground">{alerte.action}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Zap className="w-4 h-4 mr-1" />
                          Action IA
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suivi Temps Réel */}
          <TabsContent value="suivi-temps-reel" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.slice(0, 10).map((order) => (
                <Card key={order.id} className="hover-scale">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status).replace('bg-', 'bg-')}`} />
                        <div>
                          <p className="font-medium">#{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.tracking_number || 'En attente de numéro'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Progress value={getStatusProgress(order.status)} className="w-24" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {getStatusProgress(order.status)}% terminé
                          </p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status === 'pending' && 'En attente'}
                          {order.status === 'processing' && 'Traitement'}
                          {order.status === 'shipped' && 'Expédié'}
                          {order.status === 'delivered' && 'Livré'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}