import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Mail, Users, Target, TrendingUp, Clock, Play, Pause, Plus, DollarSign, MousePointer } from 'lucide-react';
import { useMarketingCampaigns, useMarketingStats } from '@/hooks/useMarketingRealData';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const MarketingAutomationPage: React.FC = () => {
  const { 
    data: campaigns = [], 
    isLoading: isLoadingCampaigns, 
    refetch 
  } = useMarketingCampaigns();
  
  const { data: statsData, isLoading: isLoadingStats } = useMarketingStats();
  
  const isLoading = isLoadingCampaigns || isLoadingStats;
  const stats = statsData || { 
    activeCampaigns: 0, totalSpend: 0, totalConversions: 0, 
    avgCTR: 0, avgROAS: 0, emailsSent: 0, openRate: 0,
    totalClicks: 0, isDemo: false
  };
  const toggleCampaign = async (id: string, isActive: boolean) => {
    console.log('Toggle campaign', id, isActive);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Marketing Automation</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Automatisez vos campagnes marketing avec des données réelles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Actualiser
          </Button>
          <Button size="sm" className="self-start sm:self-auto">
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sm:hidden">Nouveau</span>
            <span className="hidden sm:inline">Nouveau workflow</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
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
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Campagnes</CardTitle>
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{campaigns.length}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {stats.activeCampaigns} actives
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Dépenses</CardTitle>
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.totalSpend)}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Budget total
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Conversions</CardTitle>
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-chart-2" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{stats.totalConversions.toLocaleString()}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  {stats.avgCTR.toFixed(2)}% CTR moyen
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">ROAS</CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-chart-3" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{stats.avgROAS.toFixed(2)}x</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Retour sur investissement
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Email Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Emails envoyés</p>
              <p className="text-lg font-bold">{stats.emailsSent.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MousePointer className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taux d'ouverture</p>
              <p className="text-lg font-bold">{stats.openRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Campagnes marketing</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Gérez vos campagnes actives et planifiées</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-2">Aucune campagne</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez votre première campagne marketing
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle campagne
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      campaign.status === 'active' ? "bg-green-100" : "bg-gray-100"
                    )}>
                      <Target className={cn(
                        "h-4 w-4 sm:h-5 sm:w-5",
                        campaign.status === 'active' ? "text-green-600" : "text-gray-500"
                      )} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold">{campaign.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs capitalize">
                          {campaign.type}
                        </Badge>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {campaign.clicks?.toLocaleString() || 0} clics
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">•</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {campaign.conversions?.toLocaleString() || 0} conversions
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 ml-11 sm:ml-0">
                    <div className="text-left sm:text-right">
                      {campaign.spent !== undefined && (
                        <div className="text-sm font-semibold">{formatCurrency(campaign.spent)}</div>
                      )}
                      {campaign.roas !== undefined && (
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          ROAS: {campaign.roas.toFixed(2)}x
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant={campaign.status === 'active' ? 'default' : 'secondary'} 
                      className="text-xs capitalize"
                    >
                      {campaign.status === 'active' ? 'Actif' : 
                       campaign.status === 'paused' ? 'En pause' : 
                       campaign.status === 'completed' ? 'Terminé' : 'Brouillon'}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => toggleCampaign(campaign.id, campaign.status === 'active')}
                    >
                      {campaign.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingAutomationPage;
