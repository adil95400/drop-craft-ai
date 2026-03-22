/**
 * Hub Import - Refonte UX v3.0
 * Fixes: static Tailwind colors, 6 tabs, division guards, lazy rendering, extracted components
 */
import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Package, FileSpreadsheet, TrendingUp, Zap, Clock, CheckCircle, XCircle, 
  Plus, Globe, Chrome, Store, Rocket, ArrowRight, RefreshCw, 
  Eye, MoreVertical, Sparkles, ChevronRight, Box, Layers, Target, 
  Timer, History, Trash2, Loader2, AlertTriangle, Settings, ShoppingCart, 
  Wifi, FileCode, Calculator, HelpCircle,
  RotateCcw, Pause, Bolt, Wrench
} from 'lucide-react';
import { useRealImportMethods } from '@/hooks/useRealImportMethods';
import { ImportLiveTracker } from '@/components/import/ImportLiveTracker';
import { ImportScheduler } from '@/components/import/ImportScheduler';
import { useChannelConnections } from '@/hooks/useChannelConnections';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useReducedMotion, getMotionProps } from '@/hooks/useReducedMotion';

import { QuickImportHero } from '@/components/import/quick/QuickImportHero';
import { ImportModeProvider, ImportModeToggle, useImportMode, ExpertOnly } from '@/components/import/mode/ImportModeContext';
import { ImportOnboardingModal, useImportOnboarding } from '@/components/import/onboarding/ImportOnboardingModal';
import { ImportCostAnalysis } from '@/components/import/cost/ImportCostAnalysis';

import {
  ImportPerformancePanel, ImportChunkVisualizer, ImportAIMergePanel,
  ImportCSVPreview, ImportRulesEngine, ImportStatsChart
} from '@/components/import/engine';

// Extracted tab components
import { ImportChannelsTab } from '@/components/import/tabs/ImportChannelsTab';
import { ImportHistoryTab } from '@/components/import/tabs/ImportHistoryTab';

