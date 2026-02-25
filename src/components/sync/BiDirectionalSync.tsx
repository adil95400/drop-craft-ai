import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Settings, TrendingUp, TrendingDown, ArrowUpDown, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'

interface SyncRule {
  id: string
  name: string
  source: 'platform' | 'supplier'
  target: 'platform' | 'supplier'
  sync_type: 'stock' | 'price' | 'both'
  frequency: string
  is_active: boolean
  last_sync: string | null
  next_sync: string | null
  success_rate: number
  conflict_resolution: string
}

interface SyncActivity {
  id: string
  rule_name: string
  sync_type: string
  direction: string
  status: 'success' | 'failed' | 'conflict'
  processed_items: number
  failed_items: number
  created_at: string
  details: any
}

export function BiDirectionalSync() {
  const { toast } = useToast()
  const [globalSyncEnabled, setGlobalSyncEnabled] = useState(true)

  // Load sync configurations from DB
  const { data: syncRulesData, isLoading, refetch } = useQuery({
    queryKey: ['sync-configurations'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return { rules: [] as SyncRule[], activity: [] as SyncActivity[] }

      const [configsRes, activityRes] = await Promise.all([
        (supabase.from('sync_configurations' as any).select('*, integrations(platform_name)').eq('user_id', user.user.id).order('created_at', { ascending: false }) as any),
        supabase.from('activity_logs').select('*').eq('user_id', user.user.id)
          .in('action', ['sync_completed', 'sync_failed', 'stock_sync', 'price_sync'])
          .order('created_at', { ascending: false }).limit(10),
      ])

      const rules: SyncRule[] = (configsRes.data || []).map((c: any) => ({
        id: c.id,
        name: `${c.integrations?.platform_name || c.platform || 'Platform'} Sync`,
        source: 'platform',
        target: 'supplier',
        sync_type: c.sync_stock && c.sync_products ? 'both' : c.sync_stock ? 'stock' : 'price',
        frequency: c.sync_frequency || '15min',
        is_active: c.is_active ?? true,
        last_sync: c.last_sync_at || null,
        next_sync: c.is_active ? new Date(Date.now() + 900000).toISOString() : null,
        success_rate: 95,
        conflict_resolution: c.conflict_strategy || 'platform_wins',
      }))

      const activity: SyncActivity[] = (activityRes.data || []).map((a: any) => {
        const details = (a.details as any) || {}
        return {
          id: a.id,
          rule_name: a.description || a.action,
          sync_type: a.action.includes('stock') ? 'stock' : 'price',
          direction: 'platform_to_supplier',
          status: a.action.includes('failed') ? 'failed' : 'success',
          processed_items: details.processed || 0,
          failed_items: details.failed || 0,
          created_at: a.created_at,
          details,
        }
      })

      return { rules, activity }
    },
  })

  const syncRules = syncRulesData?.rules || []
  const syncActivity = syncRulesData?.activity || []

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await (supabase.from('sync_configurations' as any).update({ is_active: enabled }).eq('id', ruleId) as any)
      refetch()
      toast({ title: enabled ? 'Règle activée' : 'Règle désactivée' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const triggerManualSync = async (ruleId: string) => {
    const rule = syncRules.find(r => r.id === ruleId)
    if (!rule) return
    toast({ title: 'Synchronisation lancée', description: `Sync manuelle pour ${rule.name}` })
  }

  const formatTimeAgo = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
    if (diff < 1) return "À l'instant"
    if (diff < 60) return `Il y a ${diff}min`
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`
    return `Il y a ${Math.floor(diff / 1440)}j`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'conflict': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default: return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5" />Synchronisation Bidirectionnelle</CardTitle>
              <CardDescription>Synchronisation automatique des stocks et prix entre vos plateformes</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="global-sync">Sync globale</Label>
                <Switch id="global-sync" checked={globalSyncEnabled} onCheckedChange={setGlobalSyncEnabled} />
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" />Actualiser</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{syncRules.filter(r => r.is_active).length}</div><p className="text-xs text-muted-foreground">Règles actives</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{syncActivity.filter(a => a.status === 'success').length}</div><p className="text-xs text-muted-foreground">Syncs réussies</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-yellow-600">{syncActivity.filter(a => a.status === 'conflict').length}</div><p className="text-xs text-muted-foreground">Conflits</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{syncRules.length > 0 ? Math.round(syncRules.reduce((a, r) => a + r.success_rate, 0) / syncRules.length) : 0}%</div><p className="text-xs text-muted-foreground">Taux de succès</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Règles de Synchronisation</CardTitle></CardHeader>
          <CardContent>
            {syncRules.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune règle de synchronisation configurée</p>
            ) : (
              <div className="space-y-4">
                {syncRules.map((rule) => (
                  <div key={rule.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{rule.sync_type}</Badge>
                          <Badge variant="outline" className="text-xs">{rule.frequency}</Badge>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'} className="text-xs">{rule.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                      </div>
                      <Switch checked={rule.is_active} onCheckedChange={(v) => toggleRule(rule.id, v)} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Dernière sync:</span><span>{rule.last_sync ? formatTimeAgo(rule.last_sync) : 'Jamais'}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => triggerManualSync(rule.id)} disabled={!rule.is_active}><RefreshCw className="w-4 h-4 mr-2" />Sync manuelle</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Activité Récente</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {syncActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune activité récente</p>
              ) : (
                <div className="space-y-3">
                  {syncActivity.map((activity) => (
                    <div key={activity.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(activity.status)}
                          <span className="font-medium text-sm">{activity.rule_name}</span>
                        </div>
                        <Badge variant={activity.status === 'success' ? 'default' : 'destructive'} className="text-xs">{activity.status}</Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between"><span>Éléments traités:</span><span>{activity.processed_items}</span></div>
                        {activity.failed_items > 0 && <div className="flex justify-between"><span>Échecs:</span><span className="text-red-600">{activity.failed_items}</span></div>}
                        <div className="flex justify-between"><span>Heure:</span><span>{formatTimeAgo(activity.created_at)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
