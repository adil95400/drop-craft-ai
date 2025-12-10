import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  FlaskConical, 
  Play, 
  Pause, 
  Trophy, 
  TrendingUp, 
  Users, 
  Target,
  BarChart3,
  Plus,
  Settings,
  Copy,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface ABTest {
  id: string
  name: string
  type: 'price' | 'title' | 'image' | 'description' | 'layout' | 'cta'
  status: 'draft' | 'running' | 'paused' | 'completed'
  variants: Variant[]
  targetAudience: string
  trafficSplit: number
  startDate: string
  endDate?: string
  metrics: TestMetrics
  winner?: string
  statisticalSignificance: number
}

interface Variant {
  id: string
  name: string
  value: string
  traffic: number
  conversions: number
  revenue: number
  conversionRate: number
}

interface TestMetrics {
  totalVisitors: number
  totalConversions: number
  averageOrderValue: number
  revenuePerVisitor: number
}

const mockTests: ABTest[] = [
  {
    id: '1',
    name: 'Test Prix Premium vs Standard',
    type: 'price',
    status: 'running',
    variants: [
      { id: 'a', name: 'Prix Standard (29€)', value: '29', traffic: 1250, conversions: 87, revenue: 2523, conversionRate: 6.96 },
      { id: 'b', name: 'Prix Premium (34€)', value: '34', traffic: 1248, conversions: 72, revenue: 2448, conversionRate: 5.77 }
    ],
    targetAudience: 'Nouveaux visiteurs',
    trafficSplit: 50,
    startDate: '2024-01-15',
    metrics: { totalVisitors: 2498, totalConversions: 159, averageOrderValue: 31.2, revenuePerVisitor: 1.99 },
    statisticalSignificance: 87.5
  },
  {
    id: '2',
    name: 'CTA Button Color Test',
    type: 'cta',
    status: 'completed',
    variants: [
      { id: 'a', name: 'Vert (Contrôle)', value: 'green', traffic: 3200, conversions: 256, revenue: 7680, conversionRate: 8.0 },
      { id: 'b', name: 'Orange (Test)', value: 'orange', traffic: 3180, conversions: 318, revenue: 9540, conversionRate: 10.0 }
    ],
    targetAudience: 'Tous les visiteurs',
    trafficSplit: 50,
    startDate: '2024-01-01',
    endDate: '2024-01-14',
    metrics: { totalVisitors: 6380, totalConversions: 574, averageOrderValue: 30, revenuePerVisitor: 2.70 },
    winner: 'b',
    statisticalSignificance: 95.2
  },
  {
    id: '3',
    name: 'Description Produit Long vs Court',
    type: 'description',
    status: 'running',
    variants: [
      { id: 'a', name: 'Description courte', value: 'short', traffic: 890, conversions: 45, revenue: 1350, conversionRate: 5.06 },
      { id: 'b', name: 'Description détaillée', value: 'long', traffic: 885, conversions: 62, revenue: 1860, conversionRate: 7.01 }
    ],
    targetAudience: 'Mobile uniquement',
    trafficSplit: 50,
    startDate: '2024-01-20',
    metrics: { totalVisitors: 1775, totalConversions: 107, averageOrderValue: 30, revenuePerVisitor: 1.81 },
    statisticalSignificance: 72.3
  }
]

