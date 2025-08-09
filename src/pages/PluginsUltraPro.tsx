import { useState } from "react";
import { Puzzle, Cpu, Zap, TrendingUp, Shield, Code, Download, Settings, Search, Filter, Star, Users, BarChart3, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/layouts/AppLayout";
import { useToast } from "@/hooks/use-toast";

export default function PluginsUltraPro() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  // Mock data pour les plugins avec IA
  const plugins = [
    {
      id: 1,
      name: "AI Content Generator",
      category: "content",
      description: "Génération automatique de contenu optimisé SEO avec IA",
      version: "2.4.1",
      rating: 4.9,
      downloads: 15240,
      installed: true,
      premium: true,
      aiPowered: true,
      status: "active"
    },
    {
      id: 2,
      name: "Smart Price Optimizer",
      category: "pricing",
      description: "Optimisation intelligente des prix basée sur l'IA",
      version: "1.8.2",
      rating: 4.7,
      downloads: 8930,
      installed: true,
      premium: true,
      aiPowered: true,
      status: "active"
    },
    {
      id: 3,
      name: "Predictive Analytics Pro",
      category: "analytics",
      description: "Analytics prédictives avec machine learning",
      version: "3.1.0",
      rating: 4.8,
      downloads: 12150,
      installed: false,
      premium: true,
      aiPowered: true,
      status: "available"
    }
  ];

  const aiInsights = [
    {
      type: "recommendation",
      title: "Plugin Recommandé",
      description: "AI Inventory Predictor pourrait réduire vos ruptures de stock de 34%",
      confidence: 89
    },
    {
      type: "performance",
      title: "Performance Détectée",
      description: "Smart Price Optimizer a augmenté vos ventes de 18% ce mois",
      confidence: 95
    },
    {
      type: "update",
      title: "Mise à jour Critique",
      description: "Nouvelle version d'AI Content Generator disponible avec 40% d'amélioration",
      confidence: 92
    }
  ];

  const handleInstallPlugin = (pluginId: number) => {
    toast({
      title: "Installation en cours",
      description: "Installation du plugin avec configuration IA automatique...",
    });
  };

  const handleAIOptimization = () => {
    toast({
      title: "Optimisation IA",
      description: "Analyse des performances et recommandations en cours...",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Puzzle className="w-8 h-8 text-primary" />
              Plugins Ultra Pro
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </h1>
            <p className="text-muted-foreground">Marketplace intelligent avec IA prédictive et optimisation automatique</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAIOptimization}>
              <Cpu className="w-4 h-4 mr-2" />
              Optimisation IA
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
              <Download className="w-4 h-4 mr-2" />
              Installer Plugins IA
            </Button>
          </div>
        </div>

        {/* AI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights.map((insight, index) => (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={insight.confidence} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground">{insight.confidence}%</span>
                    </div>
                  </div>
                  <Cpu className="w-4 h-4 text-primary flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plugins Installés</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <Puzzle className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plugins IA</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Cpu className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Performance +</p>
                  <p className="text-2xl font-bold">+34%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Économies</p>
                  <p className="text-2xl font-bold">€2,340</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des plugins IA..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    <SelectItem value="ai">IA & Machine Learning</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="content">Contenu</SelectItem>
                    <SelectItem value="pricing">Pricing</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres IA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plugins Tabs */}
        <Tabs defaultValue="installed" className="space-y-4">
          <TabsList>
            <TabsTrigger value="installed">Installés</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace IA</TabsTrigger>
            <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="installed" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {plugins.filter(p => p.installed).map((plugin) => (
                <Card key={plugin.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {plugin.name}
                          {plugin.aiPowered && <Cpu className="w-4 h-4 text-blue-500" />}
                          {plugin.premium && <Star className="w-4 h-4 text-yellow-500" />}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{plugin.description}</p>
                      </div>
                      <Badge variant={plugin.status === "active" ? "default" : "secondary"}>
                        {plugin.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span>v{plugin.version}</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{plugin.rating}</span>
                        <Users className="w-4 h-4 ml-2" />
                        <span>{plugin.downloads.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurer
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Statistiques
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {plugins.filter(p => !p.installed).map((plugin) => (
                <Card key={plugin.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {plugin.name}
                          {plugin.aiPowered && <Cpu className="w-4 h-4 text-blue-500" />}
                          {plugin.premium && <Star className="w-4 h-4 text-yellow-500" />}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{plugin.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span>v{plugin.version}</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{plugin.rating}</span>
                        <Users className="w-4 h-4 ml-2" />
                        <span>{plugin.downloads.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button onClick={() => handleInstallPlugin(plugin.id)} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Installer Plugin IA
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-500" />
                  Recommandations IA Personnalisées
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  L'IA analyse vos données pour recommander les meilleurs plugins
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  Analytics de Performance IA
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Visualisation des performances et impact des plugins IA
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}