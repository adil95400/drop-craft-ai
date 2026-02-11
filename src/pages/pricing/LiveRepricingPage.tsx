/**
 * Live Repricing Page - Monitoring prix concurrents & ajustement automatique
 * Channable-style avec dashboard temps réel
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, TrendingDown, DollarSign, Eye, Zap, Shield, 
  ArrowUpDown, RefreshCw, Bell, Settings, Target, BarChart3,
  AlertTriangle, CheckCircle, Clock, ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PricingRule {
  id: string
  name: string
  strategy: 'beat_lowest' | 'match_average' | 'margin_floor' | 'dynamic_ai'
  minMargin: number
  maxDiscount: number
  isActive: boolean
  productsCount: number
  lastAdjusted: string
  adjustments24h: number
}

interface CompetitorPrice {
  id: string
  productName: string
  yourPrice: number
  lowestCompetitor: number
  avgMarket: number
  suggestedPrice: number
  trend: 'up' | 'down' | 'stable'
  marginImpact: number
  autoAdjusted: boolean
}

const mockRules: PricingRule[] = [
  { id: '1', name: 'Beat Lowest -2%', strategy: 'beat_lowest', minMargin: 15, maxDiscount: 20, isActive: true, productsCount: 145, lastAdjusted: '2m ago', adjustments24h: 34 },
  { id: '2', name: 'Match Average Market', strategy: 'match_average', minMargin: 20, maxDiscount: 15, isActive: true, productsCount: 89, lastAdjusted: '15m ago', adjustments24h: 12 },
  { id: '3', name: 'AI Dynamic Pricing', strategy: 'dynamic_ai', minMargin: 18, maxDiscount: 25, isActive: false, productsCount: 230, lastAdjusted: '1h ago', adjustments24h: 0 },
  { id: '4', name: 'Margin Floor Guard', strategy: 'margin_floor', minMargin: 25, maxDiscount: 10, isActive: true, productsCount: 67, lastAdjusted: '5m ago', adjustments24h: 8 },
]

const mockCompetitorPrices: CompetitorPrice[] = [
  { id: '1', productName: 'Wireless Earbuds Pro X', yourPrice: 49.99, lowestCompetitor: 44.99, avgMarket: 47.50, suggestedPrice: 43.99, trend: 'down', marginImpact: -3.2, autoAdjusted: true },
  { id: '2', productName: 'Smart Watch Ultra', yourPrice: 299.99, lowestCompetitor: 289.99, avgMarket: 305.00, suggestedPrice: 287.99, trend: 'stable', marginImpact: -1.5, autoAdjusted: false },
  { id: '3', productName: 'USB-C Hub 7-in-1', yourPrice: 34.99, lowestCompetitor: 39.99, avgMarket: 37.50, suggestedPrice: 34.99, trend: 'up', marginImpact: 0, autoAdjusted: false },
  { id: '4', productName: 'Bluetooth Speaker V3', yourPrice: 79.99, lowestCompetitor: 74.99, avgMarket: 82.00, suggestedPrice: 73.99, trend: 'down', marginImpact: -2.8, autoAdjusted: true },
  { id: '5', productName: 'Phone Case Premium', yourPrice: 19.99, lowestCompetitor: 15.99, avgMarket: 18.50, suggestedPrice: 15.49, trend: 'down', marginImpact: -5.1, autoAdjusted: false },
]

export default function LiveRepricingPage() {
  const { toast } = useToast()
  const [rules, setRules] = useState(mockRules)
  const [scanning, setScanning] = useState(false)

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r))
    toast({ title: 'Règle mise à jour', description: 'Le statut de la règle a été modifié.' })
  }

  const startScan = () => {
    setScanning(true)
    toast({ title: 'Scan lancé', description: 'Analyse des prix concurrents en cours...' })
    setTimeout(() => setScanning(false), 3000)
  }

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <ArrowUp className="h-4 w-4 text-green-500" />
    if (trend === 'down') return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

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
          <Button variant="outline">
            <Bell className="mr-2 h-4 w-4" /> Alertes
          </Button>
        </>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Eye className="h-4 w-4" /> Produits surveillés
            </div>
            <div className="text-2xl font-bold">531</div>
            <p className="text-xs text-muted-foreground mt-1">sur 3 marketplaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Zap className="h-4 w-4" /> Ajustements 24h
            </div>
            <div className="text-2xl font-bold text-primary">54</div>
            <p className="text-xs text-green-600 mt-1">+12% vs hier</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Shield className="h-4 w-4" /> Marge moyenne
            </div>
            <div className="text-2xl font-bold">24.3%</div>
            <p className="text-xs text-green-600 mt-1">Au-dessus du plancher</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Target className="h-4 w-4" /> Win Rate
            </div>
            <div className="text-2xl font-bold text-green-600">73%</div>
            <p className="text-xs text-muted-foreground mt-1">Buy Box gagné</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monitor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitor">
            <BarChart3 className="mr-2 h-4 w-4" /> Monitoring
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="mr-2 h-4 w-4" /> Règles
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="mr-2 h-4 w-4" /> Alertes
          </TabsTrigger>
        </TabsList>

        {/* Monitoring Tab */}
        <TabsContent value="monitor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" /> Comparaison des prix en direct
              </CardTitle>
              <CardDescription>Vos prix vs. la concurrence avec suggestions IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Produit</th>
                      <th className="pb-3 font-medium text-right">Votre prix</th>
                      <th className="pb-3 font-medium text-right">Plus bas</th>
                      <th className="pb-3 font-medium text-right">Moy. marché</th>
                      <th className="pb-3 font-medium text-right">Suggestion</th>
                      <th className="pb-3 font-medium text-center">Tendance</th>
                      <th className="pb-3 font-medium text-center">Statut</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCompetitorPrices.map(cp => (
                      <tr key={cp.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 font-medium">{cp.productName}</td>
                        <td className="py-3 text-right">{cp.yourPrice.toFixed(2)}€</td>
                        <td className="py-3 text-right">
                          <span className={cp.yourPrice > cp.lowestCompetitor ? 'text-red-500' : 'text-green-500'}>
                            {cp.lowestCompetitor.toFixed(2)}€
                          </span>
                        </td>
                        <td className="py-3 text-right">{cp.avgMarket.toFixed(2)}€</td>
                        <td className="py-3 text-right font-semibold text-primary">{cp.suggestedPrice.toFixed(2)}€</td>
                        <td className="py-3 text-center"><TrendIcon trend={cp.trend} /></td>
                        <td className="py-3 text-center">
                          {cp.autoAdjusted ? (
                            <Badge variant="default" className="text-xs"><CheckCircle className="mr-1 h-3 w-3" /> Auto</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs"><Clock className="mr-1 h-3 w-3" /> Manuel</Badge>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Prix appliqué', description: `${cp.productName} → ${cp.suggestedPrice}€` })}>
                            Appliquer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {rules.map(rule => (
              <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant={rule.strategy === 'dynamic_ai' ? 'default' : 'secondary'} className="text-xs">
                          {rule.strategy === 'beat_lowest' && 'Battre le plus bas'}
                          {rule.strategy === 'match_average' && 'Moyenne marché'}
                          {rule.strategy === 'margin_floor' && 'Plancher marge'}
                          {rule.strategy === 'dynamic_ai' && '🤖 IA Dynamique'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rule.productsCount} produits · Marge min {rule.minMargin}% · Max -{rule.maxDiscount}% · {rule.adjustments24h} ajustements 24h
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{rule.lastAdjusted}</span>
                      <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" className="w-full" onClick={() => toast({ title: 'Nouvelle règle', description: 'Formulaire de création bientôt disponible.' })}>
            + Créer une règle de repricing
          </Button>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertes Prix</CardTitle>
              <CardDescription>Notifications en temps réel sur les changements de prix significatifs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { msg: 'Wireless Earbuds Pro X : concurrent à -10% sous votre prix', severity: 'high', time: '2 min' },
                { msg: 'Smart Watch Ultra : prix moyen en hausse de +5%', severity: 'medium', time: '15 min' },
                { msg: 'USB-C Hub 7-in-1 : vous avez le meilleur prix', severity: 'low', time: '1h' },
                { msg: 'Phone Case Premium : 3 concurrents sous votre plancher', severity: 'high', time: '3h' },
              ].map((alert, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === 'high' ? 'text-destructive' : alert.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm">{alert.msg}</p>
                    <p className="text-xs text-muted-foreground mt-1">il y a {alert.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
