/**
 * AIContentRefreshPanel — Shows AI-powered content regeneration triggered by supplier changes
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Brain, RefreshCw, Sparkles, ArrowRight, Eye, Zap,
  CheckCircle, FileText, Type
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function AIContentRefreshPanel() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Get recently changed products (from attribute sync history)
  const { data: recentChanges = [], isLoading } = useQuery({
    queryKey: ['ai-content-refresh-candidates', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data: links } = await supabase
        .from('product_supplier_links')
        .select('product_id, supplier_name, metadata')
        .eq('user_id', user.id)
        .not('metadata', 'is', null)

      if (!links?.length) return []

      const candidates: any[] = []
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      for (const link of links) {
        const history = link.metadata?.change_history || []
        const recentApplied = history.filter(
          (h: any) => (h.status === 'applied' || h.status === 'auto_applied') &&
                       (h.applied_at || h.detected_at) > oneDayAgo
        )
        if (recentApplied.length > 0) {
          candidates.push({
            product_id: link.product_id,
            supplier_name: link.supplier_name,
            changes: recentApplied,
          })
        }
      }
      return candidates
    },
    enabled: !!user,
    staleTime: 30_000,
  })

  // Get AI generation history
  const { data: aiHistory = [] } = useQuery({
    queryKey: ['ai-content-history', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('ai_generated_content')
        .select('id, product_id, content_type, status, created_at, generated_content')
        .eq('user_id', user.id)
        .eq('content_type', 'seo_refresh')
        .order('created_at', { ascending: false })
        .limit(10)
      return data || []
    },
    enabled: !!user,
  })

  // Batch refresh
  const batchRefreshMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-ai-content-refresh', {
        body: { action: 'refresh_batch', user_id: user?.id, limit: 5 }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`${data.refreshed}/${data.total} contenu(s) régénéré(s) par IA`)
      queryClient.invalidateQueries({ queryKey: ['ai-content-refresh-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['ai-content-history'] })
    },
    onError: (err: any) => {
      if (err?.message?.includes('429') || err?.message?.includes('Rate')) {
        toast.error('Limite de requêtes IA atteinte, réessayez dans quelques minutes')
      } else if (err?.message?.includes('402') || err?.message?.includes('Credits')) {
        toast.error('Crédits IA épuisés, ajoutez des crédits dans les paramètres')
      } else {
        toast.error('Erreur lors de la régénération')
      }
    },
  })

  // Single product refresh
  const singleRefreshMutation = useMutation({
    mutationFn: async (candidate: any) => {
      const { data, error } = await supabase.functions.invoke('supplier-ai-content-refresh', {
        body: {
          action: 'refresh_on_change',
          product_id: candidate.product_id,
          changed_attributes: candidate.changes.map((c: any) => ({
            attribute: c.attribute,
            old_value: c.old_value,
            new_value: c.new_value,
          })),
          user_id: user?.id,
        }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Contenu SEO régénéré')
      queryClient.invalidateQueries({ queryKey: ['ai-content-refresh-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['ai-content-history'] })
    },
    onError: () => toast.error('Erreur de régénération'),
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {recentChanges.length} produit(s) à rafraîchir
          </p>
          <p className="text-xs text-muted-foreground">L'IA régénère le contenu SEO après chaque changement fournisseur</p>
        </div>
        {recentChanges.length > 0 && (
          <Button size="sm" className="h-8 text-xs" onClick={() => batchRefreshMutation.mutate()} disabled={batchRefreshMutation.isPending}>
            <Sparkles className={cn('h-3 w-3 mr-1', batchRefreshMutation.isPending && 'animate-spin')} />
            Rafraîchir tout ({recentChanges.length})
          </Button>
        )}
      </div>

      {/* Candidates */}
      {recentChanges.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-success opacity-50" />
            <p className="text-sm font-medium">Tous les contenus sont à jour</p>
            <p className="text-xs mt-1">L'IA régénérera automatiquement le contenu lors du prochain changement fournisseur</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recentChanges.map((candidate: any, i: number) => (
            <Card key={i} className="border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{candidate.product_id.slice(0, 8)}...</p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {candidate.changes.slice(0, 3).map((c: any, j: number) => (
                          <Badge key={j} variant="secondary" className="text-[9px]">
                            {c.attribute}
                          </Badge>
                        ))}
                        <span className="text-[10px] text-muted-foreground">via {candidate.supplier_name}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => singleRefreshMutation.mutate(candidate)} disabled={singleRefreshMutation.isPending}>
                    <Zap className="h-3 w-3 mr-1" />
                    Régénérer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* History */}
      {aiHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Régénérations récentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {aiHistory.map((h: any) => (
              <div key={h.id} className="flex items-center gap-2 text-xs py-1 opacity-60">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="truncate">{h.product_id?.slice(0, 8)}...</span>
                <Badge variant="default" className="text-[9px] ml-auto">
                  {h.status === 'applied' ? 'Appliqué' : 'Prévisualisation'}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(h.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
