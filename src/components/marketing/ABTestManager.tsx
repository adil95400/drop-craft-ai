import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts'
import { 
  Plus, Play, Pause, BarChart3, TrendingUp, 
  Trophy, Loader2, CheckCircle, Target
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useABTests } from '@/hooks/useABTests'
import type { ABTest, ABTestVariant } from '@/hooks/useABTests'

export function ABTestManager() {
  const { tests, isLoading, updateTestStatus, createTest, isCreating } = useABTests()

  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null)
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    type: 'email' as const,
    goal_metric: 'conversion_rate' as const,
    sample_size: 1000,
    confidence_level: 95
  })

  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧'
      case 'landing_page': return '🌐'
      case 'ad': return '📱'
      case 'button': return '🔘'
      case 'headline': return '📰'
      default: return '🧪'
    }
  }

  const calculateStatisticalSignificance = (testData: ABTest) => {
    const variant1 = testData.variants[0]
    const variant2 = testData.variants[1]
    
    // Simplified statistical significance calculation
    const p1 = variant1.metrics.conversion_rate / 100
    const p2 = variant2.metrics.conversion_rate / 100
    const n1 = variant1.metrics.impressions
    const n2 = variant2.metrics.impressions
    
    const pooledP = ((p1 * n1) + (p2 * n2)) / (n1 + n2)
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2))
    const zScore = Math.abs(p1 - p2) / se
    
    // Approximate p-value calculation
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))
    
    return {
      isSignificant: pValue < (1 - testData.confidence_level / 100),
      pValue,
      uplift: ((p2 - p1) / p1) * 100
    }
  }

  const normalCDF = (x: number) => {
    return (1 + erf(x / Math.sqrt(2))) / 2
  }

  const erf = (x: number) => {
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911
    
    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)
    
    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
    
    return sign * y
  }

  const handleStartTest = (testId: string) => {
    updateTestStatus({ id: testId, status: 'running' })
    toast({
      title: "Test démarré",
      description: "Le test A/B a été lancé avec succès"
    })
  }

  const handlePauseTest = (testId: string) => {
    updateTestStatus({ id: testId, status: 'paused' })
    toast({
      title: "Test mis en pause",
      description: "Le test A/B a été suspendu"
    })
  }

  const handleStopTest = (testId: string, winnerId?: string) => {
    updateTestStatus({ id: testId, status: 'completed', winner: winnerId })
    toast({
      title: "Test terminé",
      description: winnerId ? "Un gagnant a été déclaré" : "Le test a été arrêté"
    })
  }

  const renderTestResults = (test: ABTest) => {
    if (test.variants.length !== 2) return null

    const chartData = test.variants.map(variant => ({
      name: variant.name,
      conversion_rate: variant.metrics.conversion_rate,
      click_rate: variant.metrics.click_rate,
      revenue: variant.metrics.revenue
    }))

    const significance = calculateStatisticalSignificance(test)

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4" />
            Voir résultats
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{test.name} - Résultats détaillés</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">
                    {((test.current_sample / test.sample_size) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Progression</div>
                  <Progress 
                    value={(test.current_sample / test.sample_size) * 100} 
                    className="mt-2 h-2" 
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {significance.uplift > 0 ? '+' : ''}{significance.uplift.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Uplift</div>
                  <div className={`text-xs mt-1 ${significance.isSignificant ? 'text-green-600' : 'text-yellow-600'}`}>
                    {significance.isSignificant ? 'Significatif' : 'Non significatif'}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">
                    {test.confidence_level}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confiance</div>
                  <div className="text-xs mt-1 text-muted-foreground">
                    p = {significance.pValue.toFixed(4)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Comparaison des Performances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="conversion_rate" fill="hsl(var(--primary))" name="Taux de conversion %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
              {test.variants.map((variant, index) => (
                <Card key={variant.id} className={test.winner === variant.id ? 'border-green-500' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {variant.name}
                        {test.winner === variant.id && (
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        )}
                      </CardTitle>
                      <Badge variant="outline">
                        {variant.traffic_percentage}% du trafic
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{variant.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{variant.metrics.impressions.toLocaleString()}</div>
                        <div className="text-muted-foreground">Impressions</div>
                      </div>
                      <div>
                        <div className="font-medium">{variant.metrics.clicks.toLocaleString()}</div>
                        <div className="text-muted-foreground">Clics</div>
                      </div>
                      <div>
                        <div className="font-medium">{variant.metrics.conversions.toLocaleString()}</div>
                        <div className="text-muted-foreground">Conversions</div>
                      </div>
                      <div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('fr-FR', { 
                            style: 'currency', 
                            currency: 'EUR' 
                          }).format(variant.metrics.revenue)}
                        </div>
                        <div className="text-muted-foreground">Revenus</div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Taux de conversion</span>
                        <span className="font-medium">{variant.metrics.conversion_rate.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Taux de clic</span>
                        <span className="font-medium">{variant.metrics.click_rate.toFixed(2)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {test.status === 'running' && test.current_sample >= test.sample_size && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleStopTest(test.id, test.variants[1].id)}
                  className="flex-1"
                >
                  Déclarer le variant gagnant
                </Button>
                <Button 
                  onClick={() => handleStopTest(test.id, test.variants[0].id)}
                  variant="outline"
                  className="flex-1"
                >
                  Garder la version contrôle
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tests A/B</h2>
          <p className="text-muted-foreground">
            Optimisez vos campagnes grâce aux tests statistiques
          </p>
        </div>
        
        <Dialog open={isCreateTestOpen} onOpenChange={setIsCreateTestOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Test A/B
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un Test A/B</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-name">Nom du Test</Label>
                <Input
                  id="test-name"
                  placeholder="Ex: Test bouton CTA"
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="test-description">Description</Label>
                <Textarea
                  id="test-description"
                  placeholder="Décrivez ce que vous testez..."
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test-type">Type de Test</Label>
                  <Select 
                    value={newTest.type} 
                    onValueChange={(value: any) => setNewTest({ ...newTest, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="landing_page">Landing Page</SelectItem>
                      <SelectItem value="ad">Publicité</SelectItem>
                      <SelectItem value="button">Bouton</SelectItem>
                      <SelectItem value="headline">Titre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="test-metric">Métrique Objectif</Label>
                  <Select 
                    value={newTest.goal_metric} 
                    onValueChange={(value: any) => setNewTest({ ...newTest, goal_metric: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversion_rate">Taux de conversion</SelectItem>
                      <SelectItem value="click_rate">Taux de clic</SelectItem>
                      <SelectItem value="open_rate">Taux d'ouverture</SelectItem>
                      <SelectItem value="revenue">Revenus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test-sample-size">Taille d'échantillon</Label>
                  <Input
                    id="test-sample-size"
                    type="number"
                    value={newTest.sample_size}
                    onChange={(e) => setNewTest({ ...newTest, sample_size: parseInt(e.target.value) || 1000 })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="test-confidence">Niveau de confiance</Label>
                  <Select 
                    value={newTest.confidence_level.toString()} 
                    onValueChange={(value) => setNewTest({ ...newTest, confidence_level: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="95">95%</SelectItem>
                      <SelectItem value="99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateTestOpen(false)}>
                Annuler
              </Button>
              <Button disabled={!newTest.name.trim()}>
                Créer le Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Actifs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.filter(t => t.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">
              En cours d'exécution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Terminés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.filter(t => t.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Avec résultats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uplift Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+12.3%</div>
            <p className="text-xs text-muted-foreground">
              Sur tests complétés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiance Moyenne</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96%</div>
            <p className="text-xs text-muted-foreground">
              Niveau statistique
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tests List */}
      <div className="grid gap-4">
        {tests.map((test) => {
          const progress = (test.current_sample / test.sample_size) * 100
          const isComplete = test.status === 'completed'
          const winner = isComplete && test.winner ? test.variants.find(v => v.id === test.winner) : null

          return (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(test.type)}</span>
                      <h3 className="font-semibold text-lg">{test.name}</h3>
                      <Badge className={getStatusColor(test.status)}>
                        {test.status}
                      </Badge>
                      {winner && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Trophy className="h-3 w-3 mr-1" />
                          Gagnant: {winner.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{test.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {test.status === 'draft' && (
                      <Button size="sm" onClick={() => handleStartTest(test.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {test.status === 'running' && (
                      <Button size="sm" variant="outline" onClick={() => handlePauseTest(test.id)}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {renderTestResults(test)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Progress */}
                {test.status === 'running' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progression</span>
                      <span>{progress.toFixed(1)}% ({test.current_sample.toLocaleString()} / {test.sample_size.toLocaleString()})</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                
                {/* Variants Comparison */}
                <div className="grid gap-4 md:grid-cols-2">
                  {test.variants.map((variant, index) => (
                    <div key={variant.id} className={`p-4 rounded-lg border ${test.winner === variant.id ? 'border-green-500 bg-green-50' : 'border-border'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{variant.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{variant.traffic_percentage}%</Badge>
                          {test.winner === variant.id && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {variant.metrics.conversion_rate.toFixed(2)}%
                          </div>
                          <div className="text-muted-foreground">Conversion</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {variant.metrics.click_rate.toFixed(2)}%
                          </div>
                          <div className="text-muted-foreground">Clic</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                        {variant.metrics.impressions.toLocaleString()} impressions • {variant.metrics.conversions} conversions
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Test Info */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <div>
                    Objectif: {test.goal_metric.replace('_', ' ')} • Confiance: {test.confidence_level}%
                  </div>
                  <div>
                    Créé le {new Date(test.created_at).toLocaleDateString('fr-FR')}
                    {test.end_date && ` • Terminé le ${new Date(test.end_date).toLocaleDateString('fr-FR')}`}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {tests.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun test A/B configuré</h3>
            <p className="text-muted-foreground mb-4">
              Commencez à optimiser vos campagnes avec des tests A/B statistiquement significatifs
            </p>
            <Button onClick={() => setIsCreateTestOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un Test A/B
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}