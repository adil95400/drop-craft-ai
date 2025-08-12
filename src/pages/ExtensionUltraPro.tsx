import { useState } from "react";
import { Chrome, Download, Code, Cpu, Shield, TrendingUp, Users, Settings, Puzzle, Sparkles, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function ExtensionUltraPro() {
  const [selectedBrowser, setSelectedBrowser] = useState("chrome");
  const { toast } = useToast();

  // Mock data pour analytics extension avec IA
  const extensionUsage = [
    { month: 'Jan', installations: 1240, conversions: 89 },
    { month: 'Fév', installations: 1580, conversions: 112 },
    { month: 'Mar', installations: 1890, conversions: 145 },
    { month: 'Avr', installations: 2340, conversions: 189 },
    { month: 'Mai', installations: 2780, conversions: 234 },
    { month: 'Jun', installations: 3120, conversions: 278 }
  ];

  const browserData = [
    { browser: 'Chrome', users: 78, conversions: 4.2 },
    { browser: 'Firefox', users: 15, conversions: 3.8 },
    { browser: 'Safari', users: 5, conversions: 3.1 },
    { browser: 'Edge', users: 2, conversions: 2.9 }
  ];

  const aiFeatures = [
    {
      name: "Auto-Sync Products",
      description: "Synchronisation automatique des produits avec IA",
      usage: 89,
      status: "active",
      impact: "high"
    },
    {
      name: "Price Monitor",
      description: "Surveillance intelligente des prix concurrents",
      usage: 76,
      status: "active",
      impact: "high"
    },
    {
      name: "Review Analyzer",
      description: "Analyse IA des avis clients",
      usage: 65,
      status: "active",
      impact: "medium"
    },
    {
      name: "SEO Optimizer",
      description: "Optimisation SEO automatisée",
      usage: 58,
      status: "beta",
      impact: "high"
    }
  ];

  const handlePublishExtension = () => {
    toast({
      title: "Publication en cours",
      description: "Déploiement de l'extension avec fonctionnalités IA...",
    });
  };

  const handleAIAnalysis = () => {
    toast({
      title: "Analyse IA",
      description: "Génération des recommandations d'optimisation...",
    });
  };

  return (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Puzzle className="w-8 h-8 text-primary" />
              Extension Ultra Pro
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </h1>
            <p className="text-muted-foreground">Extensions navigateur intelligentes avec IA intégrée</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAIAnalysis}>
              <Cpu className="w-4 h-4 mr-2" />
              Analyse IA
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white" onClick={handlePublishExtension}>
              <Download className="w-4 h-4 mr-2" />
              Publier Extension
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilisateurs Actifs</p>
                  <p className="text-2xl font-bold">24,891</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux Conversion</p>
                  <p className="text-2xl font-bold">4.2%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fonctions IA</p>
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
                  <p className="text-sm text-muted-foreground">Score Sécurité</p>
                  <p className="text-2xl font-bold">98/100</p>
                </div>
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Browser Support */}
        <Card>
          <CardHeader>
            <CardTitle>Support Navigateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Chrome className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold">Chrome</h4>
                <Badge className="mt-1">Actif</Badge>
                <p className="text-sm text-muted-foreground mt-1">78% utilisateurs</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Globe className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <h4 className="font-semibold">Firefox</h4>
                <Badge className="mt-1">Actif</Badge>
                <p className="text-sm text-muted-foreground mt-1">15% utilisateurs</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Globe className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <h4 className="font-semibold">Safari</h4>
                <Badge variant="secondary" className="mt-1">Bêta</Badge>
                <p className="text-sm text-muted-foreground mt-1">5% utilisateurs</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Code className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold">Edge</h4>
                <Badge variant="outline" className="mt-1">Développement</Badge>
                <p className="text-sm text-muted-foreground mt-1">2% utilisateurs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extension Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="features">Fonctionnalités IA</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Croissance des Installations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={extensionUsage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="installations" stroke="#8b5cf6" fill="#8b5cf6" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance par Navigateur</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={browserData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="browser" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="conversions" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {aiFeatures.map((feature, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {feature.name}
                          <Cpu className="w-4 h-4 text-blue-500" />
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                      </div>
                      <Badge variant={feature.status === "active" ? "default" : "secondary"}>
                        {feature.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Utilisation</span>
                        <span>{feature.usage}%</span>
                      </div>
                      <Progress value={feature.usage} className="h-2" />
                      <Badge 
                        variant={feature.impact === "high" ? "destructive" : "default"}
                        className="mt-2"
                      >
                        Impact {feature.impact}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Analytics Avancées IA
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Analyse prédictive du comportement utilisateur et optimisation automatique
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-500" />
                  Sécurité et Confidentialité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-semibold">Chiffrement</h4>
                    <p className="text-sm text-muted-foreground">AES-256</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Code className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-semibold">Permissions</h4>
                    <p className="text-sm text-muted-foreground">Minimales</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Settings className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h4 className="font-semibold">Audits</h4>
                    <p className="text-sm text-muted-foreground">Automatiques</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}