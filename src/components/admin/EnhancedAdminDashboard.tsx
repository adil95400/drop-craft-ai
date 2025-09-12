import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { 
  Users, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Shield, 
  Database,
  Activity,
  AlertTriangle,
  RefreshCw,
  Eye,
  DollarSign,
  Download,
  Upload,
  Clock,
  Globe,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { unifiedSystem } from '@/lib/unified-system'
import { useToast } from '@/hooks/use-toast'

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalSuppliers: number
  systemLoad: number
  databaseSize: number
  apiCalls: number
  errorRate: number
}

const revenueData = [
  { name: 'Jan', revenue: 4000, orders: 240 },
  { name: 'Fév', revenue: 3000, orders: 139 },
  { name: 'Mar', revenue: 2000, orders: 980 },
  { name: 'Avr', revenue: 2780, orders: 390 },
  { name: 'Mai', revenue: 1890, orders: 480 },
  { name: 'Jun', revenue: 2390, orders: 380 },
]

const trafficData = [
  { name: 'Direct', value: 400, color: '#8884d8' },
  { name: 'Search', value: 300, color: '#82ca9d' },
  { name: 'Social', value: 200, color: '#ffc658' },
  { name: 'Email', value: 100, color: '#ff7300' },
]

export const EnhancedAdminDashboard = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalSuppliers: 0,
    systemLoad: 0,
    databaseSize: 0,
    apiCalls: 0,
    errorRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { toast } = useToast()

  const loadMetrics = async () => {
    try {
      setLoading(true)
      
      // Simuler le chargement de données réelles
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMetrics({
        totalUsers: 15847,
        activeUsers: 2847,
        totalOrders: 45621,
        totalRevenue: 2847592,
        totalProducts: 128450,
        totalSuppliers: 342,
        systemLoad: 67,
        databaseSize: 2.4, // GB
        apiCalls: 1250000,
        errorRate: 0.02
      })
      setLastUpdate(new Date())
      
      toast({
        title: "Métriques mises à jour",
        description: "Les données du tableau de bord ont été actualisées",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les métriques",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Tableau de Bord Administrateur
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble complète et gestion système • Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Système Opérationnel
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+12.5%</span>
              <span>{metrics.activeUsers.toLocaleString()} actifs</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+8.2%</span>
              <span>ce mois</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(metrics.totalRevenue / 1000000).toFixed(1)}M</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+15.3%</span>
              <span>vs mois précédent</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Importés</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.totalProducts / 1000).toFixed(0)}K</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Upload className="h-3 w-3 text-blue-600" />
              <span>+2.5K cette semaine</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Revenus et Commandes (6 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sources de Trafic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trafficData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {trafficData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Charge CPU</span>
                <span className={getStatusColor(metrics.systemLoad, { good: 50, warning: 80 })}>
                  {metrics.systemLoad}%
                </span>
              </div>
              <Progress value={metrics.systemLoad} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Base de données</span>
                <span>{metrics.databaseSize} GB</span>
              </div>
              <Progress value={30} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Taux d'erreur</span>
                <span className={getStatusColor(metrics.errorRate, { good: 0.01, warning: 0.05 })}>
                  {(metrics.errorRate * 100).toFixed(2)}%
                </span>
              </div>
              <Progress value={metrics.errorRate * 1000} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              État des Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Principale</span>
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Opérationnel
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Base de données</span>
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Opérationnel
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Stockage</span>
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Opérationnel
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Edge Functions</span>
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Maintenance
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <div className="flex justify-between items-center">
                <span>Appels API/h</span>
                <span className="font-medium">{(metrics.apiCalls / 24).toLocaleString()}</span>
              </div>
            </div>
            <div className="text-sm">
              <div className="flex justify-between items-center">
                <span>Nouveaux utilisateurs</span>
                <span className="font-medium">+47</span>
              </div>
            </div>
            <div className="text-sm">
              <div className="flex justify-between items-center">
                <span>Commandes aujourd'hui</span>
                <span className="font-medium">+124</span>
              </div>
            </div>
            <div className="text-sm">
              <div className="flex justify-between items-center">
                <span>Imports en cours</span>
                <span className="font-medium">8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Gérer Utilisateurs</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Database className="h-6 w-6" />
              <span className="text-sm">Backup BDD</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Shield className="h-6 w-6" />
              <span className="text-sm">Scan Sécurité</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Download className="h-6 w-6" />
              <span className="text-sm">Export Données</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}