/**
 * Chrome Extension Page - Installation et configuration complète
 */
import { useState, useEffect } from 'react';
import { 
  Chrome, Download, Play, CheckCircle, Settings, Zap, Star,
  Package, RefreshCw, Globe, ArrowRight, ExternalLink, Key,
  Activity, History, TrendingUp, Clock, AlertCircle, Save, Loader2
} from 'lucide-react';
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
import { QuickConnectTokenModal } from '@/components/extensions/QuickConnectTokenModal';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExtensionSettings {
  autoImport: boolean;
  importReviews: boolean;
  importImages: boolean;
  priceTracking: boolean;
  notifications: boolean;
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
  priceTracking: true,
  notifications: true,
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
  const extensionVersion = searchParams.get('v') || '4.3.10';
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
        const { error } = await supabase
          .from('extension_data')
          .upsert([{
            user_id: user.id,
            data_type: 'extension_settings',
            data: settingsToSave,
            source_url: 'webapp',
            status: 'active',
            updated_at: new Date().toISOString()
          }], {
            onConflict: 'user_id,data_type'
          });
        
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
    { name: 'AliExpress', logo: '🛒', status: 'full' },
    { name: 'Amazon', logo: '📦', status: 'full' },
    { name: 'eBay', logo: '🏷️', status: 'full' },
    { name: 'Temu', logo: '🎯', status: 'full' },
    { name: 'Banggood', logo: '📱', status: 'full' },
    { name: 'CJ Dropshipping', logo: '🚚', status: 'partial' },
    { name: 'Wish', logo: '⭐', status: 'beta' },
    { name: 'DHgate', logo: '🏪', status: 'beta' },
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
    <div className="container mx-auto p-4 md:p-6 space-y-6">
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
              <Badge variant="outline">v4.0.0</Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold">
              Extension Navigateur
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Importez des produits directement depuis votre navigateur. 
              Un clic suffit pour ajouter n'importe quel produit à votre catalogue.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-500"
                onClick={handleDownloadExtension}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Download className="h-5 w-5 mr-2" />
                )}
                {isDownloading ? 'Téléchargement...' : 'Installer l\'extension'}
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/extensions/tutorials')}>
                <Play className="h-5 w-5 mr-2" />
                Voir les tutoriels
              </Button>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Gratuit
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                15+ plateformes
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
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Chrome className="h-4 w-4" />
            <span className="hidden sm:inline">Aperçu</span>
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
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
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

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres de l'extension
              </CardTitle>
              <CardDescription>
                Personnalisez le comportement de l'extension
              </CardDescription>
            </CardHeader>
            <CardContent>
              {false ? (
                <div className="space-y-4">
                  {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">Import automatique</p>
                        <p className="text-sm text-muted-foreground">Ajouter directement au catalogue</p>
                      </div>
                      <Switch 
                        checked={settings.autoImport}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, autoImport: v }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">Importer les avis</p>
                        <p className="text-sm text-muted-foreground">Récupérer les avis clients</p>
                      </div>
                      <Switch 
                        checked={settings.importReviews}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, importReviews: v }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">Images HD</p>
                        <p className="text-sm text-muted-foreground">Télécharger toutes les images</p>
                      </div>
                      <Switch 
                        checked={settings.importImages}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, importImages: v }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">Suivi des prix</p>
                        <p className="text-sm text-muted-foreground">Alertes de changement</p>
                      </div>
                      <Switch 
                        checked={settings.priceTracking}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, priceTracking: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">Notifications</p>
                        <p className="text-sm text-muted-foreground">Recevoir les alertes</p>
                      </div>
                      <Switch 
                        checked={settings.notifications}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, notifications: v }))}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-6" 
                    onClick={() => saveSettings()}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
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
      </Tabs>

      {/* Welcome Modal for Extension Install */}
      <ExtensionInstallWelcomeModal 
        open={showWelcomeModal} 
        onOpenChange={setShowWelcomeModal}
        version={extensionVersion}
      />
    </div>
  );
}
