import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useIntegrationsUnified } from "@/hooks/unified"
import { BarChart3, TrendingUp, Activity, Download } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const IntegrationAnalytics = () => {
  const { integrations, isLoading } = useIntegrationsUnified()

  // Fetch real sync stats per integration
  const { data: syncStats } = useQuery({
    queryKey: ['integration-sync-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return {}

      const { data: syncs } = await supabase
        .from('unified_sync_queue')
        .select('channels, status')
        .eq('user_id', user.id)

      // Count syncs per integration
      const stats: Record<string, { total: number; success: number }> = {}
      ;(syncs || []).forEach((s: any) => {
        const channels = s.channels || []
        channels.forEach((ch: any) => {
          const intId = ch.integration_id || 'unknown'
          if (!stats[intId]) stats[intId] = { total: 0, success: 0 }
          stats[intId].total++
          if (s.status === 'completed' || s.status === 'synced') stats[intId].success++
        })
      })
      return stats
    },
    enabled: !isLoading
  })

  if (isLoading) {
    return <div className="p-4">Chargement des analytics...</div>
  }

  const totalSyncs = Object.values(syncStats || {}).reduce((s, v) => s + v.total, 0)
  const totalSuccess = Object.values(syncStats || {}).reduce((s, v) => s + v.success, 0)
  const successRate = totalSyncs > 0 ? ((totalSuccess / totalSyncs) * 100).toFixed(1) : '100.0'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Analytics d'Intégrations</h3>
          <p className="text-sm text-muted-foreground">Analyse des performances et utilisation</p>
        </div>
        <Button variant="outline"><Download className="w-4 h-4 mr-2" />Exporter</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Synchronisations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSyncs}</div>
            <p className="text-xs text-muted-foreground">Depuis la connexion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">Taux de réussite global</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intégrations Actives</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.filter((i: any) => i.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Sur {integrations.length} configurées</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Performance par Plateforme</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration: any) => {
              const stats = (syncStats || {})[integration.id] || { total: 0, success: 0 }
              const rate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 100
              return (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{integration.platform_name}</div>
                      <div className="text-sm text-muted-foreground">{integration.platform_type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm">{stats.total} syncs</div>
                      <div className="text-xs text-muted-foreground">{rate}% succès</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
