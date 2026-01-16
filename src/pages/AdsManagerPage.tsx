import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Megaphone, Sparkles, FlaskConical, TrendingUp, Plus, Play, Pause, 
  DollarSign, Eye, MousePointer, Target, RefreshCw 
} from 'lucide-react';
import { useRealAdsManager } from '@/hooks/useRealAdsManager';
import { cn } from '@/lib/utils';

export default function AdsManagerPage() {
  const { campaigns, metrics, isLoading, refetch } = useRealAdsManager();
  const stats = metrics ? {
    totalSpend: metrics.total_spent,
    totalImpressions: metrics.total_impressions,
    totalClicks: metrics.total_clicks,
    avgCTR: metrics.avg_ctr,
    avgROAS: metrics.avg_roas
  } : null;
  const toggleCampaign = (id: string, status: string) => console.log('Toggle', id, status);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Actif</Badge>;
      case 'paused':
        return <Badge variant="secondary">En pause</Badge>;
      case 'completed':
        return <Badge variant="outline">Terminé</Badge>;
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>AI Ads Manager - Automatisation & Optimisation</title>
        <meta name="description" content="Gérez vos campagnes publicitaires avec l'IA : création automatique, A/B testing et optimisation en temps réel" />
      </Helmet>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">AI Ads Manager</h1>
              <p className="text-muted-foreground mt-2">
                Gérez et optimisez vos campagnes publicitaires avec l'IA
              </p>
            </div>
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
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs">Dépenses totales</span>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.totalSpend || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">Impressions</span>
                    </div>
                    <p className="text-2xl font-bold">{(stats?.totalImpressions || 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <MousePointer className="h-4 w-4" />
                      <span className="text-xs">Clics</span>
                    </div>
                    <p className="text-2xl font-bold">{(stats?.totalClicks || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">CTR: {(stats?.avgCTR || 0).toFixed(2)}%</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">ROAS moyen</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{(stats?.avgROAS || 0).toFixed(2)}x</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="campaigns" className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                <span className="hidden sm:inline">Campagnes</span>
              </TabsTrigger>
              <TabsTrigger value="creatives" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Créatifs IA</span>
              </TabsTrigger>
              <TabsTrigger value="abtesting" className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                <span className="hidden sm:inline">A/B Testing</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="mt-6 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-48 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !campaigns || campaigns.length === 0 ? (
                <Card className="p-12 text-center">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    Aucune campagne créée. Lancez votre première campagne maintenant !
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une Campagne
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {campaigns.map((campaign: any) => {
                    const spentPercentage = campaign.budget_amount > 0
                      ? (campaign.spent_amount / campaign.budget_amount) * 100
                      : 0;

                    return (
                      <Card key={campaign.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{campaign.name}</h3>
                              {getStatusBadge(campaign.status)}
                              {campaign.ai_optimization_enabled && (
                                <Badge variant="outline" className="text-primary">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  IA
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">
                              {campaign.platform} • {campaign.objective}
                            </p>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCampaign(campaign.id, campaign.status)}
                          >
                            {campaign.status === 'active' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Budget</p>
                            <p className="text-lg font-semibold">
                              {formatCurrency(campaign.budget_amount || 0)}
                              <span className="text-xs text-muted-foreground ml-1">
                                /{campaign.budget_type === 'daily' ? 'jour' : 'total'}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Dépensé</p>
                            <p className="text-lg font-semibold">{formatCurrency(campaign.spent_amount || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Impressions</p>
                            <p className="text-lg font-semibold">
                              {(campaign.performance_metrics?.impressions || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">ROAS</p>
                            <p className="text-lg font-semibold flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              {campaign.performance_metrics?.roas || 0}x
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progression du budget</span>
                            <span className="font-medium">{spentPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={spentPercentage} className="h-2" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="creatives" className="mt-6">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Studio Créatif IA</CardTitle>
                  <CardDescription>
                    Générez des visuels et textes publicitaires optimisés par l'IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { label: 'Image', desc: 'Générer des visuels', icon: '🖼️' },
                      { label: 'Texte', desc: 'Copywriting IA', icon: '✍️' },
                      { label: 'Vidéo', desc: 'Clips courts', icon: '🎬' }
                    ].map((item) => (
                      <Card key={item.label} className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
                        <div className="text-3xl mb-2">{item.icon}</div>
                        <h4 className="font-medium">{item.label}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="abtesting" className="mt-6">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Tests A/B</CardTitle>
                  <CardDescription>
                    Optimisez vos campagnes avec des tests statistiques
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-center py-8">
                    <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      Créez votre premier test A/B pour optimiser vos performances
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau test A/B
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Dashboard Performance</CardTitle>
                  <CardDescription>
                    Vue d'ensemble de toutes vos campagnes
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Meilleure campagne</h4>
                      {campaigns && campaigns.length > 0 ? (
                        <div>
                        <p className="text-lg font-bold">{campaigns[0]?.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">
                            ROAS: {campaigns[0]?.roas || 0}x
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Aucune donnée</p>
                      )}
                    </Card>
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Budget restant</h4>
                      <p className="text-lg font-bold">
                        {formatCurrency(
                          (campaigns || []).reduce((sum: number, c: any) => 
                            sum + ((c.budget_amount || 0) - (c.spent_amount || 0)), 0
                          )
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Sur toutes les campagnes</p>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
