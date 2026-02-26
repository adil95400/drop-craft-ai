import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useDynamicCampaigns, DynamicCampaign, AIRecommendation } from '@/hooks/useDynamicCampaigns';
import { 
  Plus, Play, Pause, Trash2, Settings, Target, TrendingUp, 
  Sparkles, BarChart3, Zap, RefreshCw, Copy, ExternalLink,
  Facebook, DollarSign, MousePointer, Eye, ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

const CAMPAIGN_TYPES = [
  { value: 'product_feed', label: 'Flux Produits', icon: ShoppingCart },
  { value: 'retargeting', label: 'Retargeting', icon: Target },
  { value: 'dynamic_remarketing', label: 'Remarketing Dynamique', icon: RefreshCw },
  { value: 'catalog_sales', label: 'Ventes Catalogue', icon: DollarSign }
];

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook/Instagram', color: 'bg-blue-500' },
  { value: 'google', label: 'Google Ads', color: 'bg-red-500' },
  { value: 'tiktok', label: 'TikTok Ads', color: 'bg-black' },
  { value: 'pinterest', label: 'Pinterest Ads', color: 'bg-red-600' }
];

export function DynamicCampaignsDashboard() {
  const {
    campaigns,
    isLoading,
    createCampaign,
    isCreating,
    updateCampaign,
    deleteCampaign,
    startCampaign,
    pauseCampaign,
    generateFeed,
    getPerformance,
    getAIOptimization
  } = useDynamicCampaigns();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<DynamicCampaign | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    campaign_type: 'product_feed',
    platforms: ['facebook'],
    budget_daily: 50,
    budget_total: 1000,
    bid_strategy: 'auto'
  });

  const handleCreate = () => {
    createCampaign(newCampaign);
    setIsCreateOpen(false);
    setNewCampaign({
      name: '',
      description: '',
      campaign_type: 'product_feed',
      platforms: ['facebook'],
      budget_daily: 50,
      budget_total: 1000,
      bid_strategy: 'auto'
    });
  };

  const handleGetRecommendations = async (campaignId: string) => {
    try {
      const result = await getAIOptimization(campaignId);
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    }
  };

  const handleGetPerformance = async (campaignId: string) => {
    try {
      const result = await getPerformance(campaignId);
      setPerformanceData(result);
    } catch (error) {
      console.error('Error getting performance:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.budget_spent || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Campagnes actives</p>
                <p className="text-2xl font-bold">{activeCampaigns.length}</p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget dépensé</p>
                <p className="text-2xl font-bold">{totalSpend.toFixed(2)}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Impressions</p>
                <p className="text-2xl font-bold">12.4K</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Vos Campagnes</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Campagne
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Campagne Dynamique</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de la campagne</Label>
                  <Input
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="Ex: Soldes Hiver 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type de campagne</Label>
                  <Select
                    value={newCampaign.campaign_type}
                    onValueChange={(value) => setNewCampaign({ ...newCampaign, campaign_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Décrivez l'objectif de cette campagne..."
                />
              </div>

              <div className="space-y-2">
                <Label>Plateformes</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(platform => (
                    <Button
                      key={platform.value}
                      variant={newCampaign.platforms.includes(platform.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const platforms = newCampaign.platforms.includes(platform.value)
                          ? newCampaign.platforms.filter(p => p !== platform.value)
                          : [...newCampaign.platforms, platform.value];
                        setNewCampaign({ ...newCampaign, platforms });
                      }}
                    >
                      {platform.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget quotidien (€)</Label>
                  <Input
                    type="number"
                    value={newCampaign.budget_daily}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget_daily: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Budget total (€)</Label>
                  <Input
                    type="number"
                    value={newCampaign.budget_total}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget_total: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Stratégie d'enchère</Label>
                <Select
                  value={newCampaign.bid_strategy}
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, bid_strategy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatique (recommandé)</SelectItem>
                    <SelectItem value="manual">Manuel</SelectItem>
                    <SelectItem value="target_roas">ROAS cible</SelectItem>
                    <SelectItem value="target_cpa">CPA cible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !newCampaign.name}>
                {isCreating ? 'Création...' : 'Créer la campagne'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune campagne</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première campagne publicitaire dynamique
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une campagne
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map(campaign => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline">
                        {CAMPAIGN_TYPES.find(t => t.value === campaign.campaign_type)?.label}
                      </Badge>
                    </div>
                    
                    {campaign.description && (
                      <p className="text-muted-foreground text-sm mb-3">{campaign.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      {(campaign.platforms || []).map(platform => {
                        const p = PLATFORMS.find(pl => pl.value === platform);
                        return (
                          <Badge key={platform} variant="secondary" className="text-xs">
                            {p?.label || platform}
                          </Badge>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget quotidien</p>
                        <p className="font-medium">{campaign.budget_daily || 0}€</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Budget total</p>
                        <p className="font-medium">{campaign.budget_total || 0}€</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Dépensé</p>
                        <p className="font-medium">{campaign.budget_spent || 0}€</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Progression</p>
                        <Progress 
                          value={campaign.budget_total ? ((campaign.budget_spent || 0) / campaign.budget_total) * 100 : 0} 
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {campaign.status === 'active' ? (
                      <Button variant="outline" size="sm" onClick={() => pauseCampaign(campaign.id)}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => startCampaign(campaign.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        handleGetPerformance(campaign.id);
                        handleGetRecommendations(campaign.id);
                      }}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => generateFeed(campaign.id)}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteCampaign(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {campaign.campaign_product_feeds && campaign.campaign_product_feeds.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Flux produits</p>
                    <div className="flex gap-2">
                      {campaign.campaign_product_feeds.map(feed => (
                        <Badge key={feed.id} variant="outline" className="flex items-center gap-1">
                          {feed.name} ({feed.product_count} produits)
                          <ExternalLink className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Performance & Recommendations Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance: {selectedCampaign?.name}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="performance">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="recommendations">
                <Sparkles className="h-4 w-4 mr-1" />
                Recommandations IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              {performanceData?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Impressions</p>
                      <p className="text-2xl font-bold">{performanceData.summary.impressions.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Clics</p>
                      <p className="text-2xl font-bold">{performanceData.summary.clicks.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">CTR: {performanceData.summary.ctr}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Conversions</p>
                      <p className="text-2xl font-bold">{performanceData.summary.conversions}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">ROAS</p>
                      <p className="text-2xl font-bold">{performanceData.summary.roas}x</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Optimisations suggérées par l'IA
                  </CardTitle>
                  <CardDescription>
                    Recommandations basées sur l'analyse des performances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Chargement des recommandations...
                    </p>
                  ) : (
                    recommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={
                                rec.priority === 'high' ? 'destructive' : 
                                rec.priority === 'medium' ? 'default' : 'secondary'
                              }>
                                {rec.priority === 'high' ? 'Haute priorité' : 
                                 rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                              </Badge>
                              <span className="text-sm text-muted-foreground capitalize">{rec.type}</span>
                            </div>
                            <h4 className="font-medium">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            Appliquer
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
