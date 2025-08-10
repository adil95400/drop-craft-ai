import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Bot, 
  BarChart3,
  Sparkles,
  Rocket,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import { useAI } from '@/hooks/useAI'
import { useProducts } from '@/hooks/useProducts'
import { EnhancedCard } from '@/components/ui/enhanced-card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { LoadingSpinner, LoadingCard } from '@/components/ui/loading-states'
import { FloatingElement, AnimatedBadge, GlowingIcon } from '@/components/ui/floating-elements'

export function AIUltraProInterface() {
  const { products } = useProducts()
  const {
    aiTasks,
    isOptimizing,
    isGeneratingInsights,
    isCreatingAutomation,
    isBulkOptimizing,
    isAnalyzingProduct,
    optimizeContent,
    generateInsights,
    createAutomation,
    bulkOptimize,
    analyzeProduct
  } = useAI()

  const [selectedProduct, setSelectedProduct] = useState('')
  const [optimizationTask, setOptimizationTask] = useState('product_description')
  const [analysisType, setAnalysisType] = useState('sales_trends')
  const [campaignType, setCampaignType] = useState('email_sequence')
  const [bulkSettings, setBulkSettings] = useState({
    selectedProducts: [],
    tasks: ['product_description', 'seo_optimization']
  })

  // Mock data for demo
  const aiStats = {
    tasksCompleted: 1247,
    contentGenerated: 3421,
    automationsActive: 15,
    roiImprovement: 34.5
  }

  const handleSingleOptimization = () => {
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    optimizeContent({
      task: optimizationTask,
      productData: product,
      language: 'fr',
      tone: 'professional',
      length: 'medium'
    })
  }

  const handleBulkOptimization = () => {
    const selectedProductsData = products.filter(p => 
      bulkSettings.selectedProducts.includes(p.id)
    )

    bulkOptimize({
      products: selectedProductsData,
      tasks: bulkSettings.tasks,
      batchSize: 5
    })
  }

  const handleInsightsGeneration = () => {
    // Mock data for insights
    const mockData = {
      salesData: products.map(p => ({
        productId: p.id,
        sales: Math.floor(Math.random() * 1000),
        revenue: Math.floor(Math.random() * 50000)
      })),
      periods: ['2024-01', '2024-02', '2024-03'],
      products: products.slice(0, 10)
    }

    generateInsights({
      analysisType,
      data: mockData,
      timeRange: '30d',
      metrics: ['sales', 'conversion', 'traffic']
    })
  }

  const handleAutomationCreation = () => {
    createAutomation({
      campaignType,
      targetAudience: {
        demographics: { age: '25-45', gender: 'mixed' },
        interests: ['tech', 'innovation', 'e-commerce'],
        behavior: 'high_intent_buyers'
      },
      products: products.slice(0, 5),
      businessGoals: 'Augmenter les ventes et améliorer la rétention client',
      budget: 5000,
      timeframe: '1 month'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            IA Ultra Pro
          </h2>
          <p className="text-muted-foreground">
            Intelligence artificielle avancée pour l'optimisation e-commerce
          </p>
        </div>
        <EnhancedButton variant="premium" className="animate-pulse-glow">
          <Brain className="w-4 h-4 mr-2" />
          Assistant IA
        </EnhancedButton>
      </div>

      {/* AI Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FloatingElement delay={0}>
          <EnhancedCard variant="premium" className="text-center">
            <CardContent className="p-6">
              <GlowingIcon icon={<Zap />} color="primary" size="md" className="mx-auto mb-3" />
              <AnimatedCounter 
                value={aiStats.tasksCompleted} 
                className="text-2xl font-bold block mb-1"
              />
              <p className="text-sm text-muted-foreground">Tâches IA Traitées</p>
            </CardContent>
          </EnhancedCard>
        </FloatingElement>

        <FloatingElement delay={100}>
          <EnhancedCard variant="glow" className="text-center">
            <CardContent className="p-6">
              <GlowingIcon icon={<Sparkles />} color="accent" size="md" className="mx-auto mb-3" />
              <AnimatedCounter 
                value={aiStats.contentGenerated} 
                className="text-2xl font-bold block mb-1"
              />
              <p className="text-sm text-muted-foreground">Contenus Générés</p>
            </CardContent>
          </EnhancedCard>
        </FloatingElement>

        <FloatingElement delay={200}>
          <EnhancedCard variant="gradient" className="text-center">
            <CardContent className="p-6">
              <GlowingIcon icon={<Bot />} color="success" size="md" className="mx-auto mb-3" />
              <AnimatedCounter 
                value={aiStats.automationsActive} 
                className="text-2xl font-bold block mb-1"
              />
              <p className="text-sm text-muted-foreground">Automations Actives</p>
            </CardContent>
          </EnhancedCard>
        </FloatingElement>

        <FloatingElement delay={300}>
          <EnhancedCard className="text-center">
            <CardContent className="p-6">
              <GlowingIcon icon={<TrendingUp />} color="warning" size="md" className="mx-auto mb-3" />
              <AnimatedCounter 
                value={aiStats.roiImprovement} 
                format="percentage"
                decimals={1}
                className="text-2xl font-bold block mb-1"
              />
              <p className="text-sm text-muted-foreground">ROI Amélioré</p>
            </CardContent>
          </EnhancedCard>
        </FloatingElement>
      </div>

      <Tabs defaultValue="optimization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="optimization">Optimisation</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Content Optimization */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Single Product Optimization */}
            <EnhancedCard variant="premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Optimisation Individuelle
                </CardTitle>
                <CardDescription>
                  Optimisez un produit spécifique avec l'IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-select">Produit à optimiser</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.slice(0, 10).map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="task-select">Type d'optimisation</Label>
                  <Select value={optimizationTask} onValueChange={setOptimizationTask}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product_description">Description produit</SelectItem>
                      <SelectItem value="seo_optimization">Optimisation SEO</SelectItem>
                      <SelectItem value="price_optimization">Optimisation prix</SelectItem>
                      <SelectItem value="market_analysis">Analyse marché</SelectItem>
                      <SelectItem value="category_suggestion">Suggestion catégorie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <EnhancedButton 
                  onClick={handleSingleOptimization}
                  disabled={!selectedProduct || isOptimizing}
                  loading={isOptimizing}
                  variant="premium"
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Optimiser avec l'IA
                </EnhancedButton>
              </CardContent>
            </EnhancedCard>

            {/* Bulk Optimization */}
            <EnhancedCard variant="glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-accent" />
                  Optimisation en Masse
                </CardTitle>
                <CardDescription>
                  Optimisez plusieurs produits simultanément
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Produits sélectionnés</Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {bulkSettings.selectedProducts.length} produit(s) sélectionné(s)
                  </div>
                  <div className="flex gap-2 mt-2">
                    <EnhancedButton 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBulkSettings(prev => ({
                        ...prev,
                        selectedProducts: products.slice(0, 10).map(p => p.id)
                      }))}
                    >
                      Sélectionner 10 premiers
                    </EnhancedButton>
                    <EnhancedButton 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBulkSettings(prev => ({
                        ...prev,
                        selectedProducts: []
                      }))}
                    >
                      Désélectionner tout
                    </EnhancedButton>
                  </div>
                </div>

                <div>
                  <Label>Types d'optimisation</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { value: 'product_description', label: 'Description' },
                      { value: 'seo_optimization', label: 'SEO' },
                      { value: 'price_optimization', label: 'Prix' },
                      { value: 'market_analysis', label: 'Marché' }
                    ].map((task) => (
                      <label key={task.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={bulkSettings.tasks.includes(task.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSettings(prev => ({
                                ...prev,
                                tasks: [...prev.tasks, task.value]
                              }))
                            } else {
                              setBulkSettings(prev => ({
                                ...prev,
                                tasks: prev.tasks.filter(t => t !== task.value)
                              }))
                            }
                          }}
                        />
                        <span className="text-sm">{task.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <EnhancedButton 
                  onClick={handleBulkOptimization}
                  disabled={bulkSettings.selectedProducts.length === 0 || isBulkOptimizing}
                  loading={isBulkOptimizing}
                  variant="glow"
                  className="w-full"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Optimisation en Masse
                </EnhancedButton>
              </CardContent>
            </EnhancedCard>
          </div>

          {/* Recent AI Tasks */}
          <EnhancedCard>
            <CardHeader>
              <CardTitle>Tâches IA Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AnimatedBadge 
                        variant={task.status === 'completed' ? 'success' : 
                                task.status === 'failed' ? 'error' : 'info'}
                        pulse={task.status === 'processing'}
                      >
                        {task.status}
                      </AnimatedBadge>
                      <div>
                        <p className="font-medium">{task.job_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(task.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{task.progress}%</span>
                      {task.status === 'processing' && <LoadingSpinner size="sm" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </EnhancedCard>
        </TabsContent>

        {/* AI Insights */}
        <TabsContent value="insights" className="space-y-6">
          <EnhancedCard variant="premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Générateur d'Insights IA
              </CardTitle>
              <CardDescription>
                Analysez vos données avec l'intelligence artificielle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="analysis-type">Type d'analyse</Label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_trends">Tendances de vente</SelectItem>
                    <SelectItem value="customer_behavior">Comportement client</SelectItem>
                    <SelectItem value="inventory_optimization">Optimisation stock</SelectItem>
                    <SelectItem value="conversion_optimization">Optimisation conversion</SelectItem>
                    <SelectItem value="fraud_detection">Détection fraude</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <EnhancedButton 
                onClick={handleInsightsGeneration}
                disabled={isGeneratingInsights}
                loading={isGeneratingInsights}
                variant="premium"
                className="w-full"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Générer les Insights
              </EnhancedButton>
            </CardContent>
          </EnhancedCard>
        </TabsContent>

        {/* Marketing Automation */}
        <TabsContent value="automation" className="space-y-6">
          <EnhancedCard variant="glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Automation Marketing IA
              </CardTitle>
              <CardDescription>
                Créez des campagnes automatisées intelligentes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaign-type">Type de campagne</Label>
                <Select value={campaignType} onValueChange={setCampaignType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email_sequence">Séquence d'emails</SelectItem>
                    <SelectItem value="social_media">Médias sociaux</SelectItem>
                    <SelectItem value="retargeting">Retargeting</SelectItem>
                    <SelectItem value="loyalty_program">Programme fidélité</SelectItem>
                    <SelectItem value="content_marketing">Content marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <EnhancedButton 
                onClick={handleAutomationCreation}
                disabled={isCreatingAutomation}
                loading={isCreatingAutomation}
                variant="glow"
                className="w-full"
              >
                <Bot className="w-4 h-4 mr-2" />
                Créer l'Automation
              </EnhancedButton>
            </CardContent>
          </EnhancedCard>
        </TabsContent>

        {/* AI Monitoring */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EnhancedCard>
              <CardHeader>
                <CardTitle>Performance IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Taux de réussite</span>
                    <AnimatedBadge variant="success">94.2%</AnimatedBadge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Temps moyen de traitement</span>
                    <AnimatedBadge>12.3s</AnimatedBadge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Économies générées</span>
                    <AnimatedBadge variant="success">€15,420</AnimatedBadge>
                  </div>
                </div>
              </CardContent>
            </EnhancedCard>

            <EnhancedCard>
              <CardHeader>
                <CardTitle>Contrôles IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <EnhancedButton variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Paramètres IA
                  </EnhancedButton>
                  <EnhancedButton variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser Modèles
                  </EnhancedButton>
                  <EnhancedButton variant="outline" className="w-full">
                    <Pause className="w-4 h-4 mr-2" />
                    Mode Maintenance
                  </EnhancedButton>
                </div>
              </CardContent>
            </EnhancedCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}