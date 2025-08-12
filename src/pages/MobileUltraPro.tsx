import { useState } from "react";
import { Smartphone, Monitor, Tablet, Wifi, Battery, Signal, Users, TrendingUp, Eye, Download, Settings, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function MobileUltraPro() {
  const [selectedDevice, setSelectedDevice] = useState("mobile");
  const { toast } = useToast();

  // Mock data pour analytics mobile avec IA
  const mobileTraffic = [
    { month: 'Jan', mobile: 65, tablet: 20, desktop: 15 },
    { month: 'Fév', mobile: 68, tablet: 18, desktop: 14 },
    { month: 'Mar', mobile: 72, tablet: 16, desktop: 12 },
    { month: 'Avr', mobile: 75, tablet: 15, desktop: 10 },
    { month: 'Mai', mobile: 78, tablet: 14, desktop: 8 },
    { month: 'Jun', mobile: 82, tablet: 12, desktop: 6 }
  ];

  const deviceData = [
    { name: 'Mobile', value: 78, color: '#8b5cf6' },
    { name: 'Tablet', value: 14, color: '#06b6d4' },
    { name: 'Desktop', value: 8, color: '#10b981' }
  ];

  const aiInsights = [
    {
      type: "performance",
      title: "Optimisation Mobile Détectée",
      description: "L'IA recommande d'optimiser les images pour réduire le temps de chargement de 32%",
      confidence: 94,
      impact: "high"
    },
    {
      type: "behavior",
      title: "Comportement Utilisateur",
      description: "85% des achats se font sur mobile le soir entre 19h-22h",
      confidence: 89,
      impact: "medium"
    },
    {
      type: "conversion",
      title: "Taux de Conversion Mobile",
      description: "L'interface mobile actuelle convertit 23% mieux que la moyenne",
      confidence: 92,
      impact: "high"
    }
  ];

  const handleOptimizeApp = () => {
    toast({
      title: "Optimisation IA en cours",
      description: "Application des recommandations d'optimisation mobile...",
    });
  };

  const handleGenerateAPK = () => {
    toast({
      title: "Génération APK",
      description: "Création de l'application mobile avec IA intégrée...",
    });
  };

  return (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-primary" />
              Mobile Ultra Pro
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </h1>
            <p className="text-muted-foreground">Optimisation mobile intelligente avec IA prédictive</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOptimizeApp}>
              <Settings className="w-4 h-4 mr-2" />
              Optimisation IA
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" onClick={handleGenerateAPK}>
              <Download className="w-4 h-4 mr-2" />
              Générer App Mobile
            </Button>
          </div>
        </div>

        {/* AI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights.map((insight, index) => (
            <Card key={index} className={`border-l-4 ${insight.impact === 'high' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
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
                  <Badge variant={insight.impact === 'high' ? 'destructive' : 'default'} className="ml-2">
                    {insight.impact}
                  </Badge>
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
                  <p className="text-sm text-muted-foreground">Trafic Mobile</p>
                  <p className="text-2xl font-bold">78%</p>
                </div>
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Temps Chargement</p>
                  <p className="text-2xl font-bold">1.2s</p>
                </div>
                <Wifi className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score Performance</p>
                  <p className="text-2xl font-bold">94/100</p>
                </div>
                <Battery className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Mobile</p>
                  <p className="text-2xl font-bold">4.8%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="performance">Performance IA</TabsTrigger>
            <TabsTrigger value="behavior">Comportement</TabsTrigger>
            <TabsTrigger value="optimization">Optimisation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution du Trafic Mobile</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mobileTraffic}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="mobile" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                      <Area type="monotone" dataKey="tablet" stackId="1" stroke="#06b6d4" fill="#06b6d4" />
                      <Area type="monotone" dataKey="desktop" stackId="1" stroke="#10b981" fill="#10b981" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Appareil</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({name, value}) => `${name}: ${value}%`}
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="w-5 h-5 text-green-500" />
                  Performance Mobile IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Signal className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-semibold">Vitesse de Chargement</h4>
                    <p className="text-2xl font-bold text-green-600">1.2s</p>
                    <p className="text-sm text-muted-foreground">+34% vs concurrence</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h4 className="font-semibold">Score UX</h4>
                    <p className="text-2xl font-bold text-green-600">94/100</p>
                    <p className="text-sm text-muted-foreground">Excellent</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <h4 className="font-semibold">Engagement</h4>
                    <p className="text-2xl font-bold text-green-600">+28%</p>
                    <p className="text-sm text-muted-foreground">Temps sur site</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Analyse Comportementale IA
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  L'IA analyse les parcours utilisateurs pour optimiser l'expérience mobile
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimization">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-500" />
                  Recommandations d'Optimisation IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-green-600">✓ Compression Images</h4>
                    <p className="text-sm text-muted-foreground">Réduction de 45% de la taille des images</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-blue-600">→ Cache Intelligent</h4>
                    <p className="text-sm text-muted-foreground">Mise en cache prédictive des contenus</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-orange-600">⚡ Lazy Loading</h4>
                    <p className="text-sm text-muted-foreground">Chargement différé des éléments non critiques</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}