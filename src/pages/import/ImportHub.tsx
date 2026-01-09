import { useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Package, Upload, Settings, FileText, TrendingUp, Zap,
  FileSpreadsheet, Link as LinkIcon, Database, BarChart3,
  Clock, CheckCircle, XCircle, AlertCircle, Search, Plus,
  Globe, Chrome, Store, Rocket, Star, ArrowRight, RefreshCw,
  Download, Play, Eye, MoreVertical, Sparkles, ShoppingBag,
  ExternalLink, Filter, ChevronRight, Box, Layers, Target,
  MousePointerClick, Copy, Wand2, ListPlus, History, Trash2,
  TrendingDown, Loader2, AlertTriangle, ArrowUpRight, Timer,
  CheckCircle2, XCircle as XCircleIcon, Pause, RotateCcw,
  FileJson, FileCode, Wifi, Calendar, Bolt, Cpu, Shield,
  ChevronDown, LayoutGrid, List, SortAsc, SortDesc
} from 'lucide-react'
import { useRealImportMethods } from '@/hooks/useRealImportMethods'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

// Import methods with full configuration
const importMethodsConfig = [
  {
    id: 'single-url',
    title: 'Import par URL',
    description: 'Importez un produit en collant son URL. Support AliExpress, Amazon, eBay, Temu et plus.',
    icon: MousePointerClick,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-500/20 hover:border-blue-500/50',
    link: '/import/url',
    badge: 'Populaire',
    badgeColor: 'bg-blue-500',
    features: ['1-clic import', 'Auto-détection plateforme', 'Extraction images HD'],
    avgTime: '~10 sec'
  },
  {
    id: 'bulk-urls',
    title: 'Import en Masse',
    description: 'Importez des centaines de produits simultanément avec notre moteur haute performance.',
    icon: Layers,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-500/20 hover:border-purple-500/50',
    link: '/import/advanced',
    badge: 'Pro',
    badgeColor: 'bg-purple-500',
    features: ['Jusqu\'à 500 URLs', 'Queue intelligente', 'Rapport détaillé'],
    avgTime: '~5 min'
  },
  {
    id: 'csv-excel',
    title: 'CSV / Excel',
    description: 'Importez vos catalogues depuis des fichiers CSV ou Excel avec mapping intelligent.',
    icon: FileSpreadsheet,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-500',
    borderColor: 'border-green-500/20 hover:border-green-500/50',
    link: '/import/quick',
    features: ['Glisser-déposer', 'Mapping auto', 'Validation colonnes'],
    avgTime: '~2 min'
  },
  {
    id: 'shopify-sync',
    title: 'Shopify Sync',
    description: 'Synchronisez votre boutique Shopify. Import bidirectionnel automatique.',
    icon: Store,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    borderColor: 'border-emerald-500/20 hover:border-emerald-500/50',
    link: '/import/shopify',
    badge: 'Sync',
    badgeColor: 'bg-emerald-500',
    features: ['Sync bidirectionnel', 'Variantes incluses', 'Mise à jour auto'],
    avgTime: '~3 min'
  },
  {
    id: 'aliexpress',
    title: 'AliExpress Direct',
    description: 'Import optimisé pour AliExpress avec calcul automatique des marges.',
    icon: Globe,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
    borderColor: 'border-orange-500/20 hover:border-orange-500/50',
    link: '/import/aliexpress',
    features: ['Calcul marges', 'ePacket filter', 'Avis clients'],
    avgTime: '~15 sec'
  },
  {
    id: 'api-feed',
    title: 'API / XML Feed',
    description: 'Connectez vos fournisseurs via API REST ou flux XML pour import automatisé.',
    icon: FileCode,
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
    borderColor: 'border-indigo-500/20 hover:border-indigo-500/50',
    link: '/import/advanced',
    badge: 'Avancé',
    badgeColor: 'bg-indigo-500',
    features: ['REST / GraphQL', 'XML / JSON', 'Webhooks'],
    avgTime: 'Variable'
  },
  {
    id: 'chrome-extension',
    title: 'Extension Chrome',
    description: 'Importez directement en naviguant sur vos sites fournisseurs préférés.',
    icon: Chrome,
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
    borderColor: 'border-cyan-500/20 hover:border-cyan-500/50',
    link: '/extensions',
    external: true,
    features: ['1-clic browser', 'Tous les sites', 'Sync temps réel'],
    avgTime: '~5 sec'
  },
  {
    id: 'scheduled',
    title: 'Import Programmé',
    description: 'Planifiez vos imports pour qu\'ils s\'exécutent automatiquement.',
    icon: Calendar,
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-500/10',
    iconColor: 'text-pink-500',
    borderColor: 'border-pink-500/20 hover:border-pink-500/50',
    link: '/import/scheduled',
    badge: 'Auto',
    badgeColor: 'bg-pink-500',
    features: ['CRON schedules', 'Récurrence', 'Notifications'],
    avgTime: 'Planifié'
  }
]

