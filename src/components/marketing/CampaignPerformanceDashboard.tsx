import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Mail, MessageSquare, Bell, TrendingUp, TrendingDown, Users, MousePointer, ShoppingCart, Eye, Send } from 'lucide-react';

interface CampaignMetrics {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  status: 'active' | 'completed' | 'scheduled';
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  unsubscribed: number;
  bounced: number;
  startDate: string;
}

const mockCampaigns: CampaignMetrics[] = [
  {
    id: '1',
    name: 'Black Friday 2024',
    type: 'email',
    status: 'completed',
    sent: 50000,
    delivered: 48500,
    opened: 21675,
    clicked: 8670,
    converted: 1734,
    revenue: 86700,
    unsubscribed: 125,
    bounced: 1500,
    startDate: '2024-11-24'
  },
  {
    id: '2',
    name: 'Soldes Hiver SMS',
    type: 'sms',
    status: 'active',
    sent: 25000,
    delivered: 24750,
    opened: 0,
    clicked: 3712,
    converted: 742,
    revenue: 29680,
    unsubscribed: 50,
    bounced: 250,
    startDate: '2024-01-08'
  },
  {
    id: '3',
    name: 'Flash Sale Push',
    type: 'push',
    status: 'completed',
    sent: 100000,
    delivered: 95000,
    opened: 38000,
    clicked: 15200,
    converted: 2280,
    revenue: 68400,
    unsubscribed: 800,
    bounced: 5000,
    startDate: '2024-02-01'
  },
  {
    id: '4',
    name: 'Newsletter Hebdo',
    type: 'email',
    status: 'active',
    sent: 35000,
    delivered: 34300,
    opened: 10290,
    clicked: 3087,
    converted: 463,
    revenue: 13890,
    unsubscribed: 70,
    bounced: 700,
    startDate: '2024-02-05'
  }
];

const performanceOverTime = [
  { date: '01/01', openRate: 42, clickRate: 15, conversionRate: 3.2 },
  { date: '08/01', openRate: 45, clickRate: 18, conversionRate: 3.8 },
  { date: '15/01', openRate: 41, clickRate: 16, conversionRate: 3.5 },
  { date: '22/01', openRate: 48, clickRate: 20, conversionRate: 4.1 },
  { date: '29/01', openRate: 44, clickRate: 17, conversionRate: 3.6 },
  { date: '05/02', openRate: 50, clickRate: 22, conversionRate: 4.5 }
];

const channelDistribution = [
  { name: 'Email', value: 45, color: 'hsl(var(--chart-1))' },
  { name: 'SMS', value: 30, color: 'hsl(var(--chart-2))' },
  { name: 'Push', value: 25, color: 'hsl(var(--chart-3))' }
];

export function CampaignPerformanceDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedChannel, setSelectedChannel] = useState('all');

  const filteredCampaigns = selectedChannel === 'all'
    ? mockCampaigns
    : mockCampaigns.filter(c => c.type === selectedChannel);

  const totalMetrics = filteredCampaigns.reduce((acc, c) => ({
    sent: acc.sent + c.sent,
    delivered: acc.delivered + c.delivered,
    opened: acc.opened + c.opened,
    clicked: acc.clicked + c.clicked,
    converted: acc.converted + c.converted,
    revenue: acc.revenue + c.revenue
  }), { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 });

  const avgOpenRate = totalMetrics.delivered > 0 ? (totalMetrics.opened / totalMetrics.delivered * 100).toFixed(1) : 0;
  const avgClickRate = totalMetrics.delivered > 0 ? (totalMetrics.clicked / totalMetrics.delivered * 100).toFixed(1) : 0;
  const avgConversionRate = totalMetrics.clicked > 0 ? (totalMetrics.converted / totalMetrics.clicked * 100).toFixed(1) : 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance des Campagnes</h2>
          <p className="text-muted-foreground">
            Analysez vos taux d'ouverture, clics et conversions
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les canaux</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="push">Push</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Send className="h-4 w-4" />
              <span className="text-xs">Envoyés</span>
            </div>
            <p className="text-2xl font-bold">{totalMetrics.sent.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-xs">Taux d'ouverture</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{avgOpenRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointer className="h-4 w-4" />
              <span className="text-xs">Taux de clic</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{avgClickRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs">Conversion</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{avgConversionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Conversions</span>
            </div>
            <p className="text-2xl font-bold">{totalMetrics.converted.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Revenu</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{totalMetrics.revenue.toLocaleString()}€</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des performances</CardTitle>
            <CardDescription>Taux d'ouverture, clic et conversion</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="openRate" name="Ouverture %" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.3} />
                <Area type="monotone" dataKey="clickRate" name="Clic %" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} />
                <Area type="monotone" dataKey="conversionRate" name="Conversion %" stackId="3" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution par canal</CardTitle>
            <CardDescription>Répartition des envois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={channelDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {channelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par campagne</CardTitle>
          <CardDescription>Performances individuelles de chaque campagne</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Campagne</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">Statut</th>
                  <th className="text-right py-3 px-2">Envoyés</th>
                  <th className="text-right py-3 px-2">Ouverture</th>
                  <th className="text-right py-3 px-2">Clics</th>
                  <th className="text-right py-3 px-2">Conv.</th>
                  <th className="text-right py-3 px-2">Revenu</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => {
                  const openRate = campaign.delivered > 0 ? (campaign.opened / campaign.delivered * 100).toFixed(1) : 0;
                  const clickRate = campaign.delivered > 0 ? (campaign.clicked / campaign.delivered * 100).toFixed(1) : 0;
                  const convRate = campaign.clicked > 0 ? (campaign.converted / campaign.clicked * 100).toFixed(1) : 0;
                  
                  return (
                    <tr key={campaign.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-xs text-muted-foreground">{campaign.startDate}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          {getTypeIcon(campaign.type)}
                          <span className="capitalize">{campaign.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-2">{campaign.sent.toLocaleString()}</td>
                      <td className="text-right py-3 px-2">
                        <span className="text-green-600">{openRate}%</span>
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className="text-blue-600">{clickRate}%</span>
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className="text-purple-600">{convRate}%</span>
                      </td>
                      <td className="text-right py-3 px-2 font-medium">
                        {campaign.revenue.toLocaleString()}€
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
