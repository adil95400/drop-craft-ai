import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Brain, 
  Zap, 
  Target, 
  Image as ImageIcon, 
  Globe, 
  DollarSign,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { useImportUltraPro } from '@/hooks/useImportUltraPro'
import { toast } from 'sonner'

export const AIImportUltraPro = () => {
  const { 
    startAIOptimization, 
    isAIOptimizing, 
    aiJobs,
    importedProducts
  } = useImportUltraPro()

  const [selectedOptimization, setSelectedOptimization] = useState<string>('')
  const [optimizationParams, setOptimizationParams] = useState({
    target_language: 'fr',
    optimization_level: 'medium',
    focus_areas: [] as string[]
  })

  const optimizationTypes = [
    {
      id: 'image_optimization',
      title: 'Optimisation Images',
      description: 'Améliore la qualité et le SEO des images produits',
      icon: ImageIcon,
      color: 'from-purple-500 to-pink-500',
      benefits: ['Compression intelligente', 'Alt text automatique', 'Format WebP'],
      estimatedTime: '2-5 min'
    },
    {
      id: 'translation',
      title: 'Traduction Multi-langues',
      description: 'Traduit automatiquement vos produits en plusieurs langues',
      icon: Globe,
      color: 'from-blue-500 to-cyan-500',
      benefits: ['Traduction contextuelle', 'Adaptation culturelle', 'SEO multilingue'],
      estimatedTime: '3-8 min'
    },
    {
      id: 'price_optimization',
      title: 'Optimisation Prix',
      description: 'Analyse et optimise vos prix selon le marché',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      benefits: ['Analyse concurrentielle', 'Prix psychologiques', 'Marge optimale'],
      estimatedTime: '1-3 min'
    },
    {
      id: 'seo_enhancement',
      title: 'Amélioration SEO',
      description: 'Optimise vos contenus pour les moteurs de recherche',
      icon: Search,
      color: 'from-orange-500 to-red-500',
      benefits: ['Mots-clés ciblés', 'Meta descriptions', 'Titre optimisé'],
      estimatedTime: '4-10 min'
    }
  ]

  const handleStartOptimization = () => {
    if (!selectedOptimization) {
      toast.error('Veuillez sélectionner un type d\'optimisation')
      return
    }

    const selectedType = optimizationTypes.find(t => t.id === selectedOptimization);
    
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          const inputData = {
            products: importedProducts.slice(0, 10), // Limit for demo
            params: optimizationParams,
            product_ids: importedProducts.slice(0, 10).map(p => p.id)
          }

          startAIOptimization({
            job_type: selectedOptimization as any,
            input_data: inputData
          })
          
          resolve('success');
        }, 1000);
      }),
      {
        loading: `Démarrage de l'optimisation ${selectedType?.title}...`,
        success: `Optimisation ${selectedType?.title} lancée avec succès`,
        error: 'Erreur lors du lancement de l\'optimisation'
      }
    );
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Clock className="w-4 h-4 animate-spin" />
      case 'failed': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          IA Ultra Pro
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Optimisez automatiquement vos produits avec l'intelligence artificielle avancée.
          Améliorez vos descriptions, images, prix et SEO en quelques clics.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span>Optimisation automatique</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>Amélioration des conversions</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span>Analyse marché temps réel</span>
          </div>
        </div>
      </div>

      {/* Current optimization status */}
      {isAIOptimizing && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Optimisation IA en cours...</p>
                  <Badge variant="secondary">Traitement</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  L'IA analyse et optimise vos produits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {optimizationTypes.map((type) => (
          <Card 
            key={type.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedOptimization === type.id 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedOptimization(type.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${type.color}`}>
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{type.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {type.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Durée estimée</div>
                  <div className="text-sm font-medium">{type.estimatedTime}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Avantages :</h4>
                  <ul className="space-y-1">
                    {type.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration panel */}
      {selectedOptimization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Configuration de l'optimisation
            </CardTitle>
            <CardDescription>
              Personnalisez les paramètres d'optimisation selon vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_language">Langue cible</Label>
                <Select 
                  value={optimizationParams.target_language}
                  onValueChange={(value) => setOptimizationParams(prev => ({
                    ...prev,
                    target_language: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">Anglais</SelectItem>
                    <SelectItem value="es">Espagnol</SelectItem>
                    <SelectItem value="de">Allemand</SelectItem>
                    <SelectItem value="it">Italien</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="optimization_level">Niveau d'optimisation</Label>
                <Select
                  value={optimizationParams.optimization_level}
                  onValueChange={(value) => setOptimizationParams(prev => ({
                    ...prev,
                    optimization_level: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Léger (rapide)</SelectItem>
                    <SelectItem value="medium">Moyen (équilibré)</SelectItem>
                    <SelectItem value="intensive">Intensif (qualité max)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Produits à traiter :</span>
                <Badge variant="outline">{importedProducts.length} produits</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                L'optimisation sera appliquée à tous vos produits importés
              </p>
            </div>

            <Button 
              onClick={handleStartOptimization}
              disabled={isAIOptimizing || !selectedOptimization}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              {isAIOptimizing ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Optimisation en cours...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Lancer l'optimisation IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent AI jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Historique des optimisations IA
          </CardTitle>
          <CardDescription>
            Consultez l'état de vos optimisations récentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aiJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune optimisation lancée</p>
              <p className="text-sm">Vos optimisations IA apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {aiJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getJobStatusIcon(job.status)}
                    <div>
                      <p className="font-medium capitalize">
                        {job.job_type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {job.status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <Progress value={job.progress} className="w-20" />
                        <span className="text-sm">{job.progress}%</span>
                      </div>
                    )}
                    <Badge className={getJobStatusColor(job.status)}>
                      {job.status === 'completed' && 'Terminé'}
                      {job.status === 'processing' && 'En cours'}
                      {job.status === 'failed' && 'Échec'}
                      {job.status === 'pending' && 'En attente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}