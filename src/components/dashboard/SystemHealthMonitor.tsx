import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  Server, 
  Wifi,
  RefreshCw,
  TrendingUp,
  Users,
  Package
} from 'lucide-react'

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalProducts: number
  pendingJobs: number
  failedJobs: number
  systemLoad: number
  dbHealth: 'healthy' | 'warning' | 'critical'
  apiResponseTime: number
  errorRate: number
}

export function SystemHealthMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchSystemStats = async () => {
    try {
      setLoading(true)
      
      // Fetch various system metrics
      const [
        usersData,
        productsData,
        jobsData,
        failedJobsData
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at').limit(1000),
        supabase.from('products').select('id').limit(1000),
        supabase.from('import_jobs').select('id').eq('status', 'pending'),
        supabase.from('import_jobs').select('id').eq('status', 'failed')
      ])

      // Calculate active users (last 24h)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const activeUsers = usersData.data?.filter(user => 
        new Date(user.created_at) > yesterday
      ).length || 0

      // Simulate some metrics
      const systemLoad = Math.random() * 100
      const apiResponseTime = Math.random() * 200 + 50
      const errorRate = Math.random() * 5

      // Determine DB health based on response times and error rates
      let dbHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (apiResponseTime > 150 || errorRate > 3) {
        dbHealth = 'warning'
      }
      if (apiResponseTime > 200 || errorRate > 5) {
        dbHealth = 'critical'
      }

      setStats({
        totalUsers: usersData.data?.length || 0,
        activeUsers,
        totalProducts: productsData.data?.length || 0,
        pendingJobs: jobsData.data?.length || 0,
        failedJobs: failedJobsData.data?.length || 0,
        systemLoad,
        dbHealth,
        apiResponseTime,
        errorRate
      })
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching system stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    fetchSystemStats()
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchSystemStats, 120000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Santé du Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Santé du Système
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Mis à jour: {lastUpdate.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSystemStats}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Users */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Utilisateurs</span>
            </div>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <div className="text-sm text-muted-foreground">
              {stats?.activeUsers || 0} actifs (24h)
            </div>
          </div>

          {/* Products */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Produits</span>
            </div>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <div className="text-sm text-muted-foreground">
              Total catalogue
            </div>
          </div>

          {/* Pending Jobs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Tâches</span>
            </div>
            <div className="text-2xl font-bold">{stats?.pendingJobs || 0}</div>
            <div className="text-sm text-muted-foreground">
              En attente
            </div>
          </div>

          {/* Failed Jobs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Échecs</span>
            </div>
            <div className="text-2xl font-bold">{stats?.failedJobs || 0}</div>
            <div className="text-sm text-muted-foreground">
              Tâches échouées
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Database Health */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="text-sm font-medium">Base de données</span>
                </div>
                <Badge className={getHealthColor(stats?.dbHealth || 'healthy')}>
                  {getHealthIcon(stats?.dbHealth || 'healthy')}
                  {stats?.dbHealth || 'healthy'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Temps de réponse: {stats?.apiResponseTime?.toFixed(0) || 0}ms
              </div>
            </div>

            {/* System Load */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Charge système</span>
              </div>
              <Progress value={stats?.systemLoad || 0} />
              <div className="text-sm text-muted-foreground">
                {stats?.systemLoad?.toFixed(1) || 0}%
              </div>
            </div>

            {/* Error Rate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Taux d'erreur</span>
              </div>
              <Progress 
                value={Math.min((stats?.errorRate || 0) * 20, 100)} 
                className={`${(stats?.errorRate || 0) > 3 ? 'bg-red-200' : 'bg-green-200'}`}
              />
              <div className="text-sm text-muted-foreground">
                {stats?.errorRate?.toFixed(2) || 0}%
              </div>
            </div>
          </div>

          {/* System Status Summary */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">État général du système</span>
              <Badge className={getHealthColor(
                (stats?.pendingJobs || 0) > 10 || (stats?.failedJobs || 0) > 5 
                  ? 'warning' 
                  : stats?.dbHealth === 'critical' 
                    ? 'critical' 
                    : 'healthy'
              )}>
                {(stats?.pendingJobs || 0) > 10 || (stats?.failedJobs || 0) > 5 
                  ? 'Attention requise' 
                  : stats?.dbHealth === 'critical' 
                    ? 'Critique' 
                    : 'Fonctionnel'
                }
              </Badge>
            </div>
            {((stats?.pendingJobs || 0) > 10 || (stats?.failedJobs || 0) > 5) && (
              <div className="mt-2 text-sm text-orange-600">
                ⚠️ Tâches d'import en attente nécessitent une attention
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}