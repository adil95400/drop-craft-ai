import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Upload, Link as LinkIcon, FileSpreadsheet, Zap, 
  CheckCircle2, AlertCircle, Clock, Sparkles, TrendingUp, 
  Package, ArrowRight, History, CalendarClock, Settings,
  Layers, Timer, XCircle, LayoutGrid
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
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

// Plateformes supportées
const platforms = [
  { name: 'AliExpress', icon: '🛒' },
  { name: 'Amazon', icon: '📦' },
  { name: 'Shopify', icon: '🏪' },
  { name: 'Temu', icon: '🛍️' },
  { name: 'CJ Dropshipping', icon: '🚚' },
  { name: 'eBay', icon: '🏷️' },
  { name: '+2 autres', icon: '' },
]

// Méthodes d'import
const importMethods = [
  {
    id: 'quick',
    title: 'Import Rapide',
    description: 'Import en masse avec URL et images. Le plus puissant.',
    icon: Zap,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
    badge: { label: 'Nouveau', variant: 'new' as const },
    time: '~30 sec',
  },
  {
    id: 'url',
    title: 'Import par URL',
    description: 'Importez un produit en collant son URL. Support AliExpress, Amazon, eBay, Tem...',
    icon: LinkIcon,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-500',
    badge: { label: 'Populaire', variant: 'popular' as const },
    time: '~10 sec',
  },
  {
    id: 'bulk',
    title: 'Import en Masse',
    description: 'Importez des centaines de produits simultanément avec notre moteur haute...',
    icon: Layers,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-500',
    badge: { label: 'Pro', variant: 'pro' as const },
    time: '~5 min',
  },
  {
    id: 'csv',
    title: 'CSV / Excel',
    description: 'Importez vos catalogues depuis des fichiers CSV ou Excel avec mapping...',
    icon: FileSpreadsheet,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    time: '~2 min',
  },
]

export default function AdvancedImportPage() {
  const navigate = useNavigate()
  const { user } = useUnifiedAuth()
  const { toast } = useToast()
  const reducedMotion = useReducedMotion()
  
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [productUrl, setProductUrl] = useState('')

  const loadJobs = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

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

  const handleUrlImport = async () => {
    if (!productUrl.trim()) {
      toast({
        title: "URL requise",
        description: "Veuillez entrer une URL de produit",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('scrape-product', {
        body: { url: productUrl }
      })

      if (error) throw error

      toast({
        title: "Produit importé !",
        description: "Le produit a été ajouté à votre catalogue"
      })
      
      setProductUrl('')
      loadJobs()
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message || "Impossible d'importer ce produit",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const stats = {
    total: jobs.length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    successRate: jobs.length > 0 
      ? Math.round((jobs.filter(j => j.status === 'completed').length / jobs.length) * 100) 
      : 0,
  }

  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case 'new': return 'bg-orange-500 text-white'
      case 'popular': return 'bg-blue-500 text-white'
      case 'pro': return 'bg-purple-500 text-white'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <ChannablePageLayout
      title="Import Avancé"
      metaTitle="Import Avancé - ShopOpti"
      metaDescription="Importez vos produits depuis AliExpress, Amazon, Shopify et plus"
      maxWidth="2xl"
      padding="md"
      backTo="/import"
      backLabel="Retour"
    >
      {/* Hero Section Style AutoDS */}
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-primary/5 via-background to-purple-500/5 rounded-2xl p-8 border border-border/50 overflow-hidden"
      >
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Import Pro
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            <Zap className="w-3 h-3 mr-1" />
            AutoDS Style
          </Badge>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2">Importez vos produits</h1>
        <p className="text-muted-foreground mb-6 max-w-xl">
          Importez depuis AliExpress, Amazon, Shopify et plus en quelques secondes.
          <br />Notre IA optimise automatiquement vos fiches produits.
        </p>

        {/* URL Input + Actions */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-2">
            <Input
              type="url"
              placeholder="Collez l'URL du produit (AliExpress, Amazon, eBay...)"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              className="flex-1 h-12 bg-background/80 backdrop-blur border-border/50"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
            />
            <Button 
              size="lg"
              onClick={handleUrlImport}
              disabled={isLoading}
              className="h-12 px-6 bg-primary hover:bg-primary/90"
            >
              <Zap className="w-4 h-4 mr-2" />
              Importer
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="h-12" onClick={() => navigate('/import/history')}>
              <History className="w-4 h-4 mr-2" />
              Historique
            </Button>
            <Button variant="outline" className="h-12" onClick={() => navigate('/import/scheduled')}>
              <CalendarClock className="w-4 h-4 mr-2" />
              Programmés
            </Button>
            <Button variant="outline" className="h-12" onClick={() => navigate('/import/config')}>
              <Settings className="w-4 h-4 mr-2" />
              Config
            </Button>
          </div>
        </div>

        {/* Platform badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground mr-2">Plateformes:</span>
          {platforms.map((platform, idx) => (
            <Badge key={idx} variant="secondary" className="bg-background/60 backdrop-blur">
              {platform.icon && <span className="mr-1">{platform.icon}</span>}
              {platform.name}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Imports</p>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Tous les temps</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Réussis</p>
                <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stats.successRate}% succès
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-3xl font-bold text-amber-500">{stats.processing}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échoués</p>
                <p className="text-3xl font-bold text-red-500">{stats.failed}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="methods" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Méthodes
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Historique
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/import/history')}>
            <History className="w-4 h-4 mr-2" />
            Tout voir
          </Button>
          <Button size="sm" className="bg-primary">
            <Upload className="w-4 h-4 mr-2" />
            Nouvel import
          </Button>
        </div>
      </div>

      {/* Import Methods Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Méthodes d'import</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Voir tout <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {importMethods.map((method, idx) => (
            <motion.div
              key={method.id}
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group h-full"
                onClick={() => {
                  if (method.id === 'csv') {
                    // Trigger file upload
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.csv,.xlsx,.xls'
                    input.click()
                  }
                }}
              >
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("p-3 rounded-xl", method.iconBg)}>
                      <method.icon className={cn("w-5 h-5", method.iconColor)} />
                    </div>
                    {method.badge && (
                      <Badge className={cn("text-xs", getBadgeVariant(method.badge.variant))}>
                        {method.badge.variant === 'new' && <Sparkles className="w-3 h-3 mr-1" />}
                        {method.badge.label}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-semibold mb-2">{method.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">
                    {method.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {method.time}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Imports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Imports récents</h2>
          </div>
          <span className="text-sm text-muted-foreground">Vos 5 derniers imports</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/import/history')}>
            Voir tout <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="py-16 text-center">
              <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Aucun import récent</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Commencez par importer votre premier produit depuis AliExpress, Amazon ou une autre source
              </p>
              <Button onClick={() => document.querySelector<HTMLInputElement>('input[type="url"]')?.focus()}>
                <Zap className="w-4 h-4 mr-2" />
                Commencer un import
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/20 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        job.status === 'completed' && 'bg-green-500/10',
                        job.status === 'processing' && 'bg-blue-500/10',
                        job.status === 'failed' && 'bg-red-500/10'
                      )}>
                        {job.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        {job.status === 'processing' && <Clock className="w-5 h-5 text-blue-500 animate-spin" />}
                        {job.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-500" />}
                      </div>
                      <div>
                        <p className="font-medium">{job.import_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.processed_rows}/{job.total_rows} produits
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                        {job.status === 'completed' ? 'Terminé' : job.status === 'processing' ? 'En cours' : 'Échoué'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(job.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ChannablePageLayout>
  )
}
