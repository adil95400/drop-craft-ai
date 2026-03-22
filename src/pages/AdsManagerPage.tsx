import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Megaphone, Sparkles, FlaskConical, TrendingUp, Plus, Play, Pause, 
  DollarSign, Eye, MousePointer, RefreshCw, BarChart3,
  ShoppingCart, Target, Settings2, MoreHorizontal, ExternalLink, Calendar,
  Share2, Palette
} from 'lucide-react';
import { useRealAdsManager } from '@/hooks/useRealAdsManager';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { CreateCampaignDialog } from '@/components/ads/CreateCampaignDialog';
import { AdsPerformanceCharts } from '@/components/ads/AdsPerformanceCharts';
import { AdsCreativeStudio } from '@/components/ads/AdsCreativeStudio';
import { AdsABTesting } from '@/components/ads/AdsABTesting';
import { AdsAudienceBuilder } from '@/components/ads/AdsAudienceBuilder';
import { AdsMarketingSync } from '@/components/ads/AdsMarketingSync';
import { AdsCanvaStudio } from '@/components/ads/AdsCanvaStudio';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const PLATFORM_ICONS: Record<string, string> = {
  google: '🔍', facebook: '📘', instagram: '📸', tiktok: '🎵',
};
const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google Ads', facebook: 'Meta Ads', instagram: 'Instagram', tiktok: 'TikTok',
};

