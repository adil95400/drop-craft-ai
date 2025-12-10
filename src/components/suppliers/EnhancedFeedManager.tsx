// GESTIONNAIRE DE FEEDS STYLE CHANNABLE
// Règles de transformation, publication multi-canal, automatisation

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rss, Plus, Settings, Play, Pause, Trash2, 
  RefreshCw, Check, X, AlertTriangle, Clock,
  ChevronRight, Loader2, Eye, Download, Upload,
  Filter, Zap, Globe, BarChart3, Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getMarketplaceLogo } from './MarketplaceLogos';

// Types
interface Feed {
  id: string;
  name: string;
  channel: string;
  status: 'active' | 'paused' | 'error' | 'syncing';
  lastSync: Date;
  nextSync: Date;
  productsCount: number;
  rulesCount: number;
  errorCount: number;
}

interface TransformRule {
  id: string;
  field: string;
  condition: string;
  action: string;
  value: string;
  isActive: boolean;
}

// Canaux disponibles
const CHANNELS = [
  { id: 'google-shopping', name: 'Google Shopping', color: '#4285F4' },
  { id: 'amazon', name: 'Amazon', color: '#FF9900' },
  { id: 'ebay', name: 'eBay', color: '#0064D2' },
  { id: 'facebook', name: 'Meta Commerce', color: '#1877F2' },
  { id: 'tiktok-shop', name: 'TikTok Shop', color: '#000000' },
  { id: 'cdiscount', name: 'Cdiscount', color: '#C21A00' },
  { id: 'fnac', name: 'Fnac', color: '#E1A400' },
  { id: 'rakuten', name: 'Rakuten', color: '#BF0000' },
  { id: 'etsy', name: 'Etsy', color: '#F56400' },
];

