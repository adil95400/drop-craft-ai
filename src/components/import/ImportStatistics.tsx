import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock,
  CheckCircle2,
  XCircle,
  Timer
} from 'lucide-react'

interface ImportStats {
  totalImports: number
  successfulImports: number
  failedImports: number
  avgDuration: number
  successRate: number
  totalProductsImported: number
  todayImports: number
  trend: 'up' | 'down' | 'stable'
}

export const ImportStatistics = () => {
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Récupérer tous les imports
        const { data: allJobs } = await supabase
          .from('import_jobs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!allJobs) return

        // Imports d'aujourd'hui
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayJobs = allJobs.filter(j => new Date(j.created_at) >= today)

        // Imports de la semaine dernière pour la tendance
        const lastWeek = new Date()
        lastWeek.setDate(lastWeek.getDate() - 7)
        const lastWeekJobs = allJobs.filter(j => new Date(j.created_at) >= lastWeek)

        // Calculs
        const successful = allJobs.filter(j => j.status === 'completed').length
        const failed = allJobs.filter(j => j.status === 'failed').length
        const successRate = allJobs.length > 0 
          ? Math.round((successful / allJobs.length) * 100)
          : 0

        // Durée moyenne
        const completedJobs = allJobs.filter(j => 
          j.status === 'completed' && j.started_at && j.completed_at
        )
        
        let avgDuration = 0
        if (completedJobs.length > 0) {
          const totalDuration = completedJobs.reduce((sum, job) => {
            const start = new Date(job.started_at!).getTime()
            const end = new Date(job.completed_at!).getTime()
            return sum + (end - start)
          }, 0)
          avgDuration = Math.round(totalDuration / completedJobs.length / 1000) // en secondes
        }

        // Total produits
        const totalProducts = allJobs.reduce((sum, job) => 
          sum + (job.successful_imports || 0), 0
        )

        // Tendance
        const thisWeekCount = todayJobs.length
        const prevWeekCount = lastWeekJobs.length - thisWeekCount
        let trend: 'up' | 'down' | 'stable' = 'stable'
        if (thisWeekCount > prevWeekCount) trend = 'up'
        else if (thisWeekCount < prevWeekCount) trend = 'down'

        setStats({
          totalImports: allJobs.length,
          successfulImports: successful,
          failedImports: failed,
          avgDuration,
          successRate,
          totalProductsImported: totalProducts,
          todayImports: todayJobs.length,
          trend
        })
      } catch (error) {
        console.error('[ImportStatistics] Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()

    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Imports */}
      <Card className="hover-scale">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Imports
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{stats.totalImports}</div>
            <Badge variant="outline" className="text-xs">
              {stats.todayImports} aujourd'hui
            </Badge>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {stats.trend === 'up' && (
              <>
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-xs text-success">En hausse</span>
              </>
            )}
            {stats.trend === 'down' && (
              <>
                <TrendingDown className="h-3 w-3 text-destructive" />
                <span className="text-xs text-destructive">En baisse</span>
              </>
            )}
            {stats.trend === 'stable' && (
              <span className="text-xs text-muted-foreground">Stable</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card className="hover-scale">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de réussite
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {stats.successRate}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.successfulImports} réussis / {stats.failedImports} échoués
          </p>
        </CardContent>
      </Card>

      {/* Average Duration */}
      <Card className="hover-scale">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Durée moyenne
            </CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(stats.avgDuration)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Par import complété
          </p>
        </CardContent>
      </Card>

      {/* Total Products */}
      <Card className="hover-scale">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produits importés
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalProductsImported.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total cumulé
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
