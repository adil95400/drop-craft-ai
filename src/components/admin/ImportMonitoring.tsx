import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Download
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface ImportStats {
  total_jobs: number
  active_jobs: number
  completed_today: number
  failed_today: number
  avg_duration_ms: number
  success_rate: number
}

export const ImportMonitoring = () => {
  const { toast } = useToast()
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      // Charger les stats
      const { data: jobs, error: jobsError } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (jobsError) throw jobsError

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayJobs = jobs?.filter(j => new Date(j.created_at) >= today) || []
      const completedJobs = jobs?.filter(j => j.status === 'completed') || []
      
      const avgDuration = completedJobs.length > 0
        ? completedJobs.reduce((sum, j) => {
            const start = new Date(j.started_at || j.created_at).getTime()
            const end = new Date(j.completed_at || j.updated_at).getTime()
            return sum + (end - start)
          }, 0) / completedJobs.length
        : 0

      setStats({
        total_jobs: jobs?.length || 0,
        active_jobs: jobs?.filter(j => j.status === 'processing' || j.status === 'pending').length || 0,
        completed_today: todayJobs.filter(j => j.status === 'completed').length,
        failed_today: todayJobs.filter(j => j.status === 'failed').length,
        avg_duration_ms: avgDuration,
        success_rate: jobs && jobs.length > 0
          ? (jobs.filter(j => j.status === 'completed').length / jobs.length) * 100
          : 0
      })

      setRecentJobs(jobs?.slice(0, 20) || [])
    } catch (error) {
      console.error('Error loading import monitoring data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de monitoring",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const unlockStuckJobs = async () => {
    try {
      const { data, error } = await supabase.rpc('unlock_stuck_import_jobs')
      
      if (error) throw error

      toast({
        title: "Jobs débloqués",
        description: `${data || 0} jobs ont été débloqués`
      })
      
      loadData()
    } catch (error) {
      console.error('Error unlocking jobs:', error)
      toast({
        title: "Erreur",
        description: "Impossible de débloquer les jobs",
        variant: "destructive"
      })
    }
  }

  const exportLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      const csv = [
        ['ID', 'Status', 'Type', 'Started', 'Completed', 'Total Products', 'Success', 'Errors'].join(','),
        ...data.map(j => [
          j.id,
          j.status,
          j.job_type || 'import',
          j.started_at || '',
          j.completed_at || '',
          j.total_products || 0,
          j.successful_imports || 0,
          j.failed_imports || 0
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `import-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Export réussi",
        description: "Les logs ont été exportés"
      })
    } catch (error) {
      console.error('Error exporting logs:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les logs",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    loadData()
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      completed: { variant: 'default', icon: CheckCircle2 },
      processing: { variant: 'secondary', icon: Activity },
      pending: { variant: 'outline', icon: Clock },
      failed: { variant: 'destructive', icon: AlertTriangle }
    }
    
    const config = variants[status] || variants.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Monitoring des Imports</h2>
          <p className="text-muted-foreground">
            Surveillance en temps réel des imports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={unlockStuckJobs}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Débloquer jobs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Jobs</CardDescription>
            <CardTitle className="text-3xl">{stats?.total_jobs || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.active_jobs || 0} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Complétés Aujourd'hui</CardDescription>
            <CardTitle className="text-3xl text-success">
              {stats?.completed_today || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Taux de succès: {stats?.success_rate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Échoués Aujourd'hui</CardDescription>
            <CardTitle className="text-3xl text-destructive">
              {stats?.failed_today || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Nécessite attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Durée Moyenne</CardDescription>
            <CardTitle className="text-3xl">
              {formatDuration(stats?.avg_duration_ms || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Par import
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs Récents</CardTitle>
          <CardDescription>
            Les 20 derniers jobs d'import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                      <Badge variant="outline">{job.source_type}</Badge>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground">
                      {job.id.slice(0, 8)}...
                    </p>
                    {job.source_url && (
                      <p className="text-xs text-muted-foreground truncate max-w-[400px]">
                        {job.source_url}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right space-y-1 min-w-[200px]">
                    <div className="text-sm">
                      {job.total_rows > 0 && (
                        <span>
                          {job.success_rows}/{job.total_rows} réussis
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(job.created_at), 'PPp', { locale: getDateFnsLocale() })}
                    </div>
                    {job.started_at && job.completed_at && (
                      <div className="text-xs text-muted-foreground">
                        Durée: {formatDuration(
                          new Date(job.completed_at).getTime() - 
                          new Date(job.started_at).getTime()
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