// Composant Rule Editor
const RuleEditor = memo(({ 
  rule, 
  onUpdate, 
  onDelete 
}: { 
  rule: TransformRule; 
  onUpdate: (rule: TransformRule) => void;
  onDelete: () => void;
}) => {
  const fields = ['title', 'description', 'price', 'category', 'brand', 'images', 'stock'];
  const conditions = ['equals', 'contains', 'starts_with', 'ends_with', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'];
  const actions = ['set_value', 'append', 'prepend', 'replace', 'multiply', 'add', 'remove', 'uppercase', 'lowercase'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "p-4 rounded-lg border",
        rule.isActive ? "bg-card" : "bg-muted/50 opacity-60"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Switch 
            checked={rule.isActive}
            onCheckedChange={(checked) => onUpdate({ ...rule, isActive: checked })}
          />
          <span className="text-sm font-medium">
            {rule.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Champ</Label>
          <Select value={rule.field} onValueChange={(v) => onUpdate({ ...rule, field: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fields.map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Condition</Label>
          <Select value={rule.condition} onValueChange={(v) => onUpdate({ ...rule, condition: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {conditions.map(c => (
                <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Action</Label>
          <Select value={rule.action} onValueChange={(v) => onUpdate({ ...rule, action: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actions.map(a => (
                <SelectItem key={a} value={a}>{a.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Valeur</Label>
          <Input 
            value={rule.value}
            onChange={(e) => onUpdate({ ...rule, value: e.target.value })}
            placeholder="Valeur..."
          />
        </div>
      </div>
    </motion.div>
  );
});

RuleEditor.displayName = 'RuleEditor';

// Feed Card Component
const FeedCard = memo(({ 
  feed, 
  onManage, 
  onToggle, 
  onSync 
}: { 
  feed: Feed; 
  onManage: () => void;
  onToggle: () => void;
  onSync: () => void;
}) => {
  const statusColors = {
    active: 'bg-green-500',
    paused: 'bg-amber-500',
    error: 'bg-red-500',
    syncing: 'bg-blue-500'
  };

  const statusLabels = {
    active: 'Actif',
    paused: 'Pause',
    error: 'Erreur',
    syncing: 'Sync...'
  };

  return (
    <motion.div whileHover={{ y: -2 }}>
      <Card className="hover:shadow-lg transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {getMarketplaceLogo(feed.channel, 'md')}
              <div>
                <h3 className="font-semibold">{feed.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">{feed.channel.replace('-', ' ')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", statusColors[feed.status])} />
              <span className="text-xs text-muted-foreground">{statusLabels[feed.status]}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div>
              <p className="text-lg font-bold">{feed.productsCount}</p>
              <p className="text-[10px] text-muted-foreground">Produits</p>
            </div>
            <div>
              <p className="text-lg font-bold">{feed.rulesCount}</p>
              <p className="text-[10px] text-muted-foreground">Règles</p>
            </div>
            <div>
              <p className={cn("text-lg font-bold", feed.errorCount > 0 && "text-red-500")}>
                {feed.errorCount}
              </p>
              <p className="text-[10px] text-muted-foreground">Erreurs</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Dernière sync: {new Date(feed.lastSync).toLocaleString('fr-FR')}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onManage}>
              <Settings className="h-4 w-4 mr-1" />
              Gérer
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={onToggle}
            >
              {feed.status === 'active' ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={onSync}
              disabled={feed.status === 'syncing'}
            >
              <RefreshCw className={cn("h-4 w-4", feed.status === 'syncing' && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

FeedCard.displayName = 'FeedCard';

// Main Component
export const EnhancedFeedManager = memo(() => {
  const [feeds, setFeeds] = useState<Feed[]>([
    {
      id: '1',
      name: 'Catalogue Principal',
      channel: 'google-shopping',
      status: 'active',
      lastSync: new Date(Date.now() - 3600000),
      nextSync: new Date(Date.now() + 3600000),
      productsCount: 1250,
      rulesCount: 8,
      errorCount: 0
    },
    {
      id: '2',
      name: 'Mode & Accessoires',
      channel: 'amazon',
      status: 'active',
      lastSync: new Date(Date.now() - 7200000),
      nextSync: new Date(Date.now() + 1800000),
      productsCount: 450,
      rulesCount: 12,
      errorCount: 3
    },
    {
      id: '3',
      name: 'Électronique',
      channel: 'ebay',
      status: 'paused',
      lastSync: new Date(Date.now() - 86400000),
      nextSync: new Date(Date.now() + 86400000),
      productsCount: 320,
      rulesCount: 5,
      errorCount: 0
    }
  ]);

  const [rules, setRules] = useState<TransformRule[]>([
    { id: '1', field: 'title', condition: 'is_not_empty', action: 'prepend', value: '[PROMO] ', isActive: true },
    { id: '2', field: 'price', condition: 'greater_than', action: 'multiply', value: '0.9', isActive: true },
    { id: '3', field: 'description', condition: 'contains', action: 'replace', value: 'livraison gratuite', isActive: false },
  ]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [newFeedName, setNewFeedName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFeed = async () => {
    if (!selectedChannel || !newFeedName) return;
    
    setIsCreating(true);
    toast.loading('Création du feed...', { id: 'create-feed' });
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newFeed: Feed = {
      id: Date.now().toString(),
      name: newFeedName,
      channel: selectedChannel,
      status: 'active',
      lastSync: new Date(),
      nextSync: new Date(Date.now() + 3600000),
      productsCount: 0,
      rulesCount: 0,
      errorCount: 0
    };
    
    setFeeds([...feeds, newFeed]);
    setShowCreateDialog(false);
    setNewFeedName('');
    setSelectedChannel('');
    setIsCreating(false);
    
    toast.success('Feed créé avec succès', { id: 'create-feed' });
  };

  const handleToggleFeed = (feedId: string) => {
    setFeeds(feeds.map(f => {
      if (f.id === feedId) {
        const newStatus = f.status === 'active' ? 'paused' : 'active';
        toast.success(newStatus === 'active' ? 'Feed activé' : 'Feed mis en pause');
        return { ...f, status: newStatus };
      }
      return f;
    }));
  };

  const handleSyncFeed = async (feedId: string) => {
    setFeeds(feeds.map(f => f.id === feedId ? { ...f, status: 'syncing' as const } : f));
    toast.loading('Synchronisation en cours...', { id: `sync-${feedId}` });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setFeeds(feeds.map(f => f.id === feedId ? { 
      ...f, 
      status: 'active' as const, 
      lastSync: new Date() 
    } : f));
    
    toast.success('Synchronisation terminée', { id: `sync-${feedId}` });
  };

  const addRule = () => {
    const newRule: TransformRule = {
      id: Date.now().toString(),
      field: 'title',
      condition: 'is_not_empty',
      action: 'set_value',
      value: '',
      isActive: true
    };
    setRules([...rules, newRule]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
              <Rss className="h-6 w-6 text-white" />
            </div>
            Feed Manager
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez vos flux produits multi-canal style Channable
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Feed
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{feeds.length}</p>
            <p className="text-sm text-muted-foreground">Feeds actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {feeds.reduce((sum, f) => sum + f.productsCount, 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Produits publiés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{rules.length}</p>
            <p className="text-sm text-muted-foreground">Règles actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">
              {feeds.reduce((sum, f) => sum + f.errorCount, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Erreurs</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feeds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feeds" className="gap-2">
            <Globe className="h-4 w-4" />
            Mes Feeds
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Filter className="h-4 w-4" />
            Règles
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feeds">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeds.map(feed => (
              <FeedCard
                key={feed.id}
                feed={feed}
                onManage={() => toast.info(`Gestion du feed ${feed.name}`)}
                onToggle={() => handleToggleFeed(feed.id)}
                onSync={() => handleSyncFeed(feed.id)}
              />
            ))}
            
            {/* Add Feed Card */}
            <Card 
              className="border-dashed cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center min-h-[200px]"
              onClick={() => setShowCreateDialog(true)}
            >
              <CardContent className="text-center p-6">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Ajouter un feed</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Règles de transformation</CardTitle>
                <CardDescription>
                  Transformez automatiquement vos données produits avant publication
                </CardDescription>
              </div>
              <Button onClick={addRule}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle règle
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {rules.map(rule => (
                    <RuleEditor
                      key={rule.id}
                      rule={rule}
                      onUpdate={(updated) => setRules(rules.map(r => r.id === rule.id ? updated : r))}
                      onDelete={() => setRules(rules.filter(r => r.id !== rule.id))}
                    />
                  ))}
                </AnimatePresence>
                
                {rules.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune règle définie</p>
                    <Button variant="outline" className="mt-4" onClick={addRule}>
                      Créer une règle
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analytics des feeds</h3>
              <p className="text-muted-foreground mb-4">
                Suivez les performances de vos publications multi-canal
              </p>
              <Button variant="outline">
                Voir les statistiques détaillées
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Feed Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau feed</DialogTitle>
            <DialogDescription>
              Sélectionnez un canal et configurez votre flux produits
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Nom du feed</Label>
              <Input 
                value={newFeedName}
                onChange={(e) => setNewFeedName(e.target.value)}
                placeholder="Ex: Catalogue Principal"
              />
            </div>
            
            <div>
              <Label>Canal de publication</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {CHANNELS.map(channel => (
                  <div
                    key={channel.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all text-center",
                      selectedChannel === channel.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    )}
                    onClick={() => setSelectedChannel(channel.id)}
                  >
                    <div className="mx-auto mb-2">
                      {getMarketplaceLogo(channel.id, 'sm')}
                    </div>
                    <p className="text-xs font-medium">{channel.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateFeed}
              disabled={!selectedChannel || !newFeedName || isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Créer le feed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

EnhancedFeedManager.displayName = 'EnhancedFeedManager';

export default EnhancedFeedManager;
