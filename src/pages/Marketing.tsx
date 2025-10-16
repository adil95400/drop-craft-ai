import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Megaphone, 
  Target, 
  TrendingUp, 
  Users, 
  Mail, 
  Share2,
  BarChart3,
  Zap,
  Palette,
  Eye,
  Play,
  Pause,
  Settings,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLegacyPlan } from '@/lib/migration-helper';
import { CanvaIntegrationPanel } from '@/components/marketing/CanvaIntegrationPanel';
import { useMarketingStats } from '@/hooks/useMarketingStats';

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  status: string;
  target_criteria: any;
  performance_goals: any;
  current_metrics: any;
  created_at: string;
}

const Marketing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isUltraPro, isPro } = useLegacyPlan();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { data: marketingStats } = useMarketingStats();

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('automated_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les campagnes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('automated_campaigns')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', campaignId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCampaigns(campaigns.map(campaign => 
        campaign.id === campaignId ? { ...campaign, status: newStatus } : campaign
      ));

      toast({
        title: "Succès",
        description: "Statut de la campagne mis à jour",
      });
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'draft': return 'outline';
      case 'completed': return 'default';
      default: return 'secondary';
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'social': return Share2;
      case 'ads': return Target;
      default: return Megaphone;
    }
  };

  const campaignStats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    totalReach: campaigns.reduce((sum, campaign) => sum + (campaign.current_metrics?.reach || 0), 0),
    totalEngagement: campaigns.reduce((sum, campaign) => sum + (campaign.current_metrics?.engagement || 0), 0)
  };

  const handleDesignSelected = (designData: any) => {
    toast({
      title: "Design sélectionné",
      description: "Le design Canva a été intégré à votre campagne marketing",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Marketing</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketing</h2>
          <p className="text-muted-foreground">
            Créez et gérez vos campagnes marketing avec l'intégration Canva
          </p>
        </div>
        <div className="flex gap-2">
          {isUltraPro && (
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics AI
            </Button>
          )}
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle campagne
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campagnes</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.active}</div>
            <p className="text-xs text-muted-foreground">
              {campaignStats.draft} en brouillon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portée totale</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.totalReach.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.totalEngagement.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="canva">Design Canva</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {isUltraPro && <TabsTrigger value="automation">Automation AI</TabsTrigger>}
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes campagnes marketing</CardTitle>
              <CardDescription>
                Gérez toutes vos campagnes marketing en un seul endroit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const TypeIcon = getCampaignTypeIcon(campaign.campaign_type);
                  return (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <TypeIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{campaign.campaign_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="capitalize">{campaign.campaign_type}</span>
                            <span>•</span>
                            <span>Créée le {new Date(campaign.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">Portée: {campaign.current_metrics?.reach || 0}</p>
                          <p className="text-sm text-muted-foreground">
                            CTR: {campaign.current_metrics?.ctr || 0}%
                          </p>
                        </div>
                        
                        <Badge variant={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateCampaignStatus(
                              campaign.id, 
                              campaign.status === 'active' ? 'paused' : 'active'
                            )}
                          >
                            {campaign.status === 'active' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {campaigns.length === 0 && (
                  <div className="text-center py-8">
                    <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      Aucune campagne marketing créée
                    </p>
                    <Button className="mt-4" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Créer ma première campagne
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="canva" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Intégration Canva Design
              </CardTitle>
              <CardDescription>
                Créez et utilisez des designs Canva pour vos campagnes marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CanvaIntegrationPanel
                onDesignSelected={handleDesignSelected}
                selectedStores={selectedStores}
                selectedProducts={selectedProducts}
                selectedCategories={selectedCategories}
                selectedEvents={[]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance des campagnes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Taux d'ouverture email</span>
                      <span>{marketingStats?.emailOpenRate.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={marketingStats?.emailOpenRate || 0} className="mt-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Taux de clic</span>
                      <span>{marketingStats?.emailClickRate.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={marketingStats?.emailClickRate || 0} className="mt-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Conversion</span>
                      <span>{marketingStats?.conversionRate.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={marketingStats?.conversionRate || 0} className="mt-2" />
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      {marketingStats?.totalConversions || 0} conversions sur {marketingStats?.totalEvents || 0} événements
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement social</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Likes</span>
                    <span className="font-medium">{marketingStats?.socialMetrics.likes.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Partages</span>
                    <span className="font-medium">{marketingStats?.socialMetrics.shares.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Commentaires</span>
                    <span className="font-medium">{marketingStats?.socialMetrics.comments.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Portée organique</span>
                    <span className="font-medium">{marketingStats?.socialMetrics.organicReach.toLocaleString() || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isUltraPro && (
          <TabsContent value="automation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Marketing Automation AI
                </CardTitle>
                <CardDescription>
                  Automatisation intelligente de vos campagnes marketing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Segmentation automatique</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          L'IA analyse automatiquement vos clients et crée des segments pour des campagnes ciblées
                        </p>
                        <Button variant="outline" className="w-full">
                          Configurer la segmentation
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Optimisation des envois</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Détermination automatique du meilleur moment pour envoyer vos campagnes
                        </p>
                        <Button variant="outline" className="w-full">
                          Activer l'optimisation
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Génération de contenu AI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Création automatique de contenus marketing personnalisés avec Canva
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline">
                          Générer du contenu email
                        </Button>
                        <Button variant="outline">
                          Créer des visuels social media
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Marketing;