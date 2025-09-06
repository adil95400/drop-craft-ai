import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, Mail, Share2, TrendingUp, Users, Eye, MousePointer, Calendar, Play, Pause, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

// Mock data pour les campagnes email
const mockEmailCampaigns = [
  {
    id: '1',
    userId: 'user-1',
    name: 'Newsletter Janvier 2024',
    subject: 'Nouvelles fonctionnalités IA disponibles !',
    status: 'sent',
    sent: 1250,
    opened: 875,
    clicked: 234,
    unsubscribed: 12,
    bounced: 8,
    revenue: 15600,
    sendDate: '2024-01-15T10:00:00Z',
    template: 'newsletter'
  },
  {
    id: '2',
    userId: 'user-2',
    name: 'Campagne Black Friday',
    subject: '50% de réduction sur tous nos plans !',
    status: 'scheduled',
    sent: 0,
    opened: 0,
    clicked: 0,
    unsubscribed: 0,
    bounced: 0,
    revenue: 0,
    sendDate: '2024-01-25T09:00:00Z',
    template: 'promotion'
  },
  {
    id: '3',
    userId: 'user-1',
    name: 'Onboarding Nouveaux Clients',
    subject: 'Bienvenue ! Commencez dès maintenant',
    status: 'active',
    sent: 145,
    opened: 112,
    clicked: 67,
    unsubscribed: 2,
    bounced: 1,
    revenue: 8900,
    sendDate: '2024-01-10T14:00:00Z',
    template: 'onboarding'
  }
];

// Mock data pour les campagnes sociales
const mockSocialCampaigns = [
  {
    id: '1',
    platform: 'linkedin',
    campaignName: 'Acquisition B2B Q1',
    status: 'active',
    budget: 2500,
    spent: 1840,
    impressions: 45600,
    clicks: 892,
    conversions: 34,
    cpc: 2.06,
    ctr: 1.96,
    startDate: '2024-01-01',
    endDate: '2024-03-31'
  },
  {
    id: '2',
    platform: 'facebook',
    campaignName: 'Retargeting Visiteurs',
    status: 'active',
    budget: 1200,
    spent: 678,
    impressions: 78900,
    clicks: 1234,
    conversions: 67,
    cpc: 0.55,
    ctr: 1.56,
    startDate: '2024-01-15',
    endDate: '2024-02-15'
  }
];

// Mock data pour les segments
const mockSegments = [
  {
    id: '1',
    name: 'Clients Premium',
    description: 'Clients avec plan Ultra Pro actif',
    count: 156,
    criteria: 'plan = ultra_pro AND active = true',
    lastUpdated: '2024-01-15',
    engagement: 87
  },
  {
    id: '2',
    name: 'Prospects Qualifiés',
    description: 'Leads avec score > 70 et intérêt confirmé',
    count: 234,
    criteria: 'lead_score > 70 AND status = qualified',
    lastUpdated: '2024-01-14',
    engagement: 65
  },
  {
    id: '3',
    name: 'Clients à Risque',
    description: 'Clients inactifs depuis 30 jours',
    count: 89,
    criteria: 'last_login < 30 days AND plan != standard',
    lastUpdated: '2024-01-16',
    engagement: 23
  }
];

