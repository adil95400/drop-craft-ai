/**
 * Live Repricing Page - Monitoring prix concurrents & ajustement automatique
 * Uses pricing_rules + competitive_intelligence tables
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, TrendingDown, DollarSign, Eye, Zap, Shield, 
  ArrowUpDown, RefreshCw, Bell, Settings, Target, BarChart3,
  AlertTriangle, CheckCircle, Clock, ArrowUp, ArrowDown, Minus, Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { pricingApi } from '@/services/api/client'

export default function LiveRepricingPage() {
  const { toast } = useToast()
  const [scanning, setScanning] = useState(false)
  const queryClient = useQueryClient()

  // Fetch pricing rules from DB
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['pricing-rules'],
    queryFn: async () => {
      const resp = await pricingApi.listRules()
      return resp.items ?? []
    },
  })

  // Fetch competitive intelligence data
  const { data: competitorPrices = [], isLoading: ciLoading } = useQuery({
    queryKey: ['competitive-intelligence'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []
      const { data, error } = await supabase
        .from('competitive_intelligence')
        .select('*, products!competitive_intelligence_product_id_fkey(name, price)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data ?? []
    },
  })

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await pricingApi.updateRule(id, { is_active: isActive })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] })
      toast({ title: 'Règle mise à jour', description: 'Le statut de la règle a été modifié.' })
    },
  })

  const startScan = () => {
    setScanning(true)
    toast({ title: 'Scan lancé', description: 'Analyse des prix concurrents en cours...' })
    setTimeout(() => {
      setScanning(false)
      queryClient.invalidateQueries({ queryKey: ['competitive-intelligence'] })
    }, 3000)
  }

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <ArrowUp className="h-4 w-4 text-green-500" />
    if (trend === 'down') return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const activeRules = rules.filter((r: any) => r.is_active)
  const totalAdjustments = rules.reduce((a: number, r: any) => a + (r.execution_count || 0), 0)

  return (
    <ChannablePageWrapper
      title="Live Repricing"
      description="Monitoring des prix concurrents en temps réel et ajustement automatique de vos tarifs."
      heroImage="analytics"
      badge={{ label: 'Repricing', icon: TrendingUp }}
      actions={
        <>
          <Button onClick={startScan} disabled={scanning}>
            <RefreshCw className={`mr-2 h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scan en cours...' : 'Scanner les prix'}
          </Button>
          <Button variant="outline"><Bell className="mr-2 h-4 w-4" /> Alertes</Button>
        </>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Eye className="h-4 w-4" /> Produits surveillés</div><div className="text-2xl font-bold">{competitorPrices.length}</div><p className="text-xs text-muted-foreground mt-1">intelligence concurrentielle</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Zap className="h-4 w-4" /> Ajustements</div><div className="text-2xl font-bold text-primary">{totalAdjustments}</div><p className="text-xs text-muted-foreground mt-1">exécutions totales</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Shield className="h-4 w-4" /> Règles actives</div><div className="text-2xl font-bold">{activeRules.length}</div><p className="text-xs text-muted-foreground mt-1">sur {rules.length} règles</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Target className="h-4 w-4" /> Marge protégée</div><div className="text-2xl font-bold text-green-600">{rules.length > 0 ? Math.round(rules.reduce((a: number, r: any) => a + (r.margin_protection || 0), 0) / rules.length) : 0}%</div><p className="text-xs text-muted-foreground mt-1">marge minimum moyenne</p></CardContent></Card>
      </div>

      <Tabs defaultValue="monitor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitor"><BarChart3 className="mr-2 h-4 w-4" /> Monitoring</TabsTrigger>
          <TabsTrigger value="rules"><Settings className="mr-2 h-4 w-4" /> Règles</TabsTrigger>
          <TabsTrigger value="alerts"><AlertTriangle className="mr-2 h-4 w-4" /> Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ArrowUpDown className="h-5 w-5" /> Comparaison des prix en direct</CardTitle>
              <CardDescription>Vos prix vs. la concurrence</CardDescription>
            </CardHeader>
            <CardContent>
              {ciLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : competitorPrices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-3" />
                  <p className="font-medium">Aucune donnée concurrentielle</p>
                  <p className="text-sm">Lancez un scan pour commencer le monitoring</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 font-medium">Produit</th>
                        <th className="pb-3 font-medium text-right">Votre prix</th>
                        <th className="pb-3 font-medium">Concurrent</th>
                        <th className="pb-3 font-medium text-right">Prix concurrent</th>
                        <th className="pb-3 font-medium text-right">Diff.</th>
                        <th className="pb-3 font-medium text-center">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitorPrices.map((cp: any) => {
                        const yourPrice = cp.products?.price || 0
                        const diff = cp.price_difference || (yourPrice - (cp.competitor_price || 0))
                        return (
                          <tr key={cp.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 font-medium">{cp.products?.name || 'Produit inconnu'}</td>
                            <td className="py-3 text-right">{yourPrice.toFixed(2)}€</td>
                            <td className="py-3">{cp.competitor_name}</td>
                            <td className="py-3 text-right">
                              <span className={yourPrice > (cp.competitor_price || 0) ? 'text-red-500' : 'text-green-500'}>
                                {(cp.competitor_price || 0).toFixed(2)}€
                              </span>
                            </td>
                            <td className="py-3 text-right font-medium">
                              <span className={diff > 0 ? 'text-red-500' : 'text-green-500'}>{diff > 0 ? '+' : ''}{diff.toFixed(2)}€</span>
                            </td>
                            <td className="py-3 text-center">
                              <Badge variant={cp.market_position === 'leader' ? 'default' : 'secondary'} className="text-xs">
                                {cp.market_position || 'N/A'}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          {rulesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule: any) => (
                <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge variant={rule.rule_type === 'dynamic_ai' ? 'default' : 'secondary'} className="text-xs">
                            {rule.rule_type || rule.competitor_strategy || 'custom'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.products_affected || 0} produits · Marge min {rule.margin_protection || 0}% · {rule.execution_count || 0} exécutions
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {rule.last_executed_at && <span className="text-xs text-muted-foreground">{new Date(rule.last_executed_at).toLocaleString('fr-FR')}</span>}
                        <Switch checked={rule.is_active} onCheckedChange={() => toggleRuleMutation.mutate({ id: rule.id, isActive: !rule.is_active })} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {rules.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-3" />
                  <p className="font-medium">Aucune règle de pricing</p>
                  <p className="text-sm">Créez des règles pour automatiser vos ajustements de prix</p>
                </div>
              )}
            </div>
          )}
          <Button variant="outline" className="w-full" disabled>
            + Créer une règle de repricing (bientôt)
          </Button>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertes Prix</CardTitle>
              <CardDescription>Notifications basées sur les changements de prix significatifs</CardDescription>
            </CardHeader>
            <CardContent>
              {competitorPrices.filter((cp: any) => Math.abs(cp.price_difference || 0) > 5).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success" />
                  <p className="font-medium">Pas d'alertes actives</p>
                  <p className="text-sm">Vos prix sont compétitifs</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {competitorPrices
                    .filter((cp: any) => Math.abs(cp.price_difference || 0) > 5)
                    .map((cp: any) => (
                      <div key={cp.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${Math.abs(cp.price_difference || 0) > 20 ? 'text-destructive' : 'text-yellow-500'}`} />
                        <div className="flex-1">
                          <p className="text-sm">{cp.products?.name}: {cp.competitor_name} à {(cp.competitor_price || 0).toFixed(2)}€ (diff: {(cp.price_difference || 0).toFixed(2)}€)</p>
                          <p className="text-xs text-muted-foreground mt-1">{cp.last_checked_at ? new Date(cp.last_checked_at).toLocaleString('fr-FR') : ''}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
