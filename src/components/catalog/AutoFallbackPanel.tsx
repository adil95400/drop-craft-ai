/**
 * AutoFallbackPanel — Auto-switch supplier on stockout or better price
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
  ArrowRightLeft, RefreshCw, Shield, AlertTriangle,
  TrendingDown, Package, CheckCircle, XCircle, DollarSign,
  Settings, Zap, History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function AutoFallbackPanel() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'opportunities' | 'status' | 'history'>('opportunities')

  // Check fallback opportunities
  const { data: fallbackData, isLoading } = useQuery({
    queryKey: ['auto-fallback-check', user?.id],
    queryFn: async () => {
      if (!user) return { fallbacks: [], summary: {} }
      const { data, error } = await supabase.functions.invoke('supplier-auto-fallback', {
        body: { action: 'check_fallbacks', user_id: user.id }
      })
      if (error) throw error
      return data as { fallbacks: any[]; summary: any }
    },
    enabled: !!user,
    staleTime: 60_000,
  })

  // Get fallback status
  const { data: statusData } = useQuery({
    queryKey: ['auto-fallback-status', user?.id],
    queryFn: async () => {
      if (!user) return { products: [], summary: {} }
      const { data, error } = await supabase.functions.invoke('supplier-auto-fallback', {
        body: { action: 'get_fallback_status', user_id: user.id }
      })
      if (error) throw error
      return data as { products: any[]; summary: any }
    },
    enabled: !!user,
  })

  // Get history
  const { data: historyData } = useQuery({
    queryKey: ['auto-fallback-history', user?.id],
    queryFn: async () => {
      if (!user) return { history: [] }
      const { data, error } = await supabase.functions.invoke('supplier-auto-fallback', {
        body: { action: 'get_fallback_history', user_id: user.id }
      })
      if (error) throw error
      return data as { history: any[] }
    },
    enabled: !!user,
  })

  const fallbacks = fallbackData?.fallbacks || []
  const summary = fallbackData?.summary || {}
  const statusSummary = statusData?.summary || {}
  const history = historyData?.history || []

  // Execute fallback
  const executeMutation = useMutation({
    mutationFn: async (fb: any) => {
      const { data, error } = await supabase.functions.invoke('supplier-auto-fallback', {
        body: {
          action: 'execute_fallback',
          product_id: fb.product_id,
          old_primary_link_id: fb.current_supplier.id,
          new_primary_link_id: fb.fallback_supplier.id,
          reason: fb.type === 'stockout' ? 'Rupture de stock fournisseur principal' : `Meilleur prix (-${fb.savings_percent}%)`,
          user_id: user?.id,
        }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`Basculé vers ${data.new_primary}`)
      queryClient.invalidateQueries({ queryKey: ['auto-fallback'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => toast.error('Erreur lors de la bascule'),
  })

  // Execute all stockout fallbacks
  const executeAllMutation = useMutation({
    mutationFn: async () => {
      const stockouts = fallbacks.filter((f: any) => f.type === 'stockout')
      let count = 0
      for (const fb of stockouts) {
        try {
          await executeMutation.mutateAsync(fb)
          count++
        } catch {}
      }
      return count
    },
    onSuccess: (count) => {
      toast.success(`${count} bascule(s) effectuée(s)`)
    },
  })

  return (
    <div className="space-y-4">
      {/* KPI Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Shield className="h-4 w-4 mx-auto mb-1 text-success" />
            <p className="text-lg font-bold">{statusSummary.protected || 0}</p>
            <p className="text-[10px] text-muted-foreground">Protégés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-destructive" />
            <p className="text-lg font-bold">{summary.stockout_count || 0}</p>
            <p className="text-[10px] text-muted-foreground">Ruptures</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingDown className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{summary.better_price_count || 0}</p>
            <p className="text-[10px] text-muted-foreground">Meilleurs prix</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-success" />
            <p className="text-lg font-bold">{(summary.total_potential_savings || 0).toFixed(0)}€</p>
            <p className="text-[10px] text-muted-foreground">Économies potentielles</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant={tab === 'opportunities' ? 'default' : 'outline'} onClick={() => setTab('opportunities')} className="h-8 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Opportunités ({fallbacks.length})
          </Button>
          <Button size="sm" variant={tab === 'status' ? 'default' : 'outline'} onClick={() => setTab('status')} className="h-8 text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Statut
          </Button>
          <Button size="sm" variant={tab === 'history' ? 'default' : 'outline'} onClick={() => setTab('history')} className="h-8 text-xs">
            <History className="h-3 w-3 mr-1" />
            Historique
          </Button>
        </div>
        {fallbacks.filter((f: any) => f.type === 'stockout').length > 0 && tab === 'opportunities' && (
          <Button size="sm" className="h-8 text-xs" onClick={() => executeAllMutation.mutate()} disabled={executeAllMutation.isPending}>
            <Zap className="h-3 w-3 mr-1" />
            Basculer ruptures
          </Button>
        )}
      </div>

      {tab === 'opportunities' && (
        <div className="space-y-2">
          {fallbacks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-success opacity-50" />
                <p className="text-sm font-medium">Aucune bascule nécessaire</p>
                <p className="text-xs mt-1">Tous les fournisseurs principaux sont opérationnels</p>
              </CardContent>
            </Card>
          ) : (
            fallbacks.map((fb: any, i: number) => (
              <Card key={i} className={cn(
                'border-l-4',
                fb.severity === 'critical' ? 'border-l-destructive' :
                fb.severity === 'high' ? 'border-l-warning' : 'border-l-primary'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {fb.type === 'stockout' ? (
                          <Badge variant="destructive" className="text-[10px]">
                            <XCircle className="h-2.5 w-2.5 mr-0.5" />
                            Rupture
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                            -{fb.savings_percent}%
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground truncate">
                          {fb.product_id.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{fb.current_supplier.name}</span>
                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-primary">{fb.fallback_supplier.name}</span>
                      </div>
                      {fb.type === 'better_price' && (
                        <p className="text-[10px] text-success mt-0.5">
                          Économie: {fb.savings_amount}€ par unité
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={fb.type === 'stockout' ? 'default' : 'outline'}
                      className="h-7 text-xs shrink-0"
                      onClick={() => executeMutation.mutate(fb)}
                      disabled={executeMutation.isPending}
                    >
                      <ArrowRightLeft className="h-3 w-3 mr-1" />
                      Basculer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'status' && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Protégés (multi-fourn.)', value: statusSummary.protected || 0, color: 'text-success', icon: Shield },
                { label: 'Bascule nécessaire', value: statusSummary.needs_fallback || 0, color: 'text-destructive', icon: AlertTriangle },
                { label: 'À risque (rupture, pas de fallback)', value: statusSummary.at_risk || 0, color: 'text-warning', icon: XCircle },
                { label: 'Source unique', value: statusSummary.single_source || 0, color: 'text-muted-foreground', icon: Package },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                  <s.icon className={cn('h-5 w-5 shrink-0', s.color)} />
                  <div>
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardContent className="p-4">
            {history.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Aucune bascule effectuée</p>
            ) : (
              <div className="space-y-2">
                {history.map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border text-xs">
                    <div>
                      <p className="font-medium">{h.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(h.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[9px]">
                      <ArrowRightLeft className="h-2.5 w-2.5 mr-0.5" />
                      Bascule
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
