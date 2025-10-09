import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Target, 
  LineChart,
  Settings,
  Play,
  Pause,
  AlertCircle,
  Info
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PricingRule {
  id: string
  name: string
  type: 'competitor' | 'demand' | 'inventory' | 'time'
  isActive: boolean
  description: string
  products: number
  avgImpact: string
}

export default function DynamicPricing() {
  const { toast } = useToast()
  
  const [rules, setRules] = useState<PricingRule[]>([
    {
      id: '1',
      name: 'Alignement Concurrent',
      type: 'competitor',
      isActive: true,
      description: 'Ajuste les prix pour rester 5% en dessous de la concurrence',
      products: 234,
      avgImpact: '+12%'
    },
    {
      id: '2',
      name: 'Prix Dynamique Demande',
      type: 'demand',
      isActive: true,
      description: 'Augmente les prix pour les produits à forte demande',
      products: 89,
      avgImpact: '+18%'
    },
    {
      id: '3',
      name: 'Liquidation Stock',
      type: 'inventory',
      isActive: false,
      description: 'Réduit les prix pour les produits en surstock',
      products: 45,
      avgImpact: '-15%'
    },
    {
      id: '4',
      name: 'Prix Heures Creuses',
      type: 'time',
      isActive: false,
      description: 'Ajuste les prix selon l\'heure et le jour',
      products: 156,
      avgImpact: '+8%'
    }
  ])

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ))
    toast({
      title: 'Règle mise à jour',
      description: 'La règle de pricing a été mise à jour'
    })
  }

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'competitor': return <Target className="h-5 w-5" />
      case 'demand': return <TrendingUp className="h-5 w-5" />
      case 'inventory': return <TrendingDown className="h-5 w-5" />
      case 'time': return <LineChart className="h-5 w-5" />
      default: return <Settings className="h-5 w-5" />
    }
  }

  const getRuleColor = (type: string) => {
    switch (type) {
      case 'competitor': return 'text-blue-600'
      case 'demand': return 'text-green-600'
      case 'inventory': return 'text-orange-600'
      case 'time': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <>
      <Helmet>
        <title>Pricing Dynamique - Drop Craft AI</title>
        <meta name="description" content="Optimisez vos prix automatiquement avec l'IA et la data concurrentielle" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Pricing Dynamique
            </h1>
            <p className="text-muted-foreground mt-1">
              Intelligence artificielle et règles automatisées
            </p>
          </div>
          <Button variant="hero">
            <Zap className="h-4 w-4 mr-2" />
            Nouvelle Règle
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">+14.2%</div>
              <div className="text-sm text-green-800 dark:text-green-200">Revenu ce mois</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">524</div>
              <div className="text-sm text-muted-foreground">Produits optimisés</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">4</div>
              <div className="text-sm text-muted-foreground">Règles actives</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <LineChart className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">1,247</div>
              <div className="text-sm text-muted-foreground">Ajustements/jour</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rules">Règles</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="simulation">Simulation</TabsTrigger>
            <TabsTrigger value="settings">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-primary/10 rounded-lg ${getRuleColor(rule.type)}`}>
                        {getRuleIcon(rule.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{rule.name}</h3>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{rule.products} produits</span>
                          <span className={rule.avgImpact.startsWith('+') ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            Impact moyen: {rule.avgImpact}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Ajustements</CardTitle>
                <CardDescription>
                  Suivez tous les changements de prix automatiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { product: 'Wireless Earbuds', oldPrice: 29.99, newPrice: 27.99, reason: 'Concurrent -10%', time: 'Il y a 2h' },
                    { product: 'Smart Watch', oldPrice: 89.99, newPrice: 94.99, reason: 'Forte demande', time: 'Il y a 5h' },
                    { product: 'Phone Case', oldPrice: 14.99, newPrice: 12.99, reason: 'Surstock', time: 'Il y a 1j' }
                  ].map((change, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{change.product}</p>
                        <p className="text-sm text-muted-foreground">{change.reason}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm line-through text-muted-foreground">{change.oldPrice}€</span>
                          <span className="font-bold text-primary">{change.newPrice}€</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{change.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Simulateur de Prix</CardTitle>
                <CardDescription>
                  Testez différentes stratégies avant de les appliquer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Simulation de Scénarios</h3>
                  <p className="text-muted-foreground mb-4">
                    Testez l'impact de vos règles de pricing sur vos revenus
                  </p>
                  <Button>
                    Lancer une Simulation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Globale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Limites de Prix</p>
                      <p className="text-sm text-muted-foreground">Marge min: 25% • Marge max: 80%</p>
                    </div>
                    <Button variant="outline" size="sm">Modifier</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Fréquence d'Ajustement</p>
                      <p className="text-sm text-muted-foreground">Toutes les 6 heures</p>
                    </div>
                    <Button variant="outline" size="sm">Modifier</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Notifications</p>
                      <p className="text-sm text-muted-foreground">M'alerter des changements importants</p>
                    </div>
                    <Switch checked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
