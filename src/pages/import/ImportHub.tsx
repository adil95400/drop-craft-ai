import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Package, Upload, Settings, FileText, TrendingUp, Zap,
  FileSpreadsheet, Link as LinkIcon, Database, BarChart3,
  Clock, CheckCircle, XCircle, AlertCircle, Search, Plus,
  Globe, Chrome, Store, Rocket, Star, ArrowRight, RefreshCw,
  Download, Play, Eye, MoreVertical, Sparkles, ShoppingBag,
  ExternalLink, Filter, ChevronRight, Box, Layers, Target,
  MousePointerClick, Copy, Wand2, ListPlus, History, Trash2,
  TrendingDown
} from 'lucide-react'
import { useRealImportMethods } from '@/hooks/useRealImportMethods'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export default function ImportHub() {
  const navigate = useNavigate()
  const { importMethods, stats, isLoading, deleteMethod } = useRealImportMethods()
  const [searchQuery, setSearchQuery] = useState('')
  const [quickUrl, setQuickUrl] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Derniers imports récents
  const recentImports = useMemo(() => 
    importMethods.slice(0, 5), 
    [importMethods]
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />
      default: return <Clock className="w-4 h-4 text-amber-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      completed: { variant: 'default', label: 'Terminé' },
      processing: { variant: 'secondary', label: 'En cours' },
      failed: { variant: 'destructive', label: 'Échoué' },
      pending: { variant: 'outline', label: 'En attente' }
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleQuickImport = () => {
    if (quickUrl.trim()) {
      navigate(`/import/url?url=${encodeURIComponent(quickUrl)}`)
    }
  }

  // Méthodes d'import style AutoDS
  const importMethods_ui = [
    {
      id: 'single-product',
      title: 'Import Produit Unique',
      description: 'Collez une URL et importez en 1 clic',
      icon: MousePointerClick,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      link: '/import/url',
      badge: 'Populaire',
      badgeColor: 'bg-blue-500'
    },
    {
      id: 'bulk-import',
      title: 'Import en Masse',
      description: 'Importez des centaines de produits à la fois',
      icon: Layers,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
      link: '/import/advanced',
      badge: 'Pro',
      badgeColor: 'bg-purple-500'
    },
    {
      id: 'csv-excel',
      title: 'CSV / Excel',
      description: 'Importez depuis vos fichiers CSV ou Excel',
      icon: FileSpreadsheet,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-500',
      link: '/import/quick'
    },
    {
      id: 'shopify-store',
      title: 'Boutique Shopify',
      description: 'Importez depuis n\'importe quelle boutique Shopify',
      icon: Store,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      link: '/import/shopify',
      badge: 'Nouveau',
      badgeColor: 'bg-emerald-500'
    },
    {
      id: 'aliexpress',
      title: 'AliExpress',
      description: 'Import direct depuis AliExpress',
      icon: Globe,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
      link: '/import/aliexpress'
    },
    {
      id: 'chrome-extension',
      title: 'Extension Chrome',
      description: 'Importez en naviguant sur vos sites préférés',
      icon: Chrome,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-500/10',
      iconColor: 'text-indigo-500',
      link: '/extensions',
      external: true
    }
  ]

  // Plateformes supportées
  const supportedPlatforms = [
    { name: 'AliExpress', logo: '🛒', count: '500M+' },
    { name: 'Amazon', logo: '📦', count: '350M+' },
    { name: 'Shopify', logo: '🛍️', count: 'Illimité' },
    { name: 'Temu', logo: '🎯', count: '100M+' },
    { name: 'CJ Dropshipping', logo: '🚚', count: '400K+' },
    { name: 'Banggood', logo: '📱', count: '1M+' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Section - Style AutoDS */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                <Sparkles className="w-3 h-3 mr-1" />
                AutoDS Style
              </Badge>
              <Badge variant="outline">v2.0</Badge>
            </div>
            <h1 className="text-4xl font-bold mb-3">Importez vos produits</h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
              Importez des produits depuis AliExpress, Amazon, Shopify et plus en quelques secondes. 
              Automatisez votre dropshipping avec notre technologie d'import avancée.
            </p>

            {/* Quick URL Import - Style AutoDS */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Collez l'URL du produit ici (AliExpress, Amazon, Shopify...)"
                  className="pl-10 h-12 text-base"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickImport()}
                />
              </div>
              <Button 
                size="lg" 
                className="h-12 px-6 bg-primary hover:bg-primary/90"
                onClick={handleQuickImport}
              >
                <Rocket className="w-5 h-5 mr-2" />
                Importer
              </Button>
            </div>

            {/* Supported Platforms */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">Plateformes supportées:</span>
              <div className="flex flex-wrap gap-2">
                {supportedPlatforms.map((platform) => (
                  <Badge 
                    key={platform.name} 
                    variant="outline" 
                    className="bg-background/50 backdrop-blur"
                  >
                    <span className="mr-1">{platform.logo}</span>
                    {platform.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Style AutoDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Imports</p>
                  <p className="text-3xl font-bold">{stats.totalMethods}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Package className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Réussis</p>
                  <p className="text-3xl font-bold text-green-600">{stats.successfulJobs}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En attente</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.pendingJobs}</p>
                </div>
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-red-500/10 to-red-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Échoués</p>
                  <p className="text-3xl font-bold text-red-600">{stats.failedJobs}</p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid grid-cols-3 w-auto">
              <TabsTrigger value="overview" className="px-6">
                <Box className="w-4 h-4 mr-2" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="methods" className="px-6">
                <Layers className="w-4 h-4 mr-2" />
                Méthodes
              </TabsTrigger>
              <TabsTrigger value="history" className="px-6">
                <History className="w-4 h-4 mr-2" />
                Historique
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/import/history')}>
                <History className="w-4 h-4 mr-2" />
                Tout l'historique
              </Button>
              <Button size="sm" onClick={() => navigate('/import/url')}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel import
              </Button>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Import Methods Grid */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Méthodes d'import</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {importMethods_ui.map((method) => (
                  <Link key={method.id} to={method.link}>
                    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer group border-2 hover:border-primary/50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn("p-3 rounded-xl", method.bgColor)}>
                            <method.icon className={cn("w-6 h-6", method.iconColor)} />
                          </div>
                          {method.badge && (
                            <Badge className={cn("text-white text-xs", method.badgeColor)}>
                              {method.badge}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {method.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {method.description}
                        </p>
                        <div className="flex items-center text-sm text-primary font-medium">
                          Commencer
                          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Imports */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Imports récents</CardTitle>
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
                        <Skeleton className="w-10 h-10 rounded-lg" />
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
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Aucun import récent</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Commencez par importer votre premier produit
                    </p>
                    <Button onClick={() => navigate('/import/url')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Importer un produit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentImports.map((imp) => (
                      <div
                        key={imp.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            imp.status === 'completed' ? 'bg-green-500/10' :
                            imp.status === 'processing' ? 'bg-blue-500/10' :
                            imp.status === 'failed' ? 'bg-red-500/10' : 'bg-amber-500/10'
                          )}>
                            {getStatusIcon(imp.status)}
                          </div>
                          <div>
                            <p className="font-medium">
                              {imp.source_type || 'Import sans nom'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(imp.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{imp.success_rows || 0} produits</p>
                            <p className="text-xs text-muted-foreground">
                              {imp.error_rows > 0 && `${imp.error_rows} erreurs`}
                            </p>
                          </div>
                          {getStatusBadge(imp.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/import/history?id=${imp.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Methods Tab */}
          <TabsContent value="methods" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Import par URL */}
              <Card className="border-2 border-dashed border-primary/30 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl">
                      <LinkIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Import par URL</CardTitle>
                      <CardDescription>La méthode la plus rapide</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Import 1-clic depuis n'importe quelle URL</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Extraction automatique des données produit</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Support multi-plateformes</span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => navigate('/import/url')}>
                    <Rocket className="w-4 h-4 mr-2" />
                    Importer par URL
                  </Button>
                </CardContent>
              </Card>

              {/* Import en masse */}
              <Card className="border-2 hover:border-purple-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-purple-500/10 rounded-2xl">
                      <Layers className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle>Import en Masse</CardTitle>
                      <CardDescription>Pour les pros du dropshipping</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Importez des centaines de produits</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Mapping intelligent des colonnes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Optimisation IA automatique</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/import/advanced')}>
                    <ListPlus className="w-4 h-4 mr-2" />
                    Import avancé
                  </Button>
                </CardContent>
              </Card>

              {/* CSV/Excel */}
              <Card className="hover:border-green-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-green-500/10 rounded-2xl">
                      <FileSpreadsheet className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <CardTitle>CSV / Excel</CardTitle>
                      <CardDescription>Importez vos fichiers</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Support CSV, XLS, XLSX</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Drag & Drop intuitif</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Validation automatique</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/import/quick')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importer un fichier
                  </Button>
                </CardContent>
              </Card>

              {/* Extension Chrome */}
              <Card className="hover:border-indigo-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-500/10 rounded-2xl">
                      <Chrome className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                      <CardTitle>Extension Chrome</CardTitle>
                      <CardDescription>Importez en naviguant</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Import 1-clic depuis le navigateur</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Fonctionne sur tous les sites</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Synchronisation automatique</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/extensions')}>
                    <Download className="w-4 h-4 mr-2" />
                    Installer l'extension
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {/* Search & Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans l'historique..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
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
            ) : importMethods.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <History className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Aucun historique</h3>
                  <p className="text-muted-foreground mb-6">
                    Votre historique d'import apparaîtra ici
                  </p>
                  <Button onClick={() => navigate('/import/url')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Commencer un import
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {importMethods
                  .filter(imp => 
                    !searchQuery || 
                    imp.source_type?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((imp) => (
                    <Card key={imp.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center",
                              imp.status === 'completed' ? 'bg-green-500/10' :
                              imp.status === 'processing' ? 'bg-blue-500/10' :
                              imp.status === 'failed' ? 'bg-red-500/10' : 'bg-amber-500/10'
                            )}>
                              {getStatusIcon(imp.status)}
                            </div>
                            <div>
                              <p className="font-semibold">{imp.source_type || 'Import'}</p>
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
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Relancer
                                </DropdownMenuItem>
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
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
