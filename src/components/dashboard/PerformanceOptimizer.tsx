import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  Database, 
  Image, 
  Code, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Clock,
  MemoryStick
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PerformanceMetric {
  id: string
  name: string
  category: 'database' | 'images' | 'code' | 'caching'
  score: number
  status: 'good' | 'warning' | 'critical'
  suggestion: string
  impact: 'low' | 'medium' | 'high'
  estimatedImprovement: string
}

export function PerformanceOptimizer() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [optimizing, setOptimizing] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const generateMetrics = (): PerformanceMetric[] => {
    return [
      {
        id: 'db-queries',
        name: 'Optimisation des requêtes DB',
        category: 'database',
        score: 75,
        status: 'warning',
        suggestion: 'Ajouter des index sur les colonnes fréquemment utilisées',
        impact: 'high',
        estimatedImprovement: '+40% vitesse requêtes'
      },
      {
        id: 'image-optimization',
        name: 'Compression des images',
        category: 'images',
        score: 60,
        status: 'critical',
        suggestion: 'Compresser et redimensionner les images automatiquement',
        impact: 'high',
        estimatedImprovement: '+60% vitesse chargement'
      },
      {
        id: 'code-splitting',
        name: 'Division du code',
        category: 'code',
        score: 85,
        status: 'good',
        suggestion: 'Lazy loading des composants non critiques',
        impact: 'medium',
        estimatedImprovement: '+20% première visite'
      },
      {
        id: 'cache-strategy',
        name: 'Stratégie de cache',
        category: 'caching',
        score: 70,
        status: 'warning',
        suggestion: 'Implémenter un cache Redis pour les requêtes fréquentes',
        impact: 'high',
        estimatedImprovement: '+50% réactivité'
      },
      {
        id: 'memory-usage',
        name: 'Utilisation mémoire',
        category: 'code',
        score: 80,
        status: 'good',
        suggestion: 'Optimiser la gestion des états et des abonnements',
        impact: 'medium',
        estimatedImprovement: '+15% performances'
      },
      {
        id: 'api-response',
        name: 'Temps de réponse API',
        category: 'database',
        score: 65,
        status: 'warning',
        suggestion: 'Optimiser les fonctions Supabase et ajouter pagination',
        impact: 'high',
        estimatedImprovement: '+35% rapidité'
      }
    ]
  }

  const optimizeMetric = async (metric: PerformanceMetric) => {
    if (optimizing[metric.id]) return

    setOptimizing(prev => ({ ...prev, [metric.id]: true }))

    try {
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update metric score
      setMetrics(prev => prev.map(m => 
        m.id === metric.id 
          ? { ...m, score: Math.min(95, m.score + 15), status: m.score + 15 >= 85 ? 'good' : 'warning' as const }
          : m
      ))

      toast({
        title: "Optimisation terminée",
        description: `${metric.name} a été optimisé avec succès`,
        duration: 3000
      })
    } catch (error) {
      toast({
        title: "Erreur d'optimisation",
        description: "Impossible d'optimiser cette métrique",
        variant: "destructive"
      })
    } finally {
      setOptimizing(prev => ({ ...prev, [metric.id]: false }))
    }
  }

  const optimizeAll = async () => {
    const criticalMetrics = metrics.filter(m => m.status === 'critical' || m.status === 'warning')
    
    for (const metric of criticalMetrics) {
      if (!optimizing[metric.id]) {
        await optimizeMetric(metric)
        // Small delay between optimizations
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database':
        return <Database className="h-4 w-4" />
      case 'images':
        return <Image className="h-4 w-4" />
      case 'code':
        return <Code className="h-4 w-4" />
      case 'caching':
        return <MemoryStick className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-purple-100 text-purple-800'
      case 'medium':
        return 'bg-blue-100 text-blue-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const overallScore = metrics.length > 0 
    ? Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length)
    : 0

  const criticalIssues = metrics.filter(m => m.status === 'critical').length
  const warningIssues = metrics.filter(m => m.status === 'warning').length

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setMetrics(generateMetrics())
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Optimiseur de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Optimiseur de Performance
          </CardTitle>
          <Button
            onClick={optimizeAll}
            disabled={Object.values(optimizing).some(Boolean) || criticalIssues + warningIssues === 0}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Optimiser Tout
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Score */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Score de Performance Global</h3>
            <div className="text-3xl font-bold text-blue-600">{overallScore}%</div>
          </div>
          <Progress value={overallScore} className="mb-2" />
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>🟢 {metrics.filter(m => m.status === 'good').length} Bon</span>
            <span>🟡 {warningIssues} Attention</span>
            <span>🔴 {criticalIssues} Critique</span>
          </div>
        </div>

        {/* Optimization Metrics */}
        <div className="space-y-4">
          {metrics.map(metric => (
            <div key={metric.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(metric.category)}
                  <div>
                    <h4 className="font-medium">{metric.name}</h4>
                    <p className="text-sm text-muted-foreground">{metric.suggestion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getImpactColor(metric.impact)}>
                    Impact {metric.impact}
                  </Badge>
                  <Badge className={getStatusColor(metric.status)}>
                    {getStatusIcon(metric.status)}
                    {metric.status}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Score actuel</span>
                    <span>{metric.score}%</span>
                  </div>
                  <Progress value={metric.score} />
                </div>
                <div className="ml-4 text-right">
                  <div className="text-sm font-medium text-green-600 mb-2">
                    {metric.estimatedImprovement}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => optimizeMetric(metric)}
                    disabled={optimizing[metric.id] || metric.status === 'good'}
                  >
                    {optimizing[metric.id] ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Optimiser'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Conseils de Performance
          </h4>
          <ul className="text-sm space-y-1 text-blue-800">
            <li>• Optimisez les images avant upload pour réduire la taille</li>
            <li>• Utilisez la pagination pour les grandes listes de données</li>
            <li>• Implémentez le lazy loading pour les composants non critiques</li>
            <li>• Mettez en cache les requêtes fréquentes côté client</li>
            <li>• Surveillez les métriques de performance régulièrement</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}