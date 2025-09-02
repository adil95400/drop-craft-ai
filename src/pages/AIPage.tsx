import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Target, 
  BarChart3, 
  Sparkles, 
  Bot, 
  Activity,
  Lightbulb,
  Cpu,
  Globe,
  Crown
} from 'lucide-react';

// Import des interfaces AI existantes
import { AIAnalysisInterface } from '@/components/ai/AIAnalysisInterface';
import { PredictiveAIInterface } from '@/components/ai/PredictiveAIInterface';
import { AIUltraProInterface } from '@/components/ai/AIUltraProInterface';
import { AIImportUltraPro } from '@/components/import/AIImportUltraPro';

const AIPage = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [aiStats, setAiStats] = useState({
    totalAnalyses: 0,
    predictions: 0,
    optimizations: 0,
    automations: 0
  });

  useEffect(() => {
    // Simuler le chargement des statistiques AI
    setAiStats({
      totalAnalyses: 247,
      predictions: 89,
      optimizations: 156,
      automations: 34
    });
  }, []);

  const aiFeatures = [
    {
      id: 'analysis',
      title: 'Analyse Intelligente',
      description: 'Analysez vos produits et obtenez des insights actionables avec l\'IA',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500',
      isPro: false
    },
    {
      id: 'predictions',
      title: 'Prédictions Avancées',
      description: 'Anticipez les tendances du marché et les performances futures',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      isPro: true
    },
    {
      id: 'optimization',
      title: 'Optimisation Ultra Pro',
      description: 'Optimisez automatiquement vos catalogues avec l\'IA avancée',
      icon: Zap,
      color: 'from-orange-500 to-red-500',
      isPro: true
    },
    {
      id: 'import',
      title: 'Import Intelligent',
      description: 'Importez et optimisez vos produits automatiquement',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      isPro: false
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Analyses IA</p>
                <p className="text-2xl font-bold text-primary">{aiStats.totalAnalyses}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prédictions</p>
                <p className="text-2xl font-bold text-primary">{aiStats.predictions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Optimisations</p>
                <p className="text-2xl font-bold text-primary">{aiStats.optimizations}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Automatisations</p>
                <p className="text-2xl font-bold text-primary">{aiStats.automations}</p>
              </div>
              <Bot className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiFeatures.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card 
              key={feature.id} 
              className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setActiveTab(feature.id)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5`} />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      {feature.isPro && (
                        <Badge variant="secondary" className="mt-1">
                          <Crown className="h-3 w-3 mr-1" />
                          Ultra Pro
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(feature.id);
                  }}
                >
                  Utiliser cette fonctionnalité
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Actions Rapides IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => setActiveTab('analysis')}
            >
              <div className="text-left">
                <p className="font-medium">Analyse Rapide</p>
                <p className="text-sm text-muted-foreground">Analyser tous les produits</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => setActiveTab('predictions')}
            >
              <div className="text-left">
                <p className="font-medium">Prédictions Marché</p>
                <p className="text-sm text-muted-foreground">Tendances à 30 jours</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => setActiveTab('optimization')}
            >
              <div className="text-left">
                <p className="font-medium">Optimisation Auto</p>
                <p className="text-sm text-muted-foreground">SEO + Performance</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Intelligence Artificielle | Wise2Sync</title>
        <meta name="description" content="Centre d'intelligence artificielle pour l'analyse, prédiction et optimisation de vos produits e-commerce" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Intelligence Artificielle</h1>
                <p className="text-muted-foreground">
                  Optimisez votre e-commerce avec l'IA avancée de Wise2Sync
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              <Sparkles className="h-4 w-4 mr-2" />
              IA Active
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Prédictions
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Optimisation
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Import IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  Analyse Intelligente des Produits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIAnalysisInterface 
                  products={[]} // Pass actual products from context if needed
                  onAnalysisComplete={(analysis) => {
                    toast({
                      title: "Analyse terminée",
                      description: "Nouveaux insights disponibles dans le tableau de bord"
                    });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  Prédictions et Tendances IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PredictiveAIInterface />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimization">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Optimisation Ultra Pro
                  <Badge variant="secondary" className="ml-2">
                    <Crown className="h-3 w-3 mr-1" />
                    Ultra Pro
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIUltraProInterface />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Import et Optimisation Automatique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIImportUltraPro />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AIPage;