import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Zap,
  Mail,
  Users,
  Target,
  BarChart3,
  Clock,
  Play,
  Pause,
  Settings,
  Copy,
  Trash2,
  Plus,
  Send,
  Eye,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/consoleCleanup';

interface MarketingCampaign {
  id: string;
  campaign_name: string;
  campaign_type: 'email' | 'sms' | 'push' | 'social';
  status: 'draft' | 'active' | 'paused' | 'completed';
  target_criteria: Record<string, any>;
  content_templates: Record<string, any>;
  automation_flow: Array<{
    id: string;
    type: 'email' | 'delay' | 'condition' | 'action';
    config: Record<string, any>;
  }>;
  performance_goals: Record<string, any>;
  current_metrics: Record<string, any>;
  created_at: string;
  last_executed_at?: string;
  next_execution_at?: string;
}

interface CampaignMetrics {
  total_campaigns: number;
  active_campaigns: number;
  total_sends: number;
  avg_open_rate: number;
  avg_click_rate: number;
  conversion_rate: number;
  revenue_generated: number;
}

interface AutomationRule {
  id: string;
  name: string;
  rule_type: 'welcome' | 'abandoned_cart' | 'purchase_follow_up' | 're_engagement';
  trigger_conditions: Record<string, any>;
  actions: Array<{
    type: 'send_email' | 'add_tag' | 'update_score' | 'create_task';
    config: Record<string, any>;
  }>;
  is_active: boolean;
  execution_count: number;
  success_rate: number;
  created_at: string;
}

