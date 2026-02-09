/**
 * SystemAlertsPanel — Alerts based exclusively on real job signals from API V1
 * Sources: failed, retryable, canceled jobs only. No realtime subscriptions.
 */
import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, XCircle, CheckCircle, Bell, RefreshCw, RotateCcw
} from 'lucide-react'
import { importJobsApi } from '@/services/api/client'

interface JobAlert {
  id: string
  severity: 'high' | 'medium'
  title: string
  description: string
  timestamp: string
  retryable: boolean
  jobId: string
}

export const SystemAlertsPanel: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['system-alerts-jobs'],
    queryFn: async (): Promise<JobAlert[]> => {
      try {
        const [failedResp, canceledResp] = await Promise.all([
          importJobsApi.list({ status: 'failed', per_page: 10 }),
          importJobsApi.list({ status: 'canceled', per_page: 5 }),
        ])

        const jobAlerts: JobAlert[] = []

        for (const job of failedResp.items ?? []) {
          jobAlerts.push({
            id: `failed_${job.job_id ?? job.id}`,
            severity: 'high',
            title: 'Import échoué',
            description: job.error_message ?? `Job ${job.source ?? 'import'} — ${job.items_failed ?? 0} erreurs`,
            timestamp: job.completed_at ?? job.updated_at ?? job.created_at,
            retryable: true,
            jobId: job.job_id ?? job.id,
          })
        }

        for (const job of canceledResp.items ?? []) {
          jobAlerts.push({
            id: `canceled_${job.job_id ?? job.id}`,
            severity: 'medium',
            title: 'Import annulé',
            description: `Job ${job.source ?? 'import'} annulé — ${job.items_processed ?? 0}/${job.items_total ?? 0} traités`,
            timestamp: job.completed_at ?? job.updated_at ?? job.created_at,
            retryable: true,
            jobId: job.job_id ?? job.id,
          })
        }

        jobAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        return jobAlerts
      } catch {
        return []
      }
    },
    staleTime: 30000,
    refetchInterval: 60000,
  })

  const handleRetry = async (jobId: string) => {
    try {
      await importJobsApi.retry(jobId, true)
      queryClient.invalidateQueries({ queryKey: ['system-alerts-jobs'] })
    } catch (err) {
      console.error('Retry failed:', err)
    }
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'high')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertes Système
            {alerts.length > 0 && <Badge variant="destructive">{alerts.length}</Badge>}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Chargement...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">Aucune alerte système active</p>
            <p className="text-sm text-muted-foreground mt-1">Tous les jobs fonctionnent normalement</p>
          </div>
        ) : (
          <div className="space-y-3">
            {criticalAlerts.length > 0 && (
              <Alert className="border-destructive/50 bg-destructive/5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  <strong>{criticalAlerts.length} job(s) échoué(s)</strong> nécessitent une attention
                </AlertDescription>
              </Alert>
            )}

            {alerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${alert.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <Badge variant="outline" className={alert.severity === 'high' ? 'border-destructive/50 text-destructive' : ''}>
                          {alert.severity === 'high' ? 'ÉCHEC' : 'ANNULÉ'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {alert.retryable && (
                    <Button size="sm" variant="outline" onClick={() => handleRetry(alert.jobId)}>
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Relancer
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
