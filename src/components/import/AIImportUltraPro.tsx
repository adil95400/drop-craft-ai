import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileImage, Globe, Database, Cpu, Zap, CheckCircle, Clock, AlertTriangle } from "lucide-react"
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
      description: 'Redimensionnement & SEO auto',
      icon: FileImage,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      enabled: true
    },
    {
      id: 'translation',
      title: 'Traduction Auto',
      description: 'Multi-langues avec IA',
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      enabled: false
    },
    {
      id: 'price_optimization',
      title: 'Prix Dynamiques',
      description: 'Ajustement automatique',
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      enabled: false
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

  // Mock recent optimizations
  const recentOptimizations = [
    { label: 'Images redimensionnées', count: 247 },
    { label: 'Descriptions améliorées', count: 156 },
    { label: 'Prix optimisés', count: 89 },
    { label: 'Traductions générées', count: 342 }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          Import Intelligent
        </CardTitle>
        <CardDescription>
          L'IA analyse et optimise automatiquement vos imports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {optimizationFeatures.map((feature) => {
            const Icon = feature.icon
            const runningJob = aiJobs.find(job => job.job_type === feature.id && job.status === 'processing')
            
            return (
              <Card key={feature.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  {feature.enabled && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                
                {runningJob && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Traitement en cours...</span>
                      <span>{runningJob.progress}%</span>
                    </div>
                    <Progress value={runningJob.progress} className="h-2" />
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  variant={feature.enabled ? "default" : "outline"}
                  onClick={() => handleOptimization(feature.id)}
                  disabled={isAIOptimizing || !!runningJob}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {feature.enabled ? 'Activer' : 'Configurer'}
                </Button>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold">Dernières optimisations IA</h4>
            <div className="space-y-2">
              {recentOptimizations.map((opt, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                  <span className="text-sm">{opt.label}</span>
                  <Badge variant="outline">{opt.count} produits</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Tâches IA récentes</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {aiJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getJobStatusIcon(job.status)}
                    <span className="text-sm capitalize">
                      {job.job_type.replace('_', ' ')}
                    </span>
                  </div>
                  <Badge className={getJobStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                </div>
              ))}
              {aiJobs.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Cpu className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune tâche IA en cours</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}