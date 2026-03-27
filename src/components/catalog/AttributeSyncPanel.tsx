/**
 * AttributeSyncPanel — Review & manage detected supplier attribute changes
 * Uses product_supplier_links.metadata for storing changes (no extra tables needed)
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Check, X, RefreshCw, ArrowRight, DollarSign, Package,
  Type, FileText, Image, Settings, Zap, AlertTriangle, CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const ATTR_META: Record<string, { icon: any; label: string }> = {
  price: { icon: DollarSign, label: 'Prix fournisseur' },
  stock: { icon: Package, label: 'Stock' },
  title: { icon: Type, label: 'Titre' },
  description: { icon: FileText, label: 'Description' },
  images: { icon: Image, label: 'Images' },
}

const DEFAULT_CONFIG: Record<string, { sync_enabled: boolean; auto_apply: boolean; threshold_percent?: number }> = {
  price: { sync_enabled: true, auto_apply: false, threshold_percent: 5 },
  stock: { sync_enabled: true, auto_apply: true },
  title: { sync_enabled: true, auto_apply: false },
  description: { sync_enabled: true, auto_apply: false },
  images: { sync_enabled: true, auto_apply: false },
}

export function AttributeSyncPanel() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'changes' | 'config'>('changes')

  // Fetch pending changes via edge function
  const { data: syncData, isLoading } = useQuery({
    queryKey: ['attribute-sync-pending', user?.id],
    queryFn: async () => {
      if (!user) return { pending: [], history: [] }
      const { data, error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'get_pending', user_id: user.id }
      })
      if (error) throw error
      return data as { pending: any[]; history: any[] }
    },
    enabled: !!user,
    staleTime: 30_000,
  })

  // Fetch config
  const { data: configData } = useQuery({
    queryKey: ['attribute-sync-config', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_CONFIG
      const { data, error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'get_config', user_id: user.id }
      })
      if (error) return DEFAULT_CONFIG
      return { ...DEFAULT_CONFIG, ...data.config }
    },
    enabled: !!user,
  })

  const config = configData || DEFAULT_CONFIG
  const pending = syncData?.pending || []
  const history = syncData?.history || []

  // Check changes
  const checkMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'check_changes', user_id: user?.id }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`${data.changes} changement(s) détecté(s) sur ${data.links_checked} lien(s)`)
      queryClient.invalidateQueries({ queryKey: ['attribute-sync-pending'] })
    },
    onError: () => toast.error('Erreur lors de la vérification'),
  })

  // Apply single
  const applyMutation = useMutation({
    mutationFn: async ({ linkId, changeId }: { linkId: string; changeId: string }) => {
      const { data, error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'apply_change', link_id: linkId, change_id: changeId }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Changement appliqué')
      queryClient.invalidateQueries({ queryKey: ['attribute-sync-pending'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  // Dismiss single
  const dismissMutation = useMutation({
    mutationFn: async ({ linkId, changeId }: { linkId: string; changeId: string }) => {
      const { data, error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'dismiss_change', link_id: linkId, change_id: changeId }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attribute-sync-pending'] }),
  })

  // Apply all
  const applyAllMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'apply_all', user_id: user?.id }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`${data.applied} changement(s) appliqué(s)`)
      queryClient.invalidateQueries({ queryKey: ['attribute-sync-pending'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  // Save config
  const saveConfig = useMutation({
    mutationFn: async (newConfig: any) => {
      const { error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'save_config', user_id: user?.id, config: newConfig }
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Configuration sauvegardée')
      queryClient.invalidateQueries({ queryKey: ['attribute-sync-config'] })
    },
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant={tab === 'changes' ? 'default' : 'outline'} onClick={() => setTab('changes')} className="h-8 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Changements ({pending.length})
          </Button>
          <Button size="sm" variant={tab === 'config' ? 'default' : 'outline'} onClick={() => setTab('config')} className="h-8 text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Configuration
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => checkMutation.mutate()} disabled={checkMutation.isPending}>
            <RefreshCw className={cn('h-3 w-3 mr-1', checkMutation.isPending && 'animate-spin')} />
            Scanner
          </Button>
          {pending.length > 0 && (
            <Button size="sm" className="h-8 text-xs" onClick={() => applyAllMutation.mutate()} disabled={applyAllMutation.isPending}>
              <Zap className="h-3 w-3 mr-1" />
              Tout appliquer ({pending.length})
            </Button>
          )}
        </div>
      </div>

      {tab === 'changes' && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-success opacity-50" />
                <p className="text-sm font-medium">Aucun changement en attente</p>
                <p className="text-xs mt-1">Cliquez sur "Scanner" pour vérifier les changements fournisseurs</p>
              </CardContent>
            </Card>
          ) : (
            pending.map((change: any) => {
              const meta = ATTR_META[change.attribute] || { icon: Package, label: change.attribute }
              const Icon = meta.icon
              return (
                <Card key={change.id} className="border-warning/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-warning/10 shrink-0">
                          <Icon className="h-4 w-4 text-warning" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-[10px]">{meta.label}</Badge>
                            {change.supplier_name && (
                              <span className="text-[10px] text-muted-foreground">{change.supplier_name}</span>
                            )}
                            {change.change_percent != null && (
                              <Badge variant={change.change_percent > 0 ? 'destructive' : 'default'} className="text-[10px]">
                                {change.change_percent > 0 ? '+' : ''}{change.change_percent}%
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground line-through truncate max-w-[180px]">{change.old_value}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate max-w-[180px]">{change.new_value}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(change.detected_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => applyMutation.mutate({ linkId: change.link_id, changeId: change.id })} disabled={applyMutation.isPending} title="Appliquer">
                          <Check className="h-3.5 w-3.5 text-success" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dismissMutation.mutate({ linkId: change.link_id, changeId: change.id })} disabled={dismissMutation.isPending} title="Ignorer">
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}

          {/* History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Historique récent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {history.map((h: any, i: number) => {
                  const meta = ATTR_META[h.attribute] || { icon: Package, label: h.attribute }
                  const Icon = meta.icon
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs py-1 opacity-60">
                      <Icon className="h-3 w-3" />
                      <span>{meta.label}</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                      <span className="truncate max-w-[150px]">{h.new_value}</span>
                      <Badge variant={h.status === 'auto_applied' ? 'default' : h.status === 'dismissed' ? 'destructive' : 'secondary'} className="text-[9px] ml-auto">
                        {h.status === 'auto_applied' ? 'Auto' : h.status === 'dismissed' ? 'Ignoré' : 'Manuel'}
                      </Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'config' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Synchronisation par attribut</CardTitle>
            <p className="text-xs text-muted-foreground">Choisissez quels attributs surveiller et lesquels appliquer automatiquement</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(ATTR_META).map(([key, { icon: Icon, label }]) => {
              const attrConfig = (config as any)[key] || { sync_enabled: true, auto_apply: false }
              return (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {attrConfig.auto_apply ? '⚡ Application automatique' : '👁 Approbation manuelle'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground">Actif</span>
                      <Switch
                        checked={attrConfig.sync_enabled}
                        onCheckedChange={(v) => {
                          const newConfig = { ...config, [key]: { ...attrConfig, sync_enabled: v } }
                          saveConfig.mutate(newConfig)
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground">Auto</span>
                      <Switch
                        checked={attrConfig.auto_apply}
                        onCheckedChange={(v) => {
                          const newConfig = { ...config, [key]: { ...attrConfig, auto_apply: v } }
                          saveConfig.mutate(newConfig)
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
