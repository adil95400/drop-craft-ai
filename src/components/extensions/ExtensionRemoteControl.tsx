/**
 * Extension Remote Control - Pilotage à distance de l'extension depuis le SaaS
 * Permet de configurer et contrôler l'extension sans y accéder directement
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings, Zap, Package, RefreshCw, Bell, Image, Star, DollarSign,
  Shield, Clock, Wifi, WifiOff, Send, Check, AlertTriangle, Globe,
  Layers, Filter, Tag, Percent, Upload, Download, Eye, EyeOff
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RemoteConfig {
  // Import Settings
  autoImport: boolean;
  importImages: boolean;
  importReviews: boolean;
  importVariants: boolean;
  qualityThreshold: number;
  
  // Price Settings
  priceMarkup: number;
  roundPrices: boolean;
  roundTo: 'none' | '0.99' | '0.95' | '0.00';
  minMargin: number;
  
  // Behavior Settings
  notifications: boolean;
  priceTracking: boolean;
  stockAlerts: boolean;
  autoOptimize: boolean;
  
  // Advanced Settings
  defaultCategory: string;
  defaultStatus: 'active' | 'draft' | 'pending';
  duplicateAction: 'skip' | 'update' | 'create_new';
  languageDetection: boolean;
}

const defaultConfig: RemoteConfig = {
  autoImport: false,
  importImages: true,
  importReviews: true,
  importVariants: true,
  qualityThreshold: 70,
  priceMarkup: 30,
  roundPrices: true,
  roundTo: '0.99',
  minMargin: 20,
  notifications: true,
  priceTracking: true,
  stockAlerts: true,
  autoOptimize: false,
  defaultCategory: 'general',
  defaultStatus: 'draft',
  duplicateAction: 'skip',
  languageDetection: true,
};

export function ExtensionRemoteControl() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<RemoteConfig>(defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastPushed, setLastPushed] = useState<string | null>(null);

  // Fetch current remote config
  const { data: savedConfig, isLoading } = useQuery({
    queryKey: ['extension-remote-config', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('extension_data')
        .select('data, updated_at')
        .eq('user_id', user.id)
        .eq('data_type', 'remote_config')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.data) {
        const loadedConfig = data.data as unknown as RemoteConfig;
        setConfig({ ...defaultConfig, ...loadedConfig });
        setLastPushed(data.updated_at);
      }
      
      return data;
    },
    enabled: !!user,
  });

  // Check extension connection status
  const { data: connectionStatus } = useQuery({
    queryKey: ['extension-connection-status', user?.id],
    queryFn: async () => {
      if (!user) return { connected: false, lastSeen: null };

      const { data } = await supabase
        .from('extension_auth_tokens')
        .select('last_used_at, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return { connected: false, lastSeen: null };

      const lastSeen = new Date(data.last_used_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      return {
        connected: lastSeen > fiveMinutesAgo,
        lastSeen: data.last_used_at
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Push config to extension
  const pushConfig = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('extension_data')
        .upsert([{
          user_id: user.id,
          data_type: 'remote_config',
          data: JSON.parse(JSON.stringify(config)),
          source_url: 'saas_remote_control',
          status: 'active',
          updated_at: new Date().toISOString()
        }], { onConflict: 'user_id,data_type' });

      if (error) throw error;
      
      // Also trigger a sync event for connected extensions
      await supabase.from('extension_data').insert([{
        user_id: user.id,
        data_type: 'config_push_event',
        data: { pushedAt: new Date().toISOString() },
        source_url: 'saas_remote_control',
        status: 'pending'
      }]);

      return { success: true };
    },
    onSuccess: () => {
      setHasChanges(false);
      setLastPushed(new Date().toISOString());
      queryClient.invalidateQueries({ queryKey: ['extension-remote-config'] });
      toast.success('Configuration envoyée à l\'extension');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const updateConfig = <K extends keyof RemoteConfig>(key: K, value: RemoteConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <Card className={cn(
        "border-2",
        connectionStatus?.connected ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connectionStatus?.connected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium">
                  {connectionStatus?.connected ? 'Extension connectée' : 'Extension hors ligne'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {connectionStatus?.lastSeen 
                    ? `Dernière activité: ${new Date(connectionStatus.lastSeen).toLocaleString('fr-FR')}`
                    : 'Aucune connexion récente'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Changements non envoyés
                </Badge>
              )}
              <Button 
                onClick={() => pushConfig.mutate()}
                disabled={pushConfig.isPending || !hasChanges}
              >
                {pushConfig.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Envoyer à l'extension
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs defaultValue="import" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Prix
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Comportement
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Avancé
          </TabsTrigger>
        </TabsList>

        {/* Import Settings */}
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Paramètres d'import
              </CardTitle>
              <CardDescription>
                Configurez comment l'extension importe les produits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Auto Import */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Zap className={cn("h-5 w-5", config.autoImport ? "text-green-500" : "text-muted-foreground")} />
                    <div>
                      <Label>Import automatique</Label>
                      <p className="text-xs text-muted-foreground">
                        Importer en 1 clic sans preview
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={config.autoImport}
                    onCheckedChange={(v) => updateConfig('autoImport', v)}
                  />
                </div>

                {/* Import Images */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Image className={cn("h-5 w-5", config.importImages ? "text-blue-500" : "text-muted-foreground")} />
                    <div>
                      <Label>Importer les images</Label>
                      <p className="text-xs text-muted-foreground">
                        Télécharger toutes les images HD
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={config.importImages}
                    onCheckedChange={(v) => updateConfig('importImages', v)}
                  />
                </div>

                {/* Import Reviews */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Star className={cn("h-5 w-5", config.importReviews ? "text-yellow-500" : "text-muted-foreground")} />
                    <div>
                      <Label>Importer les avis</Label>
                      <p className="text-xs text-muted-foreground">
                        Récupérer les avis clients
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={config.importReviews}
                    onCheckedChange={(v) => updateConfig('importReviews', v)}
                  />
                </div>

                {/* Import Variants */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Layers className={cn("h-5 w-5", config.importVariants ? "text-purple-500" : "text-muted-foreground")} />
                    <div>
                      <Label>Importer les variantes</Label>
                      <p className="text-xs text-muted-foreground">
                        Tailles, couleurs, options
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={config.importVariants}
                    onCheckedChange={(v) => updateConfig('importVariants', v)}
                  />
                </div>
              </div>

              <Separator />

              {/* Quality Threshold */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Seuil de qualité minimum</Label>
                    <p className="text-xs text-muted-foreground">
                      Bloquer les produits sous ce score
                    </p>
                  </div>
                  <Badge variant="outline" className="text-lg font-mono">
                    {config.qualityThreshold}%
                  </Badge>
                </div>
                <Slider
                  value={[config.qualityThreshold]}
                  onValueChange={([v]) => updateConfig('qualityThreshold', v)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tout accepter</span>
                  <span>Qualité Pro</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Settings */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Règles de prix
              </CardTitle>
              <CardDescription>
                Appliquez automatiquement vos marges et arrondis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Markup */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marge automatique</Label>
                    <p className="text-xs text-muted-foreground">
                      Pourcentage ajouté au prix fournisseur
                    </p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 text-lg font-mono">
                    +{config.priceMarkup}%
                  </Badge>
                </div>
                <Slider
                  value={[config.priceMarkup]}
                  onValueChange={([v]) => updateConfig('priceMarkup', v)}
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Min Margin */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marge minimum</Label>
                    <p className="text-xs text-muted-foreground">
                      Alerter si la marge descend sous ce seuil
                    </p>
                  </div>
                  <Badge variant="outline" className="text-lg font-mono">
                    {config.minMargin}%
                  </Badge>
                </div>
                <Slider
                  value={[config.minMargin]}
                  onValueChange={([v]) => updateConfig('minMargin', v)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Price Rounding */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Percent className="h-5 w-5 text-blue-500" />
                  <div>
                    <Label>Arrondir les prix</Label>
                    <p className="text-xs text-muted-foreground">
                      Psychologie des prix
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={config.roundPrices}
                  onCheckedChange={(v) => updateConfig('roundPrices', v)}
                />
              </div>

              {config.roundPrices && (
                <div className="ml-4">
                  <Label>Arrondir à</Label>
                  <Select 
                    value={config.roundTo} 
                    onValueChange={(v) => updateConfig('roundTo', v as RemoteConfig['roundTo'])}
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.99">X,99 € (ex: 29,99 €)</SelectItem>
                      <SelectItem value="0.95">X,95 € (ex: 29,95 €)</SelectItem>
                      <SelectItem value="0.00">X,00 € (ex: 30,00 €)</SelectItem>
                      <SelectItem value="none">Pas d'arrondi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Settings */}
        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Comportement
              </CardTitle>
              <CardDescription>
                Automatisations et notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Bell className={cn("h-5 w-5", config.notifications ? "text-blue-500" : "text-muted-foreground")} />
                    <div>
                      <Label>Notifications</Label>
                      <p className="text-xs text-muted-foreground">Alertes dans le navigateur</p>
                    </div>
                  </div>
                  <Switch 
                    checked={config.notifications}
                    onCheckedChange={(v) => updateConfig('notifications', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <DollarSign className={cn("h-5 w-5", config.priceTracking ? "text-green-500" : "text-muted-foreground")} />
                    <div>
                      <Label>Suivi des prix</Label>
                      <p className="text-xs text-muted-foreground">Alertes changement de prix</p>
                    </div>
                  </div>
                  <Switch 
                    checked={config.priceTracking}
                    onCheckedChange={(v) => updateConfig('priceTracking', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Package className={cn("h-5 w-5", config.stockAlerts ? "text-orange-500" : "text-muted-foreground")} />
                    <div>
                      <Label>Alertes stock</Label>
                      <p className="text-xs text-muted-foreground">Notifier rupture de stock</p>
                    </div>
                  </div>
                  <Switch 
                    checked={config.stockAlerts}
                    onCheckedChange={(v) => updateConfig('stockAlerts', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Zap className={cn("h-5 w-5", config.autoOptimize ? "text-purple-500" : "text-muted-foreground")} />
                    <div>
                      <Label>Auto-optimisation</Label>
                      <p className="text-xs text-muted-foreground">SEO & descriptions IA</p>
                    </div>
                  </div>
                  <Switch 
                    checked={config.autoOptimize}
                    onCheckedChange={(v) => updateConfig('autoOptimize', v)}
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
                <Settings className="h-5 w-5" />
                Paramètres avancés
              </CardTitle>
              <CardDescription>
                Options pour utilisateurs expérimentés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Default Category */}
                <div className="space-y-2">
                  <Label>Catégorie par défaut</Label>
                  <Input 
                    value={config.defaultCategory}
                    onChange={(e) => updateConfig('defaultCategory', e.target.value)}
                    placeholder="general"
                  />
                </div>

                {/* Default Status */}
                <div className="space-y-2">
                  <Label>Statut par défaut</Label>
                  <Select 
                    value={config.defaultStatus}
                    onValueChange={(v) => updateConfig('defaultStatus', v as RemoteConfig['defaultStatus'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="active">Actif (publié)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duplicate Action */}
                <div className="space-y-2">
                  <Label>Si produit dupliqué</Label>
                  <Select 
                    value={config.duplicateAction}
                    onValueChange={(v) => updateConfig('duplicateAction', v as RemoteConfig['duplicateAction'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Ignorer (ne pas importer)</SelectItem>
                      <SelectItem value="update">Mettre à jour l'existant</SelectItem>
                      <SelectItem value="create_new">Créer un nouveau</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language Detection */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label>Détection langue</Label>
                      <p className="text-xs text-muted-foreground">Auto-traduire si besoin</p>
                    </div>
                  </div>
                  <Switch 
                    checked={config.languageDetection}
                    onCheckedChange={(v) => updateConfig('languageDetection', v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Push Info */}
      {lastPushed && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              <span>Dernière synchronisation: {new Date(lastPushed).toLocaleString('fr-FR')}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
