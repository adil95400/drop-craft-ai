import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  Mail, 
  MessageSquare, 
  TrendingUp, 
  Users,
  Zap,
  Calendar,
  BarChart3,
  Send,
  Play,
  Pause,
  Eye,
  Edit,
  Copy,
  Plus,
  Filter,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealMarketing } from "@/hooks/useRealMarketing";

const Marketing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const { campaigns: realCampaigns } = useRealMarketing();

  const campaigns = [
    {
      id: "1",
      name: "Black Friday 2024",
      type: "email",
      status: "active",
      budget: "€2,500",
      spent: "€1,847",
      conversions: 234,
      roi: "+280%",
      reach: "15.2K",
      engagement: "8.4%"
    },
    {
      id: "2", 
      name: "Produits iPhone 15",
      type: "ads",
      status: "active",
      budget: "€5,000",
      spent: "€3,245",
      conversions: 156,
      roi: "+190%",
      reach: "42.1K",
      engagement: "5.2%"
    },
    {
      id: "3",
      name: "Retargeting Abandons",
      type: "retargeting",
      status: "paused",
      budget: "€1,200",
      spent: "€890",
      conversions: 89,
      roi: "+150%",
      reach: "8.7K",
      engagement: "12.1%"
    },
    {
      id: "4",
      name: "Newsletter Hebdo",
      type: "email",
      status: "active",
      budget: "€500",
      spent: "€320",
      conversions: 67,
      roi: "+120%",
      reach: "25.3K",
      engagement: "6.8%"
    }
  ];

  const marketingMetrics = [
    {
      title: "ROI Moyen",
      value: "+210%",
      change: "+15%",
      trend: "up",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Coût/Acquisition",
      value: "€12.50",
      change: "-8%",
      trend: "down",
      icon: Target,
      color: "text-blue-600"
    },
    {
      title: "Taux Ouverture",
      value: "24.8%",
      change: "+3.2%",
      trend: "up",
      icon: Mail,
      color: "text-purple-600"
    },
    {
      title: "Engagement",
      value: "7.5%",
      change: "+1.8%",
      trend: "up",
      icon: MessageSquare,
      color: "text-orange-600"
    }
  ];

  const campaignTypes = [
    { type: "email", label: "Email Marketing", icon: Mail, count: 12 },
    { type: "ads", label: "Publicités", icon: Target, count: 8 },
    { type: "social", label: "Réseaux Sociaux", icon: MessageSquare, count: 15 },
    { type: "retargeting", label: "Retargeting", icon: Users, count: 5 }
  ];

  const handleCreateCampaign = () => {
    toast({
      title: "Nouvelle Campagne",
      description: "Assistant de création lancé",
    });
  };

  const handleCampaignAction = (action: string, campaignId: string) => {
    toast({
      title: `Campagne ${action}`,
      description: `Action effectuée sur la campagne ${campaignId}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "paused": return "secondary";
      case "draft": return "outline";
      default: return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email": return Mail;
      case "ads": return Target;
      case "social": return MessageSquare;
      case "retargeting": return Users;
      default: return Target;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Marketing Pro
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez vos campagnes marketing intelligentes
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Rapports
          </Button>
          <Button onClick={handleCreateCampaign}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Campagne
          </Button>
          <Button variant="premium" onClick={() => navigate("/marketing-ultra-pro")}>
            <Zap className="mr-2 h-4 w-4" />
            Ultra Pro
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {marketingMetrics.map((metric, index) => (
          <Card key={index} className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {metric.trend === "up" ? (
                  <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>
                  {metric.change}
                </span>
                <span className="ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Campaigns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Types Overview */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Types de Campagnes</CardTitle>
              <CardDescription>Vue d'ensemble de vos campagnes actives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {campaignTypes.map((type, index) => (
                  <div key={index} className="text-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <type.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.count} campagnes</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Campaigns */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Campagnes Actives</CardTitle>
                  <CardDescription>Gérez vos campagnes en cours</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const TypeIcon = getTypeIcon(campaign.type);
                  return (
                    <div 
                      key={campaign.id} 
                      className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedCampaign(campaign.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <TypeIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{campaign.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {campaign.reach} portée • ROI {campaign.roi}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(campaign.status)}>
                            {campaign.status === "active" ? "Actif" : 
                             campaign.status === "paused" ? "Pausé" : "Brouillon"}
                          </Badge>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {campaign.status === "active" ? (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCampaignAction("pause", campaign.id);
                                }}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCampaignAction("play", campaign.id);
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Budget</div>
                          <div className="font-medium">{campaign.budget}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Dépensé</div>
                          <div className="font-medium">{campaign.spent}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Conversions</div>
                          <div className="font-medium">{campaign.conversions}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Engagement</div>
                          <div className="font-medium">{campaign.engagement}</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Budget utilisé</span>
                          <span>{Math.round((parseFloat(campaign.spent.replace('€', '').replace(',', '')) / parseFloat(campaign.budget.replace('€', '').replace(',', ''))) * 100)}%</span>
                        </div>
                        <Progress 
                          value={Math.round((parseFloat(campaign.spent.replace('€', '').replace(',', '')) / parseFloat(campaign.budget.replace('€', '').replace(',', ''))) * 100)} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={handleCreateCampaign}>
                <Plus className="mr-2 h-4 w-4" />
                Créer Email Campaign
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="mr-2 h-4 w-4" />
                Nouvelle Pub Facebook
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Campagne Retargeting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Copy className="mr-2 h-4 w-4" />
                Dupliquer Campagne
              </Button>
            </CardContent>
          </Card>

          {/* Performance This Month */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Performance du Mois</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Emails envoyés</span>
                <span className="font-semibold">42,567</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Taux d'ouverture</span>
                <span className="font-semibold text-green-600">24.8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Clics</span>
                <span className="font-semibold">3,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Conversions</span>
                <span className="font-semibold">546</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">ROI Global</span>
                <span className="font-semibold text-primary">+210%</span>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Content */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Meilleurs Contenus</CardTitle>
              <CardDescription>Vos créations les plus performantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { title: "Black Friday Deal iPhone", engagement: "12.4%", type: "Email" },
                  { title: "Product Launch Video", engagement: "9.8%", type: "Social" },
                  { title: "Customer Testimonials", engagement: "8.7%", type: "Ad" },
                  { title: "Holiday Collection", engagement: "7.2%", type: "Email" }
                ].map((content, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{content.title}</div>
                      <div className="text-xs text-muted-foreground">{content.type}</div>
                    </div>
                    <Badge variant="secondary">{content.engagement}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* A/B Testing */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Tests A/B Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border border-border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">Sujet Email Campaign</span>
                    <Badge variant="outline">En cours</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Version A: 52% • Version B: 48%
                  </div>
                  <Progress value={52} className="h-2 mt-2" />
                </div>
                
                <div className="p-3 border border-border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">Call-to-Action Button</span>
                    <Badge variant="default">Terminé</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Gagnant: Version B (+15% conversion)
                  </div>
                  <Progress value={85} className="h-2 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Marketing;