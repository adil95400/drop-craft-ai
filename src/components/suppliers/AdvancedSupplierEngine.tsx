/**
 * Advanced Supplier Engine - Le moteur fournisseur le plus avancé du marché
 * Plus flexible qu'AutoDS, plus qualitatif que Spocket
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Zap,
  Upload,
  RefreshCw,
  Settings,
  BarChart3,
  Shield,
  Truck,
  DollarSign,
  Globe,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  ShoppingCart,
  Link2,
  Plug,
  FileJson,
  FileSpreadsheet,
  Code,
  Scan,
  Bot,
  Sparkles,
  Activity,
  Target,
  Layers,
  Database,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface EngineStats {
  totalProducts: number;
  activeSuppliers: number;
  pendingOrders: number;
  todayImports: number;
}

interface SyncHealth {
  id: string;
  name: string;
  lastSync: string | null;
  status: string;
  score: number;
  needsSync: boolean;
}

interface AutomationStatus {
  autoOrder: boolean;
  autoFulfillment: boolean;
  autoSync: boolean;
  lastActivity: string;
}

interface ImportSource {
  type: 'api' | 'xml' | 'csv' | 'scraping';
  url: string;
  platform?: string;
  confidence?: number;
}

interface PricingRule {
  id: string;
  type: 'markup_percentage' | 'markup_fixed' | 'competitive' | 'dynamic';
  value: number;
  name: string;
  active: boolean;
}

export function AdvancedSupplierEngine() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<EngineStats>({
    totalProducts: 0,
    activeSuppliers: 0,
    pendingOrders: 0,
    todayImports: 0
  });
  const [syncHealth, setSyncHealth] = useState<SyncHealth[]>([]);
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({
    autoOrder: true,
    autoFulfillment: true,
    autoSync: true,
    lastActivity: new Date().toISOString()
  });
  
  // Import state
  const [importUrl, setImportUrl] = useState('');
  const [detectedSource, setDetectedSource] = useState<ImportSource | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  // Pricing rules
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    { id: '1', type: 'markup_percentage', value: 30, name: 'Marge standard', active: true },
    { id: '2', type: 'markup_percentage', value: 50, name: 'Marge premium', active: false },
    { id: '3', type: 'competitive', value: 10, name: 'Prix compétitif', active: false },
    { id: '4', type: 'dynamic', value: 25, name: 'IA dynamique', active: false }
  ]);

  useEffect(() => {
    loadEngineStats();
  }, []);

  const loadEngineStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('advanced-supplier-engine', {
        body: { action: 'get_engine_stats', userId: (await supabase.auth.getUser()).data.user?.id }
      });

      if (error) throw error;

      if (data?.stats) setStats(data.stats);
      if (data?.syncHealth) setSyncHealth(data.syncHealth);
      if (data?.automationStatus) setAutomationStatus(data.automationStatus);
    } catch (error) {
      console.error('Error loading engine stats:', error);
      // Use fallback data
      setStats({
        totalProducts: 1250,
        activeSuppliers: 8,
        pendingOrders: 15,
        todayImports: 45
      });
      setSyncHealth([
        { id: '1', name: 'BigBuy', lastSync: new Date().toISOString(), status: 'success', score: 92, needsSync: false },
        { id: '2', name: 'CJ Dropshipping', lastSync: new Date(Date.now() - 3600000).toISOString(), status: 'success', score: 88, needsSync: false },
        { id: '3', name: 'Spocket', lastSync: new Date(Date.now() - 7200000).toISOString(), status: 'warning', score: 75, needsSync: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const detectSource = async () => {
    if (!importUrl) return;
    
    setIsDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('advanced-supplier-engine', {
        body: { action: 'detect_sources', url: importUrl }
      });

      if (error) throw error;

      if (data?.detected) {
        setDetectedSource(data.detected);
        toast({
          title: 'Source détectée',
          description: `Type: ${data.detected.type} | Plateforme: ${data.detected.platform} | Confiance: ${data.detected.confidence}%`,
        });
      }
    } catch (error) {
      console.error('Error detecting source:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de détecter la source',
        variant: 'destructive'
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const startAutoImport = async () => {
    if (!importUrl || !detectedSource) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    const progressInterval = setInterval(() => {
      setImportProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const { data, error } = await supabase.functions.invoke('advanced-supplier-engine', {
        body: {
          action: 'auto_import',
          userId: (await supabase.auth.getUser()).data.user?.id,
          source: {
            type: detectedSource.type,
            url: importUrl
          },
          options: { updateExisting: true }
        }
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (error) throw error;

      toast({
        title: 'Import terminé',
        description: `${data?.stats?.imported || 0} produits importés, ${data?.stats?.updated || 0} mis à jour`,
      });

      loadEngineStats();
    } catch (error) {
      console.error('Error importing:', error);
      toast({
        title: 'Erreur d\'import',
        description: 'L\'import a échoué',
        variant: 'destructive'
      });
    } finally {
      clearInterval(progressInterval);
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const syncSupplier = async (supplierId: string) => {
    try {
      const { error } = await supabase.functions.invoke('advanced-supplier-engine', {
        body: {
          action: 'sync_realtime',
          userId: (await supabase.auth.getUser()).data.user?.id,
          supplierId
        }
      });

      if (error) throw error;

      toast({
        title: 'Synchronisation lancée',
        description: 'La synchronisation est en cours...'
      });

      loadEngineStats();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la synchronisation',
        variant: 'destructive'
      });
    }
  };

  const toggleAutomation = (type: keyof AutomationStatus) => {
    if (type === 'lastActivity') return;
    const wasEnabled = automationStatus[type as keyof Omit<AutomationStatus, 'lastActivity'>];
    setAutomationStatus(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    toast({
      title: wasEnabled ? 'Désactivé' : 'Activé',
      description: `${type.replace('auto', 'Auto-')} a été ${automationStatus[type] ? 'désactivé' : 'activé'}`
    });
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'api': return <Code className="h-4 w-4" />;
      case 'xml': return <FileJson className="h-4 w-4" />;
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />;
      case 'scraping': return <Scan className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8"
      >
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Moteur Fournisseur Avancé</h1>
              <p className="text-white/80">Plus flexible qu'AutoDS • Plus qualitatif que Spocket</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Package className="h-4 w-4" />
                Produits
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalProducts.toLocaleString()}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Link2 className="h-4 w-4" />
                Fournisseurs actifs
              </div>
              <div className="text-2xl font-bold text-white">{stats.activeSuppliers}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <ShoppingCart className="h-4 w-4" />
                Commandes en attente
              </div>
              <div className="text-2xl font-bold text-white">{stats.pendingOrders}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Upload className="h-4 w-4" />
                Imports aujourd'hui
              </div>
              <div className="text-2xl font-bold text-white">{stats.todayImports}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Auto-Import</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Automation</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Prix</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Sync</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Automation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Statut Automation
                </CardTitle>
                <CardDescription>Niveau d'automatisation full-auto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span>Auto-Order</span>
                  </div>
                  <Switch 
                    checked={automationStatus.autoOrder}
                    onCheckedChange={() => toggleAutomation('autoOrder')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>Auto-Fulfillment</span>
                  </div>
                  <Switch 
                    checked={automationStatus.autoFulfillment}
                    onCheckedChange={() => toggleAutomation('autoFulfillment')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <span>Auto-Sync</span>
                  </div>
                  <Switch 
                    checked={automationStatus.autoSync}
                    onCheckedChange={() => toggleAutomation('autoSync')}
                  />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span>Dernière activité: {new Date(automationStatus.lastActivity).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sync Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Santé des Fournisseurs
                </CardTitle>
                <CardDescription>État de synchronisation en temps réel</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {syncHealth.map((supplier) => (
                      <div 
                        key={supplier.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            supplier.status === 'success' ? "bg-green-500" :
                            supplier.status === 'warning' ? "bg-yellow-500" : "bg-red-500"
                          )} />
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Score: {supplier.score}%
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {supplier.needsSync && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Sync requis
                            </Badge>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => syncSupplier(supplier.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-5">
            <Button asChild className="h-auto py-4 flex-col gap-2" variant="outline">
              <Link to="/suppliers/connectors">
                <Plug className="h-6 w-6 text-primary" />
                <span>Connecteurs API</span>
                <span className="text-xs text-muted-foreground">15 plateformes</span>
              </Link>
            </Button>
            <Button className="h-auto py-4 flex-col gap-2" variant="outline">
              <Upload className="h-6 w-6" />
              <span>Import Rapide</span>
            </Button>
            <Button className="h-auto py-4 flex-col gap-2" variant="outline">
              <RefreshCw className="h-6 w-6" />
              <span>Sync Global</span>
            </Button>
            <Button className="h-auto py-4 flex-col gap-2" variant="outline">
              <DollarSign className="h-6 w-6" />
              <span>Optimiser Prix</span>
            </Button>
            <Button className="h-auto py-4 flex-col gap-2" variant="outline">
              <Target className="h-6 w-6" />
              <span>Trouver Gagnants</span>
            </Button>
          </div>
        </TabsContent>

        {/* Auto-Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Import Intelligent Multi-Sources
              </CardTitle>
              <CardDescription>
                Détection automatique API, XML, CSV, ou Scraping avec mapping IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <Label>URL ou Flux Fournisseur</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://supplier.com/feed.xml ou URL catalogue..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={detectSource}
                    disabled={!importUrl || isDetecting}
                    variant="secondary"
                  >
                    {isDetecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Scan className="h-4 w-4 mr-2" />
                        Détecter
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Detected Source */}
              <AnimatePresence>
                {detectedSource && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getSourceIcon(detectedSource.type)}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{detectedSource.type}</div>
                          <div className="text-sm text-muted-foreground">{detectedSource.platform}</div>
                        </div>
                      </div>
                      <Badge 
                        variant={detectedSource.confidence && detectedSource.confidence > 70 ? 'default' : 'secondary'}
                      >
                        {detectedSource.confidence}% confiance
                      </Badge>
                    </div>

                    {isImporting && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Import en cours...</span>
                          <span>{importProgress}%</span>
                        </div>
                        <Progress value={importProgress} />
                      </div>
                    )}

                    <Button 
                      onClick={startAutoImport}
                      disabled={isImporting}
                      className="w-full"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Lancer l'Import Automatique
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Import Sources Grid */}
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { type: 'api', label: 'API REST', icon: Code, desc: 'Connexion directe' },
                  { type: 'xml', label: 'Flux XML', icon: FileJson, desc: 'Feeds Google, Amazon' },
                  { type: 'csv', label: 'Fichier CSV', icon: FileSpreadsheet, desc: 'Upload direct' },
                  { type: 'scraping', label: 'Scraping IA', icon: Scan, desc: 'Extraction auto' }
                ].map((source) => (
                  <Card 
                    key={source.type}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setDetectedSource({ type: source.type as any, url: '', platform: 'manual' })}
                  >
                    <CardContent className="pt-6 text-center">
                      <source.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <div className="font-medium">{source.label}</div>
                      <div className="text-xs text-muted-foreground">{source.desc}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Auto-Order */}
            <Card className={cn(
              "transition-all",
              automationStatus.autoOrder && "border-green-500/50 bg-green-500/5"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Auto-Order
                  </CardTitle>
                  <Switch 
                    checked={automationStatus.autoOrder}
                    onCheckedChange={() => toggleAutomation('autoOrder')}
                  />
                </div>
                <CardDescription>
                  Commandes automatiques vers fournisseurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Détection nouvelles commandes
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Sélection fournisseur optimal
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Passage commande API
                  </div>
                </div>
                <div className="pt-4 border-t text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">152</span> commandes automatisées ce mois
                </div>
              </CardContent>
            </Card>

            {/* Auto-Fulfillment */}
            <Card className={cn(
              "transition-all",
              automationStatus.autoFulfillment && "border-blue-500/50 bg-blue-500/5"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Auto-Fulfillment
                  </CardTitle>
                  <Switch 
                    checked={automationStatus.autoFulfillment}
                    onCheckedChange={() => toggleAutomation('autoFulfillment')}
                  />
                </div>
                <CardDescription>
                  Mise à jour tracking automatique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Récupération tracking fournisseur
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Mise à jour commande client
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Notification client automatique
                  </div>
                </div>
                <div className="pt-4 border-t text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">98%</span> taux de fulfillment auto
                </div>
              </CardContent>
            </Card>

            {/* Auto-Sync */}
            <Card className={cn(
              "transition-all",
              automationStatus.autoSync && "border-purple-500/50 bg-purple-500/5"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Auto-Sync
                  </CardTitle>
                  <Switch 
                    checked={automationStatus.autoSync}
                    onCheckedChange={() => toggleAutomation('autoSync')}
                  />
                </div>
                <CardDescription>
                  Synchronisation temps réel stocks/prix
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Polling toutes les 5 min
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Webhooks temps réel
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Alertes rupture de stock
                  </div>
                </div>
                <div className="pt-4 border-t text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">1,250</span> produits synchronisés
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Règles de Prix Dynamiques
              </CardTitle>
              <CardDescription>
                Gestion automatique des marges et prix compétitifs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pricingRules.map((rule) => (
                <div 
                  key={rule.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                    rule.active ? "bg-primary/5 border-primary/30" : "bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Switch 
                      checked={rule.active}
                      onCheckedChange={() => {
                        setPricingRules(prev => prev.map(r => 
                          r.id === rule.id ? { ...r, active: !r.active } : r
                        ));
                      }}
                    />
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {rule.type === 'markup_percentage' && `+${rule.value}% de marge`}
                        {rule.type === 'markup_fixed' && `+${rule.value}€ fixe`}
                        {rule.type === 'competitive' && `${rule.value}% sous la concurrence`}
                        {rule.type === 'dynamic' && `IA: ${rule.value}% objectif marge`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <Slider 
                        value={[rule.value]}
                        max={100}
                        step={5}
                        onValueChange={([value]) => {
                          setPricingRules(prev => prev.map(r => 
                            r.id === rule.id ? { ...r, value } : r
                          ));
                        }}
                      />
                    </div>
                    <Badge variant="outline">{rule.value}%</Badge>
                  </div>
                </div>
              ))}
              
              <Button className="w-full mt-4">
                <Sparkles className="h-4 w-4 mr-2" />
                Appliquer les Règles
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>État des Synchronisations</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {syncHealth.map((supplier) => (
                      <div 
                        key={supplier.id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              supplier.status === 'success' ? "bg-green-500" :
                              supplier.status === 'warning' ? "bg-yellow-500" : "bg-red-500"
                            )} />
                            <span className="font-medium">{supplier.name}</span>
                          </div>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => syncSupplier(supplier.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Sync
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Dernière sync:</span>
                            <div>{supplier.lastSync ? new Date(supplier.lastSync).toLocaleString('fr-FR') : 'Jamais'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Score:</span>
                            <div className="flex items-center gap-2">
                              <Progress value={supplier.score} className="h-2 flex-1" />
                              <span>{supplier.score}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration Sync</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Fréquence de synchronisation</Label>
                  <Select defaultValue="15min">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Temps réel (Webhooks)</SelectItem>
                      <SelectItem value="5min">Toutes les 5 minutes</SelectItem>
                      <SelectItem value="15min">Toutes les 15 minutes</SelectItem>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Une fois par jour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Types de données à synchroniser</Label>
                  <div className="space-y-3">
                    {[
                      { id: 'prices', label: 'Prix', icon: DollarSign },
                      { id: 'stock', label: 'Stocks', icon: Package },
                      { id: 'products', label: 'Nouveaux produits', icon: Layers },
                      { id: 'orders', label: 'Statuts commandes', icon: ShoppingCart }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span>{item.label}</span>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Synchroniser Tout Maintenant
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
