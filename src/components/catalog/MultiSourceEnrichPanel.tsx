/**
 * MultiSourceEnrichPanel — UI for multi-source enrichment
 * Scrape all suppliers for a product and merge the best content
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Layers, RefreshCw, Image, FileText, Star, ExternalLink,
  CheckCircle, Sparkles, Merge, ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function MultiSourceEnrichPanel() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  // Get products with supplier links
  const { data: linksData = [], isLoading } = useQuery({
    queryKey: ['multi-source-links', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('product_supplier_links')
        .select('product_id, supplier_name, supplier_url, is_primary, priority, metadata')
        .eq('user_id', user.id)
        .not('supplier_url', 'is', null)
        .order('priority', { ascending: true })
      return data || []
    },
    enabled: !!user,
    staleTime: 60_000,
  })

  // Group by product
  const productGroups = linksData.reduce((acc: any, link: any) => {
    if (!acc[link.product_id]) acc[link.product_id] = []
    acc[link.product_id].push(link)
    return acc
  }, {} as Record<string, any[]>)

  const multiSourceProducts = Object.entries(productGroups).filter(([, links]) => (links as any[]).length >= 2)

  // Enrich single product
  const enrichMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('supplier-multi-source-enrich', {
        body: { action: 'enrich_product', product_id: productId, user_id: user?.id }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`${data.sources_found} source(s) analysée(s)`)
      queryClient.invalidateQueries({ queryKey: ['multi-source-links'] })
    },
    onError: () => toast.error('Erreur lors de l\'enrichissement'),
  })

  // Enrich batch
  const batchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-multi-source-enrich', {
        body: { action: 'enrich_batch', user_id: user?.id, limit: 10 }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`${data.enriched}/${data.total} produits enrichis`)
      queryClient.invalidateQueries({ queryKey: ['multi-source-links'] })
    },
    onError: () => toast.error('Erreur batch'),
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            {multiSourceProducts.length} produit(s) multi-sources
          </p>
          <p className="text-xs text-muted-foreground">Fusionnez les meilleurs visuels et descriptions depuis plusieurs fournisseurs</p>
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={() => batchMutation.mutate()} disabled={batchMutation.isPending}>
          <Sparkles className={cn('h-3 w-3 mr-1', batchMutation.isPending && 'animate-spin')} />
          Enrichir tout
        </Button>
      </div>

      {multiSourceProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Layers className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Aucun produit multi-source</p>
            <p className="text-xs mt-1">Ajoutez plusieurs fournisseurs à un produit pour activer l'enrichissement croisé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {multiSourceProducts.map(([productId, links]) => {
            const typedLinks = links as any[]
            const isExpanded = expandedProduct === productId
            const bestScore = Math.max(...typedLinks.map((l: any) => l.metadata?.quality_score || 0))

            return (
              <Card key={productId} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {typedLinks.length} sources
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">{productId.slice(0, 8)}...</span>
                      {bestScore > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Star className="h-2.5 w-2.5 mr-0.5" />
                          Score: {bestScore}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpandedProduct(isExpanded ? null : productId)}>
                        {isExpanded ? 'Réduire' : 'Détails'}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => enrichMutation.mutate(productId)} disabled={enrichMutation.isPending}>
                        <RefreshCw className={cn('h-3 w-3 mr-1', enrichMutation.isPending && 'animate-spin')} />
                        Scanner
                      </Button>
                    </div>
                  </div>

                  {/* Source list */}
                  <div className="flex gap-2 flex-wrap">
                    {typedLinks.map((link: any, i: number) => (
                      <div key={i} className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border',
                        link.is_primary ? 'border-primary/30 bg-primary/5' : 'border-border'
                      )}>
                        {link.is_primary && <Star className="h-2.5 w-2.5 text-primary" />}
                        <span className="font-medium">{link.supplier_name || 'Fournisseur'}</span>
                        {link.metadata?.quality_score > 0 && (
                          <span className="text-muted-foreground">({link.metadata.quality_score})</span>
                        )}
                        {link.metadata?.last_scraped && (
                          <span className="text-muted-foreground">
                            • {link.metadata.last_scraped.images?.length || 0} img
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {typedLinks.map((link: any, i: number) => {
                        const scraped = link.metadata?.last_scraped
                        return (
                          <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{link.supplier_name}</span>
                              <div className="flex items-center gap-2">
                                {scraped && (
                                  <Badge variant="default" className="text-[9px]">
                                    <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                                    Scanné
                                  </Badge>
                                )}
                                <a href={link.supplier_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                </a>
                              </div>
                            </div>
                            {scraped ? (
                              <div className="text-[10px] text-muted-foreground space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-2.5 w-2.5" />
                                  <span className="truncate">{scraped.title || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Image className="h-2.5 w-2.5" />
                                  <span>{scraped.images?.length || 0} images</span>
                                </div>
                                {scraped.price && <span>Prix: {scraped.price}€</span>}
                              </div>
                            ) : (
                              <p className="text-[10px] text-muted-foreground italic">Non encore scanné</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
