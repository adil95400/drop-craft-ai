import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, Link as LinkIcon, FileText, Database, Settings, Zap, 
  CheckCircle2, AlertCircle, Clock, Code, Webhook, FileCode,
  Play, RefreshCw, Sparkles, TrendingUp, Package, ArrowRight,
  Rss
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { XMLFeedImporter } from '@/components/import/XMLFeedImporter'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Hook pour préférences réduites
const useReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface ImportJob {
  id: string
  import_type: string
  status: string
  total_rows: number
  processed_rows: number
  error_rows: number
  created_at: string
}

const tabConfig = [
  { id: 'file', label: 'Fichier CSV', icon: FileText },
  { id: 'url', label: 'URL/API', icon: LinkIcon },
  { id: 'xml', label: 'Flux XML/JSON', icon: Rss },
  { id: 'database', label: 'Base de données', icon: Database },
  { id: 'advanced', label: 'Configuration', icon: Settings },
]

export default function AdvancedImportPage() {
  const navigate = useNavigate()
  const { user } = useUnifiedAuth()
  const { hasFeature } = useUnifiedPlan()
  const { toast } = useToast()
  const reducedMotion = useReducedMotion()
  
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('file')

  const loadJobs = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setJobs(data.map((job: any) => ({
        ...job,
        import_type: job.job_type,
        total_rows: job.total_products,
        processed_rows: job.processed_products,
        error_rows: job.failed_imports
      })))
    }
  }, [user])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const handleFileImport = async (file: File) => {
    if (!hasFeature('advanced_import')) {
      toast({
        title: "Fonctionnalité Pro",
        description: "L'import avancé nécessite un plan Pro ou supérieur",
        variant: "destructive"
      })
      navigate('/pricing')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data, error } = await supabase.functions.invoke('csv-import', {
        body: formData
      })

      if (error) throw error

      toast({
        title: "Import lancé",
        description: "Votre fichier est en cours de traitement"
      })
      
      loadJobs()
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlImport = async (url: string) => {
    if (!hasFeature('url_import')) {
      toast({
        title: "Fonctionnalité Ultra Pro",
        description: "L'import par URL nécessite un plan Ultra Pro",
        variant: "destructive"
      })
      navigate('/pricing')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('url-import', {
        body: { url }
      })

      if (error) throw error

      toast({
        title: "Import URL lancé",
        description: "Le scraping de l'URL est en cours"
      })
      
      loadJobs()
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
      completed: { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Terminé' },
      processing: { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'En cours' },
      failed: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Échoué' },
      pending: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'En attente' },
    }
    return configs[status] || configs.pending
  }

  const stats = {
    total: jobs.length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    totalProducts: jobs.reduce((sum, j) => sum + (j.processed_rows || 0), 0),
  }

  return (
    <ChannablePageWrapper
      title="Import Avancé"
      subtitle="Pro"
      description="Importez depuis CSV, API REST, webhooks ou bases de données avec mapping intelligent"
      heroImage="import"
      badge={{ icon: Code, label: 'Pro' }}
      actions={
        <Button variant="outline" onClick={() => navigate('/import/autods')} className="gap-2">
          <Zap className="h-4 w-4" />
          Import rapide
        </Button>
      }
    >

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Imports totaux', value: stats.total, icon: Upload, color: 'text-primary' },
          { label: 'En cours', value: stats.processing, icon: Clock, color: 'text-blue-500' },
          { label: 'Réussis', value: stats.completed, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Échoués', value: stats.failed, icon: AlertCircle, color: 'text-red-500' },
        ].map((stat, idx) => (
          <Card key={idx} className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={cn("w-8 h-8 opacity-50", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Import Tabs */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Nouvelle importation
          </CardTitle>
          <CardDescription>
            Choisissez votre méthode d'import et configurez les paramètres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              {tabConfig.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div 
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                  "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                  "focus-within:ring-2 focus-within:ring-primary"
                )}
                role="button"
                tabIndex={0}
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.csv'
                  input.onchange = (e: any) => handleFileImport(e.target.files[0])
                  input.click()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.csv'
                    input.onchange = (ev: any) => handleFileImport(ev.target.files[0])
                    input.click()
                  }
                }}
                aria-label="Zone de dépôt pour fichier CSV"
              >
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Glissez votre fichier CSV ici</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  ou cliquez pour sélectionner un fichier
                </p>
                <Button disabled={isLoading}>
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Sélectionner un fichier
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">URL du produit ou catalogue</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/products"
                      className="flex-1 px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
                      aria-label="URL du produit"
                    />
                    <Button 
                      onClick={() => handleUrlImport('https://example.com')}
                      disabled={isLoading}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Importer
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Webhook className="w-3 h-3" />
                    REST API
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FileCode className="w-3 h-3" />
                    GraphQL
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Code className="w-3 h-3" />
                    XML/JSON
                  </Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="xml" className="space-y-4">
              <XMLFeedImporter />
            </TabsContent>

            <TabsContent value="database" className="space-y-4">
              <div className="text-center py-8">
                <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Connexion base de données</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connectez-vous à une base de données externe pour importer vos produits
                </p>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer une connexion
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="text-center py-8">
                <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                  <Settings className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Configuration avancée</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Mapping de colonnes, transformation de données, validation personnalisée
                </p>
                <Button variant="outline" onClick={() => navigate('/import/config')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Accéder aux paramètres
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Jobs History */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historique des imports</CardTitle>
            <CardDescription>Vos 10 derniers imports</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadJobs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">Aucun import pour le moment</p>
              <Button onClick={() => navigate('/import/autods')}>
                <Zap className="w-4 h-4 mr-2" />
                Commencer un import
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const config = getStatusConfig(job.status)
                const progress = job.total_rows > 0 
                  ? Math.round((job.processed_rows / job.total_rows) * 100) 
                  : 0

                return (
                  <motion.div 
                    key={job.id}
                    initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-colors",
                      config.bgColor, "border-border/50"
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn("p-2 rounded-lg", config.bgColor)}>
                        <config.icon className={cn(
                          "w-5 h-5",
                          config.color,
                          job.status === 'processing' && 'animate-spin'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{job.import_type}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{job.processed_rows}/{job.total_rows} produits</span>
                          {job.status === 'processing' && (
                            <Progress value={progress} className="w-24 h-2" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("text-xs", config.bgColor, config.color)}>
                        {config.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  )
}
