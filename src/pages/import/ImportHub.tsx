/**
 * Hub Import - Refonte UX Complète v2.0
 * - Quick Import en position premium (en haut)
 * - Mode Basique/Expert
 * - Calculateur de marges intégré
 * - Onboarding guidé
 * - Terminologie FR unifiée
 */
import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Package, FileSpreadsheet, TrendingUp, Zap, Clock, CheckCircle, XCircle, 
  Search, Plus, Globe, Chrome, Store, Rocket, ArrowRight, RefreshCw, 
  Eye, MoreVertical, Sparkles, ChevronRight, Box, Layers, Target, 
  Timer, History, Trash2, Loader2, AlertTriangle, Settings, ShoppingCart, 
  Wifi, FileCode, LayoutGrid, List, SortAsc, SortDesc, Calculator, HelpCircle,
  RotateCcw, Pause, Bolt
} from 'lucide-react';
import { useRealImportMethods } from '@/hooks/useRealImportMethods';
import { ImportLiveTracker } from '@/components/import/ImportLiveTracker';
import { ImportScheduler } from '@/components/import/ImportScheduler';
import { useChannelConnections } from '@/hooks/useChannelConnections';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useReducedMotion, getMotionProps } from '@/hooks/useReducedMotion';

// Nouveaux composants modulaires
import { QuickImportHero } from '@/components/import/quick/QuickImportHero';
import { ImportModeProvider, ImportModeToggle, useImportMode, ExpertOnly } from '@/components/import/mode/ImportModeContext';
import { ImportOnboardingModal, useImportOnboarding } from '@/components/import/onboarding/ImportOnboardingModal';
import { ImportCostAnalysis } from '@/components/import/cost/ImportCostAnalysis';

// Engine components - AutoDS-superior
import { ImportPerformancePanel, ImportChunkVisualizer, ImportDetailedLogs, ImportAIMergePanel } from '@/components/import/engine';

const AliExpressConnectorLazy = lazy(() => import('@/components/import/AliExpressConnector').then(m => ({ default: m.AliExpressConnector })));
const CJConnectorLazy = lazy(() => import('@/components/import/CJConnector').then(m => ({ default: m.CJConnector })));
const AmazonConnectorLazy = lazy(() => import('@/components/import/AmazonConnector').then(m => ({ default: m.AmazonConnector })));

// Logos des plateformes
const platformLogos: Record<string, string> = {
  shopify: '🛍️', woocommerce: '🛒', prestashop: '🏪', magento: '🧲',
  amazon: '📦', ebay: '🏷️', etsy: '🎨', google: '🔍',
  facebook: '📘', tiktok: '🎵', cdiscount: '🔴', fnac: '📀', default: '🌐'
};

