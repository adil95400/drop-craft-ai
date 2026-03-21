import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Share2, Send, CheckCircle2, AlertCircle, Loader2, Store,
  Globe, Facebook, Instagram, ArrowRight, RefreshCw, Clock, Zap
} from 'lucide-react';

interface ConnectedChannel {
  id: string;
  name: string;
  platform: string;
  type: 'social' | 'store' | 'marketplace';
  status: 'connected' | 'disconnected' | 'error';
  icon: string;
  lastSync?: string;
}

interface SyncResult {
  channel: string;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

const CHANNEL_ICONS: Record<string, string> = {
  facebook: '📘', instagram: '📸', tiktok: '🎵', pinterest: '📌',
  twitter: '𝕏', linkedin: '💼', shopify: '🛒', woocommerce: '🔧',
  amazon: '📦', ebay: '🏷️', etsy: '🧵', google_shopping: '🔍',
};

export function AdsMarketingSync() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<ConnectedChannel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    loadChannels();
    loadProducts();
  }, []);

  const loadChannels = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch connected stores - use type assertion to avoid deep type instantiation
      const storesQuery = supabase
        .from('store_connections')
        .select('id, store_name, platform, status, last_sync_at')
        .eq('user_id', user.id);
      const { data: stores } = await storesQuery;

      const allChannels: ConnectedChannel[] = [];

      // Social networks (show all, mark disconnected)
      const socialPlatforms = ['facebook', 'instagram', 'tiktok', 'pinterest', 'twitter', 'linkedin'];
      socialPlatforms.forEach(platform => {
        allChannels.push({
          id: `social_${platform}`,
          name: platform.charAt(0).toUpperCase() + platform.slice(1),
          platform,
          type: 'social',
          status: 'disconnected', // Will be connected when user configures credentials
          icon: CHANNEL_ICONS[platform] || '🔗',
        });
      });

      // Connected stores
      (stores || []).forEach((store: any) => {
        allChannels.push({
          id: store.id,
          name: store.store_name || store.platform,
          platform: store.platform,
          type: store.platform?.includes('amazon') || store.platform?.includes('ebay') || store.platform?.includes('etsy') ? 'marketplace' : 'store',
          status: store.status === 'active' ? 'connected' : 'disconnected',
          icon: CHANNEL_ICONS[store.platform] || '🏪',
          lastSync: store.last_sync_at,
        });
      });

      setChannels(allChannels);
    } catch (err) {
      console.error('Failed to load channels:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('products')
      .select('id, name, price, image_urls')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setProducts(data || []);
  };

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllType = (type: string) => {
    const typeChannels = channels.filter(c => c.type === type && c.status === 'connected');
    setSelectedChannels(prev => {
      const next = new Set(prev);
      const allSelected = typeChannels.every(c => next.has(c.id));
      if (allSelected) {
        typeChannels.forEach(c => next.delete(c.id));
      } else {
        typeChannels.forEach(c => next.add(c.id));
      }
      return next;
    });
  };

  const publishToChannels = async () => {
    if (selectedChannels.size === 0) {
      toast({ title: 'Sélectionnez au moins un canal', variant: 'destructive' });
      return;
    }

    setIsSyncing(true);
    setSyncResults([]);
    setSyncProgress(0);

    const selectedList = channels.filter(c => selectedChannels.has(c.id));
    const socialChannels = selectedList.filter(c => c.type === 'social').map(c => c.platform);
    const storeChannels = selectedList.filter(c => c.type === 'store' || c.type === 'marketplace');

    const results: SyncResult[] = [];
    let completed = 0;
    const total = socialChannels.length + storeChannels.length;

    // Publish to social networks
    if (socialChannels.length > 0 && selectedProduct) {
      try {
        const { data, error } = await supabase.functions.invoke('social-media-publish', {
          body: {
            productId: selectedProduct,
            channels: socialChannels,
            customMessage: customMessage || undefined,
          },
        });

        if (error) throw error;

        (data?.results || []).forEach((r: any) => {
          results.push(r);
          completed++;
          setSyncProgress((completed / total) * 100);
        });
      } catch (err: any) {
        socialChannels.forEach(ch => {
          results.push({ channel: ch, success: false, error: err.message });
          completed++;
          setSyncProgress((completed / total) * 100);
        });
      }
    }

    // Sync to connected stores/marketplaces
    for (const store of storeChannels) {
      try {
        const { data, error } = await supabase.functions.invoke('marketplace-publish', {
          body: {
            productId: selectedProduct,
            storeConnectionId: store.id,
            platform: store.platform,
          },
        });

        if (error) throw error;
        results.push({ channel: store.name, success: true, postId: data?.externalId });
      } catch (err: any) {
        results.push({ channel: store.name, success: false, error: err.message });
      }
      completed++;
      setSyncProgress((completed / total) * 100);
    }

    setSyncResults(results);
    setIsSyncing(false);

    const successCount = results.filter(r => r.success).length;
    toast({
      title: `Synchronisation terminée`,
      description: `${successCount}/${results.length} canaux synchronisés avec succès`,
      variant: successCount > 0 ? 'default' : 'destructive',
    });
  };

  const connectedSocial = channels.filter(c => c.type === 'social' && c.status === 'connected');
  const connectedStores = channels.filter(c => c.type === 'store' && c.status === 'connected');
  const connectedMarketplaces = channels.filter(c => c.type === 'marketplace' && c.status === 'connected');

  const renderChannelGroup = (title: string, icon: React.ReactNode, type: string, channelList: ConnectedChannel[]) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-semibold text-sm">{title}</h4>
          <Badge variant="secondary" className="text-[10px]">
            {channelList.filter(c => c.status === 'connected').length} connectés
          </Badge>
        </div>
        {channelList.filter(c => c.status === 'connected').length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => selectAllType(type)}>
            Tout sélectionner
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {channelList.map(channel => {
          const isSelected = selectedChannels.has(channel.id);
          const isConnected = channel.status === 'connected';
          return (
            <button
              key={channel.id}
              onClick={() => isConnected && toggleChannel(channel.id)}
              disabled={!isConnected}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                isSelected && isConnected ? 'border-primary bg-primary/5 shadow-sm' : '',
                isConnected ? 'hover:border-primary/30 cursor-pointer' : 'opacity-50 cursor-not-allowed',
                !isSelected && isConnected ? 'border-border' : ''
              )}
            >
              <span className="text-xl">{channel.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{channel.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {isConnected ? 'Connecté' : 'Non connecté'}
                </p>
              </div>
              {isConnected && (
                <Switch
                  checked={isSelected}
                  onCheckedChange={() => toggleChannel(channel.id)}
                  className="shrink-0"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Channel Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-5 w-5 text-primary" />
            Synchronisation Multi-Canal
          </CardTitle>
          <CardDescription>
            Publiez vos campagnes et produits sur tous vos canaux connectés en un clic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {renderChannelGroup('Réseaux Sociaux', <Globe className="h-4 w-4 text-blue-500" />, 'social', channels.filter(c => c.type === 'social'))}
              {renderChannelGroup('Boutiques', <Store className="h-4 w-4 text-green-500" />, 'store', channels.filter(c => c.type === 'store'))}
              {renderChannelGroup('Marketplaces', <Globe className="h-4 w-4 text-orange-500" />, 'marketplace', channels.filter(c => c.type === 'marketplace'))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Publish Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-5 w-5 text-primary" />
            Publication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Produit à promouvoir</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.price}€
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Message personnalisé (optionnel)</label>
              <Textarea
                placeholder="Laissez vide pour un message auto-généré"
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                className="h-[38px] min-h-[38px] resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>{selectedChannels.size} canaux sélectionnés</span>
            </div>
            <Button
              onClick={publishToChannels}
              disabled={isSyncing || selectedChannels.size === 0 || !selectedProduct}
              size="lg"
            >
              {isSyncing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publication en cours…</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Publier sur {selectedChannels.size} canaux</>
              )}
            </Button>
          </div>

          {isSyncing && (
            <div className="space-y-2">
              <Progress value={syncProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">{Math.round(syncProgress)}% terminé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Results */}
      {syncResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              Résultats de synchronisation
              <Badge variant={syncResults.every(r => r.success) ? 'default' : 'secondary'}>
                {syncResults.filter(r => r.success).length}/{syncResults.length} succès
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncResults.map((result, i) => (
                <div key={i} className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  result.success ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'
                )}>
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{CHANNEL_ICONS[result.channel] || '🔗'} {result.channel}</p>
                      {result.error && <p className="text-xs text-destructive mt-0.5">{result.error}</p>}
                    </div>
                  </div>
                  {result.postUrl && (
                    <a href={result.postUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1">
                      Voir <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Réseaux Sociaux</p>
              <p className="text-xs text-muted-foreground">{connectedSocial.length} connectés</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {connectedSocial.map(c => (
              <Badge key={c.id} variant="outline" className="text-xs">{c.icon} {c.name}</Badge>
            ))}
            {connectedSocial.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucun réseau connecté</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Store className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Boutiques</p>
              <p className="text-xs text-muted-foreground">{connectedStores.length} connectées</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {connectedStores.map(c => (
              <Badge key={c.id} variant="outline" className="text-xs">{c.icon} {c.name}</Badge>
            ))}
            {connectedStores.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucune boutique connectée</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Globe className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Marketplaces</p>
              <p className="text-xs text-muted-foreground">{connectedMarketplaces.length} connectées</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {connectedMarketplaces.map(c => (
              <Badge key={c.id} variant="outline" className="text-xs">{c.icon} {c.name}</Badge>
            ))}
            {connectedMarketplaces.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucune marketplace connectée</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
