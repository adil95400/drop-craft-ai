/**
 * AI Enrichment Snapshots - Diff history for AI-generated content
 * Uses real data from ai_generated_content table
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  History, CheckCircle, RotateCcw, Clock,
  Sparkles, FileText, TrendingUp, Zap, Package, Undo2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function EnrichmentSnapshotsPage() {
  const { toast } = useToast()
  const { user } = useUnifiedAuth()
  const queryClient = useQueryClient()
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['enrichment-snapshots', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('ai_generated_content') as any)
        .select('*, products:product_id(name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data || []).map((s: any) => ({
        id: s.id,
        productId: s.product_id,
        productName: s.products?.name || 'Produit inconnu',
        contentType: s.content_type,
        original: s.original_content || '',
        generated: s.generated_content || '',
        qualityScore: s.quality_score || 0,
        tokensUsed: s.tokens_used || 0,
        status: s.status || 'generated',
        createdAt: s.created_at,
      }))
    },
    enabled: !!user?.id,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from('ai_generated_content') as any)
        .update({ status, applied_at: status === 'applied' ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrichment-snapshots'] })
    },
  })

  const products = [...new Set(snapshots.map((s: any) => s.productName))]
  const filtered = snapshots.filter((s: any) => {
    const matchProduct = selectedProduct === 'all' || s.productName === selectedProduct
    const matchType = selectedType === 'all' || s.contentType === selectedType
    return matchProduct && matchType
  })

  const avgScore = snapshots.length > 0 ? Math.round(snapshots.reduce((s: number, snap: any) => s + snap.qualityScore, 0) / snapshots.length) : 0
  const totalTokens = snapshots.reduce((s: number, snap: any) => s + snap.tokensUsed, 0)
  const appliedCount = snapshots.filter((s: any) => s.status === 'applied').length

  const revertSnapshot = (id: string) => {
    updateStatus.mutate({ id, status: 'reverted' })
    toast({ title: 'Contenu restauré', description: 'Le contenu original a été rétabli.' })
  }

  const applySnapshot = (id: string) => {
    updateStatus.mutate({ id, status: 'applied' })
    toast({ title: 'Contenu appliqué', description: 'Le contenu IA a été appliqué au produit.' })
  }

  const contentTypeLabel = (type: string) => {
    switch (type) {
      case 'title': return 'Titre'
      case 'description': return 'Description'
      case 'keywords': return 'Mots-clés'
      case 'full_seo': return 'SEO Complet'
      default: return type
    }
  }

  return (
    <ChannablePageWrapper
      title="Snapshots d'Enrichissement"
      description="Historique diff complet des contenus générés par l'IA avec comparaison avant/après."
      heroImage="ai"
      badge={{ label: 'Historique IA', icon: History }}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Sparkles className="h-4 w-4" /> Total snapshots</div>
          <div className="text-2xl font-bold">{snapshots.length}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><CheckCircle className="h-4 w-4" /> Appliqués</div>
          <div className="text-2xl font-bold text-green-600">{appliedCount}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /> Score moyen</div>
          <div className="text-2xl font-bold text-primary">{avgScore}/100</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Zap className="h-4 w-4" /> Tokens utilisés</div>
          <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Tous les produits" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les produits</SelectItem>
            {products.map((p: string) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tous les types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="title">Titre</SelectItem>
            <SelectItem value="description">Description</SelectItem>
            <SelectItem value="keywords">Mots-clés</SelectItem>
            <SelectItem value="full_seo">SEO Complet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Snapshots Timeline */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 && (
            <Card><CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Aucun snapshot trouvé</h3>
              <p className="text-muted-foreground mt-1">Les contenus générés par l'IA apparaîtront ici.</p>
            </CardContent></Card>
          )}
          {filtered.map((snap: any) => (
            <Card key={snap.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{snap.productName}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{contentTypeLabel(snap.contentType)}</Badge>
                    {snap.status === 'applied' && <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">Appliqué</Badge>}
                    {snap.status === 'generated' && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">En attente</Badge>}
                    {snap.status === 'reverted' && <Badge variant="outline" className="text-xs">Révoqué</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(snap.createdAt), { addSuffix: true, locale: fr })}
                    <Badge variant="outline" className="text-xs">{snap.qualityScore}/100</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FileText className="h-4 w-4" /> Original
                    </div>
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm leading-relaxed">
                      {snap.original || '—'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Sparkles className="h-4 w-4" /> Généré par IA
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm leading-relaxed">
                      {snap.generated}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{snap.tokensUsed} tokens</span>
                  </div>
                  <div className="flex gap-2">
                    {snap.status === 'applied' && (
                      <Button size="sm" variant="outline" onClick={() => revertSnapshot(snap.id)}>
                        <Undo2 className="mr-1 h-3.5 w-3.5" /> Révoquer
                      </Button>
                    )}
                    {snap.status === 'generated' && (
                      <Button size="sm" onClick={() => applySnapshot(snap.id)}>
                        <CheckCircle className="mr-1 h-3.5 w-3.5" /> Appliquer
                      </Button>
                    )}
                    {snap.status === 'reverted' && (
                      <Button size="sm" variant="outline" onClick={() => applySnapshot(snap.id)}>
                        <RotateCcw className="mr-1 h-3.5 w-3.5" /> Ré-appliquer
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ChannablePageWrapper>
  )
}