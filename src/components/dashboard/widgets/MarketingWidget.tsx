import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, TrendingUp, MousePointer, DollarSign, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface MarketingWidgetProps {
  timeRange: string;
  settings?: {
    showChart?: boolean;
    showCampaigns?: boolean;
  };
}

const campaignData = [
  { name: 'Google Ads', spend: 2500, revenue: 8500, roas: 3.4 },
  { name: 'Facebook', spend: 1800, revenue: 5400, roas: 3.0 },
  { name: 'Instagram', spend: 1200, revenue: 4200, roas: 3.5 },
  { name: 'Email', spend: 300, revenue: 2100, roas: 7.0 },
];

const campaigns = [
  { id: 1, name: 'Soldes Été 2024', status: 'active', impressions: 45000, clicks: 1250, ctr: 2.8 },
  { id: 2, name: 'Nouveaux Produits', status: 'active', impressions: 32000, clicks: 890, ctr: 2.8 },
  { id: 3, name: 'Retargeting Q2', status: 'paused', impressions: 28000, clicks: 1120, ctr: 4.0 },
];

export function MarketingWidget({ settings }: MarketingWidgetProps) {
  const showChart = settings?.showChart ?? true;
  const showCampaigns = settings?.showCampaigns ?? true;

  const totalSpend = campaignData.reduce((sum, d) => sum + d.spend, 0);
  const totalRevenue = campaignData.reduce((sum, d) => sum + d.revenue, 0);
  const avgRoas = (totalRevenue / totalSpend).toFixed(1);

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

        {showChart && (
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
            {campaigns.slice(0, 2).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                    {campaign.status === 'active' ? 'Actif' : 'Pause'}
                  </Badge>
                  <span className="text-sm">{campaign.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {(campaign.impressions / 1000).toFixed(0)}k
                  </div>
                  <div className="flex items-center gap-1">
                    <MousePointer className="h-3 w-3" />
                    {campaign.ctr}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
