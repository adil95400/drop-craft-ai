import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Megaphone, Sparkles, FlaskConical, TrendingUp, Plus, Play, Pause, 
  DollarSign, Eye, MousePointer, Target, RefreshCw, BarChart3, Zap,
  ArrowUpRight, ArrowDownRight, Users, ShoppingCart
} from 'lucide-react';
import { useRealAdsManager } from '@/hooks/useRealAdsManager';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { CreateCampaignDialog } from '@/components/ads/CreateCampaignDialog';
import { AdsPerformanceCharts } from '@/components/ads/AdsPerformanceCharts';
import { AdsCreativeStudio } from '@/components/ads/AdsCreativeStudio';
import { AdsABTesting } from '@/components/ads/AdsABTesting';
import { cn } from '@/lib/utils';

const PLATFORM_ICONS: Record<string, string> = {
  google: '🔍', facebook: '📘', instagram: '📸', tiktok: '🎵',
};

export default function AdsManagerPage() {
  const { campaigns, metrics, platformPerformance, isLoading, refetch } = useRealAdsManager();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const stats = metrics ? {
    totalSpend: metrics.total_spent,
    totalImpressions: metrics.total_impressions,
    totalClicks: metrics.total_clicks,
    totalConversions: metrics.total_conversions,
    avgCTR: metrics.avg_ctr,
    avgCPC: metrics.avg_cpc,
    avgROAS: metrics.avg_roas,
    activeCampaigns: metrics.active_campaigns,
    totalCampaigns: metrics.total_campaigns,
  } : null;

  const toggleCampaign = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.from('ad_campaigns').update({ status: newStatus }).eq('id', id);
      refetch();
    } catch (_) { /* handled */ }
  };

  const fmt = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      active: { label: 'Actif', variant: 'default' },
      paused: { label: 'En pause', variant: 'secondary' },
      completed: { label: 'Terminé', variant: 'outline' },
      draft: { label: 'Brouillon', variant: 'outline' },
    };
    const s = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={s.variant} className={status === 'active' ? 'bg-success hover:bg-success' : ''}>{s.label}</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>AI Ads Manager - Automatisation & Optimisation</title>
        <meta name="description" content="Gérez vos campagnes publicitaires avec l'IA : création automatique, A/B testing et optimisation en temps réel" />
      </Helmet>

      <ChannablePageWrapper
        title="AI Ads Manager"
        subtitle="Marketing"
        description="Gérez et optimisez vos campagnes publicitaires multi-plateformes avec l'IA"
        heroImage="marketing"
        badge={{ label: "AI Powered", icon: Sparkles }}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Campagne
            </Button>
          </div>
        }
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-24" /></CardContent></Card>
            ))
          ) : (
            <>
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Dépenses totales</span>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{fmt(stats?.totalSpend || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.activeCampaigns || 0} campagnes actives</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Impressions</span>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{(stats?.totalImpressions || 0).toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Clics</span>
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{(stats?.totalClicks || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">CTR: {(stats?.avgCTR || 0).toFixed(2)}%</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Conversions</span>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{(stats?.totalConversions || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">CPC: {fmt(stats?.avgCPC || 0)}</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-success">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">ROAS moyen</span>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-2xl font-bold text-success">{(stats?.avgROAS || 0).toFixed(2)}x</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Campagnes</span>
            </TabsTrigger>
            <TabsTrigger value="creatives" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Studio Créatif</span>
            </TabsTrigger>
            <TabsTrigger value="abtesting" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">A/B Testing</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
          </TabsList>

          {/* CAMPAIGNS TAB */}
          <TabsContent value="campaigns" className="mt-6 space-y-4">
            {/* Platform filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="cursor-pointer">Toutes ({stats?.totalCampaigns || 0})</Badge>
              {platformPerformance.map(p => (
                <Badge key={p.platform} variant="outline" className="cursor-pointer">
                  {PLATFORM_ICONS[p.platform] || '📢'} {p.platform} ({p.campaigns})
                </Badge>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-48 mb-4" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
                ))}
              </div>
            ) : !campaigns || campaigns.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2">
                <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold text-lg mb-2">Aucune campagne</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Créez votre première campagne publicitaire et commencez à générer du trafic qualifié vers vos produits.
                </p>
                <Button size="lg" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer ma première campagne
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign: any) => {
                  const spentPct = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
                  return (
                    <Card key={campaign.id} className="hover:shadow-lg transition-all group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-xl">{PLATFORM_ICONS[campaign.platform] || '📢'}</span>
                              <h3 className="font-semibold text-lg">{campaign.name}</h3>
                              {getStatusBadge(campaign.status)}
                            </div>
                            <p className="text-sm text-muted-foreground ml-9">
                              {campaign.start_date && new Date(campaign.start_date).toLocaleDateString('fr-FR')}
                              {campaign.end_date && ` → ${new Date(campaign.end_date).toLocaleDateString('fr-FR')}`}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCampaign(campaign.id, campaign.status)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Budget</p>
                            <p className="font-semibold">{fmt(campaign.budget || 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Dépensé</p>
                            <p className="font-semibold">{fmt(campaign.spent || 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Impressions</p>
                            <p className="font-semibold">{(campaign.impressions || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">CTR</p>
                            <p className="font-semibold">{(campaign.ctr || 0).toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">ROAS</p>
                            <p className={cn('font-semibold', (campaign.roas || 0) >= 2 ? 'text-success' : (campaign.roas || 0) >= 1 ? 'text-foreground' : 'text-destructive')}>
                              {(campaign.roas || 0).toFixed(2)}x
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Budget consommé</span>
                            <span className="font-medium">{spentPct.toFixed(0)}%</span>
                          </div>
                          <Progress value={Math.min(spentPct, 100)} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* CREATIVES TAB */}
          <TabsContent value="creatives" className="mt-6">
            <AdsCreativeStudio />
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
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Détail par plateforme</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left p-2">Plateforme</th>
                          <th className="text-right p-2">Campagnes</th>
                          <th className="text-right p-2">Dépensé</th>
                          <th className="text-right p-2">Revenue</th>
                          <th className="text-right p-2">ROAS</th>
                          <th className="text-right p-2">Conversions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformPerformance.map(p => (
                          <tr key={p.platform} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-2 font-medium">{PLATFORM_ICONS[p.platform] || '📢'} {p.platform}</td>
                            <td className="p-2 text-right">{p.campaigns}</td>
                            <td className="p-2 text-right">{fmt(p.spent)}</td>
                            <td className="p-2 text-right">{fmt(p.revenue)}</td>
                            <td className="p-2 text-right">
                              <span className={cn(p.roas >= 2 ? 'text-success' : p.roas >= 1 ? '' : 'text-destructive', 'font-semibold')}>
                                {p.roas.toFixed(2)}x
                              </span>
                            </td>
                            <td className="p-2 text-right">{p.conversions}</td>
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
        onOpenChange={setShowCreateDialog}
        onSuccess={() => refetch()}
      />
    </>
  );
}
