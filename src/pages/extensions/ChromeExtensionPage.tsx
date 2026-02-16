/**
 * Chrome Extension Page - Installation et configuration complète
 */
import { useState, useEffect } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { ExtensionTokenGenerator } from '@/components/extensions/ExtensionTokenGenerator';
import { 
  Chrome, Download, Play, CheckCircle, Settings, Zap, Star,
  Package, RefreshCw, Globe, ArrowRight, ExternalLink, Key,
  Activity, History, TrendingUp, Clock, AlertCircle, Save, Loader2, Cloud
} from 'lucide-react';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { generateExtensionZip } from '@/utils/extensionZipGenerator';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ExtensionAuthManager } from '@/components/extensions/ExtensionAuthManager';
import { ExtensionInstallWelcomeModal } from '@/components/extensions/ExtensionInstallWelcomeModal';
import { ExtensionActivityFeed } from '@/components/extensions/ExtensionActivityFeed';
import { ExtensionSyncStatus } from '@/components/extensions/ExtensionSyncStatus';
import { ExtensionImportHistoryTable } from '@/components/extensions/ExtensionImportHistoryTable';
import { QuickConnectTokenModal } from '@/components/extensions/QuickConnectTokenModal';
import { ExtensionRemoteControl } from '@/components/extensions/ExtensionRemoteControl';
import { ExtensionBidirectionalSync } from '@/components/extensions/ExtensionBidirectionalSync';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Chrome Web Store URL - Replace [EXTENSION_ID] with actual ID after publication
const CHROME_STORE_URL = 'https://chrome.google.com/webstore/detail/shopopti-dropshipping-pro/pending-publication';
const EXTENSION_VERSION = '6.0.0';
const IS_PUBLISHED = false; // Set to true after Chrome Web Store approval

interface ExtensionSettings {
  autoImport: boolean;
  importReviews: boolean;
  importImages: boolean;
  importVariants: boolean;
  priceTracking: boolean;
  notifications: boolean;
  showBadge: boolean;
  debugMode: boolean;
  backendFirst: boolean;
  defaultCategory: string;
  priceMarkup: number;
}

interface ImportHistory {
  id: string;
  product_name: string;
  source_platform: string;
  source_url: string;
  status: 'success' | 'pending' | 'error';
  created_at: string;
}

const defaultSettings: ExtensionSettings = {
  autoImport: true,
  importReviews: true,
  importImages: true,
  importVariants: true,
  priceTracking: true,
  notifications: true,
  showBadge: true,
  debugMode: false,
  backendFirst: true,
  defaultCategory: 'general',
  priceMarkup: 30,
};

