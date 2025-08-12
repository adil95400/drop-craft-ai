import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Bot, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Zap } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { useToast } from '@/hooks/use-toast';

interface AIInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIInsightsModal({ open, onOpenChange }: AIInsightsModalProps) {
  const [analysisType, setAnalysisType] = useState('sales_trends');
  const { generateInsights, isGeneratingInsights } = useAI();
  const { toast } = useToast();

  const mockInsights = {
    sales_trends: {
      title: "Analyse des tendances de vente",
      insights: [
        { type: "success", text: "Croissance de 23% sur les smartphones cette semaine", priority: "high" },
        { type: "warning", text: "Baisse des ventes d'accessoires (-12%)", priority: "medium" },
        { type: "info", text: "Pic d'activité prévu le weekend prochain", priority: "low" }
      ],
      recommendations: [
        "Augmenter le stock des iPhone 15 Pro de 50 unités",
        "Lancer une campagne promotionnelle pour les accessoires",
        "Préparer une opération flash pour le weekend"
      ]
    },
    customer_behavior: {
      title: "Comportement client",
      insights: [
        { type: "success", text: "Taux de rétention client amélioré de 8%", priority: "high" },
        { type: "info", text: "Temps moyen sur site: 4m 32s (+15%)", priority: "medium" },
        { type: "warning", text: "Abandon panier élevé sur mobile (68%)", priority: "high" }
      ],
      recommendations: [
        "Optimiser le checkout mobile",
        "Créer un programme de fidélité renforcé",
        "Segmenter les campagnes par comportement"
      ]
    }
  };

  const handleGenerateInsights = async () => {
    try {
      await generateInsights({
        analysisType: analysisType as any,
        data: {
          salesData: [],
          products: [],
          periods: ['7d']
        },
        timeRange: '7d',
        metrics: ['sales', 'conversion', 'traffic']
      });
      
      toast({
        title: "Insights générés",
        description: "Analyse IA terminée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer les insights",
        variant: "destructive",
      });
    }
  };

  const currentInsights = mockInsights[analysisType as keyof typeof mockInsights];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-500" />
            IA Insights - Analyse Avancée
          </DialogTitle>
          <DialogDescription>
            Générez des insights personnalisés avec l'intelligence artificielle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration de l'analyse */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration de l'analyse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type d'analyse</label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_trends">Tendances de vente</SelectItem>
                      <SelectItem value="customer_behavior">Comportement client</SelectItem>
                      <SelectItem value="inventory_optimization">Optimisation stock</SelectItem>
                      <SelectItem value="conversion_optimization">Optimisation conversion</SelectItem>
                      <SelectItem value="fraud_detection">Détection fraude</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Période d'analyse</label>
                  <Select defaultValue="7d">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Dernières 24h</SelectItem>
                      <SelectItem value="7d">7 derniers jours</SelectItem>
                      <SelectItem value="30d">30 derniers jours</SelectItem>
                      <SelectItem value="90d">3 derniers mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerateInsights}
                disabled={isGeneratingInsights}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isGeneratingInsights ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Générer les insights IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Résultats */}
          <Tabs defaultValue="insights" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{currentInsights.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentInsights.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                      {insight.type === 'success' && <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />}
                      {insight.type === 'warning' && <TrendingDown className="h-5 w-5 text-yellow-500 mt-0.5" />}
                      {insight.type === 'info' && <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />}
                      
                      <div className="flex-1">
                        <p className="text-sm">{insight.text}</p>
                      </div>
                      
                      <Badge variant={
                        insight.priority === 'high' ? 'destructive' :
                        insight.priority === 'medium' ? 'secondary' : 'outline'
                      }>
                        {insight.priority}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recommandations stratégiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentInsights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                      <Target className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{rec}</p>
                        <div className="mt-2">
                          <Progress value={Math.random() * 100} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Impact estimé: {Math.floor(Math.random() * 30 + 10)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Actions recommandées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Créer une campagne marketing ciblée
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Ajuster les niveaux de stock
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Optimiser le processus de checkout
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}