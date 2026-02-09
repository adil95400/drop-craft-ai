import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ImportMethodModal } from './ImportMethodModal'
import { importJobsApi } from '@/services/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { 
  Upload, 
  Globe, 
  Zap, 
  Bot, 
  Database, 
  Smartphone,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  RefreshCw
} from 'lucide-react'

interface ImportMethod {
  id: string
  title: string
  description: string
  icon: React.ElementType
  category: string
  popularity: number
  difficulty: 'facile' | 'moyen' | 'avancé'
  features: string[]
  supportedSources: number
  avgImportTime: string
  successRate: number
}

const IMPORT_METHODS: ImportMethod[] = [
  {
    id: 'one-click',
    title: 'Import 1-Clic',
    description: 'Importez depuis 150+ marketplaces en un seul clic',
    icon: Zap,
    category: 'marketplace',
    popularity: 95,
    difficulty: 'facile',
    features: ['Amazon', 'eBay', 'AliExpress', 'Shopify', 'WooCommerce'],
    supportedSources: 150,
    avgImportTime: '2-5 min',
    successRate: 98
  },
  {
    id: 'chrome-extension',
    title: 'Extension Chrome',
    description: 'Extension navigateur pour import direct depuis n\'importe quel site',
    icon: Smartphone,
    category: 'browser',
    popularity: 88,
    difficulty: 'facile',
    features: ['Import direct', 'Détection auto', 'Prévisualisation', 'Mapping intelligent'],
    supportedSources: 999,
    avgImportTime: '1-3 min',
    successRate: 94
  },
  {
    id: 'ai-scraper',
    title: 'IA Scraper Avancé',
    description: 'IA qui comprend et extrait les données de n\'importe quelle page',
    icon: Bot,
    category: 'ai',
    popularity: 92,
    difficulty: 'facile',
    features: ['Vision IA', 'OCR intelligent', 'Structuration auto', 'Multi-langues'],
    supportedSources: 999,
    avgImportTime: '3-8 min',
    successRate: 91
  },
  {
    id: 'bulk-csv',
    title: 'CSV/Excel Intelligent',
    description: 'Import massif avec validation et optimisation automatique',
    icon: Database,
    category: 'file',
    popularity: 85,
    difficulty: 'moyen',
    features: ['Mapping auto', 'Validation', 'Déduplication', 'Enrichissement'],
    supportedSources: 1,
    avgImportTime: '5-15 min',
    successRate: 96
  },
  {
    id: 'api-connector',
    title: 'Connecteurs API',
    description: 'Synchronisation temps réel avec vos fournisseurs',
    icon: Globe,
    category: 'api',
    popularity: 78,
    difficulty: 'avancé',
    features: ['Sync temps réel', 'Webhooks', 'Authentification', 'Rate limiting'],
    supportedSources: 50,
    avgImportTime: '1-2 min',
    successRate: 99
  },
  {
    id: 'marketplace-feeds',
    title: 'Flux Marketplace',
    description: 'Import automatique depuis les flux XML/JSON des marketplaces',
    icon: ShoppingCart,
    category: 'feed',
    popularity: 82,
    difficulty: 'moyen',
    features: ['Plannification', 'Mise à jour auto', 'Monitoring', 'Alertes'],
    supportedSources: 25,
    avgImportTime: '10-30 min',
    successRate: 97
  }
]

const RECENT_IMPORTS = [
  { id: 1, source: 'Amazon', products: 1247, status: 'completed', time: '3 min', accuracy: 98 },
  { id: 2, source: 'eBay', products: 856, status: 'processing', time: '2 min', accuracy: 94 },
  { id: 3, source: 'AliExpress', products: 2341, status: 'completed', time: '8 min', accuracy: 92 },
  { id: 4, source: 'Shopify Store', products: 432, status: 'completed', time: '1 min', accuracy: 99 }
]

