import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Eye, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface AdsWidgetProps {
  isCustomizing: boolean;
}

export function AdsWidget({ isCustomizing }: AdsWidgetProps) {
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['ads-widget-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select('impressions, clicks, spend, conversions, status')
        .eq('user_id', user.id);

      if (!campaigns || campaigns.length === 0) return null;

      const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
      const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
      const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0);
      const totalConversions = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
      const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const roas = totalSpend > 0 ? (totalConversions * 30) / totalSpend : 0;

      return { totalImpressions, totalClicks, ctr, cpc, roas, activeCampaigns };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {t('ads.title', 'Publicités')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !stats ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('ads.noCampaigns', 'Aucune campagne configurée')}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-blue-600" />
                  <p className="text-xs text-muted-foreground">{t('ads.impressions', 'Impressions')}</p>
                </div>
                <p className="text-xl font-bold">{formatNumber(stats.totalImpressions)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-muted-foreground">{t('ads.clicks', 'Clics')}</p>
                </div>
                <p className="text-xl font-bold">{formatNumber(stats.totalClicks)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CTR</span>
                <span className="font-semibold">{stats.ctr.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CPC</span>
                <span className="font-semibold">{stats.cpc.toFixed(2)}€</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ROAS</span>
                <span className="font-semibold text-green-600">{stats.roas.toFixed(1)}x</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t('ads.activeCampaigns', 'Campagnes actives')}</p>
                <span className="font-semibold">{stats.activeCampaigns}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}