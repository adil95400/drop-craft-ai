import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Target,
  Lightbulb,
  BarChart3,
  ArrowRight,
  Sparkles,
  Bot,
  RefreshCw
} from 'lucide-react';
import { useSimplePlan } from '@/hooks/useSimplePlan';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'optimization' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  category: string;
  estimatedRevenue?: number;
  timeframe?: string;
}

interface AIDecision {
  id: string;
  title: string;
  description: string;
  recommendedAction: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  impact: string;
  reasoning: string[];
}

export const OperationalAI = () => {
  const { user } = useAuth();
  const { isUltraPro } = useSimplePlan(user);
  const { toast } = useToast();
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [decisions, setDecisions] = useState<AIDecision[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Mock AI insights
  const mockInsights: AIInsight[] = [
    {
      id: '1',
      type: 'opportunity',
      title: 'Optimisation des prix détectée',
      description: 'Augmenter le prix de 3 produits pourrait générer +15% de revenus sans impact sur les ventes',
      confidence: 87,
      impact: 'high',
      actionable: true,
      category: 'Pricing',
      estimatedRevenue: 2400,
      timeframe: '7 jours'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Stock critique sur produit bestseller',
      description: 'Le produit "T-Shirt Premium" va être en rupture dans 3 jours',
      confidence: 95,
      impact: 'high',
      actionable: true,
      category: 'Inventory',
      timeframe: '3 jours'
    },
    {
      id: '3',
      type: 'trend',
      title: 'Tendance saisonnière détectée',
      description: 'Les ventes de produits d\'été augmentent de 45% plus tôt que prévu',
      confidence: 78,
      impact: 'medium',
      actionable: true,
      category: 'Trends',
      estimatedRevenue: 1800
    },
    {
      id: '4',
      type: 'optimization',
      title: 'Opportunité de cross-selling',
      description: 'Recommander des accessoires avec les commandes actuelles pourrait augmenter le panier moyen',
      confidence: 82,
      impact: 'medium',
      actionable: true,
      category: 'Marketing',
      estimatedRevenue: 950
    }
  ];

  const mockDecisions: AIDecision[] = [
    {
      id: '1',
      title: 'Ajustement automatique des prix',
      description: 'Augmenter le prix de 3 produits de 8-12% en fonction de la demande',
      recommendedAction: 'Appliquer les nouveaux prix pendant 7 jours puis évaluer',
      confidence: 87,
      status: 'pending',
      impact: '+€2,400 revenus estimés',
      reasoning: [
        'Analyse de 30 jours de données de vente',
        'Comparaison avec la concurrence',
        'Élasticité prix historique favorable',
        'Inventaire disponible suffisant'
      ]
    },
    {
      id: '2',
      title: 'Commande automatique de stock',
      description: 'Passer commande de 200 unités de T-Shirt Premium',
      recommendedAction: 'Commander maintenant pour éviter la rupture',
      confidence: 95,
      status: 'approved',
      impact: 'Évite la perte de €3,200 en ventes',
      reasoning: [
        'Rythme de vente actuel: 15 unités/jour',
        'Délai de réapprovisionnement: 5 jours',
        'Marge bénéficiaire élevée sur ce produit',
        'Saison de forte demande'
      ]
    }
  ];

  useEffect(() => {
    if (isUltraPro) {
      setInsights(mockInsights);
      setDecisions(mockDecisions);
    }
  }, [isUltraPro]);

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate AI analysis progress
    const progressSteps = [
      { step: 20, message: 'Analyse des données de vente...' },
      { step: 40, message: 'Détection des tendances...' },
      { step: 60, message: 'Calcul des opportunités...' },
      { step: 80, message: 'Génération des recommandations...' },
      { step: 100, message: 'Analyse terminée !' }
    ];

    for (const { step, message } of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress(step);
      
      if (step < 100) {
        toast({
          description: message,
          duration: 1000
        });
      }
    }

    setIsAnalyzing(false);
    toast({
      title: "Analyse IA terminée",
      description: `${mockInsights.length} insights générés avec succès`,
    });
  };

  const handleApproveDecision = (decisionId: string) => {
    setDecisions(prev => 
      prev.map(d => 
        d.id === decisionId 
          ? { ...d, status: 'approved' }
          : d
      )
    );
    toast({
      title: "Décision approuvée",
      description: "L'action sera exécutée automatiquement",
    });
  };

  const handleRejectDecision = (decisionId: string) => {
    setDecisions(prev => 
      prev.map(d => 
        d.id === decisionId 
          ? { ...d, status: 'rejected' }
          : d
      )
    );
    toast({
      title: "Décision rejetée",
      description: "L'action n'sera pas exécutée",
      variant: "destructive"
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return Lightbulb;
      case 'warning': return AlertTriangle;
      case 'optimization': return Target;
      case 'trend': return TrendingUp;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-green-600';
      case 'warning': return 'text-red-600';
      case 'optimization': return 'text-blue-600';
      case 'trend': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isUltraPro) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">IA Opérationnelle</h3>
          <p className="text-muted-foreground mb-4">
            Disponible uniquement avec le plan Ultra Pro
          </p>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Fonctionnalité Premium
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            IA Opérationnelle
          </h2>
          <p className="text-muted-foreground">
            Intelligence artificielle pour l'optimisation automatique
          </p>
        </div>
        <Button onClick={runAIAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Nouvelle Analyse
            </>
          )}
        </Button>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Analyse IA en cours</span>
                <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
          <TabsTrigger value="decisions">Décisions Automatiques</TabsTrigger>
          <TabsTrigger value="performance">Performance IA</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight) => {
              const IconComponent = getInsightIcon(insight.type);
              const iconColor = getInsightColor(insight.type);
              
              return (
                <Card key={insight.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <IconComponent className={`h-6 w-6 ${iconColor} mt-1`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{insight.title}</h3>
                            <Badge className={getImpactColor(insight.impact)}>
                              {insight.impact.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">
                            {insight.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <BarChart3 className="h-4 w-4" />
                              <span>Confiance: {insight.confidence}%</span>
                            </div>
                            {insight.estimatedRevenue && (
                              <div className="flex items-center gap-1 text-green-600">
                                <Target className="h-4 w-4" />
                                <span>+€{insight.estimatedRevenue}</span>
                              </div>
                            )}
                            {insight.timeframe && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{insight.timeframe}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {insight.actionable && (
                        <Button size="sm" className="ml-4">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <div className="grid gap-4">
            {decisions.map((decision) => (
              <Card key={decision.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{decision.title}</h3>
                          <Badge variant={
                            decision.status === 'approved' ? 'default' :
                            decision.status === 'rejected' ? 'destructive' :
                            decision.status === 'executed' ? 'default' : 'secondary'
                          }>
                            {decision.status === 'pending' ? 'En attente' :
                             decision.status === 'approved' ? 'Approuvé' :
                             decision.status === 'rejected' ? 'Rejeté' : 'Exécuté'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{decision.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{decision.confidence}%</span>
                      </div>
                    </div>

                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Action recommandée:</strong> {decision.recommendedAction}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <h4 className="font-medium">Raisonnement IA:</h4>
                      <ul className="space-y-1">
                        {decision.reasoning.map((reason, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-medium text-green-600">
                        {decision.impact}
                      </span>
                      
                      {decision.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRejectDecision(decision.id)}
                          >
                            Rejeter
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleApproveDecision(decision.id)}
                          >
                            Approuver
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Précision IA</p>
                    <p className="text-2xl font-bold">87.3%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Sur les 30 derniers jours
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenus générés</p>
                    <p className="text-2xl font-bold">€12,450</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Grâce aux optimisations IA
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Temps économisé</p>
                    <p className="text-2xl font-bold">24h</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Automatisation des tâches
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};