// Static color map — prevents dynamic Tailwind class compilation issues
const quickActionColors: Record<string, { bg: string; text: string; hoverBg: string }> = {
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', hoverBg: 'hover:bg-orange-500/5' },
  green:  { bg: 'bg-green-500/10',  text: 'text-green-500',  hoverBg: 'hover:bg-green-500/5' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', hoverBg: 'hover:bg-purple-500/5' },
  blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-500',   hoverBg: 'hover:bg-blue-500/5' },
};

const platformLogos: Record<string, string> = {
  shopify: '🛍️', woocommerce: '🛒', prestashop: '🏪', magento: '🧲',
  amazon: '📦', ebay: '🏷️', etsy: '🎨', google: '🔍',
  facebook: '📘', tiktok: '🎵', cdiscount: '🔴', fnac: '📀', default: '🌐'
};

const importMethodsConfig = [
  {
    id: 'autods-style', title: 'Import Rapide',
    description: 'Import unitaire ou en masse avec URL. La méthode la plus rapide.',
    icon: Bolt, bgColor: 'bg-warning/10', iconColor: 'text-warning',
    borderColor: 'border-orange-500/20 hover:border-orange-500/50',
    link: '/import/autods', badge: '⭐ Recommandé', badgeColor: 'bg-gradient-to-r from-orange-500 to-red-500',
    features: ['Import par URL', 'Import par image', 'File d\'attente intelligente'], avgTime: '~30 sec', mode: 'basic' as const,
  },
  {
    id: 'bulk-urls', title: 'Import en Masse',
    description: 'Importez des centaines de produits simultanément avec file d\'attente.',
    icon: Layers, bgColor: 'bg-purple-500/10', iconColor: 'text-purple-500',
    borderColor: 'border-purple-500/20 hover:border-purple-500/50',
    link: '/import/bulk', badge: 'Pro', badgeColor: 'bg-purple-500',
    features: ['Jusqu\'à 500 URLs', 'File d\'attente intelligente', 'Rapport détaillé'], avgTime: '~5 min', mode: 'basic' as const,
  },
  {
    id: 'csv-excel', title: 'CSV / Excel',
    description: 'Importez vos catalogues depuis des fichiers avec mapping intelligent.',
    icon: FileSpreadsheet, bgColor: 'bg-success/10', iconColor: 'text-success',
    borderColor: 'border-success/20 hover:border-success/50',
    link: '/import/quick', features: ['Glisser-déposer', 'Mapping automatique', 'Validation des colonnes'], avgTime: '~2 min', mode: 'basic' as const,
  },
  {
    id: 'feed-url', title: 'Feed URL',
    description: 'Importez depuis une URL de flux CSV, XML ou JSON (Shopify, Matterhorn, etc.)',
    icon: Globe, bgColor: 'bg-teal-500/10', iconColor: 'text-teal-500',
    borderColor: 'border-teal-500/20 hover:border-teal-500/50',
    link: '/import/feed-url', badge: '🆕 Nouveau', badgeColor: 'bg-gradient-to-r from-teal-500 to-emerald-500',
    features: ['Auto-détection format', 'CSV Shopify', 'XML / JSON'], avgTime: '~1 min', mode: 'basic' as const,
  },
  {
    id: 'api-feed', title: 'Flux API / XML',
    description: 'Connectez vos fournisseurs via API REST ou flux XML automatisé.',
    icon: FileCode, bgColor: 'bg-indigo-500/10', iconColor: 'text-indigo-500',
    borderColor: 'border-indigo-500/20 hover:border-indigo-500/50',
    link: '/import/advanced', badge: 'Avancé', badgeColor: 'bg-indigo-500',
    features: ['REST / GraphQL', 'XML / JSON', 'Webhooks'], avgTime: 'Variable', mode: 'expert' as const,
  },
  {
    id: 'chrome-extension', title: 'Extension Chrome',
    description: 'Importez en naviguant sur vos sites fournisseurs préférés.',
    icon: Chrome, bgColor: 'bg-cyan-500/10', iconColor: 'text-cyan-500',
    borderColor: 'border-cyan-500/20 hover:border-cyan-500/50',
    link: '/extensions', features: ['Import en 1 clic', 'Tous les sites supportés', 'Synchronisation temps réel'], avgTime: '~5 sec', mode: 'basic' as const,
  },
  {
    id: 'advanced-engine', title: 'Moteur Avancé',
    description: 'Découvrez des produits gagnants avec analyse IA et veille concurrentielle.',
    icon: Target, bgColor: 'bg-pink-500/10', iconColor: 'text-pink-500',
    borderColor: 'border-pink-500/20 hover:border-pink-500/50',
    link: '/suppliers/engine', badge: 'IA', badgeColor: 'bg-gradient-to-r from-pink-500 to-rose-500',
    features: ['Analyse IA', 'Produits gagnants', 'Veille prix'], avgTime: 'Temps réel', mode: 'expert' as const,
  }
];

const supportedPlatforms = [
  { name: 'Shopify', products: 'Illimité', path: '/import/shopify' },
  { name: 'Amazon', products: '350M+', path: '/import/amazon' },
  { name: 'AliExpress', products: '500M+', path: '/import/aliexpress' },
  { name: 'eBay', products: '1.9B+', path: '/import/ebay' },
  { name: 'Etsy', products: '100M+', path: '/import/etsy' },
  { name: 'CJ Dropshipping', products: '400K+', path: '/import/cj-dropshipping' },
  { name: 'Temu', products: '100M+', path: '/import/temu' },
  { name: 'Cdiscount', products: '50M+', path: '/import/cdiscount' },
];

function safeProgress(processed: number, total: number): number {
  return total > 0 ? Math.round((processed / total) * 100) : 0;
}

function ImportHubContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const { isExpert } = useImportMode();
  const { showOnboarding, setShowOnboarding, resetOnboarding } = useImportOnboarding();

  const { importMethods, stats, isLoading, deleteMethod, executeImport } = useRealImportMethods();
  const { connections, stats: channelStats, isLoading: isLoadingChannels, syncMutation } = useChannelConnections();

  const [activeTab, setActiveTab] = useState('apercu');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const fadeInUp = getMotionProps(prefersReducedMotion, {
    initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }
  });

  const connectedChannels = useMemo(() => connections.filter(c => c.connection_status === 'connected'), [connections]);
  const storeConnections = useMemo(() => connectedChannels.filter(c => ['shopify', 'woocommerce', 'prestashop', 'magento', 'wix', 'bigcommerce'].includes(c.platform_type?.toLowerCase())), [connectedChannels]);
  const marketplaceConnections = useMemo(() => connectedChannels.filter(c => ['amazon', 'ebay', 'etsy', 'google', 'facebook', 'tiktok', 'cdiscount', 'fnac'].includes(c.platform_type?.toLowerCase())), [connectedChannels]);

  const recentImports = useMemo(() => importMethods.slice(0, 5), [importMethods]);
  const activeImports = useMemo(() => importMethods.filter(imp => imp.status === 'processing'), [importMethods]);

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

  const handleRetryImport = useCallback(async (id: string) => {
    try {
      const importToRetry = importMethods.find(imp => imp.id === id);
      if (!importToRetry) throw new Error('Import non trouvé');
      const sourceUrl = importToRetry.configuration?.url || importToRetry.configuration?.feed_url || importToRetry.configuration?.source_url;
      if (!sourceUrl) {
        toast({ title: "Impossible de relancer", description: "Aucune URL source trouvée.", variant: "destructive" });
        return;
      }
      await executeImport({ source_type: importToRetry.source_type, source_url: sourceUrl });
      toast({ title: "Import relancé", description: "L'import est en cours de traitement" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de relancer l'import", variant: "destructive" });
    }
  }, [executeImport, importMethods, toast]);

  const handleCancelImport = useCallback(async (id: string) => {
    try {
      await deleteMethod(id);
      toast({ title: "Import annulé", description: "L'import a été annulé avec succès" });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'annuler l'import", variant: "destructive" });
    }
  }, [deleteMethod, toast]);

  const handleSyncChannel = useCallback((connectionId: string) => {
    syncMutation.mutate([connectionId]);
  }, [syncMutation]);

  const getStatusConfig = useCallback((status: string) => {
    const configs: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
      completed: { icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10', label: 'Terminé' },
      processing: { icon: Loader2, color: 'text-info', bgColor: 'bg-info/10', label: 'En cours' },
      failed: { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Échoué' },
      pending: { icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10', label: 'En attente' },
      partial: { icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10', label: 'Partiel' }
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
      <ImportOnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} onComplete={() => setShowOnboarding(false)} />

      <ChannablePageWrapper
        title={tPages('importezVosProduits.title')}
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
        <ImportLiveTracker />
        <ImportScheduler />
        <QuickImportHero className="mb-6" />

        {/* Channel status bar */}
        <motion.div {...fadeInUp}>
          <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-success/10 rounded-lg"><Wifi className="w-4 h-4 text-success" /></div>
                    <div>
                      <p className="text-sm font-medium">{channelStats.totalConnected} canaux connectés</p>
                      <p className="text-xs text-muted-foreground">{channelStats.storesCount} boutiques • {channelStats.marketplacesCount} marketplaces</p>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-10 hidden lg:block" />
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-info/10 rounded-lg"><Package className="w-4 h-4 text-info" /></div>
                    <div>
                      <p className="text-sm font-medium">{channelStats.totalProducts.toLocaleString()} produits</p>
                      <p className="text-xs text-muted-foreground">dans votre catalogue</p>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-10 hidden lg:block" />
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg"><ShoppingCart className="w-4 h-4 text-purple-500" /></div>
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
                            <div className="w-2 h-2 rounded-full bg-success" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{channel.shop_domain || channel.platform_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Dernière sync: {channel.last_sync_at ? formatDistanceToNow(new Date(channel.last_sync_at), { addSuffix: true, locale: getDateFnsLocale() }) : 'Jamais'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                  {connectedChannels.length > 5 && <Badge variant="outline">+{connectedChannels.length - 5}</Badge>}
                  {connectedChannels.length === 0 && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/stores')}>
                      <Plus className="w-4 h-4 mr-2" />Connecter une boutique
                    </Button>
                  )}
                  {connectedChannels.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/stores')}><Settings className="w-4 h-4" /></Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions — static color classes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Import URL', icon: Bolt, link: '/import/autods', color: 'orange' },
            { label: 'CSV / Excel', icon: FileSpreadsheet, link: '/import/quick', color: 'green' },
            { label: 'Import en Masse', icon: Layers, link: '/import/bulk', color: 'purple' },
            { label: 'Historique', icon: History, link: '/import/history', color: 'blue' },
          ].map((action, index) => {
            const colors = quickActionColors[action.color] || quickActionColors.blue;
            return (
              <motion.div key={action.label} {...getMotionProps(prefersReducedMotion, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.05 } })}>
                <Link to={action.link}>
                  <Card className={cn("cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/30", colors.hoverBg)}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", colors.bg)}>
                        <action.icon className={cn("w-5 h-5", colors.text)} />
                      </div>
                      <span className="font-medium text-sm">{action.label}</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <ImportPerformancePanel stats={stats} activeImports={activeImports} className="mb-6" />
        {activeImports.length > 0 && <ImportChunkVisualizer activeImports={activeImports} className="mb-6" />}

        {/* Active imports banner */}
        <AnimatePresence>
          {activeImports.length > 0 && (
            <motion.div key="active-imports-banner" {...getMotionProps(prefersReducedMotion, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 } })} className="mb-6">
              <Card className="border-info/30 bg-info/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-info/20 rounded-lg">
                        <Loader2 className={cn("w-5 h-5 text-info", !prefersReducedMotion && "animate-spin")} />
                      </div>
                      <div>
                        <p className="font-medium">{activeImports.length} import{activeImports.length > 1 ? 's' : ''} en cours</p>
                        <p className="text-sm text-muted-foreground">Traitement de vos produits...</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('historique')}>
                      Voir détails <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  {activeImports[0] && activeImports[0].total_rows > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{activeImports[0].source_type}</span>
                        <span>{activeImports[0].processed_rows} / {activeImports[0].total_rows} produits</span>
                      </div>
                      <Progress value={safeProgress(activeImports[0].processed_rows, activeImports[0].total_rows)} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6 Tabs — reorganized from 11 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-muted/50 overflow-x-auto max-w-full flex-wrap">
              <TabsTrigger value="apercu" className="data-[state=active]:bg-background">
                <Box className="w-4 h-4 mr-2" />Aperçu
              </TabsTrigger>
              <TabsTrigger value="methodes" className="data-[state=active]:bg-background">
                <Layers className="w-4 h-4 mr-2" />Méthodes
              </TabsTrigger>
              <TabsTrigger value="canaux" className="data-[state=active]:bg-background">
                <Store className="w-4 h-4 mr-2" />Canaux
                {connectedChannels.length > 0 && <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">{connectedChannels.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="statistiques" className="data-[state=active]:bg-background">
                <TrendingUp className="w-4 h-4 mr-2" />Statistiques
              </TabsTrigger>
              <TabsTrigger value="historique" className="data-[state=active]:bg-background">
                <History className="w-4 h-4 mr-2" />Historique
              </TabsTrigger>
              <ExpertOnly>
                <TabsTrigger value="outils" className="data-[state=active]:bg-background">
                  <Wrench className="w-4 h-4 mr-2" />Outils
                </TabsTrigger>
              </ExpertOnly>
            </TabsList>

            <Button size="sm" className="bg-primary" onClick={() => navigate('/import/autods')}>
              <Plus className="w-4 h-4 mr-2" />Nouvel import
            </Button>
          </div>

          {/* === Aperçu === */}
          <TabsContent value="apercu" className="space-y-6 mt-0">
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
                            {method.badge && <Badge className={cn("text-white text-xs", method.badgeColor)}>{method.badge}</Badge>}
                          </div>
                          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{method.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{method.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center"><Timer className="w-3 h-3 mr-1" />{method.avgTime}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent imports */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><History className="w-5 h-5 text-muted-foreground" />Imports récents</CardTitle>
                    <CardDescription>Vos 5 derniers imports</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('historique')}>Voir tout <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div>
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
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">Commencez par importer votre premier produit</p>
                    <Button onClick={() => navigate('/import/autods')}><Rocket className="w-4 h-4 mr-2" />Importer un produit</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentImports.map((imp, index) => {
                      const statusConfig = getStatusConfig(imp.status);
                      return (
                        <motion.div key={imp.id} {...getMotionProps(prefersReducedMotion, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.05 } })}
                          className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", statusConfig.bgColor)}>
                              <statusConfig.icon className={cn("w-5 h-5", statusConfig.color, imp.status === 'processing' && !prefersReducedMotion && 'animate-spin')} />
                            </div>
                            <div>
                              <p className="font-medium">{imp.source_type || imp.method_name || 'Import'}</p>
                              <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(imp.created_at), { addSuffix: true, locale: getDateFnsLocale() })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">{imp.success_rows || 0} produits</p>
                              {imp.error_rows > 0 && <p className="text-xs text-destructive">{imp.error_rows} erreurs</p>}
                            </div>
                            {imp.status === 'processing' && imp.total_rows > 0 && (
                              <div className="w-24"><Progress value={safeProgress(imp.processed_rows, imp.total_rows)} className="h-1.5" /></div>
                            )}
                            {getStatusBadge(imp.status)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setActiveTab('historique'); setSearchQuery(imp.source_type || ''); }}><Eye className="w-4 h-4 mr-2" />Voir détails</DropdownMenuItem>
                                {imp.status === 'failed' && <DropdownMenuItem onClick={() => handleRetryImport(imp.id)}><RotateCcw className="w-4 h-4 mr-2" />Relancer</DropdownMenuItem>}
                                {imp.status === 'processing' && <DropdownMenuItem onClick={() => handleCancelImport(imp.id)}><Pause className="w-4 h-4 mr-2" />Annuler</DropdownMenuItem>}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteMethod(imp.id)}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>
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

            {/* Supported platforms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-muted-foreground" />Plateformes supportées</CardTitle>
                <CardDescription>Importez depuis les plus grandes plateformes e-commerce</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {supportedPlatforms.map(platform => (
                    <Link key={platform.name} to={platform.path}>
                      <div className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer group">
                        <span className="text-2xl">{platformLogos[platform.name.toLowerCase().split(' ')[0]] || '🌐'}</span>
                        <span className="font-medium text-sm group-hover:text-primary transition-colors">{platform.name}</span>
                        <span className="text-xs text-muted-foreground">{platform.products}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <ImportAIMergePanel />
          </TabsContent>

          {/* === Méthodes === */}
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
                          {method.badge && <Badge className={cn("text-white text-xs", method.badgeColor)}>{method.badge}</Badge>}
                        </div>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{method.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{method.description}</p>
                        <div className="space-y-2 mb-4">
                          {method.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Separator className="my-4" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center"><Timer className="w-4 h-4 mr-1" />{method.avgTime}</span>
                          <div className="flex items-center text-primary font-medium text-sm">
                            Commencer <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* API connectors as cards instead of tabs */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Connecteurs API directs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'AliExpress API', icon: '🛍️', desc: 'Importez directement via l\'API AliExpress', path: '/import/aliexpress' },
                  { name: 'CJ Dropshipping', icon: '📦', desc: 'Accès direct au catalogue CJ', path: '/import/cj-dropshipping' },
                  { name: 'Amazon API', icon: '🛒', desc: 'Product Advertising API Amazon', path: '/import/amazon' },
                ].map(connector => (
                  <Link key={connector.name} to={connector.path}>
                    <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                      <CardContent className="p-5 flex items-center gap-4">
                        <span className="text-3xl">{connector.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">{connector.name}</h3>
                          <p className="text-sm text-muted-foreground">{connector.desc}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* === Canaux === */}
          <TabsContent value="canaux" className="space-y-6 mt-0">
            <ImportChannelsTab
              storeConnections={storeConnections as any}
              marketplaceConnections={marketplaceConnections as any}
              onSyncChannel={handleSyncChannel}
              isSyncing={syncMutation.isPending}
            />
          </TabsContent>

          {/* === Statistiques === */}
          <TabsContent value="statistiques" className="space-y-6 mt-0">
            <ImportStatsChart imports={importMethods} />
          </TabsContent>

          {/* === Historique === */}
          <TabsContent value="historique" className="space-y-6 mt-0">
            <ImportHistoryTab
              imports={filteredImports}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortOrder={sortOrder}
              onSortOrderToggle={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              onRetry={handleRetryImport}
              onCancel={handleCancelImport}
              onDelete={deleteMethod}
              onViewDetails={(sourceType) => setSearchQuery(sourceType)}
              prefersReducedMotion={prefersReducedMotion}
            />
          </TabsContent>

          {/* === Outils (Expert) — CSV Preview + Règles + Marges === */}
          <TabsContent value="outils" className="space-y-6 mt-0">
            <Tabs defaultValue="csv-preview" className="w-full">
              <TabsList className="bg-muted/50 mb-4">
                <TabsTrigger value="csv-preview"><FileSpreadsheet className="w-4 h-4 mr-2" />CSV Preview</TabsTrigger>
                <TabsTrigger value="regles"><Settings className="w-4 h-4 mr-2" />Règles</TabsTrigger>
                <TabsTrigger value="marges"><Calculator className="w-4 h-4 mr-2" />Marges</TabsTrigger>
              </TabsList>
              <TabsContent value="csv-preview">
                <ImportCSVPreview onImport={(data) => {
                  toast({ title: `Import CSV lancé`, description: `${data.length} produits en cours de traitement` });
                }} />
              </TabsContent>
              <TabsContent value="regles"><ImportRulesEngine /></TabsContent>
              <TabsContent value="marges"><ImportCostAnalysis /></TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}

export default function ImportHub() {
  return (
    <ImportModeProvider>
      <ImportHubContent />
    </ImportModeProvider>
  );
}
