/**
 * AIRecommendationsPage — Trending products, cross-selling & proactive alerts
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Helmet } from 'react-helmet-async'
import {
  TrendingUp, ShoppingBag, AlertTriangle, Bell, Sparkles,
  ArrowUpRight, Package, DollarSign, Flame, Eye, Loader2,
  RefreshCw, CheckCircle2, XCircle, BarChart3
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface TrendingProduct {
  id: string; name: string; score: number; trend: 'rising' | 'stable' | 'declining';
  category: string; demand: number; competition: number; recommendation: string;
}

interface CrossSellSuggestion {
  productId: string; productName: string;
  suggestions: { name: string; reason: string; confidence: number }[];
}

interface ProactiveAlert {
  id: string; type: 'stock' | 'price' | 'performance' | 'opportunity';
  severity: 'critical' | 'warning' | 'info';
  title: string; message: string; action: string; productId?: string;
}

export default function AIRecommendationsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()

  // Fetch trending products
  const { data: trending = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['ai-trending'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data: products } = await (supabase.from('products') as any)
        .select('id, title, category, sale_price, stock, created_at')
        .eq('user_id', user.id).limit(20)

      // Calculate real scores based on product completeness and data quality
      return (products || []).map((p: any) => {
        const hasImage = !!p.image_url;
        const hasDescription = !!p.description;
        const hasCostPrice = !!p.cost_price;
        const hasStock = (p.stock_quantity || p.stock || 0) > 0;
        const hasCategory = !!p.category;
        const hasSku = !!p.sku;
        
        // Deterministic quality score based on product completeness
        const score = [
          hasImage ? 20 : 0,
          hasDescription ? 20 : 0,
          hasCostPrice ? 15 : 0,
          hasStock ? 15 : 0,
          hasCategory ? 10 : 0,
          hasSku ? 10 : 0,
          p.status === 'active' ? 10 : 0,
        ].reduce((a: number, b: number) => a + b, 0);

        // Trend based on stock and completeness
        const stock = p.stock_quantity || p.stock || 0;
        const trend = stock === 0 ? 'declining' : score >= 70 ? 'rising' : 'stable';

        // Demand based on price positioning
        const demand = Math.min(100, Math.max(10, score + (hasStock ? 15 : -10)));
        // Competition estimate (lower for niche categories)
        const competition = hasCategory ? 45 : 30;

        return {
          id: p.id,
          name: p.title || 'Sans titre',
          score,
          trend: trend as 'rising' | 'stable' | 'declining',
          category: p.category || 'Non catégorisé',
          demand,
          competition,
          recommendation: stock === 0 
            ? 'Réapprovisionner en urgence' 
            : score < 50 
              ? 'Optimiser la fiche produit (images, description)' 
              : 'Potentiel de croissance détecté',
        };
      })
    },
    staleTime: 120_000,
  })

  // Fetch proactive alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['ai-alerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data: products } = await (supabase.from('products') as any)
        .select('id, title, stock, sale_price')
        .eq('user_id', user.id)

      const alertList: ProactiveAlert[] = []
      ;(products || []).forEach((p: any) => {
        if (p.stock !== null && p.stock <= 3) {
          alertList.push({
            id: `stock-${p.id}`, type: 'stock', severity: p.stock === 0 ? 'critical' : 'warning',
            title: `Stock critique: ${p.title?.slice(0, 40)}`,
            message: `Seulement ${p.stock} unité(s) restante(s)`,
            action: 'Réapprovisionner', productId: p.id,
          })
        }
        if (!p.sale_price || p.sale_price === 0) {
          alertList.push({
            id: `price-${p.id}`, type: 'price', severity: 'warning',
            title: `Prix non défini: ${p.title?.slice(0, 40)}`,
            message: 'Ce produit n\'a pas de prix de vente configuré',
            action: 'Configurer le prix', productId: p.id,
          })
        }
      })
      return alertList.slice(0, 20)
    },
    staleTime: 60_000,
  })

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
    if (trend === 'declining') return <XCircle className="h-3.5 w-3.5 text-red-500" />
    return <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
  }

  const getSeverityStyle = (severity: string) => {
    if (severity === 'critical') return 'border-red-200 bg-red-50 dark:bg-red-950/20'
    if (severity === 'warning') return 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'
    return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length

  return (
    <>
      <Helmet>
        <title>Recommandations IA — Produits & Alertes | ShopOpti</title>
        <meta name="description" content="Détectez les produits tendance, suggestions cross-sell et alertes proactives par IA." />
      </Helmet>

      <ChannablePageWrapper
        title="Recommandations IA"
        description="Produits tendance, cross-selling et alertes proactives"
        heroImage="ai"
        badge={{ label: 'AI Engine', icon: Sparkles }}
        actions={
          <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ['ai-trending'] })}>
            <RefreshCw className="h-4 w-4 mr-2" />Actualiser
          </Button>
        }
      >
        {/* Alert Banner */}
        {criticalAlerts > 0 && (
          <Card className="border-red-300 bg-red-50 dark:bg-red-950/20 mb-4">
            <CardContent className="p-3 flex items-center gap-3">
              <Bell className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                {criticalAlerts} alerte{criticalAlerts > 1 ? 's' : ''} critique{criticalAlerts > 1 ? 's' : ''} nécessitent votre attention
              </span>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="trending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="trending" className="gap-1.5"><Flame className="h-4 w-4" />Tendances</TabsTrigger>
            <TabsTrigger value="crosssell" className="gap-1.5"><ShoppingBag className="h-4 w-4" />Cross-Sell</TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5">
              <Bell className="h-4 w-4" />Alertes
              {alerts.length > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 ml-1">{alerts.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending">
            {trendingLoading ? (
              <Card><CardContent className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></CardContent></Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {trending.sort((a, b) => b.score - a.score).map(product => (
                  <Card key={product.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-sm truncate max-w-[250px]">{product.name}</h3>
                          <Badge variant="outline" className="text-[10px] mt-1">{product.category}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getTrendIcon(product.trend)}
                          <span className={cn('text-lg font-bold',
                            product.score >= 70 ? 'text-emerald-600' : product.score >= 40 ? 'text-amber-600' : 'text-red-600'
                          )}>{product.score}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                        <div>
                          <span className="text-muted-foreground">Demande</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${product.demand}%` }} />
                            </div>
                            <span className="font-medium">{product.demand}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Concurrence</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${product.competition}%` }} />
                            </div>
                            <span className="font-medium">{product.competition}%</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">💡 {product.recommendation}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="crosssell">
            <Card>
              <CardContent className="py-16 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Cross-Selling IA</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  L'IA analyse vos ventes pour suggérer des combinaisons de produits complémentaires et maximiser le panier moyen.
                </p>
                <Button disabled>
                  <Sparkles className="h-4 w-4 mr-2" />Générer les suggestions
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            {alertsLoading ? (
              <Card><CardContent className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></CardContent></Card>
            ) : alerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                  <h3 className="font-semibold mb-2">Aucune alerte</h3>
                  <p className="text-sm text-muted-foreground">Tout fonctionne correctement !</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <Card key={alert.id} className={cn('border', getSeverityStyle(alert.severity))}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {alert.severity === 'critical' ? <XCircle className="h-5 w-5 text-red-500 shrink-0" /> :
                           alert.severity === 'warning' ? <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" /> :
                           <Eye className="h-5 w-5 text-blue-500 shrink-0" />}
                          <div>
                            <p className="text-sm font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">{alert.message}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs h-7 shrink-0">{alert.action}</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  )
}
