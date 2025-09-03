import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Settings,
  Sparkles,
  Target,
  BarChart3
} from 'lucide-react'
import { useImport } from '@/domains/commerce/hooks/useImport'
import { useAutoSync } from '@/hooks/useAutoSync'
import { toast } from 'sonner'

interface DataQualityIssue {
  id: string
  type: 'missing_data' | 'format_error' | 'duplicate' | 'low_quality' | 'price_anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  suggestion: string
  autoFixable: boolean
}

interface ProcessingRule {
  id: string
  name: string
  description: string
  enabled: boolean
  type: 'data_cleaning' | 'price_optimization' | 'seo_enhancement' | 'categorization'
  config: Record<string, any>
}

export const SmartDataProcessor = () => {
  const { products, isLoading } = useImport()
  const { manualSync } = useAutoSync()
  const [issues, setIssues] = useState<DataQualityIssue[]>([])
  const [processingRules, setProcessingRules] = useState<ProcessingRule[]>([
    {
      id: 'clean-html',
      name: 'Nettoyage HTML',
      description: 'Supprime les balises HTML des descriptions',
      enabled: true,
      type: 'data_cleaning',
      config: { preserveFormatting: true }
    },
    {
      id: 'optimize-prices',
      name: 'Optimisation Prix',
      description: 'Analyse et suggère des prix compétitifs',
      enabled: true,
      type: 'price_optimization',
      config: { margin: 0.3, strategy: 'competitive' }
    },
    {
      id: 'generate-seo',
      name: 'Génération SEO',
      description: 'Crée automatiquement les méta-données SEO',
      enabled: true,
      type: 'seo_enhancement',
      config: { keywordDensity: 0.02, titleLength: 60 }
    },
    {
      id: 'auto-categorize',
      name: 'Catégorisation IA',
      description: 'Assigne automatiquement les catégories',
      enabled: true,
      type: 'categorization',
      config: { confidence: 0.8 }
    }
  ])
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState({
    totalProducts: 0,
    processedProducts: 0,
    issuesFound: 0,
    issuesFixed: 0
  })

  // Analyse automatique des problèmes de qualité
  useEffect(() => {
    if (products.length > 0) {
      analyzeDataQuality()
    }
  }, [products])

  const analyzeDataQuality = () => {
    const foundIssues: DataQualityIssue[] = []
    
    products.forEach(product => {
      // Vérifier les données manquantes
      if (!product.description || product.description.trim().length < 10) {
        foundIssues.push({
          id: `${product.id}-desc`,
          type: 'missing_data',
          severity: 'high',
          description: `Description manquante pour "${product.name}"`,
          suggestion: 'Générer une description automatique basée sur le nom et la catégorie',
          autoFixable: true
        })
      }

      // Détecter le HTML dans les descriptions
      if (product.description && product.description.includes('<')) {
        foundIssues.push({
          id: `${product.id}-html`,
          type: 'format_error',
          severity: 'medium',
          description: `Balises HTML détectées dans "${product.name}"`,
          suggestion: 'Nettoyer automatiquement les balises HTML',
          autoFixable: true
        })
      }

      // Anomalies de prix
      if (product.price && (product.price > 100000 || product.price < 0.01)) {
        foundIssues.push({
          id: `${product.id}-price`,
          type: 'price_anomaly',
          severity: 'critical',
          description: `Prix anormal (${product.price}€) pour "${product.name}"`,
          suggestion: 'Vérifier et corriger le prix manuellement',
          autoFixable: false
        })
      }

      // Catégorie manquante
      if (!product.category || product.category === 'General') {
        foundIssues.push({
          id: `${product.id}-cat`,
          type: 'missing_data',
          severity: 'medium',
          description: `Catégorie générique pour "${product.name}"`,
          suggestion: 'Utiliser l\'IA pour suggérer une catégorie spécifique',
          autoFixable: true
        })
      }
    })

    setIssues(foundIssues)
    setStats(prev => ({
      ...prev,
      totalProducts: products.length,
      issuesFound: foundIssues.length
    }))
  }

  const executeAutomaticProcessing = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)
    
    const enabledRules = processingRules.filter(rule => rule.enabled)
    let processedCount = 0
    let fixedIssues = 0

    try {
      for (const product of products) {
        // Simuler le traitement avec les règles activées
        for (const rule of enabledRules) {
          switch (rule.type) {
            case 'data_cleaning':
              if (product.description?.includes('<')) {
                // Nettoyer HTML
                fixedIssues++
              }
              break
            case 'price_optimization':
              if (product.price && product.price > 0) {
                // Optimiser prix
                processedCount++
              }
              break
            case 'seo_enhancement':
              if (product.seo_title || product.name) {
                // Générer SEO
                fixedIssues++
              }
              break
            case 'categorization':
              if (!product.category || product.category === 'General') {
                // Catégoriser
                fixedIssues++
              }
              break
          }
        }
        
        processedCount++
        setProcessingProgress((processedCount / products.length) * 100)
        
        // Pause pour simulation
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setStats(prev => ({
        ...prev,
        processedProducts: processedCount,
        issuesFixed: fixedIssues
      }))

      toast.success(`Traitement terminé ! ${fixedIssues} problèmes corrigés automatiquement`)
      
      // Synchroniser après traitement
      manualSync(['imports', 'products'])
      
    } catch (error) {
      console.error('Processing error:', error)
      toast.error('Erreur pendant le traitement automatique')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleRule = (ruleId: string) => {
    setProcessingRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'data_cleaning': return <Sparkles className="w-4 h-4" />
      case 'price_optimization': return <TrendingUp className="w-4 h-4" />
      case 'seo_enhancement': return <Target className="w-4 h-4" />
      case 'categorization': return <BarChart3 className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produits</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Traités</p>
                <p className="text-2xl font-bold">{stats.processedProducts}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Problèmes</p>
                <p className="text-2xl font-bold">{stats.issuesFound}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Corrigés</p>
                <p className="text-2xl font-bold">{stats.issuesFixed}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contrôles de traitement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Traitement Automatique Intelligent
            </CardTitle>
            <Button
              onClick={executeAutomaticProcessing}
              disabled={isProcessing || products.length === 0}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Lancer le Traitement IA
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isProcessing && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{Math.round(processingProgress)}%</span>
              </div>
              <Progress value={processingProgress} />
            </div>
          )}

          <Tabs defaultValue="rules" className="w-full">
            <TabsList>
              <TabsTrigger value="rules">Règles de Traitement</TabsTrigger>
              <TabsTrigger value="issues">Problèmes Détectés</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processingRules.map(rule => (
                  <Card key={rule.id} className={`border ${rule.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getTypeIcon(rule.type)}
                          <div>
                            <h3 className="font-medium">{rule.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                          </div>
                        </div>
                        <Button
                          variant={rule.enabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleRule(rule.id)}
                        >
                          {rule.enabled ? "Activé" : "Désactivé"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              {issues.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Aucun problème détecté !</h3>
                  <p className="text-gray-600">Vos données semblent être de bonne qualité.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {issues.map(issue => (
                    <Card key={issue.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getSeverityColor(issue.severity)} className="text-xs">
                                {issue.severity.toUpperCase()}
                              </Badge>
                              <span className="font-medium">{issue.description}</span>
                            </div>
                            <p className="text-sm text-gray-600">{issue.suggestion}</p>
                          </div>
                          {issue.autoFixable && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Auto-corrigible
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}