export default function AdsManagerPage() {
  const { t: tPages } = useTranslation('pages');
  const { campaigns, metrics, platformPerformance, isLoading, refetch } = useRealAdsManager();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);

  const stats = metrics;

  const filteredCampaigns = platformFilter
    ? campaigns.filter((c: any) => c.platform === platformFilter)
    : campaigns;

  const toggleCampaign = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.from('ad_campaigns').update({ status: newStatus }).eq('id', id);
      refetch();
    } catch (_) { /* handled */ }
  };

  const fmt = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  const fmtShort = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      active: { label: 'Actif', cls: 'bg-success/15 text-success border-success/30' },
      paused: { label: 'Pause', cls: 'bg-orange-500/10 text-orange-600 border-orange-200' },
      completed: { label: 'Terminé', cls: 'bg-muted text-muted-foreground' },
      draft: { label: 'Brouillon', cls: 'bg-muted text-muted-foreground' },
    };
    const s = map[status] || { label: status, cls: '' };
    return <Badge variant="outline" className={cn('text-[11px] font-medium', s.cls)}>{s.label}</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>AI Ads Manager - Gestion Publicitaire Multi-Plateformes</title>
        <meta name="description" content="Gérez vos campagnes publicitaires Google, Meta, TikTok avec l'IA : création automatique, A/B testing et optimisation en temps réel" />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('aiAdsManager.title')}
        subtitle={tPages('marketing.title')}
        description="Gérez et optimisez vos campagnes publicitaires multi-plateformes avec l'IA"
        heroImage="marketing"
        badge={{ label: "AI Powered", icon: Sparkles }}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />Sync
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />Nouvelle Campagne
            </Button>
          </div>
        }
      >
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i}><CardContent className="p-3"><Skeleton className="h-4 w-16 mb-1.5" /><Skeleton className="h-7 w-20" /></CardContent></Card>
            ))
          ) : (
            <>
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Dépenses</span>
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold mt-0.5">{fmt(stats?.total_spent || 0)}</p>
                  <p className="text-[10px] text-muted-foreground">{stats?.active_campaigns || 0} actives / {stats?.total_campaigns || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Impressions</span>
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold mt-0.5">{fmtShort(stats?.total_impressions || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Clics</span>
                    <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold mt-0.5">{fmtShort(stats?.total_clicks || 0)}</p>
                  <p className="text-[10px] text-muted-foreground">CTR: {(stats?.avg_ctr || 0).toFixed(2)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Conversions</span>
                    <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold mt-0.5">{stats?.total_conversions || 0}</p>
                  <p className="text-[10px] text-muted-foreground">CPC: {fmt(stats?.avg_cpc || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-success">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">ROAS</span>
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                  </div>
                  <p className="text-xl font-bold text-success mt-0.5">{(stats?.avg_roas || 0).toFixed(2)}x</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Budget total</span>
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold mt-0.5">{fmt(stats?.total_budget || 0)}</p>
                  <p className="text-[10px] text-muted-foreground">{stats?.total_budget && stats?.total_spent ? ((stats.total_spent / stats.total_budget) * 100).toFixed(0) : 0}% consommé</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid grid-cols-7 w-full max-w-4xl">
            <TabsTrigger value="campaigns" className="flex items-center gap-1.5">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Campagnes</span>
            </TabsTrigger>
            <TabsTrigger value="audience" className="flex items-center gap-1.5">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Audiences</span>
            </TabsTrigger>
            <TabsTrigger value="creatives" className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Studio IA</span>
            </TabsTrigger>
            <TabsTrigger value="canva" className="flex items-center gap-1.5">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Canva</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-1.5">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Sync</span>
            </TabsTrigger>
            <TabsTrigger value="abtesting" className="flex items-center gap-1.5">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">A/B Tests</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
          </TabsList>

          {/* CAMPAIGNS TAB */}
          <TabsContent value="campaigns" className="mt-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setPlatformFilter(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    !platformFilter ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'
                  )}
                >
                  Toutes ({stats?.total_campaigns || 0})
                </button>
                {platformPerformance.map(p => (
                  <button
                    key={p.platform}
                    onClick={() => setPlatformFilter(platformFilter === p.platform ? null : p.platform)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      platformFilter === p.platform ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'
                    )}
                  >
                    {PLATFORM_ICONS[p.platform]} {PLATFORM_LABELS[p.platform] || p.platform} ({p.campaigns})
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <Card key={i}><CardContent className="p-5"><Skeleton className="h-5 w-48 mb-3" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
                ))}
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2">
                <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <h3 className="font-semibold text-lg mb-2">
                  {platformFilter ? `Aucune campagne ${PLATFORM_LABELS[platformFilter] || platformFilter}` : 'Aucune campagne'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                  Créez votre première campagne publicitaire et commencez à générer du trafic qualifié.
                </p>
                <Button size="lg" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />Créer ma première campagne
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredCampaigns.map((campaign: any) => {
                  const spentPct = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
                  return (
                    <Card key={campaign.id} className="hover:shadow-md transition-all group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                              {PLATFORM_ICONS[campaign.platform] || '📢'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold truncate">{campaign.name}</h3>
                                {getStatusBadge(campaign.status)}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{PLATFORM_LABELS[campaign.platform] || campaign.platform}</span>
                                {campaign.start_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(campaign.start_date).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleCampaign(campaign.id, campaign.status)}
                            >
                              {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Settings2 className="h-4 w-4 mr-2" />Modifier</DropdownMenuItem>
                                <DropdownMenuItem><BarChart3 className="h-4 w-4 mr-2" />Rapport détaillé</DropdownMenuItem>
                                <DropdownMenuItem><ExternalLink className="h-4 w-4 mr-2" />Voir sur la plateforme</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Budget</p>
                            <p className="font-semibold text-sm">{fmt(campaign.budget || 0)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dépensé</p>
                            <p className="font-semibold text-sm">{fmt(campaign.spent || 0)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Impressions</p>
                            <p className="font-semibold text-sm">{fmtShort(campaign.impressions || 0)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Clics</p>
                            <p className="font-semibold text-sm">{fmtShort(campaign.clicks || 0)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CTR</p>
                            <p className="font-semibold text-sm">{(campaign.ctr || 0).toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ROAS</p>
                            <p className={cn('font-bold text-sm', (campaign.roas || 0) >= 2 ? 'text-success' : (campaign.roas || 0) >= 1 ? '' : 'text-destructive')}>
                              {(campaign.roas || 0).toFixed(2)}x
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Budget consommé</span>
                            <span className={cn('font-medium', spentPct > 90 ? 'text-destructive' : '')}>{spentPct.toFixed(0)}%</span>
                          </div>
                          <Progress value={Math.min(spentPct, 100)} className="h-1" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* AUDIENCE TAB */}
          <TabsContent value="audience" className="mt-6">
            <AdsAudienceBuilder />
          </TabsContent>

          {/* CREATIVES TAB */}
          <TabsContent value="creatives" className="mt-6">
            <AdsCreativeStudio />
          </TabsContent>

          {/* CANVA TAB */}
          <TabsContent value="canva" className="mt-6">
            <AdsCanvaStudio />
          </TabsContent>

          {/* SYNC TAB */}
          <TabsContent value="sync" className="mt-6">
            <AdsMarketingSync />
          </TabsContent>

          {/* A/B TESTING TAB */}
          <TabsContent value="abtesting" className="mt-6">
            <AdsABTesting />
          </TabsContent>

          {/* PERFORMANCE TAB */}
          <TabsContent value="performance" className="mt-6 space-y-6">
            <AdsPerformanceCharts platformPerformance={platformPerformance} campaigns={campaigns} />

            {/* Platform breakdown table */}
            {platformPerformance.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-medium text-xs text-muted-foreground">Plateforme</th>
                          <th className="text-right p-3 font-medium text-xs text-muted-foreground">Campagnes</th>
                          <th className="text-right p-3 font-medium text-xs text-muted-foreground">Dépensé</th>
                          <th className="text-right p-3 font-medium text-xs text-muted-foreground">Revenue</th>
                          <th className="text-right p-3 font-medium text-xs text-muted-foreground">ROAS</th>
                          <th className="text-right p-3 font-medium text-xs text-muted-foreground">Conversions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformPerformance.map(p => (
                          <tr key={p.platform} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-medium">
                              <span className="mr-2">{PLATFORM_ICONS[p.platform]}</span>
                              {PLATFORM_LABELS[p.platform] || p.platform}
                            </td>
                            <td className="p-3 text-right">{p.campaigns}</td>
                            <td className="p-3 text-right">{fmt(p.spent)}</td>
                            <td className="p-3 text-right">{fmt(p.revenue)}</td>
                            <td className="p-3 text-right">
                              <span className={cn('font-bold', p.roas >= 2 ? 'text-success' : p.roas >= 1 ? '' : 'text-destructive')}>
                                {p.roas.toFixed(2)}x
                              </span>
                            </td>
                            <td className="p-3 text-right">{p.conversions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>

      <CreateCampaignDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) refetch();
        }}
      />
    </>
  );
}
