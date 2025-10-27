import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Rss, 
  Plus, 
  PlayCircle, 
  PauseCircle,
  Settings,
  TrendingUp,
  Target,
  Zap,
  FileText,
  BarChart3,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface Feed {
  id: string;
  name: string;
  platform: string;
  format: string;
  status: string;
  product_count: number;
  last_generated_at: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

const platformIcons: Record<string, string> = {
  amazon: '🛒',
  ebay: '🔨',
  etsy: '🎨',
  facebook: '👥',
  google: '🔍',
  cdiscount: '🛍️',
  allegro: '⚡',
  manomano: '🔧'
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  draft: 'bg-gray-500',
  paused: 'bg-yellow-500',
  error: 'bg-red-500',
  generating: 'bg-blue-500'
};

export default function FeedManager() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const [newFeed, setNewFeed] = useState({
    name: '',
    platform: 'amazon',
    format: 'xml',
    target_country: 'FR',
    optimize_titles: true,
    optimize_descriptions: true,
    auto_categorize: true,
    update_frequency_hours: 24
  });

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('marketplace_feeds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeeds(data || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createFeed = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('feed-manager', {
        body: { 
          action: 'create_feed',
          feed_data: newFeed
        }
      });

      if (error) throw error;
      
      toast({
        title: '✨ Feed créé',
        description: `Feed ${newFeed.name} créé avec succès`,
      });
      
      setShowCreateDialog(false);
      await loadFeeds();
    } catch (error: any) {
      toast({
        title: 'Erreur de création',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const generateFeed = async (feedId: string) => {
    setGenerating(feedId);
    try {
      const { data, error } = await supabase.functions.invoke('feed-manager', {
        body: { 
          action: 'generate_feed',
          feed_id: feedId
        }
      });

      if (error) throw error;
      
      toast({
        title: '🚀 Feed généré',
        description: `${data.products_optimized} produits optimisés (SEO: ${data.avg_seo_score}/1.0)`,
      });
      
      await loadFeeds();
    } catch (error: any) {
      toast({
        title: 'Erreur de génération',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setGenerating(null);
    }
  };

  const autoMapCategories = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('feed-manager', {
        body: { action: 'auto_map_categories' }
      });

      if (error) throw error;
      
      toast({
        title: '🎯 Mapping automatique terminé',
        description: `${data.mappings_created} correspondances créées`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const FeedCard = ({ feed }: { feed: Feed }) => {
    const ctr = feed.impressions > 0 ? ((feed.clicks / feed.impressions) * 100).toFixed(2) : '0.00';
    const convRate = feed.clicks > 0 ? ((feed.conversions / feed.clicks) * 100).toFixed(2) : '0.00';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{platformIcons[feed.platform]}</div>
              <div>
                <h3 className="text-lg font-bold">{feed.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {feed.format.toUpperCase()}
                  </Badge>
                  <Badge className={`${statusColors[feed.status]} text-white border-0`}>
                    {feed.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => generateFeed(feed.id)}
                disabled={generating === feed.id}
              >
                {generating === feed.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Produits</p>
                <p className="text-lg font-bold">{feed.product_count}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Impressions</p>
                <p className="text-lg font-bold">{feed.impressions.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">CTR</p>
                <p className="text-lg font-bold">{ctr}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Conversion</p>
                <p className="text-lg font-bold">{convRate}%</p>
              </div>
            </div>
          </div>

          {feed.last_generated_at && (
            <p className="text-xs text-muted-foreground">
              Dernière mise à jour: {new Date(feed.last_generated_at).toLocaleDateString('fr-FR')}
            </p>
          )}
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Rss className="h-8 w-8 text-primary" />
            Gestion de Feeds
          </h1>
          <p className="text-muted-foreground mt-2">
            Optimisez vos produits pour chaque marketplace avec SEO automatique
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={autoMapCategories}>
            <Zap className="h-4 w-4 mr-2" />
            Auto-mapping
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Feed
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau feed</DialogTitle>
                <DialogDescription>
                  Configurez votre feed marketplace avec optimisation SEO automatique
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label>Nom du feed</Label>
                  <Input 
                    value={newFeed.name}
                    onChange={(e) => setNewFeed({...newFeed, name: e.target.value})}
                    placeholder="Mon feed Amazon FR"
                  />
                </div>

                <div>
                  <Label>Plateforme</Label>
                  <Select value={newFeed.platform} onValueChange={(v) => setNewFeed({...newFeed, platform: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amazon">🛒 Amazon</SelectItem>
                      <SelectItem value="ebay">🔨 eBay</SelectItem>
                      <SelectItem value="etsy">🎨 Etsy</SelectItem>
                      <SelectItem value="facebook">👥 Facebook</SelectItem>
                      <SelectItem value="google">🔍 Google Shopping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Format</Label>
                  <Select value={newFeed.format} onValueChange={(v) => setNewFeed({...newFeed, format: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Optimiser les titres</Label>
                    <Switch 
                      checked={newFeed.optimize_titles}
                      onCheckedChange={(v) => setNewFeed({...newFeed, optimize_titles: v})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Optimiser les descriptions</Label>
                    <Switch 
                      checked={newFeed.optimize_descriptions}
                      onCheckedChange={(v) => setNewFeed({...newFeed, optimize_descriptions: v})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Catégorisation automatique</Label>
                    <Switch 
                      checked={newFeed.auto_categorize}
                      onCheckedChange={(v) => setNewFeed({...newFeed, auto_categorize: v})}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={createFeed} className="bg-gradient-primary">
                  Créer le feed
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Rss className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Feeds actifs</p>
              <p className="text-2xl font-bold">{feeds.filter(f => f.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produits optimisés</p>
              <p className="text-2xl font-bold">
                {feeds.reduce((sum, f) => sum + f.product_count, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total impressions</p>
              <p className="text-2xl font-bold">
                {feeds.reduce((sum, f) => sum + f.impressions, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">
                {feeds.reduce((sum, f) => sum + f.conversions, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Feeds Grid */}
      {feeds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feeds.map(feed => (
            <FeedCard key={feed.id} feed={feed} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Rss className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucun feed configuré</h3>
          <p className="text-muted-foreground mb-6">
            Créez votre premier feed pour optimiser vos produits sur les marketplaces
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Créer un feed
          </Button>
        </Card>
      )}
    </div>
  );
}

const Package = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);