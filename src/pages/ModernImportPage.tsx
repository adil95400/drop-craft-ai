/**
 * Page Import moderne - Hub multi-formats d'import
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'
import { ActionButton } from '@/components/common/ActionButton'
import { Helmet } from 'react-helmet-async'
import { ImportJobDialog } from '@/components/import/ImportJobDialog'
import { 
  Upload, FileText, Globe, Database, 
  Zap, CheckCircle, XCircle, Clock,
  Download, History, Settings
} from 'lucide-react'

const ModernImportPage: React.FC = () => {
  const { user, loading, getImportJobs } = useUnifiedSystem()
  const [importJobs, setImportJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedImportType, setSelectedImportType] = useState('')

  useEffect(() => {
    loadImportJobs()
  }, [])

  const loadImportJobs = async () => {
    if (!user?.id) return
    setLoadingJobs(true)
    try {
      const jobs = await getImportJobs()
      setImportJobs(jobs)
    } catch (error) {
      console.error('Erreur chargement jobs:', error)
    } finally {
      setLoadingJobs(false)
    }
  }

  const importMethods = [
    {
      id: 'csv',
      title: 'Fichier CSV',
      description: 'Importez vos produits depuis un fichier CSV',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'url',
      title: 'URL / Scraping',
      description: 'Importez depuis une URL ou site web',
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'api',
      title: 'API / EDI',
      description: 'Connexion directe via API ou EDI',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'database',
      title: 'Base de données',
      description: 'Import depuis une base de données',
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé'
      case 'failed':
        return 'Échoué'
      case 'processing':
        return 'En cours'
      default:
        return 'En attente'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Import - Drop Craft AI | Hub Import Multi-formats</title>
        <meta name="description" content="Importez vos produits depuis CSV, API, URL, base de données. Interface moderne et intuitive." />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hub Import</h1>
            <p className="text-muted-foreground">
              Importez vos produits depuis multiples sources en quelques clics
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              Historique
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </Button>
          </div>
        </div>

        <Tabs defaultValue="methods" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="methods">Méthodes d'Import</TabsTrigger>
            <TabsTrigger value="history">Historique des Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="methods" className="space-y-6">
            {/* Méthodes d'import */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {importMethods.map((method) => {
                const Icon = method.icon
                return (
                  <Card key={method.id} className="card-hover">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${method.bgColor}`}>
                          <Icon className={`h-6 w-6 ${method.color}`} />
                        </div>
                        <div>
                          <CardTitle>{method.title}</CardTitle>
                          <CardDescription>{method.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ActionButton
                        className="w-full"
                        onClick={async () => {
                          setSelectedImportType(method.id)
                          setImportDialogOpen(true)
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Commencer l'import
                      </ActionButton>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Template d'import rapide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Template d'Import
                </CardTitle>
                <CardDescription>
                  Téléchargez notre template CSV pour un import optimal
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Template Standard
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Template Avancé
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Historique des imports */}
            <Card>
              <CardHeader>
                <CardTitle>Jobs d'Import Récents</CardTitle>
                <CardDescription>
                  Historique de vos dernières synchronisations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement des jobs...</p>
                  </div>
                ) : importJobs.length > 0 ? (
                  <div className="space-y-4">
                    {importJobs.map((job: any) => (
                      <div key={job.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(job.status)}
                            <div>
                              <h4 className="font-medium">Import #{job.id.slice(-6)}</h4>
                              <p className="text-sm text-muted-foreground">
                                {job.source_type?.toUpperCase()} • {new Date(job.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                            {getStatusLabel(job.status)}
                          </Badge>
                        </div>
                        
                        {job.status === 'completed' && (
                          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t text-sm">
                            <div>
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-medium">{job.total_rows || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Succès</p>
                              <p className="font-medium text-green-600">{job.success_rows || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Erreurs</p>
                              <p className="font-medium text-red-600">{job.error_rows || 0}</p>
                            </div>
                          </div>
                        )}
                        
                        {job.status === 'processing' && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progression</span>
                              <span>{job.processed_rows || 0}/{job.total_rows || 0}</span>
                            </div>
                            <Progress 
                              value={job.total_rows ? (job.processed_rows / job.total_rows) * 100 : 0} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucun import</h3>
                    <p className="text-muted-foreground mb-4">
                      Vous n'avez pas encore effectué d'import.
                    </p>
                    <Button onClick={() => window.location.href = '#methods'}>
                      <Upload className="h-4 w-4 mr-2" />
                      Commencer un import
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog d'import */}
      <ImportJobDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        sourceType={selectedImportType}
        onJobCreated={loadImportJobs}
      />
    </>
  )
}

export default ModernImportPage