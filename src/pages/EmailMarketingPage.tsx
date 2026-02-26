import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Send, Users, TrendingUp, Clock, Plus, Eye, Loader2, MoreHorizontal, Edit, Trash2, Play, Pause } from 'lucide-react';
import { useMarketingCampaigns } from '@/hooks/useMarketingCampaigns';
import { useCustomersUnified } from '@/hooks/unified';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { EmailTemplatesManager } from '@/components/email/EmailTemplatesManager';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

const EmailMarketingPage: React.FC = () => {
  const { campaigns, isLoading, createCampaign, updateCampaign, deleteCampaign, isCreating } = useMarketingCampaigns();
  const { stats: customerStats } = useCustomersUnified();
  const { templates } = useEmailTemplates();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'email' as const });

  const totalSent = campaigns.reduce((acc, c) => {
    const metrics = c.metrics as any;
    return acc + (metrics?.sent || 0);
  }, 0);

  const totalOpened = campaigns.reduce((acc, c) => {
    const metrics = c.metrics as any;
    return acc + (metrics?.opened || 0);
  }, 0);

  const totalClicked = campaigns.reduce((acc, c) => {
    const metrics = c.metrics as any;
    return acc + (metrics?.clicked || 0);
  }, 0);

  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0';
  const totalSubscribers = customerStats?.total || 0;

  const handleCreateCampaign = async () => {
    if (!newCampaign.name) return;
    
    createCampaign({
      name: newCampaign.name,
      type: newCampaign.type,
      status: 'draft',
      metrics: { sent: 0, opened: 0, clicked: 0 },
    });
    setNewCampaign({ name: '', type: 'email' });
    setIsAddDialogOpen(false);
  };

  const handleToggleCampaignStatus = (campaign: any) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    updateCampaign({ id: campaign.id, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'completed':
        return <Badge>Terminé</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Planifié</Badge>;
      case 'paused':
        return <Badge variant="outline">En pause</Badge>;
      default:
        return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  return (
    <ChannablePageWrapper
      title="Email Marketing"
      subtitle="Marketing"
      description="Créez et gérez vos campagnes email avec suivi des performances"
      heroImage="marketing"
      badge={{ label: "Automation", icon: Mail }}
      actions={
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle campagne
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle campagne</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom de la campagne</Label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Ex: Promotion été 2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={newCampaign.type} 
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="social">Réseaux sociaux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateCampaign} disabled={isCreating || !newCampaign.name} className="w-full">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Créer la campagne
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.emailMarketing} />

      {/* Stats Cards - Real Data */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails envoyés</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total toutes campagnes</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'ouverture</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{openRate}%</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  {totalOpened.toLocaleString()} ouvertures
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de clic</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{clickRate}%</div>
                <p className="text-xs text-muted-foreground">{totalClicked.toLocaleString()} clics</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscribers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Depuis la base clients</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vos campagnes</CardTitle>
              <CardDescription>Gérez vos campagnes email marketing</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => {
                    const metrics = campaign.metrics as any;
                    return (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{campaign.name}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {metrics?.sent > 0 ? (
                                <>
                                  <span>{metrics.sent} envoyés</span>
                                  <span>•</span>
                                  <span>{metrics.opened || 0} ouvertures</span>
                                  <span>•</span>
                                  <span>{metrics.clicked || 0} clics</span>
                                </>
                              ) : campaign.start_date ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Prévu le {format(new Date(campaign.start_date), 'dd MMM yyyy', { locale: getDateFnsLocale() })}
                                </span>
                              ) : (
                                <span>Brouillon - pas encore envoyé</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            {campaign.budget && (
                              <p className="text-sm">
                                Budget: {campaign.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(campaign.created_at), 'dd/MM/yyyy', { locale: getDateFnsLocale() })}
                            </p>
                          </div>
                          {getStatusBadge(campaign.status || 'draft')}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleCampaignStatus(campaign)}
                          >
                            {campaign.status === 'active' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteCampaign(campaign.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune campagne</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez votre première campagne email
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle campagne
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <EmailTemplatesManager />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics email</CardTitle>
              <CardDescription>Performance détaillée de vos campagnes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">{campaigns.length}</p>
                  <p className="text-sm text-muted-foreground">Campagnes créées</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-500">{openRate}%</p>
                  <p className="text-sm text-muted-foreground">Taux d'ouverture moyen</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-500">{clickRate}%</p>
                  <p className="text-sm text-muted-foreground">Taux de clic moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
};

export default EmailMarketingPage;