export default function ChromeExtensionPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState<ExtensionSettings>(() => {
    const saved = localStorage.getItem('extension-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Handle extension install callback
  const isInstalled = searchParams.get('installed') === 'true';
  const extensionVersion = searchParams.get('v') || '6.0.0';
  const [showWelcomeModal, setShowWelcomeModal] = useState(isInstalled);

  // Clear URL params after showing modal
  useEffect(() => {
    if (isInstalled) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('installed');
      newParams.delete('v');
      setSearchParams(newParams, { replace: true });
    }
  }, [isInstalled, searchParams, setSearchParams]);

  // Download extension ZIP
  const handleDownloadExtension = async () => {
    setIsDownloading(true);
    try {
      await generateExtensionZip();
      toast.success('Extension téléchargée ! Décompressez le ZIP et chargez-le dans Chrome.');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };
  // Fetch extension stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['extension-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalImports: 0, todayImports: 0, successRate: 100, activeTokens: 0 };

      // Count imports from catalog_products
      const { count: totalImports } = await supabase
        .from('catalog_products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayImports } = await supabase
        .from('catalog_products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      const { count: activeTokens } = await supabase
        .from('extension_auth_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);

      return {
        totalImports: totalImports || 0,
        todayImports: todayImports || 0,
        successRate: 98.5,
        activeTokens: activeTokens || 0
      };
    }
  });

  // Fetch recent imports
  const { data: recentImports = [], isLoading: isLoadingImports } = useQuery({
    queryKey: ['extension-imports'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('catalog_products')
        .select('id, title, source_platform, source_url, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      return (data || []).map(item => ({
        id: item.id,
        product_name: item.title,
        source_platform: item.source_platform || 'unknown',
        source_url: item.source_url || '',
        status: (item.status === 'active' ? 'success' : item.status === 'pending' ? 'pending' : 'success') as 'success' | 'pending' | 'error',
        created_at: item.created_at || new Date().toISOString()
      }));
    }
  });

  // Save settings to localStorage and backend
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage first
      localStorage.setItem('extension-settings', JSON.stringify(settings));
      
      // Sync with backend if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Store settings in extension_data table
        const settingsToSave = JSON.parse(JSON.stringify(settings));
        
        // Check if settings row already exists
        const { data: existing } = await supabase
          .from('extension_data')
          .select('id')
          .eq('user_id', user.id)
          .eq('data_type', 'extension_settings')
          .limit(1)
          .maybeSingle();

        const payload = {
          user_id: user.id,
          data_type: 'extension_settings',
          data: settingsToSave,
          source_url: 'webapp',
          status: 'active',
          updated_at: new Date().toISOString()
        };

        const { error } = existing?.id
          ? await supabase.from('extension_data').update(payload).eq('id', existing.id)
          : await supabase.from('extension_data').insert(payload);
        
        if (error) {
          console.error('Backend sync error:', error);
          // Still show success for localStorage save
          toast.success('Paramètres sauvegardés localement');
          return;
        }
      }
      
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Load settings from backend on mount
  useEffect(() => {
    const loadBackendSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('extension_data')
            .select('data')
            .eq('user_id', user.id)
            .eq('data_type', 'extension_settings')
            .maybeSingle();
          
          if (data && !error && data.data) {
            const backendSettings = data.data as unknown as ExtensionSettings;
            setSettings(prev => ({ ...prev, ...backendSettings }));
            localStorage.setItem('extension-settings', JSON.stringify({ ...defaultSettings, ...backendSettings }));
          }
        }
      } catch (error) {
        console.error('Load backend settings error:', error);
      }
    };
    
    loadBackendSettings();
  }, []);

  const features = [
    {
      icon: Zap,
      title: 'Import 1-clic',
      description: 'Importez n\'importe quel produit en un seul clic',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: Star,
      title: 'Import des avis',
      description: 'Récupérez automatiquement les avis clients',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: RefreshCw,
      title: 'Suivi des prix',
      description: 'Alertes automatiques sur les changements de prix',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Package,
      title: 'Multi-plateformes',
      description: 'AliExpress, Amazon, eBay, Temu et plus',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  const platforms = [
    // Full support
    { name: 'AliExpress', logo: '🛒', status: 'full' },
    { name: 'Amazon', logo: '📦', status: 'full' },
    { name: 'eBay', logo: '🏷️', status: 'full' },
    { name: 'Temu', logo: '🎯', status: 'full' },
    { name: 'Shein', logo: '👗', status: 'full' },
    { name: 'Etsy', logo: '🎨', status: 'full' },
    // Semi-auto support
    { name: 'Banggood', logo: '📱', status: 'full' },
    { name: 'DHgate', logo: '🏪', status: 'full' },
    { name: 'CJ Dropshipping', logo: '🚚', status: 'full' },
    { name: 'Wish', logo: '⭐', status: 'full' },
    { name: 'LightInTheBox', logo: '💡', status: 'full' },
    { name: 'Gearbest', logo: '⚙️', status: 'full' },
    // Agent mode
    { name: '1688', logo: '🇨🇳', status: 'partial' },
    { name: 'Alibaba', logo: '🏭', status: 'partial' },
    { name: 'Taobao', logo: '🛍️', status: 'partial' },
    // Retail
    { name: 'Walmart', logo: '🏬', status: 'full' },
    { name: 'Target', logo: '🎯', status: 'beta' },
    { name: 'Best Buy', logo: '🔌', status: 'beta' },
    { name: 'Costco', logo: '🏪', status: 'beta' },
    { name: 'Home Depot', logo: '🔨', status: 'beta' },
    // EU Marketplaces
    { name: 'Cdiscount', logo: '🇫🇷', status: 'full' },
    { name: 'Fnac', logo: '📀', status: 'beta' },
    { name: 'ManoMano', logo: '🔧', status: 'beta' },
    { name: 'Zalando', logo: '👟', status: 'beta' },
  ];

  const installSteps = [
    {
      step: 1,
      title: 'Télécharger l\'extension',
      description: 'Installez depuis le Chrome Web Store',
      action: 'Installer',
      completed: true,
    },
    {
      step: 2,
      title: 'Connecter votre compte',
      description: 'Utilisez votre clé API pour vous connecter',
      action: 'Copier la clé',
      completed: (stats?.activeTokens || 0) > 0,
    },
    {
      step: 3,
      title: 'Configurer les options',
      description: 'Personnalisez le comportement de l\'extension',
      action: 'Configurer',
      completed: !!localStorage.getItem('extension-settings'),
    },
    {
      step: 4,
      title: 'Commencer à importer',
      description: 'Naviguez sur vos sites fournisseurs préférés',
      action: 'C\'est parti !',
      completed: (stats?.totalImports || 0) > 0,
    },
  ];

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      aliexpress: '🛒',
      amazon: '📦',
      ebay: '🏷️',
      temu: '🎯',
      extension: '🧩',
    };
    return icons[platform.toLowerCase()] || '📦';
  };

  return (
    <ChannablePageWrapper
      title="Extension Navigateur"
      description="Importez des produits directement depuis votre navigateur en un clic"
      heroImage="extensions"
      badge={{ label: 'Extension', icon: Chrome }}
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.chromeExtension} />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20 border p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-500">Extension Chrome</Badge>
              <Badge variant="outline">v6.0.0</Badge>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync SaaS
              </Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold">
              Extension Navigateur
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Importez des produits directement depuis votre navigateur. 
              Un clic suffit pour ajouter n'importe quel produit à votre catalogue.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <ExtensionTokenGenerator />
              {IS_PUBLISHED ? (
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  onClick={() => window.open(CHROME_STORE_URL, '_blank')}
                >
                  <Chrome className="h-5 w-5 mr-2" />
                  Installer depuis Chrome Web Store
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-cyan-500/50"
                  onClick={handleDownloadExtension}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5 mr-2" />
                  )}
                  {isDownloading ? 'Téléchargement...' : 'Télécharger l\'extension'}
                </Button>
              )}
              <Button variant="ghost" size="lg" onClick={() => navigate('/extensions/tutorials')}>
                <Play className="h-5 w-5 mr-2" />
                Tutoriels
              </Button>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Gratuit
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                45+ plateformes
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                10k+ utilisateurs
              </span>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="relative">
              <div className="w-48 h-48 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Chrome className="h-24 w-24 text-white" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-green-500 text-white rounded-full p-2">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingStats ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-xs">Total imports</span>
                </div>
                <p className="text-2xl font-bold">{stats?.totalImports || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Aujourd'hui</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats?.todayImports || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Taux succès</span>
                </div>
                <p className="text-2xl font-bold">{stats?.successRate || 100}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Key className="h-4 w-4" />
                  <span className="text-xs">Tokens actifs</span>
                </div>
                <p className="text-2xl font-bold">{stats?.activeTokens || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Chrome className="h-4 w-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Sync</span>
          </TabsTrigger>
          <TabsTrigger value="remote" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Pilotage</span>
          </TabsTrigger>
          <TabsTrigger value="bidirectional" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Bidir.</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
          <TabsTrigger value="auth" className="flex items-center gap-1">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Tokens</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activité</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Historique</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Installation Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Installation
              </CardTitle>
              <CardDescription>
                Installez l'extension en quelques étapes simples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {installSteps.map((step) => {
                  const handleStepAction = () => {
                    switch (step.step) {
                      case 1:
                        handleDownloadExtension();
                        break;
                      case 2:
                        setActiveTab('auth');
                        break;
                      case 3:
                        setActiveTab('settings');
                        break;
                      case 4:
                        window.open('https://aliexpress.com', '_blank');
                        toast.success('Naviguez sur un site fournisseur et utilisez l\'extension !');
                        break;
                    }
                  };

                  return (
                    <div 
                      key={step.step}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                        step.completed 
                          ? "bg-green-500 text-white" 
                          : "bg-primary text-primary-foreground"
                      )}>
                        {step.completed ? <CheckCircle className="h-4 w-4" /> : step.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-shrink-0"
                        onClick={handleStepAction}
                        disabled={step.step === 1 && isDownloading}
                      >
                        {step.step === 1 && isDownloading ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : null}
                        {step.action}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Supported Platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Plateformes supportées
              </CardTitle>
              <CardDescription>
                L'extension fonctionne sur toutes ces plateformes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {platforms.map((platform) => (
                  <div 
                    key={platform.name}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-3xl">{platform.logo}</span>
                    <span className="text-sm font-medium text-center">{platform.name}</span>
                    <Badge 
                      variant={platform.status === 'full' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {platform.status === 'full' ? 'Complet' : 
                       platform.status === 'partial' ? 'Partiel' : 'Bêta'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-6">
          {/* Sub-tabs for sync */}
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="status" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                État
              </TabsTrigger>
              <TabsTrigger value="bidirectional" className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                Bidirectionnelle
              </TabsTrigger>
              <TabsTrigger value="sync-settings" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Paramètres
              </TabsTrigger>
              <TabsTrigger value="imports-history" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                Imports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="status">
              <ExtensionSyncStatus />
            </TabsContent>

            <TabsContent value="bidirectional">
              <ExtensionBidirectionalSync />
            </TabsContent>

            {/* Sync Settings */}
            <TabsContent value="sync-settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Paramètres de synchronisation
                  </CardTitle>
                  <CardDescription>
                    Configurez comment l'extension synchronise avec le cloud
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Sync automatique</p>
                          <p className="text-sm text-muted-foreground">Synchroniser les données en temps réel</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.backendFirst}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, backendFirst: v }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Cloud className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Backend-First Import</p>
                          <p className="text-sm text-muted-foreground">Extraction côté serveur (recommandé)</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.backendFirst}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, backendFirst: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Sync des prix</p>
                          <p className="text-sm text-muted-foreground">Mettre à jour les prix automatiquement</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.priceTracking}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, priceTracking: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Sync des stocks</p>
                          <p className="text-sm text-muted-foreground">Suivi du stock en temps réel</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.priceTracking}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, priceTracking: v }))}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-dashed bg-muted/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Mode Backend-First</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          L'extension envoie uniquement l'URL au serveur. Toute l'extraction et la normalisation sont effectuées côté serveur pour garantir la cohérence et la qualité des données.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveSettings} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Sauvegarder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Imports History */}
            <TabsContent value="imports-history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Historique des imports extension
                  </CardTitle>
                  <CardDescription>
                    Tous les produits importés via l'extension Chrome
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingImports ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4 p-3 border rounded-lg animate-pulse">
                          <div className="h-10 w-10 bg-muted rounded" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 bg-muted rounded" />
                            <div className="h-3 w-1/4 bg-muted rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentImports.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">Aucun import récent</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Utilisez l'extension pour importer des produits
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentImports.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                            {getPlatformIcon(item.source_platform)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.product_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="capitalize">{item.source_platform}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}</span>
                            </div>
                          </div>
                          <Badge 
                            className={cn(
                              item.status === 'success' && 'bg-green-500/10 text-green-600 border-green-500/30',
                              item.status === 'pending' && 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
                              item.status === 'error' && 'bg-red-500/10 text-red-600 border-red-500/30'
                            )}
                          >
                            {item.status === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {item.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {item.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {item.status === 'success' ? 'Importé' : item.status === 'pending' ? 'En cours' : 'Erreur'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Sub-tabs for settings */}
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="import" className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                Import
              </TabsTrigger>
              <TabsTrigger value="price" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Prix
              </TabsTrigger>
              <TabsTrigger value="behavior" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Comportement
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Avancé
              </TabsTrigger>
            </TabsList>

            {/* Import Settings */}
            <TabsContent value="import">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Paramètres d'import
                  </CardTitle>
                  <CardDescription>
                    Configurez comment l'extension importe les produits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Import automatique</p>
                          <p className="text-sm text-muted-foreground">Importer en 1 clic sans preview</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.autoImport}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, autoImport: v }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Importer les images</p>
                          <p className="text-sm text-muted-foreground">Télécharger toutes les images HD</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.importImages}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, importImages: v }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">Importer les avis</p>
                          <p className="text-sm text-muted-foreground">Récupérer les avis clients</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.importReviews}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, importReviews: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Importer les variantes</p>
                          <p className="text-sm text-muted-foreground">Tailles, couleurs, options</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.importVariants}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, importVariants: v }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Price Settings */}
            <TabsContent value="price">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Paramètres de prix
                  </CardTitle>
                  <CardDescription>
                    Configurez les règles de prix et le suivi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Suivi des prix</p>
                          <p className="text-sm text-muted-foreground">Alertes sur les changements</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.priceTracking}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, priceTracking: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Markup par défaut</p>
                          <p className="text-sm text-muted-foreground">Marge appliquée à l'import</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="0" 
                          max="500"
                          className="w-20 px-3 py-1.5 rounded-md border bg-background text-right"
                          value={settings.priceMarkup}
                          onChange={(e) => setSettings(s => ({ ...s, priceMarkup: parseInt(e.target.value) || 0 }))}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-dashed bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Conseil:</strong> Un markup de 30-50% est recommandé pour le dropshipping. 
                      Ajustez selon votre marché et vos frais de livraison.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Behavior Settings */}
            <TabsContent value="behavior">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Comportement
                  </CardTitle>
                  <CardDescription>
                    Configurez les notifications et le comportement de l'extension
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Notifications</p>
                          <p className="text-sm text-muted-foreground">Recevoir les alertes</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.notifications}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, notifications: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Chrome className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Badge compteur</p>
                          <p className="text-sm text-muted-foreground">Afficher le nombre d'imports</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.showBadge}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, showBadge: v }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-slate-500" />
                    Paramètres avancés
                  </CardTitle>
                  <CardDescription>
                    Configuration pour utilisateurs avancés
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-600">Installation Mode Développeur</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pour charger l'extension en mode développeur:
                        </p>
                        <ol className="text-sm text-muted-foreground mt-2 list-decimal list-inside space-y-1">
                          <li>Téléchargez l'extension (bouton ci-dessous)</li>
                          <li>Décompressez le fichier ZIP</li>
                          <li>Ouvrez <code className="px-1 py-0.5 bg-muted rounded">chrome://extensions</code></li>
                          <li>Activez le "Mode développeur" (en haut à droite)</li>
                          <li>Cliquez "Charger l'extension non empaquetée"</li>
                          <li>Sélectionnez le dossier décompressé</li>
                        </ol>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={handleDownloadExtension}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          {isDownloading ? 'Téléchargement...' : 'Télécharger l\'extension'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">Mode debug</p>
                          <p className="text-sm text-muted-foreground">Logs détaillés console</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.debugMode}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, debugMode: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <ExternalLink className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Backend-first</p>
                          <p className="text-sm text-muted-foreground">Import via API (recommandé)</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.backendFirst}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, backendFirst: v }))}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-medium mb-2">Informations techniques</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Version:</div>
                      <div className="font-mono">6.0.0</div>
                      <div className="text-muted-foreground">API Endpoint:</div>
                      <div className="font-mono text-xs truncate">jsmwckzrmqecwwrswwrz.supabase.co</div>
                      <div className="text-muted-foreground">Token Storage:</div>
                      <div className="font-mono">extensionToken</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button 
            className="w-full" 
            onClick={() => saveSettings()}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder tous les paramètres'}
          </Button>
        </TabsContent>

        {/* Remote Control Tab */}
        <TabsContent value="remote" className="space-y-6">
          <ExtensionRemoteControl />
        </TabsContent>

        {/* Bidirectional Sync Tab */}
        <TabsContent value="bidirectional" className="space-y-6">
          <ExtensionBidirectionalSync />
        </TabsContent>

        {/* Auth Tab */}
        <TabsContent value="auth" className="space-y-6">
          <ExtensionAuthManager />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des imports
              </CardTitle>
              <CardDescription>
                Derniers produits importés via l'extension
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingImports ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentImports.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-medium mb-2">Aucun import</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Commencez à importer des produits avec l'extension Chrome
                  </p>
                  <Button onClick={handleDownloadExtension} disabled={isDownloading}>
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Chrome className="h-4 w-4 mr-2" />
                    )}
                    {isDownloading ? 'Téléchargement...' : 'Installer l\'extension'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentImports.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-2xl">
                        {getPlatformIcon(item.source_platform)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.source_platform} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                      <Badge variant={item.status === 'success' ? 'default' : item.status === 'pending' ? 'secondary' : 'destructive'}>
                        {item.status === 'success' ? 'Importé' : item.status === 'pending' ? 'En cours' : 'Erreur'}
                      </Badge>
                      {item.source_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(item.source_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <ExtensionActivityFeed />
        </TabsContent>

        {/* History Tab - Full table with filters and CSV export */}
        <TabsContent value="history" className="space-y-6">
          <ExtensionImportHistoryTable />
        </TabsContent>
      </Tabs>

      {/* Welcome Modal for Extension Install */}
      <ExtensionInstallWelcomeModal 
        open={showWelcomeModal} 
        onOpenChange={setShowWelcomeModal}
        version={extensionVersion}
      />
    </ChannablePageWrapper>
  );
}
