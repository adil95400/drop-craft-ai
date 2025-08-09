import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  FileImage, 
  Globe, 
  Database, 
  Cpu, 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Brain,
  Sparkles,
  Target
} from "lucide-react"
import { useImportUltraPro } from "@/hooks/useImportUltraPro"

export const AIImportUltraPro = () => {
  const { 
    startAIOptimization, 
    isAIOptimizing, 
    aiJobs 
  } = useImportUltraPro()

  const optimizationFeatures = [
    {
      id: 'image_optimization',
      title: 'Optimisation Images',
      description: 'Redimensionnement automatique & SEO',
      icon: FileImage,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      enabled: true,
      impact: 'Améliore conversion +15%'
    },
    {
      id: 'translation',
      title: 'Traduction IA',
      description: 'Multi-langues avec contexte métier',
      icon: Globe,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      enabled: false,
      impact: 'Expansion internationale'
    },
    {
      id: 'price_optimization',
      title: 'Prix Dynamiques',
      description: 'Ajustement intelligent des marges',
      icon: Target,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      enabled: false,
      impact: 'Optimise profit +25%'
    },
    {
      id: 'seo_enhancement',
      title: 'SEO Automatique',
      description: 'Titre & description optimisés',
      icon: Sparkles,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      enabled: true,
      impact: 'Visibilité +40%'
    }
  ]

  const handleOptimization = (jobType: string) => {
    startAIOptimization({
      job_type: jobType as any,
      input_data: {
        settings: {
          quality: 'high',
          format: 'webp',
          maxWidth: 1200
        }
      }
    })
  }

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const recentOptimizations = [
    { label: 'Images redimensionnées', count: 247, trend: '+12%' },
    { label: 'Descriptions améliorées', count: 156, trend: '+8%' },
    { label: 'Prix optimisés', count: 89, trend: '+25%' },
    { label: 'Traductions générées', count: 342, trend: '+5%' }
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-hero p-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-2">IA Smart Ultra Pro</h2>
              <p className="text-xl opacity-90">
                Intelligence artificielle avancée pour optimiser vos imports
              </p>
            </div>
            <Badge className="bg-gradient-accent text-white px-4 py-2 font-bold animate-pulse-glow">
              <Brain className="h-4 w-4 mr-2" />
              AI POWERED
            </Badge>
          </div>

          {/* AI Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">247</div>
                    <p className="text-sm opacity-80">Images Optimisées</p>
                  </div>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileImage className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">156</div>
                    <p className="text-sm opacity-80">Descriptions IA</p>
                  </div>
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">89</div>
                    <p className="text-sm opacity-80">Prix Optimisés</p>
                  </div>
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Target className="h-5 w-5 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Features */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Optimisations IA Avancées
          </CardTitle>
          <CardDescription className="text-lg">
            L'intelligence artificielle optimise automatiquement tous vos imports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {optimizationFeatures.map((feature) => {
              const IconComponent = feature.icon
              const runningJob = aiJobs.find(job => job.job_type === feature.id && job.status === 'processing')
              
              return (
                <Card 
                  key={feature.id} 
                  className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-glow hover-scale"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl ${feature.bgColor} group-hover:scale-110 transition-transform`}>
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex flex-col gap-1">
                        {feature.enabled ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Disponible
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {feature.impact}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="relative">
                    {runningJob && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-2">
                          <span>Traitement en cours...</span>
                          <span>{runningJob.progress}%</span>
                        </div>
                        <Progress value={runningJob.progress} className="h-2" />
                      </div>
                    )}
                    
                    <Button 
                      className="w-full bg-gradient-primary hover:bg-gradient-accent transition-all duration-300" 
                      onClick={() => handleOptimization(feature.id)}
                      disabled={isAIOptimizing || !!runningJob}
                    >
                      {runningJob ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          En cours...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          {feature.enabled ? 'Lancer Optimisation' : 'Configurer'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Dernières Optimisations IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOptimizations.map((opt, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg border hover:shadow-md transition-shadow">
                  <div>
                    <span className="font-medium">{opt.label}</span>
                    <div className="text-sm text-muted-foreground">
                      {opt.count} produits traités
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {opt.trend}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-600" />
              Tâches IA Récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {aiJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getJobStatusIcon(job.status)}
                    <div>
                      <p className="font-medium capitalize">
                        {job.job_type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Il y a {Math.floor(Math.random() * 30)} minutes
                      </p>
                    </div>
                  </div>
                  <Badge className={getJobStatusColor(job.status)}>
                    {job.status === 'completed' ? 'Terminé' :
                     job.status === 'processing' ? 'En cours' :
                     job.status === 'failed' ? 'Échoué' : job.status}
                  </Badge>
                </div>
              ))}
              {aiJobs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune tâche IA en cours</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}