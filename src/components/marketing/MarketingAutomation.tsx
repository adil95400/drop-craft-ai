import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Mail, Users, Target, BarChart3, Plus, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const mockCampaigns = [
  { id: '1', campaign_name: 'Welcome Series', campaign_type: 'email', status: 'active', current_metrics: { sends: 1250, opens: 456, clicks: 89, conversions: 23 }, created_at: new Date().toISOString() },
  { id: '2', campaign_name: 'Re-engagement', campaign_type: 'email', status: 'draft', current_metrics: { sends: 0, opens: 0, clicks: 0, conversions: 0 }, created_at: new Date().toISOString() }
];

const campaignPerformanceData = [
  { name: 'Sem 1', sends: 1250, opens: 456, clicks: 89, conversions: 23 },
  { name: 'Sem 2', sends: 1450, opens: 523, clicks: 112, conversions: 31 },
  { name: 'Sem 3', sends: 1320, opens: 478, clicks: 95, conversions: 28 },
  { name: 'Sem 4', sends: 1580, opens: 615, clicks: 134, conversions: 42 }
];

export const MarketingAutomation: React.FC = () => {
  const [campaigns] = useState(mockCampaigns);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    const colors = { 'active': 'bg-green-100 text-green-800', 'paused': 'bg-yellow-100 text-yellow-800', 'draft': 'bg-gray-100 text-gray-800' };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCampaignTypeIcon = (type: string) => {
    const icons = { 'email': Mail, 'sms': Target, 'push': Target, 'social': Users };
    return icons[type as keyof typeof icons] || Mail;
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Marketing Automation</h1>
          <p className="text-muted-foreground">Campagnes automatisées</p>
        </div>
        <Button onClick={() => setShowNewCampaign(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle Campagne</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Campagnes Actives</p><p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</p></div><Zap className="w-6 h-6 text-blue-600" /></div></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Taux d'Ouverture</p><p className="text-2xl font-bold">24.5%</p></div><Mail className="w-6 h-6 text-green-600" /></div></CardContent></Card>
        <Card className="border-l-4 border-l-purple-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Conversion</p><p className="text-2xl font-bold">2.1%</p></div><Target className="w-6 h-6 text-purple-600" /></div></CardContent></Card>
        <Card className="border-l-4 border-l-orange-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">CA Généré</p><p className="text-2xl font-bold">{formatCurrency(12500)}</p></div><BarChart3 className="w-6 h-6 text-orange-600" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Performance des Campagnes</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={campaignPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sends" stroke="#E5E7EB" strokeWidth={2} />
              <Line type="monotone" dataKey="opens" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="conversions" stroke="#F59E0B" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Campagnes Marketing</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const CampaignIcon = getCampaignTypeIcon(campaign.campaign_type);
              return (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"><CampaignIcon className="w-5 h-5 text-primary" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{campaign.campaign_name}</p>
                        <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Créée le {new Date(campaign.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="text-right"><p className="text-sm font-medium">{campaign.current_metrics?.sends || 0} envois</p></div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
