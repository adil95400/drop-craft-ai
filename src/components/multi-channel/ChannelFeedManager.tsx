import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Layers, Filter, CheckCircle2, TrendingUp, Plus, Loader2
} from 'lucide-react';
import { ChannelCard, ChannelData } from '@/components/feed-management/ChannelCard';
import { FeedRulesPanel } from '@/components/feed-management/FeedRulesPanel';
import { QualityScoreCard } from '@/components/feed-management/QualityScoreCard';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export function ChannelFeedManager() {
  const { user } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('channels');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  // Fetch real integrations as channels
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['channel-integrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch product channel mapping stats
  const { data: mappingStats = {} } = useQuery({
    queryKey: ['channel-mapping-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_channel_mappings')
        .select('channel_id, sync_status')
        .eq('user_id', user!.id);
      if (error) throw error;
      const stats: Record<string, { total: number; approved: number; pending: number; rejected: number }> = {};
      data?.forEach(m => {
        if (!stats[m.channel_id]) stats[m.channel_id] = { total: 0, approved: 0, pending: 0, rejected: 0 };
        stats[m.channel_id].total++;
        if (m.sync_status === 'synced') stats[m.channel_id].approved++;
        else if (m.sync_status === 'pending') stats[m.channel_id].pending++;
        else if (m.sync_status === 'error') stats[m.channel_id].rejected++;
      });
      return stats;
    },
    enabled: !!user?.id,
  });

  // Transform integrations to ChannelData format
  const channels: ChannelData[] = useMemo(() => {
    return integrations.map(i => {
      const stats = mappingStats[i.id] || { total: 0, approved: 0, pending: 0, rejected: 0 };
      return {
        id: i.id,
        name: (i as any).name || i.platform,
        platform: i.platform,
        status: (i as any).is_active ? 'active' : 'error',
        products: stats,
        lastSync: (i as any).last_sync_at || i.updated_at,
        qualityScore: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0,
        rules: 0,
      };
    });
  }, [integrations, mappingStats]);

  // Compute quality metrics from real product data
  const { data: qualityData } = useQuery({
    queryKey: ['channel-quality', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('title, description, main_image_url, sku, price, category')
        .eq('user_id', user!.id)
        .limit(500);
      if (error) throw error;

      const total = data?.length || 1;
      const withTitle = data?.filter(p => p.title && p.title.length > 10).length || 0;
      const withDesc = data?.filter(p => p.description && p.description.length > 100).length || 0;
      const withImage = data?.filter(p => p.main_image_url).length || 0;
      const withPrice = data?.filter(p => p.price && p.price > 0).length || 0;
      const withCategory = data?.filter(p => p.category).length || 0;
      const withSku = data?.filter(p => p.sku).length || 0;

      return {
        metrics: [
          { name: 'Titres', score: Math.round((withTitle / total) * 100), maxScore: 100, description: 'Titres optimisés et complets' },
          { name: 'Descriptions', score: Math.round((withDesc / total) * 100), maxScore: 100, description: 'Descriptions détaillées' },
          { name: 'Images', score: Math.round((withImage / total) * 100), maxScore: 100, description: 'Images haute résolution' },
          { name: 'Prix', score: Math.round((withPrice / total) * 100), maxScore: 100, description: 'Prix valides et formatés' },
          { name: 'Catégories', score: Math.round((withCategory / total) * 100), maxScore: 100, description: 'Mapping catégories' },
          { name: 'Identifiants', score: Math.round((withSku / total) * 100), maxScore: 100, description: 'SKU/GTIN présents' },
        ],
        issues: [
          ...(total - withCategory > 0 ? [{ id: '1', type: 'error' as const, message: 'Catégorie manquante', affectedProducts: total - withCategory, field: 'category', suggestion: 'Ajouter une catégorie à tous les produits' }] : []),
          ...(total - withDesc > 0 ? [{ id: '2', type: 'warning' as const, message: 'Description courte (<100 car.)', affectedProducts: total - withDesc, field: 'description', suggestion: 'Enrichir les descriptions' }] : []),
          ...(total - withImage > 0 ? [{ id: '3', type: 'warning' as const, message: 'Image manquante', affectedProducts: total - withImage, field: 'image', suggestion: 'Ajouter des images' }] : []),
          ...(total - withSku > 0 ? [{ id: '4', type: 'info' as const, message: 'SKU manquant', affectedProducts: total - withSku, field: 'sku', suggestion: 'Ajouter le SKU pour améliorer le référencement' }] : []),
        ],
        totalProducts: total,
      };
    },
    enabled: !!user?.id,
  });

  const qualityMetrics = qualityData?.metrics || [];
  const qualityIssues = qualityData?.issues || [];
  const totalProducts = qualityData?.totalProducts || 0;

  const overallQualityScore = qualityMetrics.length > 0
    ? Math.round(qualityMetrics.reduce((sum, m) => sum + m.score, 0) / qualityMetrics.length)
    : 0;

  const handleChannelSync = (channelId: string) => {
    console.log('Syncing channel:', channelId);
  };

  const handleChannelSettings = (channelId: string) => {
    setSelectedChannel(channelId);
  };

  const handleViewIssue = (issueId: string) => {
    console.log('Viewing issue:', issueId);
  };

  const handleFixIssue = (issueId: string) => {
    console.log('Fixing issue:', issueId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canaux actifs</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">sur {channels.length} canaux configurés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits publiés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {channels.reduce((sum, c) => sum + c.products.approved, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">
                {channels.reduce((sum, c) => sum + c.products.rejected, 0)} erreurs
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score qualité</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallQualityScore}%</div>
            <Progress value={overallQualityScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits catalogue</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">analysés</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="channels">Canaux</TabsTrigger>
            <TabsTrigger value="rules">Règles de feed</TabsTrigger>
            <TabsTrigger value="quality">Qualité</TabsTrigger>
          </TabsList>
          <Button><Plus className="mr-2 h-4 w-4" /> Ajouter un canal</Button>
        </div>

        <TabsContent value="channels" className="space-y-4">
          {channels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Aucun canal configuré</p>
              <p className="text-sm mt-1">Connectez vos boutiques pour gérer vos flux produits</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map(channel => (
                <ChannelCard key={channel.id} channel={channel} onSync={handleChannelSync} onEdit={handleChannelSettings} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules">
          <FeedRulesPanel channelId={selectedChannel || 'default'} />
        </TabsContent>

        <TabsContent value="quality">
          <div className="grid grid-cols-1 gap-6">
            <QualityScoreCard 
              score={overallQualityScore}
              metrics={qualityMetrics}
              issues={qualityIssues}
              totalProducts={totalProducts}
              onViewIssue={handleViewIssue}
              onFixIssue={handleFixIssue}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