// Méthodes d'import - Terminologie FR unifiée
const importMethodsConfig = [
  {
    id: 'autods-style',
    title: 'Import Rapide',
    description: 'Import unitaire ou en masse avec URL. La méthode la plus rapide.',
    icon: Bolt,
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
    borderColor: 'border-orange-500/20 hover:border-orange-500/50',
    link: '/import/autods',
    badge: '⭐ Recommandé',
    badgeColor: 'bg-gradient-to-r from-orange-500 to-red-500',
    features: ['Import par URL', 'Import par image', 'File d\'attente intelligente'],
    avgTime: '~30 sec',
    mode: 'basic' as const,
  },
  {
    id: 'bulk-urls',
    title: 'Import en Masse',
    description: 'Importez des centaines de produits simultanément avec file d\'attente.',
    icon: Layers,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-500/20 hover:border-purple-500/50',
    link: '/import/bulk',
    badge: 'Pro',
    badgeColor: 'bg-purple-500',
    features: ['Jusqu\'à 500 URLs', 'File d\'attente intelligente', 'Rapport détaillé'],
    avgTime: '~5 min',
    mode: 'basic' as const,
  },
  {
    id: 'csv-excel',
    title: 'CSV / Excel',
    description: 'Importez vos catalogues depuis des fichiers avec mapping intelligent.',
    icon: FileSpreadsheet,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-500',
    borderColor: 'border-green-500/20 hover:border-green-500/50',
    link: '/import/quick',
    features: ['Glisser-déposer', 'Mapping automatique', 'Validation des colonnes'],
    avgTime: '~2 min',
    mode: 'basic' as const,
  },
  {
    id: 'feed-url',
    title: 'Feed URL',
    description: 'Importez depuis une URL de flux CSV, XML ou JSON (Shopify, Matterhorn, etc.)',
    icon: Globe,
    color: 'from-teal-500 to-emerald-600',
    bgColor: 'bg-teal-500/10',
    iconColor: 'text-teal-500',
    borderColor: 'border-teal-500/20 hover:border-teal-500/50',
    link: '/import/feed-url',
    badge: '🆕 Nouveau',
    badgeColor: 'bg-gradient-to-r from-teal-500 to-emerald-500',
    features: ['Auto-détection format', 'CSV Shopify', 'XML / JSON'],
    avgTime: '~1 min',
    mode: 'basic' as const,
  },
  {
    id: 'api-feed',
    title: 'Flux API / XML',
    description: 'Connectez vos fournisseurs via API REST ou flux XML automatisé.',
    icon: FileCode,
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
    borderColor: 'border-indigo-500/20 hover:border-indigo-500/50',
    link: '/import/advanced',
    badge: 'Avancé',
    badgeColor: 'bg-indigo-500',
    features: ['REST / GraphQL', 'XML / JSON', 'Webhooks'],
    avgTime: 'Variable',
    mode: 'expert' as const,
  },
  {
    id: 'chrome-extension',
    title: 'Extension Chrome',
    description: 'Importez en naviguant sur vos sites fournisseurs préférés.',
    icon: Chrome,
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
    borderColor: 'border-cyan-500/20 hover:border-cyan-500/50',
    link: '/extensions',
    external: true,
    features: ['Import en 1 clic', 'Tous les sites supportés', 'Synchronisation temps réel'],
    avgTime: '~5 sec',
    mode: 'basic' as const,
  },
  {
    id: 'advanced-engine',
    title: 'Moteur Avancé',
    description: 'Découvrez des produits gagnants avec analyse IA et veille concurrentielle.',
    icon: Target,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-500/10',
    iconColor: 'text-pink-500',
    borderColor: 'border-pink-500/20 hover:border-pink-500/50',
    link: '/suppliers/engine',
    badge: 'IA',
    badgeColor: 'bg-gradient-to-r from-pink-500 to-rose-500',
    features: ['Analyse IA', 'Produits gagnants', 'Veille prix'],
    avgTime: 'Temps réel',
    mode: 'expert' as const,
  }
];

// Plateformes supportées
const supportedPlatforms = [
  { name: 'Shopify', logo: '/logos/shopify.svg', products: 'Illimité', path: '/import/shopify' },
  { name: 'Amazon', logo: '/logos/amazon-logo.svg', products: '350M+', path: '/import/amazon' },
  { name: 'AliExpress', logo: '/logos/aliexpress-logo.svg', products: '500M+', path: '/import/aliexpress' },
  { name: 'eBay', logo: '/logos/ebay-icon.svg', products: '1.9B+', path: '/import/ebay' },
  { name: 'Etsy', logo: '/logos/etsy.svg', products: '100M+', path: '/import/etsy' },
  { name: 'CJ Dropshipping', logo: '/logos/cj-logo.svg', products: '400K+', path: '/import/cj-dropshipping' },
  { name: 'Temu', logo: '/logos/temu-logo.svg', products: '100M+', path: '/import/temu' },
  { name: 'Cdiscount', logo: '/logos/cdiscount-icon.svg', products: '50M+', path: '/import/cdiscount' },
];