// Supported platforms configuration
const supportedPlatforms = [
  { name: 'AliExpress', logo: '🛒', products: '500M+', status: 'active' },
  { name: 'Amazon', logo: '📦', products: '350M+', status: 'active' },
  { name: 'Shopify', logo: '🛍️', products: 'Illimité', status: 'active' },
  { name: 'Temu', logo: '🎯', products: '100M+', status: 'active' },
  { name: 'CJ Dropshipping', logo: '🚚', products: '400K+', status: 'active' },
  { name: 'eBay', logo: '🏷️', products: '1.9B+', status: 'active' },
  { name: 'Banggood', logo: '📱', products: '1M+', status: 'active' },
  { name: 'Wish', logo: '⭐', products: '150M+', status: 'beta' },
]

export default function ImportHub() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { importMethods, stats, isLoading, deleteMethod, executeImport, isExecuting } = useRealImportMethods()
  
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [quickUrl, setQuickUrl] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [isQuickImporting, setIsQuickImporting] = useState(false)

  // Computed values
  const recentImports = useMemo(() => 
    importMethods.slice(0, 5), 
    [importMethods]
  )

  const filteredImports = useMemo(() => {
    let filtered = [...importMethods]
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(imp => 
        imp.source_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        imp.method_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(imp => imp.status === statusFilter)
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })
    
    return filtered
  }, [importMethods, searchQuery, statusFilter, sortOrder])

  const activeImports = useMemo(() => 
    importMethods.filter(imp => imp.status === 'processing'),
    [importMethods]
  )

  // Handlers
  const handleQuickImport = useCallback(async () => {
    if (!quickUrl.trim()) {
      toast({
        title: "URL requise",
        description: "Veuillez entrer une URL de produit",
        variant: "destructive"
      })
      return
    }
    
    setIsQuickImporting(true)
    
    // Navigate to URL import with the URL pre-filled
    navigate(`/import/url?url=${encodeURIComponent(quickUrl)}`)
    
    setIsQuickImporting(false)
  }, [quickUrl, navigate, toast])

  const handleRetryImport = useCallback(async (id: string) => {
    try {
      // Find the import to get its source_type
      const importToRetry = importMethods.find(imp => imp.id === id)
      if (!importToRetry) {
        throw new Error('Import non trouvé')
      }
      await executeImport({ 
        source_type: importToRetry.source_type,
        mapping_config: importToRetry.mapping_config
      })
      toast({
        title: "Import relancé",
        description: "L'import est en cours de traitement"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de relancer l'import",
        variant: "destructive"
      })
    }
  }, [executeImport, importMethods, toast])

  const handleCancelImport = useCallback(async (id: string) => {
    try {
      await deleteMethod(id)
      toast({
        title: "Import annulé",
        description: "L'import a été annulé avec succès"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler l'import",
        variant: "destructive"
      })
    }
  }, [deleteMethod, toast])

  // Status helpers
  const getStatusConfig = useCallback((status: string) => {
    const configs: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
      completed: { 
        icon: CheckCircle, 
        color: 'text-green-500', 
        bgColor: 'bg-green-500/10',
        label: 'Terminé' 
      },
      processing: { 
        icon: Loader2, 
        color: 'text-blue-500', 
        bgColor: 'bg-blue-500/10',
        label: 'En cours' 
      },
      failed: { 
        icon: XCircle, 
        color: 'text-red-500', 
        bgColor: 'bg-red-500/10',
        label: 'Échoué' 
      },
      pending: { 
        icon: Clock, 
        color: 'text-amber-500', 
        bgColor: 'bg-amber-500/10',
        label: 'En attente' 
      },
      partial: { 
        icon: AlertTriangle, 
        color: 'text-orange-500', 
        bgColor: 'bg-orange-500/10',
        label: 'Partiel' 
      }
    }
    return configs[status] || configs.pending
  }, [])

  const getStatusBadge = useCallback((status: string) => {
    const config = getStatusConfig(status)
    return (
      <Badge 
        variant="secondary" 
        className={cn("flex items-center gap-1", config.bgColor, config.color)}
      >
        <config.icon className={cn("w-3 h-3", status === 'processing' && 'animate-spin')} />
        {config.label}
      </Badge>
    )
  }, [getStatusConfig])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Hero Section - AutoDS Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border shadow-lg"
        >
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Import Pro
                  </Badge>
                  <Badge variant="outline" className="border-primary/30">
                    <Zap className="w-3 h-3 mr-1" />
                    AutoDS Style
                  </Badge>
                  {activeImports.length > 0 && (
                    <Badge variant="default" className="bg-blue-500 animate-pulse">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      {activeImports.length} import{activeImports.length > 1 ? 's' : ''} en cours
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Importez vos produits
                </h1>
                <p className="text-muted-foreground text-lg">
                  Importez depuis AliExpress, Amazon, Shopify et plus en quelques secondes. 
                  Notre IA optimise automatiquement vos fiches produits.
                </p>

                {/* Quick URL Import */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Collez l'URL du produit (AliExpress, Amazon, eBay...)"
                      className="pl-12 h-12 text-base bg-background/80 backdrop-blur border-2 focus:border-primary"
                      value={quickUrl}
                      onChange={(e) => setQuickUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickImport()}
                    />
                  </div>
                  <Button 
                    size="lg" 
                    className="h-12 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg"
                    onClick={handleQuickImport}
                    disabled={isQuickImporting}
                  >
                    {isQuickImporting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 mr-2" />
                        Importer
                      </>
                    )}
                  </Button>
                </div>

                {/* Supported Platforms */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-sm text-muted-foreground">Plateformes:</span>
                  {supportedPlatforms.slice(0, 6).map((platform) => (
                    <Badge 
                      key={platform.name} 
                      variant="outline" 
                      className="bg-background/50 backdrop-blur text-xs"
                    >
                      <span className="mr-1">{platform.logo}</span>
                      {platform.name}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="bg-background/50">
                    +{supportedPlatforms.length - 6} autres
                  </Badge>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex lg:flex-col gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 lg:flex-none"
                  onClick={() => navigate('/import/history')}
                >
                  <History className="w-4 h-4 mr-2" />
                  Historique
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 lg:flex-none"
                  onClick={() => navigate('/import/scheduled')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Programmés
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 lg:flex-none"
                  onClick={() => navigate('/import/config')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Config
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Imports</p>
                    <p className="text-3xl font-bold mt-1">{stats.totalMethods}</p>
                    <p className="text-xs text-muted-foreground mt-1">Tous les temps</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Package className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Réussis</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.successfulJobs}</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stats.totalMethods > 0 ? Math.round((stats.successfulJobs / stats.totalMethods) * 100) : 0}% succès
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">En cours</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingJobs}</p>
                    {activeImports.length > 0 && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Traitement...
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-amber-500/20 rounded-xl">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-red-500/10 to-red-500/5 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Échoués</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{stats.failedJobs}</p>
                    {stats.failedJobs > 0 && (
                      <Button variant="link" size="sm" className="text-xs text-red-600 p-0 h-auto mt-1">
                        Voir les erreurs
                      </Button>
                    )}
                  </div>
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Active Imports Banner */}
        <AnimatePresence>
          {activeImports.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {activeImports.length} import{activeImports.length > 1 ? 's' : ''} en cours
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Traitement de vos produits...
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('history')}>
                      Voir détails
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  {/* Progress for first active import */}
                  {activeImports[0] && activeImports[0].total_rows > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{activeImports[0].source_type}</span>
                        <span>{activeImports[0].processed_rows} / {activeImports[0].total_rows} produits</span>
                      </div>
                      <Progress 
                        value={(activeImports[0].processed_rows / activeImports[0].total_rows) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-background">
                <Box className="w-4 h-4 mr-2" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="methods" className="data-[state=active]:bg-background">
                <Layers className="w-4 h-4 mr-2" />
                Méthodes
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-background">
                <History className="w-4 h-4 mr-2" />
                Historique
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/import/history')}>
                <History className="w-4 h-4 mr-2" />
                Tout voir
              </Button>
              <Button size="sm" className="bg-primary" onClick={() => navigate('/import/url')}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel import
              </Button>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Import Methods Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Méthodes d'import</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('methods')}>
                  Voir tout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {importMethodsConfig.slice(0, 4).map((method, index) => (
                  <motion.div
                    key={method.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={method.link}>
                      <Card className={cn(
                        "h-full transition-all duration-300 hover:shadow-lg cursor-pointer group border-2",
                        method.borderColor
                      )}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className={cn("p-2.5 rounded-xl", method.bgColor)}>
                              <method.icon className={cn("w-5 h-5", method.iconColor)} />
                            </div>
                            {method.badge && (
                              <Badge className={cn("text-white text-xs", method.badgeColor)}>
                                {method.badge}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            {method.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {method.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Timer className="w-3 h-3 mr-1" />
                              {method.avgTime}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Imports */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-muted-foreground" />
                      Imports récents
                    </CardTitle>
                    <CardDescription>Vos 5 derniers imports</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('history')}>
                    Voir tout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : recentImports.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Aucun import récent</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                      Commencez par importer votre premier produit depuis AliExpress, Amazon ou une autre source
                    </p>
                    <Button onClick={() => navigate('/import/url')}>
                      <Rocket className="w-4 h-4 mr-2" />
                      Importer un produit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentImports.map((imp, index) => {
                      const statusConfig = getStatusConfig(imp.status)
                      return (
                        <motion.div
                          key={imp.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", statusConfig.bgColor)}>
                              <statusConfig.icon className={cn("w-5 h-5", statusConfig.color, imp.status === 'processing' && 'animate-spin')} />
                            </div>
                            <div>
                              <p className="font-medium">
                                {imp.source_type || imp.method_name || 'Import'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(imp.created_at), { addSuffix: true, locale: fr })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">{imp.success_rows || 0} produits</p>
                              {imp.error_rows > 0 && (
                                <p className="text-xs text-red-500">{imp.error_rows} erreurs</p>
                              )}
                            </div>
                            
                            {imp.status === 'processing' && imp.total_rows > 0 && (
                              <div className="w-24">
                                <Progress 
                                  value={(imp.processed_rows / imp.total_rows) * 100} 
                                  className="h-1.5"
                                />
                              </div>
                            )}
                            
                            {getStatusBadge(imp.status)}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/import/history?id=${imp.id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                {imp.status === 'failed' && (
                                  <DropdownMenuItem onClick={() => handleRetryImport(imp.id)}>
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Relancer
                                  </DropdownMenuItem>
                                )}
                                {imp.status === 'processing' && (
                                  <DropdownMenuItem onClick={() => handleCancelImport(imp.id)}>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Annuler
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => deleteMethod(imp.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supported Platforms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  Plateformes supportées
                </CardTitle>
                <CardDescription>
                  Importez des produits depuis ces marketplaces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {supportedPlatforms.map((platform) => (
                    <div 
                      key={platform.name}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <span className="text-2xl">{platform.logo}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">{platform.products}</p>
                      </div>
                      {platform.status === 'beta' && (
                        <Badge variant="outline" className="text-xs">Beta</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Methods Tab */}
          <TabsContent value="methods" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {importMethodsConfig.map((method, index) => (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={method.link}>
                    <Card className={cn(
                      "h-full transition-all duration-300 hover:shadow-lg cursor-pointer group border-2",
                      method.borderColor
                    )}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn("p-3 rounded-xl", method.bgColor)}>
                            <method.icon className={cn("w-6 h-6", method.iconColor)} />
                          </div>
                          <div className="flex items-center gap-2">
                            {method.badge && (
                              <Badge className={cn("text-white text-xs", method.badgeColor)}>
                                {method.badge}
                              </Badge>
                            )}
                            {method.external && (
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {method.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {method.description}
                        </p>
                        
                        {/* Features list */}
                        <div className="space-y-2 mb-4">
                          {method.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center">
                            <Timer className="w-4 h-4 mr-1" />
                            {method.avgTime}
                          </span>
                          <div className="flex items-center text-primary font-medium text-sm">
                            Commencer
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-0">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans l'historique..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="completed">Terminés</SelectItem>
                    <SelectItem value="processing">En cours</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="failed">Échoués</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                >
                  {sortOrder === 'desc' ? (
                    <SortDesc className="w-4 h-4" />
                  ) : (
                    <SortAsc className="w-4 h-4" />
                  )}
                </Button>
                
                <div className="flex border rounded-md">
                  <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* History List */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredImports.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <History className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery || statusFilter !== 'all' ? 'Aucun résultat' : 'Aucun historique'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Essayez de modifier vos filtres'
                      : 'Votre historique d\'import apparaîtra ici'
                    }
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Button onClick={() => navigate('/import/url')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Commencer un import
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === 'list' ? (
              <div className="space-y-3">
                {filteredImports.map((imp, index) => {
                  const statusConfig = getStatusConfig(imp.status)
                  return (
                    <motion.div
                      key={imp.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", statusConfig.bgColor)}>
                                <statusConfig.icon className={cn("w-5 h-5", statusConfig.color, imp.status === 'processing' && 'animate-spin')} />
                              </div>
                              <div>
                                <p className="font-semibold">{imp.source_type || imp.method_name || 'Import'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(imp.created_at), "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-lg font-bold">{imp.success_rows || 0}</p>
                                <p className="text-xs text-muted-foreground">Produits</p>
                              </div>
                              
                              {imp.status === 'processing' && imp.total_rows > 0 && (
                                <div className="w-32">
                                  <Progress 
                                    value={(imp.processed_rows / imp.total_rows) * 100} 
                                    className="h-2"
                                  />
                                  <p className="text-xs text-center mt-1 text-muted-foreground">
                                    {Math.round((imp.processed_rows / imp.total_rows) * 100)}%
                                  </p>
                                </div>
                              )}
                              
                              {getStatusBadge(imp.status)}
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/import/history?id=${imp.id}`)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  {imp.status === 'failed' && (
                                    <DropdownMenuItem onClick={() => handleRetryImport(imp.id)}>
                                      <RotateCcw className="w-4 h-4 mr-2" />
                                      Relancer
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => deleteMethod(imp.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredImports.map((imp, index) => {
                  const statusConfig = getStatusConfig(imp.status)
                  return (
                    <motion.div
                      key={imp.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", statusConfig.bgColor)}>
                              <statusConfig.icon className={cn("w-5 h-5", statusConfig.color, imp.status === 'processing' && 'animate-spin')} />
                            </div>
                            {getStatusBadge(imp.status)}
                          </div>
                          
                          <h3 className="font-semibold mb-1 truncate">{imp.source_type || 'Import'}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {formatDistanceToNow(new Date(imp.created_at), { addSuffix: true, locale: fr })}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold">{imp.success_rows || 0}</p>
                              <p className="text-xs text-muted-foreground">produits</p>
                            </div>
                            
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/import/history?id=${imp.id}`)}>
                              <ArrowUpRight className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {imp.status === 'processing' && imp.total_rows > 0 && (
                            <Progress 
                              value={(imp.processed_rows / imp.total_rows) * 100} 
                              className="h-1.5 mt-4"
                            />
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