export const MarketingAutomation: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const { toast } = useToast();

  const campaignPerformanceData = [
    { name: 'Sem 1', sends: 1250, opens: 456, clicks: 89, conversions: 23 },
    { name: 'Sem 2', sends: 1450, opens: 523, clicks: 112, conversions: 31 },
    { name: 'Sem 3', sends: 1320, opens: 478, clicks: 95, conversions: 28 },
    { name: 'Sem 4', sends: 1580, opens: 615, clicks: 134, conversions: 42 }
  ];

  const channelPerformanceData = [
    { channel: 'Email', campaigns: 12, open_rate: 24.5, click_rate: 3.8, conversion: 2.1, color: '#3B82F6' },
    { channel: 'SMS', campaigns: 5, open_rate: 96.2, click_rate: 8.4, conversion: 4.3, color: '#10B981' },
    { channel: 'Push', campaigns: 8, open_rate: 45.3, click_rate: 5.2, conversion: 1.8, color: '#F59E0B' },
    { channel: 'Social', campaigns: 3, open_rate: 12.8, click_rate: 2.1, conversion: 0.9, color: '#EF4444' }
  ];

  const automationFlowData = [
    { step: 'Trigger', contacts: 1000, conversion: 100 },
    { step: 'Email 1', contacts: 950, conversion: 95 },
    { step: 'Délai 24h', contacts: 850, conversion: 85 },
    { step: 'Email 2', contacts: 765, conversion: 76.5 },
    { step: 'Condition', contacts: 612, conversion: 61.2 },
    { step: 'Conversion', contacts: 147, conversion: 14.7 }
  ];

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const fetchMarketingData = async () => {
    try {
      setLoading(true);

      // Fetch campaigns
      const { data: campaignData } = await supabase
        .from('automated_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignData) {
        const transformedCampaigns = campaignData.map(campaign => ({
          ...campaign,
          campaign_type: (campaign.campaign_type || 'email') as 'email' | 'sms' | 'push' | 'social',
          status: (campaign.status || 'draft') as 'draft' | 'active' | 'paused' | 'completed',
          target_criteria: (campaign.target_criteria as Record<string, any>) || {},
          content_templates: (campaign.content_templates as Record<string, any>) || {},
          automation_flow: (campaign.automation_flow as Array<any>) || [],
          performance_goals: (campaign.performance_goals as Record<string, any>) || {},
          current_metrics: (campaign.current_metrics as Record<string, any>) || {}
        }));
        setCampaigns(transformedCampaigns);
      }

      // Fetch automation rules
      const { data: rulesData } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (rulesData) {
        const transformedRules = rulesData.map(rule => ({
          ...rule,
          rule_type: (rule.rule_type || 'welcome') as 'welcome' | 'abandoned_cart' | 'purchase_follow_up' | 're_engagement',
          actions: ((rule.actions as any[]) || []).map(action => ({
            type: (action.type || 'send_email') as 'send_email' | 'add_tag' | 'update_score' | 'create_task',
            config: action.config || {}
          })),
          trigger_conditions: (rule.trigger_conditions as Record<string, any>) || {}
        }));
        setAutomationRules(transformedRules);
      }

      // Calculate metrics
      const totalCampaigns = campaignData?.length || 0;
      const activeCampaigns = campaignData?.filter(c => c.status === 'active').length || 0;
      const totalExecutions = rulesData?.reduce((sum, rule) => sum + (rule.execution_count || 0), 0) || 0;
      const avgSuccessRate = rulesData?.length ? 
        rulesData.reduce((sum, rule) => sum + (rule.success_rate || 0), 0) / rulesData.length : 0;

      setMetrics({
        total_campaigns: totalCampaigns,
        active_campaigns: activeCampaigns,
        total_sends: totalExecutions * 50, // Estimation
        avg_open_rate: 24.5,
        avg_click_rate: 3.8,
        conversion_rate: 2.1,
        revenue_generated: totalExecutions * 125 // Estimation
      });

    } catch (error) {
      logError(error as Error, 'Error fetching marketing data');
      toast({
        title: "Erreur",
        description: "Impossible de charger les données marketing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('automated_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: newStatus as any }
          : campaign
      ));

      toast({
        title: "Statut mis à jour",
        description: `Campagne ${newStatus === 'active' ? 'activée' : 'mise en pause'}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de la campagne",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'paused': 'bg-yellow-100 text-yellow-800',
      'draft': 'bg-gray-100 text-gray-800',
      'completed': 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCampaignTypeIcon = (type: string) => {
    const icons = {
      'email': Mail,
      'sms': Send,
      'push': Target,
      'social': Users
    };
    return icons[type as keyof typeof icons] || Mail;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketing Automation</h1>
          <p className="text-muted-foreground">Campagnes automatisées et règles d'engagement client</p>
        </div>
        <Button onClick={() => setShowNewCampaign(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Campagne
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Campagnes Actives</p>
                <p className="text-2xl font-bold">{metrics?.active_campaigns || 0}</p>
                <p className="text-xs text-muted-foreground">sur {metrics?.total_campaigns || 0} total</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux d'Ouverture</p>
                <p className="text-2xl font-bold">{metrics?.avg_open_rate?.toFixed(1) || 0}%</p>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">+2.3%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de Conversion</p>
                <p className="text-2xl font-bold">{metrics?.conversion_rate?.toFixed(1) || 0}%</p>
                <div className="flex items-center gap-1 text-purple-600">
                  <Target className="w-3 h-3" />
                  <span className="text-xs">Performance</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CA Généré</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.revenue_generated || 0)}</p>
                <p className="text-xs text-muted-foreground">ce mois</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance des Campagnes</CardTitle>
            <CardDescription>Évolution des métriques sur 4 semaines</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={campaignPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sends" stroke="#E5E7EB" strokeWidth={2} name="Envois" />
                <Line type="monotone" dataKey="opens" stroke="#3B82F6" strokeWidth={2} name="Ouvertures" />
                <Line type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={2} name="Clics" />
                <Line type="monotone" dataKey="conversions" stroke="#F59E0B" strokeWidth={2} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance par Canal</CardTitle>
            <CardDescription>Comparaison des taux de conversion</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  `${value}%`,
                  name === 'open_rate' ? 'Taux d\'ouverture' :
                  name === 'click_rate' ? 'Taux de clic' : 'Conversion'
                ]} />
                <Bar dataKey="open_rate" fill="#3B82F6" name="open_rate" />
                <Bar dataKey="click_rate" fill="#10B981" name="click_rate" />
                <Bar dataKey="conversion" fill="#F59E0B" name="conversion" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="automations">Automatisations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campagnes Marketing</CardTitle>
              <CardDescription>Gérez vos campagnes d'engagement automatisées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const CampaignIcon = getCampaignTypeIcon(campaign.campaign_type);
                  return (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <CampaignIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{campaign.campaign_name}</p>
                            <Badge className={getStatusColor(campaign.status)} variant="outline">
                              {campaign.status}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {campaign.campaign_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Créée le {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          {campaign.last_executed_at && (
                            <p className="text-xs text-muted-foreground">
                              Dernière exécution: {new Date(campaign.last_executed_at).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {campaign.current_metrics?.sends || 0} envois
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {((campaign.current_metrics?.conversions || 0) / (campaign.current_metrics?.sends || 1) * 100).toFixed(1)}% conversion
                          </p>
                        </div>
                        <Switch
                          checked={campaign.status === 'active'}
                          onCheckedChange={() => toggleCampaignStatus(campaign.id, campaign.status)}
                        />
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Règles d'Automatisation</CardTitle>
              <CardDescription>Configurez des actions automatiques basées sur le comportement client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${rule.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{rule.name}</p>
                          <Badge variant="outline" className="capitalize">
                            {rule.rule_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.execution_count} exécutions • {rule.success_rate?.toFixed(1) || 0}% succès
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rule.actions.length} actions configurées
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => {
                          // Toggle rule status
                          setAutomationRules(prev => prev.map(r => 
                            r.id === rule.id ? { ...r, is_active: !r.is_active } : r
                          ));
                        }}
                      />
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Entonnoir d'Automatisation</CardTitle>
                <CardDescription>Progression des contacts dans les flux automatisés</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={automationFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="contacts" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques Avancées</CardTitle>
                <CardDescription>Analyse détaillée des performances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-sm font-medium">Taux de Délivrabilité</span>
                    <span className="text-lg font-bold text-green-600">98.5%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-sm font-medium">Temps Optimal d'Envoi</span>
                    <span className="text-lg font-bold">14:30</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-sm font-medium">Segmentation Active</span>
                    <span className="text-lg font-bold">12 segments</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-sm font-medium">A/B Tests En Cours</span>
                    <span className="text-lg font-bold">3 tests</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-sm font-medium">ROI Marketing</span>
                    <span className="text-lg font-bold text-green-600">420%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};