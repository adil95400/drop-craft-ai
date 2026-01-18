import { useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  ChevronDown, LayoutGrid, List, SortAsc, SortDesc, FolderUp,
  ImageIcon, FileUp, Server, Cloud, Webhook, Rss, CircleDot,
  HelpCircle, BookOpen, MessageSquare, Grip, ArrowDown, ArrowUp,
  PlugZap, Unplug, Activity, Workflow
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
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection'
import { useDropzone } from 'react-dropzone'

// Import methods configuration
const importMethodsConfig = [
  {
    id: 'csv-excel',
    title: 'CSV / Excel',
    description: 'Importez vos catalogues depuis des fichiers CSV ou Excel avec mapping intelligent des colonnes.',
    icon: FileSpreadsheet,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-500',
    borderColor: 'border-green-500/20 hover:border-green-500/50',
    action: 'upload',
    badge: 'Populaire',
    badgeColor: 'bg-green-500',
    features: ['Glisser-déposer', 'Mapping auto colonnes', 'Validation données', 'Détection encoding'],
    avgTime: '~2 min',
    maxSize: '50 MB'
  },
  {
    id: 'api-rest',
    title: 'API REST',
    description: 'Connectez vos fournisseurs via API REST pour un import automatisé et temps réel.',
    icon: FileCode,
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
    borderColor: 'border-indigo-500/20 hover:border-indigo-500/50',
    action: 'api',
    badge: 'Pro',
    badgeColor: 'bg-indigo-500',
    features: ['REST / GraphQL', 'Authentification OAuth', 'Rate limiting', 'Webhooks'],
    avgTime: 'Temps réel'
  },
  {
    id: 'xml-feed',
    title: 'Flux XML / RSS',
    description: 'Importez depuis des flux XML, Atom ou RSS avec parsing intelligent.',
    icon: Rss,
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
    borderColor: 'border-orange-500/20 hover:border-orange-500/50',
    action: 'xml',
    badge: 'Avancé',
    badgeColor: 'bg-orange-500',
    features: ['XML / Atom / RSS', 'XPath queries', 'Validation XSD', 'Transformation XSLT'],
    avgTime: '~5 min'
  },
  {
    id: 'json-feed',
    title: 'JSON / JSONL',
    description: 'Importez depuis des fichiers JSON ou des flux JSONL ligne par ligne.',
    icon: FileJson,
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
    borderColor: 'border-cyan-500/20 hover:border-cyan-500/50',
    action: 'json',
    features: ['JSON / JSONL', 'JSONPath queries', 'Nested data', 'Streaming'],
    avgTime: '~3 min'
  },
  {
    id: 'ftp-sftp',
    title: 'FTP / SFTP',
    description: 'Connectez-vous à un serveur FTP ou SFTP pour récupérer vos fichiers automatiquement.',
    icon: Server,
    color: 'from-slate-500 to-gray-600',
    bgColor: 'bg-slate-500/10',
    iconColor: 'text-slate-500',
    borderColor: 'border-slate-500/20 hover:border-slate-500/50',
    action: 'ftp',
    badge: 'Secure',
    badgeColor: 'bg-slate-500',
    features: ['FTP / SFTP', 'Clé SSH', 'Récurrence auto', 'Multi-fichiers'],
    avgTime: 'Variable'
  },
  {
    id: 'google-sheets',
    title: 'Google Sheets',
    description: 'Synchronisez directement depuis une feuille Google Sheets partagée.',
    icon: Cloud,
    color: 'from-blue-500 to-sky-600',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-500/20 hover:border-blue-500/50',
    action: 'google',
    features: ['Sync temps réel', 'Multi-feuilles', 'Formules supportées', 'OAuth Google'],
    avgTime: '~1 min'
  },
  {
    id: 'webhook',
    title: 'Webhook',
    description: 'Recevez des données en temps réel via des webhooks entrants.',
    icon: Webhook,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
    borderColor: 'border-violet-500/20 hover:border-violet-500/50',
    action: 'webhook',
    badge: 'Temps réel',
    badgeColor: 'bg-violet-500',
    features: ['URL dédiée', 'Signature HMAC', 'Retry auto', 'Logs détaillés'],
    avgTime: 'Instant'
  },
  {
    id: 'manual',
    title: 'Saisie manuelle',
    description: 'Créez ou modifiez vos produits manuellement avec notre éditeur avancé.',
    icon: ListPlus,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    borderColor: 'border-emerald-500/20 hover:border-emerald-500/50',
    action: 'manual',
    features: ['Éditeur visuel', 'Templates', 'Copier/coller', 'Bulk edit'],
    avgTime: 'Variable'
  }
]

// Data sources for quick connect
const dataSources = [
  { id: 'shopify', name: 'Shopify', icon: '🛍️', status: 'available', color: 'bg-green-500' },
  { id: 'woocommerce', name: 'WooCommerce', icon: '🛒', status: 'available', color: 'bg-purple-500' },
  { id: 'prestashop', name: 'PrestaShop', icon: '🏪', status: 'available', color: 'bg-pink-500' },
  { id: 'magento', name: 'Magento', icon: '🔶', status: 'available', color: 'bg-orange-500' },
  { id: 'bigcommerce', name: 'BigCommerce', icon: '📦', status: 'available', color: 'bg-blue-500' },
  { id: 'amazon', name: 'Amazon', icon: '📦', status: 'beta', color: 'bg-amber-500' },
  { id: 'ebay', name: 'eBay', icon: '🏷️', status: 'beta', color: 'bg-blue-400' },
  { id: 'google-merchant', name: 'Google Merchant', icon: '🛒', status: 'available', color: 'bg-red-500' },
]

export default function ImportHub() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { importMethods, stats, isLoading, deleteMethod, executeImport, isExecuting } = useRealImportMethods()
  
  // State
  const [activeTab, setActiveTab] = useState('methods')
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [pasteInput, setPasteInput] = useState('')
  const [showApiDialog, setShowApiDialog] = useState(false)
  const [showFtpDialog, setShowFtpDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // File dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles)
    if (acceptedFiles.length > 0) {
      toast({
        title: "Fichier reçu",
        description: `${acceptedFiles[0].name} prêt à être importé`,
      })
      // Auto start import
      handleFileImport(acceptedFiles[0])
    }
  }, [toast])

  const { getRootProps, getInputProps, isDragActive, isDragAccept } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  // Computed
  const recentImports = useMemo(() => 
    importMethods.slice(0, 8), 
    [importMethods]
  )

  const activeImports = useMemo(() => 
    importMethods.filter(imp => imp.status === 'processing'),
    [importMethods]
  )

  const filteredImports = useMemo(() => {
    let filtered = [...importMethods]
    if (statusFilter !== 'all') {
      filtered = filtered.filter(imp => imp.status === statusFilter)
    }
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })
    return filtered
  }, [importMethods, statusFilter, sortOrder])

  // Handlers
  const handleFileImport = async (file: File) => {
    setIsProcessing(true)
    try {
      // Determine type
      const ext = file.name.split('.').pop()?.toLowerCase()
      let type: 'csv' | 'xml' | 'json' = 'csv'
      if (ext === 'xml') type = 'xml'
      if (ext === 'json') type = 'json'
      
      await executeImport({
        source_type: type,
        source_url: file.name,
        mapping_config: {}
      })
      
      toast({
        title: "Import lancé",
        description: `Import de ${file.name} en cours de traitement`,
      })
      setActiveTab('history')
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lancer l'import",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setUploadedFiles([])
    }
  }

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "URL requise",
        description: "Veuillez entrer une URL valide",
        variant: "destructive"
      })
      return
    }
    
    setIsProcessing(true)
    try {
      await executeImport({
        source_type: 'api',
        source_url: urlInput,
        mapping_config: {}
      })
      
      toast({
        title: "Import lancé",
        description: "Récupération des données en cours...",
      })
      setUrlInput('')
      setActiveTab('history')
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePasteImport = async () => {
    if (!pasteInput.trim()) {
      toast({
        title: "Données requises",
        description: "Veuillez coller des données",
        variant: "destructive"
      })
      return
    }
    
    setIsProcessing(true)
    try {
      // Detect format
      let type: 'json' | 'csv' | 'xml' = 'csv'
      const trimmed = pasteInput.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) type = 'json'
      else if (trimmed.startsWith('<')) type = 'xml'
      
      await executeImport({
        source_type: type,
        source_url: 'paste-import',
        mapping_config: { raw_data: pasteInput }
      })
      
      toast({
        title: "Import lancé",
        description: "Traitement des données en cours...",
      })
      setPasteInput('')
      setActiveTab('history')
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter les données",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMethodAction = (method: typeof importMethodsConfig[0]) => {
    switch (method.action) {
      case 'upload':
        // Trigger file picker
        document.getElementById('file-upload-input')?.click()
        break
      case 'api':
        setShowApiDialog(true)
        break
      case 'ftp':
        setShowFtpDialog(true)
        break
      case 'manual':
        navigate('/products/new')
        break
      case 'google':
        toast({ title: "Google Sheets", description: "Connexion Google en cours..." })
        break
      case 'webhook':
        toast({ title: "Webhook", description: "URL webhook générée !" })
        break
      default:
        setSelectedMethod(method.id)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
      completed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Terminé' },
      processing: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'En cours' },
      failed: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Échoué' },
      pending: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'En attente' },
    }
    return configs[status] || configs.pending
  }

  return (
    <ChannablePageLayout
      title="Import de données"
      metaTitle="Import de données"
      metaDescription="Importez vos produits depuis CSV, Excel, API, XML et plus"
      showBackButton={false}
      maxWidth="2xl"
    >
      {/* Hero Section */}
      <ChannableHeroSection
        badge={{ label: "Centre d'Import", icon: Upload }}
        title="Importez vos données"
        subtitle="CSV, Excel, API, XML, JSON, FTP et plus"
        description="Importez vos catalogues produits depuis n'importe quelle source. Notre moteur intelligent détecte automatiquement le format et mappe vos colonnes."
        variant="compact"
        showHexagons={false}
        stats={[
          { value: stats.totalMethods.toString(), label: 'Imports', icon: Package },
          { value: `${stats.successfulJobs}`, label: 'Réussis', icon: CheckCircle },
          { value: activeImports.length.toString(), label: 'En cours', icon: Loader2 },
        ]}
      />

      {/* Quick Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed transition-all duration-300 cursor-pointer",
            isDragActive && "border-primary bg-primary/5 scale-[1.02]",
            isDragAccept && "border-green-500 bg-green-500/5",
            !isDragActive && "hover:border-primary/50 hover:bg-accent/50"
          )}
        >
          <input {...getInputProps()} id="file-upload-input" />
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <motion.div 
                animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                  isDragActive ? "bg-primary/20" : "bg-muted"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : (
                  <FolderUp className={cn("w-10 h-10", isDragActive ? "text-primary" : "text-muted-foreground")} />
                )}
              </motion.div>
              
              <h3 className="text-xl font-semibold mb-2">
                {isDragActive ? "Déposez votre fichier ici" : "Glissez-déposez votre fichier"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Supporté: CSV, Excel (.xlsx, .xls), XML, JSON • Max 50 MB
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" disabled={isProcessing}>
                  <Upload className="w-4 h-4 mr-2" />
                  Parcourir
                </Button>
                <span className="text-sm text-muted-foreground">ou</span>
                <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setActiveTab('paste') }}>
                  <Copy className="w-4 h-4 mr-2" />
                  Coller des données
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Imports Banner */}
      <AnimatePresence>
        {activeImports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {activeImports.length}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">
                        {activeImports.length} import{activeImports.length > 1 ? 's' : ''} en cours
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Traitement de vos données...
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('history')}>
                    Voir les détails
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                
                {activeImports[0]?.total_rows > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{activeImports[0].source_type}</span>
                      <span>{activeImports[0].processed_rows} / {activeImports[0].total_rows}</span>
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

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="methods" className="data-[state=active]:bg-background">
              <Layers className="w-4 h-4 mr-2" />
              Méthodes
            </TabsTrigger>
            <TabsTrigger value="url" className="data-[state=active]:bg-background">
              <LinkIcon className="w-4 h-4 mr-2" />
              URL
            </TabsTrigger>
            <TabsTrigger value="paste" className="data-[state=active]:bg-background">
              <Copy className="w-4 h-4 mr-2" />
              Coller
            </TabsTrigger>
            <TabsTrigger value="sources" className="data-[state=active]:bg-background">
              <PlugZap className="w-4 h-4 mr-2" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-background relative">
              <History className="w-4 h-4 mr-2" />
              Historique
              {importMethods.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {importMethods.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Methods Tab */}
        <TabsContent value="methods" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {importMethodsConfig.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={cn(
                    "h-full transition-all duration-300 hover:shadow-lg cursor-pointer group border-2",
                    method.borderColor
                  )}
                  onClick={() => handleMethodAction(method)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", method.bgColor)}>
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
                    
                    <div className="space-y-1.5 mb-3">
                      {method.features.slice(0, 3).map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Timer className="w-3 h-3 mr-1" />
                        {method.avgTime}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Help */}
          <Card className="bg-muted/30">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <HelpCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Besoin d'aide pour choisir ?</h3>
                    <p className="text-sm text-muted-foreground">
                      Consultez notre guide pour savoir quelle méthode d'import utiliser selon votre situation.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Guide
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* URL Tab */}
        <TabsContent value="url" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Import depuis une URL
              </CardTitle>
              <CardDescription>
                Entrez l'URL d'un flux de données (API, XML, JSON, CSV)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="https://example.com/products.json ou /api/products"
                    className="pl-12 h-12 text-base"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                  />
                </div>
                <Button 
                  size="lg" 
                  className="h-12 px-6"
                  onClick={handleUrlImport}
                  disabled={isProcessing || !urlInput.trim()}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Récupérer
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" size="sm" className="justify-start" onClick={() => setUrlInput('https://api.example.com/products')}>
                  <FileCode className="w-4 h-4 mr-2" />
                  API REST
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => setUrlInput('https://feed.example.com/products.xml')}>
                  <Rss className="w-4 h-4 mr-2" />
                  Flux XML
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => setUrlInput('https://data.example.com/catalog.json')}>
                  <FileJson className="w-4 h-4 mr-2" />
                  JSON Feed
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => setUrlInput('https://example.com/products.csv')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  CSV distant
                </Button>
              </div>
              
              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Connexion sécurisée HTTPS</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Détection auto du format</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paste Tab */}
        <TabsContent value="paste" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Coller des données
              </CardTitle>
              <CardDescription>
                Collez directement du JSON, XML, CSV ou des données tabulaires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder='Collez vos données ici...

Exemples supportés:
• JSON: [{"title": "Produit 1", "price": 29.99}, ...]
• CSV: title,price,description\nProduit 1,29.99,Description...
• XML: <products><product><title>...</title></product></products>'
                className="min-h-[200px] font-mono text-sm"
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wand2 className="w-4 h-4" />
                  Format détecté: {pasteInput.trim().startsWith('{') || pasteInput.trim().startsWith('[') ? 'JSON' : pasteInput.trim().startsWith('<') ? 'XML' : 'CSV/Texte'}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPasteInput('')} disabled={!pasteInput}>
                    Effacer
                  </Button>
                  <Button onClick={handlePasteImport} disabled={isProcessing || !pasteInput.trim()}>
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Importer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlugZap className="w-5 h-5" />
                  Sources connectées
                </CardTitle>
                <CardDescription>
                  Connectez vos plateformes e-commerce pour un import automatique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dataSources.map((source) => (
                    <div 
                      key={source.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{source.icon}</span>
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {source.status === 'beta' ? 'Bêta' : 'Disponible'}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <PlugZap className="w-4 h-4 mr-2" />
                        Connecter
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5" />
                  Webhooks entrants
                </CardTitle>
                <CardDescription>
                  Recevez des données en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Votre URL webhook:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded text-xs font-mono truncate">
                      https://api.shopopti.com/webhook/import/abc123
                    </code>
                    <Button variant="ghost" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Requêtes reçues (24h)</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Dernière activité</span>
                    <span className="text-muted-foreground">Aucune</span>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Régénérer l'URL
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-0">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
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
              {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
            </Button>
            
            <div className="flex-1" />
            
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
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
                <h3 className="text-lg font-semibold mb-2">Aucun import</h3>
                <p className="text-muted-foreground mb-6">
                  Commencez par importer des données depuis l'une des méthodes disponibles.
                </p>
                <Button onClick={() => setActiveTab('methods')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel import
                </Button>
              </CardContent>
            </Card>
          ) : (
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
                                {format(new Date(imp.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
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
                            
                            <Badge 
                              variant="secondary" 
                              className={cn("flex items-center gap-1", statusConfig.bgColor, statusConfig.color)}
                            >
                              <statusConfig.icon className={cn("w-3 h-3", imp.status === 'processing' && 'animate-spin')} />
                              {statusConfig.label}
                            </Badge>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                {imp.status === 'failed' && (
                                  <DropdownMenuItem>
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
          )}
        </TabsContent>
      </Tabs>

      {/* API Dialog */}
      <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Configuration API REST
            </DialogTitle>
            <DialogDescription>
              Connectez-vous à une API externe pour importer des données
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL de l'API</label>
              <Input placeholder="https://api.example.com/products" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Méthode</label>
                <Select defaultValue="GET">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <Select defaultValue="json">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Headers (optionnel)</label>
              <Textarea 
                placeholder='{"Authorization": "Bearer token123"}'
                className="font-mono text-sm"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => { setShowApiDialog(false); handleUrlImport() }}>
              <Download className="w-4 h-4 mr-2" />
              Tester & Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FTP Dialog */}
      <Dialog open={showFtpDialog} onOpenChange={setShowFtpDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Configuration FTP/SFTP
            </DialogTitle>
            <DialogDescription>
              Connectez-vous à un serveur FTP pour récupérer vos fichiers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hôte</label>
              <Input placeholder="ftp.example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Port</label>
                <Input placeholder="21" defaultValue="21" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Protocole</label>
                <Select defaultValue="ftp">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ftp">FTP</SelectItem>
                    <SelectItem value="sftp">SFTP</SelectItem>
                    <SelectItem value="ftps">FTPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Utilisateur</label>
                <Input placeholder="username" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mot de passe</label>
                <Input type="password" placeholder="••••••••" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Chemin du fichier</label>
              <Input placeholder="/exports/products.csv" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFtpDialog(false)}>
              Annuler
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Connecter & Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChannablePageLayout>
  )
}