// Contenu principal avec les hooks de mode
function ImportHubContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const { mode, isExpert } = useImportMode();
  const { showOnboarding, setShowOnboarding, resetOnboarding } = useImportOnboarding();
  
  const { importMethods, stats, isLoading, deleteMethod, executeImport } = useRealImportMethods();
  const { connections, stats: channelStats, isLoading: isLoadingChannels, syncMutation } = useChannelConnections();

  // State
  const [activeTab, setActiveTab] = useState('apercu');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Motion props
  const fadeInUp = getMotionProps(prefersReducedMotion, {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  });

  // Computed values
  const connectedChannels = useMemo(() => 
    connections.filter(c => c.connection_status === 'connected'), [connections]);
  const storeConnections = useMemo(() => 
    connectedChannels.filter(c => ['shopify', 'woocommerce', 'prestashop', 'magento', 'wix', 'bigcommerce'].includes(c.platform_type?.toLowerCase())), [connectedChannels]);
  const marketplaceConnections = useMemo(() => 
    connectedChannels.filter(c => ['amazon', 'ebay', 'etsy', 'google', 'facebook', 'tiktok', 'cdiscount', 'fnac'].includes(c.platform_type?.toLowerCase())), [connectedChannels]);
  
  const recentImports = useMemo(() => importMethods.slice(0, 5), [importMethods]);
  const activeImports = useMemo(() => importMethods.filter(imp => imp.status === 'processing'), [importMethods]);
  
  // Méthodes filtrées selon le mode
  const filteredMethods = useMemo(() => {
    if (isExpert) return importMethodsConfig;
    return importMethodsConfig.filter(m => m.mode === 'basic');
  }, [isExpert]);

  const filteredImports = useMemo(() => {
    let filtered = [...importMethods];
    if (searchQuery) {
      filtered = filtered.filter(imp => 
        imp.source_type?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        imp.method_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(imp => imp.status === statusFilter);
    }
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  }, [importMethods, searchQuery, statusFilter, sortOrder]);

  // Handlers
  const handleRetryImport = useCallback(async (id: string) => {
    try {
      const importToRetry = importMethods.find(imp => imp.id === id);
      if (!importToRetry) throw new Error('Import non trouvé');
      const sourceUrl = importToRetry.configuration?.url || importToRetry.configuration?.feed_url || importToRetry.configuration?.source_url;
      if (!sourceUrl) {
        toast({ title: "Impossible de relancer", description: "Aucune URL source trouvée pour cet import. Relancez manuellement.", variant: "destructive" });
        return;
      }
      await executeImport({ source_type: importToRetry.source_type, source_url: sourceUrl });
      toast({ title: "Import relancé", description: "L'import est en cours de traitement" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de relancer l'import", variant: "destructive" });
    }
  }, [executeImport, importMethods, toast]);

  const handleCancelImport = useCallback(async (id: string) => {
    try {
      await deleteMethod(id);
      toast({ title: "Import annulé", description: "L'import a été annulé avec succès" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'annuler l'import", variant: "destructive" });
    }
  }, [deleteMethod, toast]);

  const handleSyncChannel = useCallback((connectionId: string) => {
    syncMutation.mutate([connectionId]);
  }, [syncMutation]);

  // Status helpers
  const getStatusConfig = useCallback((status: string) => {
    const configs: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
      completed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Terminé' },
      processing: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'En cours' },
      failed: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Échoué' },
      pending: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'En attente' },
      partial: { icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'Partiel' }
    };
    return configs[status] || configs.pending;
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const config = getStatusConfig(status);
    return (
      <Badge variant="secondary" className={cn("flex items-center gap-1", config.bgColor, config.color)}>
        <config.icon className={cn("w-3 h-3", status === 'processing' && !prefersReducedMotion && 'animate-spin')} />
        {config.label}
      </Badge>
    );
  }, [getStatusConfig, prefersReducedMotion]);

  return (
    <>
      {/* Modal d'onboarding */}
      <ImportOnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      <ChannablePageWrapper
        title="Importez vos produits"
        description="Depuis AliExpress, Amazon, Shopify et plus — Notre IA optimise automatiquement vos fiches"
        heroImage="import"
        badge={{ label: 'Import', icon: Package }}
        actions={
          <div className="flex items-center gap-2">
            <ImportModeToggle />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={resetOnboarding} title="Revoir l'introduction">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        }
      >
        {/* LIVE TRACKER - Progression temps réel */}
        <ImportLiveTracker />

        {/* PLANIFICATEUR - Imports récurrents */}
        <ImportScheduler />

        {/* HERO: Quick Import en position premium */}
        <QuickImportHero className="mb-6" />

        {/* Barre de statut des canaux connectés */}
        <motion.div {...fadeInUp}>
          <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Wifi className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{channelStats.totalConnected} canaux connectés</p>
                      <p className="text-xs text-muted-foreground">
                        {channelStats.storesCount} boutiques • {channelStats.marketplacesCount} marketplaces
                      </p>
                    </div>
                  </div>
                  
                  <Separator orientation="vertical" className="h-10 hidden lg:block" />
                  
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Package className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{channelStats.totalProducts.toLocaleString()} produits</p>
                      <p className="text-xs text-muted-foreground">dans votre catalogue</p>
                    </div>
                  </div>
                  
                  <Separator orientation="vertical" className="h-10 hidden lg:block" />
                  
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{channelStats.totalOrders.toLocaleString()} commandes</p>
                      <p className="text-xs text-muted-foreground">synchronisées</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <TooltipProvider>
                    {connectedChannels.slice(0, 5).map(channel => (
                      <Tooltip key={channel.id}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background border rounded-full text-sm">
                            <span>{platformLogos[channel.platform_type?.toLowerCase()] || platformLogos.default}</span>
                            <span className="font-medium truncate max-w-[80px]">{channel.platform_name}</span>
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{channel.shop_domain || channel.platform_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Dernière sync: {channel.last_sync_at ? formatDistanceToNow(new Date(channel.last_sync_at), { addSuffix: true, locale: fr }) : 'Jamais'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                  
                  {connectedChannels.length > 5 && (
                    <Badge variant="outline">+{connectedChannels.length - 5}</Badge>
                  )}
                  
                  {connectedChannels.length === 0 && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/stores')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Connecter une boutique
                    </Button>
                  )}
                  
                  {connectedChannels.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/stores')}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Raccourcis rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Import URL', icon: Bolt, link: '/import/autods', color: 'orange' },
            { label: 'CSV / Excel', icon: FileSpreadsheet, link: '/import/quick', color: 'green' },
            { label: 'Import en Masse', icon: Layers, link: '/import/bulk', color: 'purple' },
            { label: 'Historique', icon: History, link: '/import/history', color: 'blue' },
          ].map((action, index) => (
            <motion.div key={action.label} {...getMotionProps(prefersReducedMotion, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.05 } })}>
              <Link to={action.link}>
                <Card className={cn("cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/30", `hover:bg-${action.color}-500/5`)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", `bg-${action.color}-500/10`)}>
                      <action.icon className={cn("w-5 h-5", `text-${action.color}-500`)} />
                    </div>
                    <span className="font-medium text-sm">{action.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Performance KPIs — AutoDS-superior */}
        <ImportPerformancePanel stats={stats} activeImports={activeImports} className="mb-6" />

        {/* Chunk Pipeline — Visualisation parallèle */}
        {activeImports.length > 0 && (
          <ImportChunkVisualizer activeImports={activeImports} className="mb-6" />
        )}

        {/* Imports actifs */}
        <AnimatePresence>
          {activeImports.length > 0 && (
            <motion.div {...getMotionProps(prefersReducedMotion, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 } })} className="mb-6">
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Loader2 className={cn("w-5 h-5 text-blue-500", !prefersReducedMotion && "animate-spin")} />
                      </div>
                      <div>
                        <p className="font-medium">{activeImports.length} import{activeImports.length > 1 ? 's' : ''} en cours</p>
                        <p className="text-sm text-muted-foreground">Traitement de vos produits...</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('historique')}>
                      Voir détails
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  {activeImports[0] && activeImports[0].total_rows > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{activeImports[0].source_type}</span>
                        <span>{activeImports[0].processed_rows} / {activeImports[0].total_rows} produits</span>
                      </div>
                      <Progress value={activeImports[0].processed_rows / activeImports[0].total_rows * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="apercu" className="data-[state=active]:bg-background">
                <Box className="w-4 h-4 mr-2" />
                Aperçu
              </TabsTrigger>
              <TabsTrigger value="methodes" className="data-[state=active]:bg-background">
                <Layers className="w-4 h-4 mr-2" />
                Méthodes
              </TabsTrigger>
              <ExpertOnly>
                <TabsTrigger value="marges" className="data-[state=active]:bg-background">
                  <Calculator className="w-4 h-4 mr-2" />
                  Marges
                </TabsTrigger>
              </ExpertOnly>
              <TabsTrigger value="canaux" className="data-[state=active]:bg-background">
                <Store className="w-4 h-4 mr-2" />
                Canaux
                {connectedChannels.length > 0 && <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">{connectedChannels.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="aliexpress" className="data-[state=active]:bg-background">
                <Rocket className="w-4 h-4 mr-2" />
                AliExpress API
              </TabsTrigger>
              <TabsTrigger value="cj" className="data-[state=active]:bg-background">
                <Package className="w-4 h-4 mr-2" />
                CJ Dropshipping
              </TabsTrigger>
              <TabsTrigger value="amazon" className="data-[state=active]:bg-background">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Amazon API
              </TabsTrigger>
              <TabsTrigger value="historique" className="data-[state=active]:bg-background">
                <History className="w-4 h-4 mr-2" />
                Historique
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-primary" onClick={() => navigate('/import/autods')}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel import
              </Button>
            </div>
          </div>

          {/* Onglet Aperçu */}
          <TabsContent value="apercu" className="space-y-6 mt-0">
            {/* Grille des méthodes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Méthodes d'import</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('methodes')}>
                  Voir tout <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredMethods.slice(0, 4).map((method, index) => (
                  <motion.div key={method.id} {...getMotionProps(prefersReducedMotion, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.1 } })}>
                    <Link to={method.link}>
                      <Card className={cn("h-full transition-all duration-300 hover:shadow-lg cursor-pointer group border-2", method.borderColor)}>
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

            {/* Imports récents */}
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
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('historique')}>
                    Voir tout <ArrowRight className="w-4 h-4 ml-2" />
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
                    <Button onClick={() => navigate('/import/autods')}>
                      <Rocket className="w-4 h-4 mr-2" />
                      Importer un produit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentImports.map((imp, index) => {
                      const statusConfig = getStatusConfig(imp.status);
                      return (
                        <motion.div
                          key={imp.id}
                          {...getMotionProps(prefersReducedMotion, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.05 } })}
                          className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", statusConfig.bgColor)}>
                              <statusConfig.icon className={cn("w-5 h-5", statusConfig.color, imp.status === 'processing' && !prefersReducedMotion && 'animate-spin')} />
                            </div>
                            <div>
                              <p className="font-medium">{imp.source_type || imp.method_name || 'Import'}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(imp.created_at), { addSuffix: true, locale: fr })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">{imp.success_rows || 0} produits</p>
                              {imp.error_rows > 0 && <p className="text-xs text-red-500">{imp.error_rows} erreurs</p>}
                            </div>
                            
                            {imp.status === 'processing' && imp.total_rows > 0 && (
                              <div className="w-24">
                                <Progress value={imp.processed_rows / imp.total_rows * 100} className="h-1.5" />
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
                                <DropdownMenuItem onClick={() => { setActiveTab('historique'); setSearchQuery(imp.source_type || ''); }}>
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
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteMethod(imp.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plateformes supportées */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  Plateformes supportées
                </CardTitle>
                <CardDescription>Importez des produits depuis ces marketplaces</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {supportedPlatforms.map(platform => (
                    <div
                      key={platform.name}
                      onClick={() => navigate(platform.path)}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <img
                        src={platform.logo}
                        alt={platform.name}
                        className="w-8 h-8 object-contain flex-shrink-0 group-hover:scale-110 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">{platform.products}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Merge Suggestions */}
            <ImportAIMergePanel />
          </TabsContent>

          {/* Onglet Méthodes */}
          <TabsContent value="methodes" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMethods.map((method, index) => (
                <motion.div key={method.id} {...getMotionProps(prefersReducedMotion, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.05 } })}>
                  <Link to={method.link}>
                    <Card className={cn("h-full transition-all duration-300 hover:shadow-lg cursor-pointer group border-2", method.borderColor)}>
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
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {method.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {method.description}
                        </p>
                        
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

          {/* Onglet Marges (Expert only) */}
          <TabsContent value="marges" className="space-y-6 mt-0">
            <ImportCostAnalysis />
          </TabsContent>

          {/* Onglet Canaux */}
          <TabsContent value="canaux" className="space-y-6 mt-0">
            {/* Boutiques */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Boutiques connectées
                  </h2>
                  <p className="text-sm text-muted-foreground">Synchronisez vos produits avec vos boutiques e-commerce</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/stores')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une boutique
                </Button>
              </div>
              
              {storeConnections.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Store className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Aucune boutique connectée</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                      Connectez votre boutique Shopify, WooCommerce ou PrestaShop pour synchroniser vos produits
                    </p>
                    <Button onClick={() => navigate('/stores')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Connecter une boutique
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeConnections.map((store) => (
                    <Card key={store.id} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">
                              {platformLogos[store.platform_type?.toLowerCase()] || platformLogos.default}
                            </div>
                            <div>
                              <p className="font-semibold">{store.platform_name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {store.shop_domain || 'Non configuré'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                            <Wifi className="w-3 h-3 mr-1" />
                            Connecté
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold">{store.products_synced}</p>
                            <p className="text-xs text-muted-foreground">Produits</p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold">{store.orders_synced}</p>
                            <p className="text-xs text-muted-foreground">Commandes</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Sync: {store.last_sync_at ? formatDistanceToNow(new Date(store.last_sync_at), { addSuffix: true, locale: fr }) : 'Jamais'}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => handleSyncChannel(store.id)} disabled={syncMutation.isPending}>
                            <RefreshCw className={cn("w-4 h-4", syncMutation.isPending && "animate-spin")} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Marketplaces */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Marketplaces connectées
                  </h2>
                  <p className="text-sm text-muted-foreground">Publiez vos produits sur les principales marketplaces</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/stores?tab=marketplaces')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une marketplace
                </Button>
              </div>
              
              {marketplaceConnections.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Aucune marketplace connectée</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                      Connectez Amazon, eBay, Etsy ou d'autres marketplaces pour élargir votre audience
                    </p>
                    <Button onClick={() => navigate('/stores?tab=marketplaces')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Connecter une marketplace
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketplaceConnections.map((marketplace) => (
                    <Card key={marketplace.id} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">
                              {platformLogos[marketplace.platform_type?.toLowerCase()] || platformLogos.default}
                            </div>
                            <div>
                              <p className="font-semibold">{marketplace.platform_name}</p>
                              <p className="text-xs text-muted-foreground">Marketplace</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                            <Wifi className="w-3 h-3 mr-1" />
                            Connecté
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold">{marketplace.products_synced}</p>
                            <p className="text-xs text-muted-foreground">Produits</p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold">{marketplace.orders_synced}</p>
                            <p className="text-xs text-muted-foreground">Commandes</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Sync: {marketplace.last_sync_at ? formatDistanceToNow(new Date(marketplace.last_sync_at), { addSuffix: true, locale: fr }) : 'Jamais'}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => handleSyncChannel(marketplace.id)} disabled={syncMutation.isPending}>
                            <RefreshCw className={cn("w-4 h-4", syncMutation.isPending && "animate-spin")} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Onglet AliExpress API */}
          <TabsContent value="aliexpress" className="space-y-6 mt-0">
            <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}>
              <AliExpressConnectorLazy />
            </Suspense>
          </TabsContent>

          {/* Onglet CJ Dropshipping */}
          <TabsContent value="cj" className="space-y-6 mt-0">
            <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}>
              <CJConnectorLazy />
            </Suspense>
          </TabsContent>

          {/* Onglet Amazon */}
          <TabsContent value="amazon" className="space-y-6 mt-0">
            <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}>
              <AmazonConnectorLazy />
            </Suspense>
          </TabsContent>

          {/* Onglet Historique */}
          <TabsContent value="historique" className="space-y-6 mt-0">
            {/* Logs enrichis */}
            <ImportDetailedLogs imports={importMethods} />
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Historique des imports</CardTitle>
                    <CardDescription>Gérez et suivez tous vos imports</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-48"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="completed">Terminés</SelectItem>
                        <SelectItem value="processing">En cours</SelectItem>
                        <SelectItem value="failed">Échoués</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    >
                      {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredImports.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Aucun import trouvé</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Essayez de modifier vos filtres'
                        : 'Commencez par importer des produits'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredImports.map((imp) => {
                      const statusConfig = getStatusConfig(imp.status);
                      return (
                        <div
                          key={imp.id}
                          className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", statusConfig.bgColor)}>
                              <statusConfig.icon className={cn("w-5 h-5", statusConfig.color, imp.status === 'processing' && !prefersReducedMotion && 'animate-spin')} />
                            </div>
                            <div>
                              <p className="font-medium">{imp.source_type || imp.method_name || 'Import'}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(imp.created_at), { addSuffix: true, locale: fr })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">{imp.success_rows || 0} produits</p>
                              {imp.error_rows > 0 && <p className="text-xs text-red-500">{imp.error_rows} erreurs</p>}
                            </div>
                            
                            {getStatusBadge(imp.status)}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
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
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteMethod(imp.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}

// Composant principal avec Provider
export default function ImportHub() {
  return (
    <ImportModeProvider>
      <ImportHubContent />
    </ImportModeProvider>
  );
}