export function AdvancedImportHub() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMethod, setModalMethod] = useState<ImportMethod | null>(null)
  const [recentImports, setRecentImports] = useState(RECENT_IMPORTS)
  const [stats, setStats] = useState({
    sources: 150,
    productsThisMonth: 24571,
    successRate: 96,
    avgTime: 4
  })
  
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // Load real-time import data
  useEffect(() => {
    if (!user) return
    loadRecentImports()
    loadStats()
    const interval = setInterval(() => { loadRecentImports(); loadStats() }, 15000)
    return () => clearInterval(interval)
  }, [user])

  const loadRecentImports = async () => {
    if (!user) return
    try {
      const resp = await importJobsApi.list({ per_page: 10 })
      const data = resp.items || []
      const formattedImports = data.map((job: any, index: number) => ({
        id: index + 1,
        source: job.source || job.job_type || 'Source inconnue',
        products: job.progress?.success ?? 0,
        status: job.status,
        time: job.completed_at && job.started_at
          ? `${Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / (1000 * 60))} min`
          : '-- min',
        accuracy: (job.progress?.total ?? 0) > 0
          ? Math.round((job.progress?.success ?? 0) / job.progress.total * 100) : 0
      }))
      setRecentImports(formattedImports)
    } catch (error) {
      console.error('Error loading recent imports:', error)
    }
  }

  const loadStats = async () => {
    if (!user) return
    try {
      const resp = await importJobsApi.list({ per_page: 100 })
      const data = resp.items || []
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const thisMonthImports = data.filter((job: any) => new Date(job.created_at) >= thisMonth)
      const totalProducts = thisMonthImports.reduce((sum: number, job: any) => sum + (job.progress?.success ?? 0), 0)
      const totalJobs = data.length
      const successfulJobs = data.filter((job: any) => job.status === 'completed').length
      const successRate = totalJobs > 0 ? Math.round(successfulJobs / totalJobs * 100) : 0
      setStats({ sources: 150, productsThisMonth: totalProducts, successRate, avgTime: 4 })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleStartImport = (method: ImportMethod) => {
    setModalMethod(method)
    setIsModalOpen(true)
  }

  const handleImportCreated = (jobId: string) => {
    toast({
      title: "Import démarré",
      description: "Votre import a été créé avec succès.",
    })
    loadRecentImports()
    loadStats()
  }

  const categories = [
    { id: 'all', label: 'Tous', count: IMPORT_METHODS.length },
    { id: 'marketplace', label: 'Marketplaces', count: IMPORT_METHODS.filter(m => m.category === 'marketplace').length },
    { id: 'ai', label: 'IA Avancée', count: IMPORT_METHODS.filter(m => m.category === 'ai').length },
    { id: 'api', label: 'API & Sync', count: IMPORT_METHODS.filter(m => m.category === 'api').length },
    { id: 'file', label: 'Fichiers', count: IMPORT_METHODS.filter(m => m.category === 'file').length }
  ]

  const filteredMethods = selectedCategory === 'all' 
    ? IMPORT_METHODS 
    : IMPORT_METHODS.filter(method => method.category === selectedCategory)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'bg-green-500'
      case 'moyen': return 'bg-yellow-500'
      case 'avancé': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing': return <Clock className="h-4 w-4 text-blue-500" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/import/sources')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sources Disponibles</p>
                <p className="text-2xl font-bold">{stats.sources}+</p>
              </div>
              <Globe className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits ce mois</p>
                <p className="text-2xl font-bold">{stats.productsThisMonth.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de Réussite</p>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Temps Moyen</p>
                <p className="text-2xl font-bold">{stats.avgTime} min</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="methods" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="methods">Méthodes d'Import</TabsTrigger>
          <TabsTrigger value="activity">Activité Récente</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-4">
          {/* Filtres par catégorie */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="h-8"
              >
                {category.label}
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Grille des méthodes d'import */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMethods.map((method) => (
              <Card 
                key={method.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMethod === method.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <method.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{method.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`h-5 text-xs ${getDifficultyColor(method.difficulty)}`}
                          >
                            {method.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {method.popularity}% populaire
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {method.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Métriques clés */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Sources</p>
                        <p className="font-medium">{method.supportedSources}+</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Temps moyen</p>
                        <p className="font-medium">{method.avgImportTime}</p>
                      </div>
                    </div>
                    
                    {/* Barre de succès */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Taux de réussite</span>
                        <span className="font-medium">{method.successRate}%</span>
                      </div>
                      <Progress value={method.successRate} className="h-2" />
                    </div>
                    
                    {/* Features principales */}
                    <div className="flex flex-wrap gap-1">
                      {method.features.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {method.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{method.features.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleStartImport(method)}
                    >
                      Démarrer l'import
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Imports Récents</CardTitle>
              <CardDescription>
                Suivi en temps réel de vos imports de produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RECENT_IMPORTS.map((import_item) => (
                  <div key={import_item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(import_item.status)}
                      <div>
                        <p className="font-medium">{import_item.source}</p>
                        <p className="text-sm text-muted-foreground">
                          {import_item.products} produits • {import_item.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{import_item.accuracy}% précision</p>
                      <p className="text-xs text-muted-foreground">
                        {import_item.status === 'processing' ? 'En cours...' : 'Terminé'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance par Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { source: 'Amazon', success: 98, volume: 1247 },
                    { source: 'eBay', success: 94, volume: 856 },
                    { source: 'AliExpress', success: 92, volume: 2341 },
                    { source: 'Shopify', success: 99, volume: 432 }
                  ].map((item) => (
                    <div key={item.source} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.source}</p>
                        <p className="text-sm text-muted-foreground">{item.volume} produits</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.success}%</p>
                        <Progress value={item.success} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Optimisations IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SEO optimisé automatiquement</span>
                    <Badge>89%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Images redimensionnées</span>
                    <Badge>94%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Catégories détectées</span>
                    <Badge>91%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Prix optimisés</span>
                    <Badge>76%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Import Method Modal */}
      <ImportMethodModal
        method={modalMethod}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportStart={handleImportCreated}
      />
    </div>
  )
}