const AdminMarketing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch(platform) {
      case 'facebook': return 'bg-blue-100 text-blue-800';
      case 'linkedin': return 'bg-blue-100 text-blue-800';
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'twitter': return 'bg-sky-100 text-sky-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateOpenRate = (opened: number, sent: number) => {
    return sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0';
  };

  const calculateClickRate = (clicked: number, sent: number) => {
    return sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0';
  };

  const marketingStats = {
    totalCampaigns: mockEmailCampaigns.length + mockSocialCampaigns.length,
    activeCampaigns: mockEmailCampaigns.filter(c => c.status === 'active' || c.status === 'sent').length + 
                    mockSocialCampaigns.filter(c => c.status === 'active').length,
    totalRevenue: mockEmailCampaigns.reduce((acc, c) => acc + c.revenue, 0),
    avgOpenRate: (mockEmailCampaigns.reduce((acc, c) => acc + (c.sent > 0 ? (c.opened / c.sent) * 100 : 0), 0) / mockEmailCampaigns.length).toFixed(1),
    totalSegments: mockSegments.length,
    totalReach: mockEmailCampaigns.reduce((acc, c) => acc + c.sent, 0) + 
                mockSocialCampaigns.reduce((acc, c) => acc + c.impressions, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion Marketing</h1>
          <p className="text-muted-foreground">Campagnes email, réseaux sociaux et segmentation client</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Campagne
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une Campagne</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaignType">Type de Campagne</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Marketing</SelectItem>
                      <SelectItem value="social">Réseaux Sociaux</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="campaignName">Nom de la Campagne</Label>
                  <Input id="campaignName" placeholder="Ma campagne 2024" />
                </div>
                <div>
                  <Label htmlFor="campaignSegment">Segment Cible</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSegments.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {segment.name} ({segment.count} contacts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Créer la Campagne</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campagnes Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">{marketingStats.activeCampaigns} actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Générés</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.totalRevenue.toLocaleString()}€</div>
            <p className="text-xs text-muted-foreground">+18% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Ouverture</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.avgOpenRate}%</div>
            <p className="text-xs text-muted-foreground">+2.3% vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portée Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(marketingStats.totalReach / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Impressions + Emails</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.totalSegments}</div>
            <p className="text-xs text-muted-foreground">Segments actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2x</div>
            <p className="text-xs text-muted-foreground">Retour sur investissement</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email Campaigns ({mockEmailCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="w-4 h-4 mr-2" />
            Réseaux Sociaux ({mockSocialCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="segments">
            <Users className="w-4 h-4 mr-2" />
            Segments ({mockSegments.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="email" className="space-y-4">
          {/* Email Campaigns List */}
          <div className="space-y-4">
            {mockEmailCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Envoyé le {new Date(campaign.sendDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <div className="flex space-x-1">
                          {campaign.status === 'scheduled' && (
                            <Button variant="ghost" size="sm">
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          {campaign.status === 'active' && (
                            <Button variant="ghost" size="sm">
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {campaign.sent > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="text-center">
                          <p className="text-lg font-semibold">{campaign.sent}</p>
                          <p className="text-xs text-muted-foreground">Envoyés</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-green-600">{campaign.opened}</p>
                          <p className="text-xs text-muted-foreground">Ouvertures ({calculateOpenRate(campaign.opened, campaign.sent)}%)</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-blue-600">{campaign.clicked}</p>
                          <p className="text-xs text-muted-foreground">Clics ({calculateClickRate(campaign.clicked, campaign.sent)}%)</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-red-600">{campaign.unsubscribed}</p>
                          <p className="text-xs text-muted-foreground">Désabonnés</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-yellow-600">{campaign.bounced}</p>
                          <p className="text-xs text-muted-foreground">Rebonds</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-emerald-600">{campaign.revenue.toLocaleString()}€</p>
                          <p className="text-xs text-muted-foreground">Revenus</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          {/* Social Campaigns List */}
          <div className="space-y-4">
            {mockSocialCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Share2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{campaign.campaignName}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getPlatformColor(campaign.platform)}>
                              {campaign.platform}
                            </Badge>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {campaign.startDate} - {campaign.endDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{campaign.budget.toLocaleString()}€</p>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <div className="mt-1">
                          <Progress value={(campaign.spent / campaign.budget) * 100} className="h-1" />
                          <p className="text-xs text-muted-foreground mt-1">{campaign.spent}€ dépensés</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{(campaign.impressions / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">Impressions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-600">{campaign.clicks}</p>
                        <p className="text-xs text-muted-foreground">Clics ({campaign.ctr}%)</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600">{campaign.conversions}</p>
                        <p className="text-xs text-muted-foreground">Conversions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{campaign.cpc.toFixed(2)}€</p>
                        <p className="text-xs text-muted-foreground">CPC moyen</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          {/* Segments List */}
          <div className="space-y-4">
            {mockSegments.map((segment) => (
              <Card key={segment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{segment.name}</h3>
                        <p className="text-sm text-muted-foreground">{segment.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Mis à jour le {segment.lastUpdated}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{segment.count}</p>
                        <p className="text-xs text-muted-foreground">Contacts</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-semibold ${segment.engagement >= 70 ? 'text-green-600' : segment.engagement >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {segment.engagement}%
                        </p>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted/30 rounded font-mono text-sm">
                    {segment.criteria}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMarketing;