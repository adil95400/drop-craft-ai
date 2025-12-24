import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, TrendingUp, MousePointer, DollarSign, Eye, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MarketingWidgetProps {
  timeRange: string;
  settings?: {
    showChart?: boolean;
    showCampaigns?: boolean;
  };
}

export function MarketingWidget({ settings }: MarketingWidgetProps) {
  const showChart = settings?.showChart ?? true;
  const showCampaigns = settings?.showCampaigns ?? true;

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  const campaignData = campaigns.slice(0, 4).map(campaign => ({
    name: campaign.name?.substring(0, 12) || 'Campagne',
    spend: Number(campaign.budget_spent || 0),
    revenue: Number(campaign.budget_spent || 0) * 3.2, // Estimated ROAS
    roas: 3.2
  }));

  const totalSpend = campaignData.reduce((sum, d) => sum + d.spend, 0);
  const totalRevenue = campaignData.reduce((sum, d) => sum + d.revenue, 0);
  const avgRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(1) : '0';

  const activeCampaigns = campaigns.filter(c => c.status === 'active').slice(0, 2);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="h-4 w-4 text-purple-500" />
          Marketing & Campagnes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <DollarSign className="h-4 w-4 mx-auto text-red-500 mb-1" />
            <p className="text-lg font-bold">{totalSpend.toLocaleString('fr-FR')}€</p>
            <p className="text-xs text-muted-foreground">Dépenses</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <TrendingUp className="h-4 w-4 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold">{totalRevenue.toLocaleString('fr-FR')}€</p>
            <p className="text-xs text-muted-foreground">Revenus</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <MousePointer className="h-4 w-4 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">{avgRoas}x</p>
            <p className="text-xs text-muted-foreground">ROAS</p>
          </div>
        </div>

        {showChart && campaignData.length > 0 && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={70} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString('fr-FR')}€`, 
                    name === 'spend' ? 'Dépenses' : 'Revenus'
                  ]}
                />
                <Bar dataKey="spend" fill="hsl(0 84% 60%)" radius={[0, 4, 4, 0]} name="spend" />
                <Bar dataKey="revenue" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {showCampaigns && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Campagnes actives</p>
            {activeCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune campagne active
              </p>
            ) : (
              activeCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                      {campaign.status === 'active' ? 'Actif' : 'Pause'}
                    </Badge>
                    <span className="text-sm truncate max-w-[120px]">{campaign.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {Number(campaign.budget || 0).toLocaleString('fr-FR')}€
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {campaigns.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune campagne marketing
          </p>
        )}
      </CardContent>
    </Card>
  );
}
