/**
 * Page d'import moderne style AutoDS/Spocket
 */

import React, { useState, useEffect } from 'react'
import { Upload, FileText, Globe, Database, Zap, Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'

export function ModernImportPage() {
  const { getImportJobs, loading, isPro, isUltraPro } = useUnifiedSystem()
  const [importJobs, setImportJobs] = useState([])

  useEffect(() => {
    loadImportJobs()
  }, [])

  const loadImportJobs = async () => {
    try {
      const data = await getImportJobs()
      setImportJobs(data)
    } catch (error) {
      console.error('Error loading import jobs:', error)
    }
  }

  // Types d'import disponibles selon le plan
  const importTypes = [
    {
      id: 'file',
      title: 'Import de fichier',
      description: 'CSV, Excel, XML',
      icon: FileText,
      available: true,
      planRequired: 'standard'
    },
    {
      id: 'url',
      title: 'Import URL',
      description: 'Feed produits en ligne',
      icon: Globe,
      available: true,
      planRequired: 'standard'
    },
    {
      id: 'bulk',
      title: 'Import en masse',
      description: 'Milliers de produits',
      icon: Database,
      available: isPro,
      planRequired: 'pro'
    },
    {
      id: 'ai',
      title: 'Import IA',
      description: 'Classification automatique',
      icon: Zap,
      available: isUltraPro,
      planRequired: 'ultra_pro',
      badge: 'AI'
    },
    {
      id: 'scheduled',
      title: 'Import programmé',
      description: 'Synchronisation automatique',
      icon: Clock,
      available: isPro,
      planRequired: 'pro'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'processing': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé'
      case 'processing': return 'En cours'
      case 'failed': return 'Échec'
      case 'pending': return 'En attente'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import de produits</h1>
          <p className="text-muted-foreground">
            Importez vos produits depuis différentes sources
          </p>
        </div>
      </div>

      {/* Import Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {importTypes.map((type) => {
          const Icon = type.icon
          return (
            <Card 
              key={type.id} 
              className={`hover:shadow-lg transition-all cursor-pointer border-2 ${
                type.available ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      type.available ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {type.title}
                        {type.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {type.badge}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {type.available ? (
                  <Button className="w-full">
                    Utiliser
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Nécessite le plan {type.planRequired}
                    </p>
                    <Button variant="outline" className="w-full">
                      Mettre à niveau
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Import Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Imports récents</span>
            <Button variant="outline" size="sm">
              Voir tout
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importJobs.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun import en cours</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par importer vos premiers produits
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel import
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {importJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(job.status)}`}></div>
                    <div>
                      <div className="font-medium">
                        Import {job.source_type || 'Fichier'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.total_rows || 0} produits • {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={job.status === 'completed' ? 'default' : 
                                   job.status === 'processing' ? 'secondary' : 'destructive'}>
                      {getStatusText(job.status)}
                    </Badge>
                    
                    {job.status === 'processing' && job.processed_rows && job.total_rows && (
                      <div className="w-24">
                        <Progress 
                          value={(job.processed_rows / job.total_rows) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Import rapide</h3>
          <p className="text-sm text-muted-foreground">
            Glissez-déposez vos fichiers
          </p>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Feed URL</h3>
          <p className="text-sm text-muted-foreground">
            Connectez votre feed produits
          </p>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <Database className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Base de données</h3>
          <p className="text-sm text-muted-foreground">
            Import depuis BDD externe
          </p>
        </Card>
      </div>
    </div>
  )
}

export default ModernImportPage