export function AdvancedABTesting() {
  const [tests, setTests] = useState<ABTest[]>(mockTests)
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTest, setNewTest] = useState({
    name: '',
    type: 'price' as ABTest['type'],
    targetAudience: 'all',
    trafficSplit: 50
  })

  const handleStartTest = (testId: string) => {
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, status: 'running' as const } : t
    ))
    toast.success('Test A/B démarré')
  }

  const handlePauseTest = (testId: string) => {
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, status: 'paused' as const } : t
    ))
    toast.info('Test A/B mis en pause')
  }

  const handleDeclareWinner = (testId: string, variantId: string) => {
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, status: 'completed' as const, winner: variantId } : t
    ))
    toast.success('Gagnant déclaré et appliqué à tous les visiteurs')
  }

  const handleCreateTest = () => {
    if (!newTest.name) {
      toast.error('Veuillez entrer un nom pour le test')
      return
    }
    
    const test: ABTest = {
      id: Date.now().toString(),
      name: newTest.name,
      type: newTest.type,
      status: 'draft',
      variants: [
        { id: 'a', name: 'Contrôle', value: '', traffic: 0, conversions: 0, revenue: 0, conversionRate: 0 },
        { id: 'b', name: 'Variante B', value: '', traffic: 0, conversions: 0, revenue: 0, conversionRate: 0 }
      ],
      targetAudience: newTest.targetAudience,
      trafficSplit: newTest.trafficSplit,
      startDate: new Date().toISOString().split('T')[0],
      metrics: { totalVisitors: 0, totalConversions: 0, averageOrderValue: 0, revenuePerVisitor: 0 },
      statisticalSignificance: 0
    }
    
    setTests(prev => [test, ...prev])
    setIsCreating(false)
    setNewTest({ name: '', type: 'price', targetAudience: 'all', trafficSplit: 50 })
    toast.success('Test A/B créé')
  }

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'paused': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getTypeLabel = (type: ABTest['type']) => {
    const labels = {
      price: 'Prix',
      title: 'Titre',
      image: 'Image',
      description: 'Description',
      layout: 'Layout',
      cta: 'CTA'
    }
    return labels[type]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            A/B Testing Avancé
          </h2>
          <p className="text-muted-foreground">
            Testez et optimisez chaque élément de votre catalogue
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Test
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tests actifs</p>
                <p className="text-2xl font-bold">{tests.filter(t => t.status === 'running').length}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visiteurs testés</p>
                <p className="text-2xl font-bold">{tests.reduce((acc, t) => acc + t.metrics.totalVisitors, 0).toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uplift moyen</p>
                <p className="text-2xl font-bold text-green-500">+18.5%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tests gagnants</p>
                <p className="text-2xl font-bold">{tests.filter(t => t.winner).length}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Test Modal */}
      {isCreating && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Créer un nouveau test A/B</CardTitle>
            <CardDescription>Configurez les paramètres de votre expérimentation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du test</Label>
                <Input 
                  placeholder="Ex: Test prix produit phare"
                  value={newTest.name}
                  onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Type de test</Label>
                <Select value={newTest.type} onValueChange={(v) => setNewTest(prev => ({ ...prev, type: v as ABTest['type'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Prix</SelectItem>
                    <SelectItem value="title">Titre</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="layout">Layout</SelectItem>
                    <SelectItem value="cta">CTA / Bouton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience cible</Label>
                <Select value={newTest.targetAudience} onValueChange={(v) => setNewTest(prev => ({ ...prev, targetAudience: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les visiteurs</SelectItem>
                    <SelectItem value="new">Nouveaux visiteurs</SelectItem>
                    <SelectItem value="returning">Visiteurs récurrents</SelectItem>
                    <SelectItem value="mobile">Mobile uniquement</SelectItem>
                    <SelectItem value="desktop">Desktop uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Répartition du trafic: {newTest.trafficSplit}% / {100 - newTest.trafficSplit}%</Label>
                <Input 
                  type="range"
                  min="10"
                  max="90"
                  value={newTest.trafficSplit}
                  onChange={(e) => setNewTest(prev => ({ ...prev, trafficSplit: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreating(false)}>Annuler</Button>
              <Button onClick={handleCreateTest}>Créer le test</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tests List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tous ({tests.length})</TabsTrigger>
          <TabsTrigger value="running">En cours ({tests.filter(t => t.status === 'running').length})</TabsTrigger>
          <TabsTrigger value="completed">Terminés ({tests.filter(t => t.status === 'completed').length})</TabsTrigger>
          <TabsTrigger value="draft">Brouillons ({tests.filter(t => t.status === 'draft').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {tests.map(test => (
            <Card key={test.id} className={test.winner ? 'border-green-500/50' : ''}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Test Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{test.name}</h3>
                      <Badge variant="outline">{getTypeLabel(test.type)}</Badge>
                      <Badge className={getStatusColor(test.status)}>
                        {test.status === 'running' ? 'En cours' : 
                         test.status === 'completed' ? 'Terminé' : 
                         test.status === 'paused' ? 'En pause' : 'Brouillon'}
                      </Badge>
                      {test.winner && (
                        <Badge className="bg-green-500/10 text-green-500">
                          <Trophy className="h-3 w-3 mr-1" />
                          Gagnant trouvé
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {test.targetAudience}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {test.metrics.totalVisitors.toLocaleString()} visiteurs
                      </span>
                      <span>Depuis le {new Date(test.startDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Significance */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Signification statistique</p>
                      <div className="flex items-center gap-2">
                        <Progress value={test.statisticalSignificance} className="w-24 h-2" />
                        <span className={`text-sm font-medium ${test.statisticalSignificance >= 95 ? 'text-green-500' : test.statisticalSignificance >= 80 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                          {test.statisticalSignificance.toFixed(1)}%
                        </span>
                      </div>
                      {test.statisticalSignificance >= 95 && (
                        <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Statistiquement significatif
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {test.status === 'draft' && (
                        <Button size="sm" onClick={() => handleStartTest(test.id)}>
                          <Play className="h-4 w-4 mr-1" />
                          Démarrer
                        </Button>
                      )}
                      {test.status === 'running' && (
                        <Button size="sm" variant="outline" onClick={() => handlePauseTest(test.id)}>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      {test.status === 'paused' && (
                        <Button size="sm" onClick={() => handleStartTest(test.id)}>
                          <Play className="h-4 w-4 mr-1" />
                          Reprendre
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setSelectedTest(test)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Variants Comparison */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.variants.map((variant, idx) => (
                    <div 
                      key={variant.id}
                      className={`p-4 rounded-lg border ${test.winner === variant.id ? 'border-green-500 bg-green-500/5' : 'border-border'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={idx === 0 ? 'secondary' : 'default'}>
                            {idx === 0 ? 'Contrôle' : `Variante ${String.fromCharCode(65 + idx)}`}
                          </Badge>
                          <span className="font-medium">{variant.name}</span>
                          {test.winner === variant.id && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        {test.status === 'running' && test.statisticalSignificance >= 95 && !test.winner && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeclareWinner(test.id, variant.id)}
                          >
                            Déclarer gagnant
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Trafic</p>
                          <p className="font-medium">{variant.traffic.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Conversions</p>
                          <p className="font-medium">{variant.conversions}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Taux conv.</p>
                          <p className={`font-medium ${idx > 0 && variant.conversionRate > test.variants[0].conversionRate ? 'text-green-500' : ''}`}>
                            {variant.conversionRate.toFixed(2)}%
                            {idx > 0 && (
                              <span className="text-xs ml-1">
                                ({variant.conversionRate > test.variants[0].conversionRate ? '+' : ''}
                                {((variant.conversionRate - test.variants[0].conversionRate) / test.variants[0].conversionRate * 100).toFixed(1)}%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="running" className="space-y-4 mt-4">
          {tests.filter(t => t.status === 'running').map(test => (
            <Card key={test.id}>
              <CardContent className="pt-6">
                <h3 className="font-semibold">{test.name}</h3>
                <p className="text-sm text-muted-foreground">{test.metrics.totalVisitors.toLocaleString()} visiteurs</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {tests.filter(t => t.status === 'completed').map(test => (
            <Card key={test.id} className="border-green-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold">{test.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gagnant: {test.variants.find(v => v.id === test.winner)?.name}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4 mt-4">
          {tests.filter(t => t.status === 'draft').map(test => (
            <Card key={test.id}>
              <CardContent className="pt-6">
                <h3 className="font-semibold">{test.name}</h3>
                <Button size="sm" className="mt-2" onClick={() => handleStartTest(test.id)}>
                  <Play className="h-4 w-4 mr-1" />
                  Démarrer
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
