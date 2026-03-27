/**
 * AttributeSyncPanel — Review & manage detected supplier attribute changes
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Check, X, RefreshCw, ArrowRight, DollarSign, Package,
  Type, FileText, Image, Settings, Zap, AlertTriangle, CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const ATTRIBUTE_ICONS: Record<string, any> = {
  price: DollarSign,
  stock: Package,
  title: Type,
  description: FileText,
  images: Image,
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  price: 'Prix fournisseur',
  stock: 'Stock',
  title: 'Titre',
  description: 'Description',
  images: 'Images',
}

const DEFAULT_CONFIGS = [
  { attribute_name: 'price', sync_enabled: true, auto_apply: false, threshold_percent: 5 },
  { attribute_name: 'stock', sync_enabled: true, auto_apply: true, threshold_percent: null },
  { attribute_name: 'title', sync_enabled: true, auto_apply: false, threshold_percent: null },
  { attribute_name: 'description', sync_enabled: true, auto_apply: false, threshold_percent: null },
  { attribute_name: 'images', sync_enabled: true, auto_apply: false, threshold_percent: null },
]

export function AttributeSyncPanel() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'changes' | 'config'>('changes')

  // Fetch pending changes
  const { data: changes = [], isLoading: changesLoading } = useQuery({
    queryKey: ['attribute-sync-changes', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('attribute_sync_changes' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false })
        .limit(100)
      return (data as any[]) || []
    },
    enabled: !!user,
  })

  // Fetch configs
  const { data: configs = [] } = useQuery({
    queryKey: ['attribute-sync-configs', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_CONFIGS
      const { data } = await supabase
        .from('attribute_sync_configs' as any)
        .select('*')
        .eq('user_id', user.id)
      if (!data?.length) return DEFAULT_CONFIGS
      // Merge with defaults
      return DEFAULT_CONFIGS.map(d => {
        const saved = (data as any[]).find((c: any) => c.attribute_name === d.attribute_name)
        return saved || d
      })
    },
    enabled: !!user,
  })

  // Check for changes mutation
  const checkMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'check_changes', user_id: user?.id }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`${data.changes} changements détectés sur ${data.links_checked} liens`)
      queryClient.invalidateQueries({ queryKey: ['attribute-sync-changes'] })
    },
    onError: () => toast.error('Erreur lors de la vérification'),
  })

  // Apply single change
  const applyMutation = useMutation({
    mutationFn: async (changeId: string) => {
      const { data, error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'apply_change', change_id: changeId }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Changement appliqué')
      queryClient.invalidateQueries({ queryKey: ['attribute-sync-changes'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  // Dismiss single change
  const dismissMutation = useMutation({
    mutationFn: async (changeId: string) => {
      const { data, error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'dismiss_change', change_id: changeId }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute-sync-changes'] })
    },
  })

  // Apply all pending
  const applyAllMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'apply_all', user_id: user?.id }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`${data.applied}/${data.total} changements appliqués`)
      queryClient.invalidateQueries({ queryKey: ['attribute-sync-changes'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  // Save config
  const saveConfigMutation = useMutation({
    mutationFn: async (updatedConfigs: any[]) => {
      const { data, error } = await supabase.functions.invoke('supplier-attribute-sync', {
        body: { action: 'save_config', user_id: user?.id, configs: updatedConfigs }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Configuration sauvegardée')
      queryClient.invalidateQueries({ queryKey: ['attribute-sync-configs'] })
    },
  })

  const pendingChanges = changes.filter((c: any) => c.status === 'pending')
  const recentApplied = changes.filter((c: any) => c.status === 'applied' || c.status === 'auto_applied').slice(0, 10)

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={tab === 'changes' ? 'default' : 'outline'}
            onClick={() => setTab('changes')}
            className="h-8 text-xs"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Changements ({pendingChanges.length})
          </Button>
          <Button
            size="sm"
            variant={tab === 'config' ? 'default' : 'outline'}
            onClick={() => setTab('config')}
            className="h-8 text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            Configuration
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => checkMutation.mutate()}
            disabled={checkMutation.isPending}
          >
            <RefreshCw className={cn('h-3 w-3 mr-1', checkMutation.isPending && 'animate-spin')} />
            Vérifier maintenant
          </Button>
          {pendingChanges.length > 0 && (
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => applyAllMutation.mutate()}
              disabled={applyAllMutation.isPending}
            >
              <Zap className="h-3 w-3 mr-1" />
              Tout appliquer ({pendingChanges.length})
            </Button>
          )}
        </div>
      </div>

      {tab === 'changes' && (
        <div className="space-y-3">
          {/* Pending changes */}
          {pendingChanges.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-success opacity-50" />
                <p className="text-sm font-medium">Aucun changement en attente</p>
                <p className="text-xs mt-1">Cliquez sur "Vérifier maintenant" pour scanner vos fournisseurs</p>
              </CardContent>
            </Card>
          ) : (
            pendingChanges.map((change: any) => {
              const Icon = ATTRIBUTE_ICONS[change.attribute_name] || Package
              const label = ATTRIBUTE_LABELS[change.attribute_name] || change.attribute_name

              return (
                <Card key={change.id} className="border-warning/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-warning/10">
                          <Icon className="h-4 w-4 text-warning" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-[10px]">{label}</Badge>
                            {change.change_percent && (
                              <Badge variant={change.change_percent > 0 ? 'destructive' : 'default'} className="text-[10px]">
                                {change.change_percent > 0 ? '+' : ''}{change.change_percent}%
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground line-through truncate max-w-[200px]">
                              {change.old_value}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate max-w-[200px]">
                              {change.new_value}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Détecté {new Date(change.detected_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => applyMutation.mutate(change.id)}
                          disabled={applyMutation.isPending}
                          title="Appliquer"
                        >
                          <Check className="h-3.5 w-3.5 text-success" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => dismissMutation.mutate(change.id)}
                          disabled={dismissMutation.isPending}
                          title="Ignorer"
                        >
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}

          {/* Recently applied */}
          {recentApplied.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Récemment appliqués</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {recentApplied.map((change: any) => {
                  const Icon = ATTRIBUTE_ICONS[change.attribute_name] || Package
                  return (
                    <div key={change.id} className="flex items-center gap-2 text-xs py-1 opacity-60">
                      <Icon className="h-3 w-3" />
                      <span>{ATTRIBUTE_LABELS[change.attribute_name]}</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                      <span className="truncate">{change.new_value}</span>
                      <Badge variant={change.status === 'auto_applied' ? 'default' : 'secondary'} className="text-[9px] ml-auto">
                        {change.status === 'auto_applied' ? 'Auto' : 'Manuel'}
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
            <CardTitle className="text-sm">Configuration par attribut</CardTitle>
            <p className="text-xs text-muted-foreground">
              Définissez quels attributs synchroniser et lesquels appliquer automatiquement
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {configs.map((config: any) => {
              const Icon = ATTRIBUTE_ICONS[config.attribute_name] || Package
              const label = ATTRIBUTE_LABELS[config.attribute_name] || config.attribute_name

              return (
                <div key={config.attribute_name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {config.auto_apply ? 'Application automatique' : 'Approbation manuelle requise'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground">Actif</span>
                      <Switch
                        checked={config.sync_enabled}
                        onCheckedChange={(v) => {
                          const updated = configs.map((c: any) =>
                            c.attribute_name === config.attribute_name ? { ...c, sync_enabled: v } : c
                          )
                          saveConfigMutation.mutate(updated)
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground">Auto</span>
                      <Switch
                        checked={config.auto_apply}
                        onCheckedChange={(v) => {
                          const updated = configs.map((c: any) =>
                            c.attribute_name === config.attribute_name ? { ...c, auto_apply: v } : c
                          )
                          saveConfigMutation.mutate(updated)
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
