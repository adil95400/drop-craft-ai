import { useState } from 'react';
import { productionLogger } from '@/utils/productionLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  BarChart3,
  Loader2,
  Brain,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface PredictiveAnalyzerProps {
  className?: string;
}

interface AnalysisResult {
  analysis: string;
  analysisType: string;
  metadata: {
    timeframe: string;
    confidence: string;
    dataPoints: number;
    generatedAt: string;
  };
}

const analysisTypes = [
  {
    id: 'sales_forecast',
    name: 'Prévisions de Ventes',
    icon: TrendingUp,
    description: 'Prédire les ventes futures basées sur les données historiques',
    color: 'text-green-600',
    sampleData: {
      monthly_sales: [12000, 15000, 18000, 22000, 19000, 25000],
      products: ['Produit A', 'Produit B', 'Produit C'],
      seasons: ['Q1', 'Q2', 'Q3', 'Q4'],
      trends: ['croissance', 'stable', 'déclin']
    }
  },
  {
    id: 'customer_behavior',
    name: 'Comportement Client',
    icon: Users,
    description: 'Analyser les patterns d\'achat et prédire le churn',
    color: 'text-blue-600',
    sampleData: {
      customer_segments: ['Premium', 'Régulier', 'Occasionnel'],
      purchase_frequency: [2.5, 1.8, 0.6],
      avg_order_value: [150, 89, 45],
      retention_rate: [0.85, 0.65, 0.30],
      churn_indicators: ['inactivité', 'baisse_commandes', 'support_tickets']
    }
  },
  {
    id: 'market_trends',
    name: 'Tendances Marché',
    icon: BarChart3,
    description: 'Identifier les opportunités et menaces du marché',
    color: 'text-purple-600',
    sampleData: {
      market_size: 1500000,
      growth_rate: 0.12,
      competition_level: 'élevé',
      emerging_trends: ['durabilité', 'personnalisation', 'omnichannel'],
      threats: ['nouveaux entrants', 'réglementation'],
      opportunities: ['segments inexploités', 'technologies émergentes']
    }
  },
  {
    id: 'inventory_optimization',
    name: 'Optimisation Stock',
    icon: Package,
    description: 'Optimiser les niveaux de stock et prédire la demande',
    color: 'text-orange-600',
    sampleData: {
      current_stock: { 'Produit A': 150, 'Produit B': 89, 'Produit C': 234 },
      turnover_rate: { 'Produit A': 12, 'Produit B': 8, 'Produit C': 15 },
      lead_times: { 'Fournisseur 1': 7, 'Fournisseur 2': 14, 'Fournisseur 3': 21 },
      seasonal_factors: [1.2, 0.8, 1.1, 1.4],
      reorder_points: { 'Produit A': 50, 'Produit B': 30, 'Produit C': 75 }
    }
  }
];

const timeframes = [
  { value: '1month', label: '1 mois' },
  { value: '3months', label: '3 mois' },
  { value: '6months', label: '6 mois' },
  { value: '1year', label: '1 an' }
];

const confidenceLevels = [
  { value: 'low', label: 'Faible', description: 'Analyse rapide' },
  { value: 'medium', label: 'Moyen', description: 'Analyse équilibrée' },
  { value: 'high', label: 'Élevé', description: 'Analyse approfondie' }
];

export const PredictiveAnalyzer = ({ className }: PredictiveAnalyzerProps) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState(analysisTypes[0]);
  const [timeframe, setTimeframe] = useState('3months');
  const [confidence, setConfidence] = useState('medium');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const { toast } = useToast();

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setActiveTab('results');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Vous devez être connecté pour utiliser l\'analyse prédictive');
      }

      // Utiliser les données d'exemple du type d'analyse sélectionné
      const analysisData = selectedAnalysis.sampleData;

      const response = await supabase.functions.invoke('ai-powerhouse/predictive-analyzer', {
        body: {
          analysisType: selectedAnalysis.id,
          data: analysisData,
          timeframe,
          confidence
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de l\'analyse prédictive');
      }

      setAnalysisResult(response.data);
      
      toast({
        title: "Analyse terminée !",
        description: `Analyse ${selectedAnalysis.name} générée avec succès`
      });

    } catch (error: any) {
      productionLogger.error('Predictive analysis failed', error as Error, 'PredictiveAnalyzer');
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
      setActiveTab('config');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatAnalysisText = (text: string) => {
    // Diviser le texte en sections et ajouter de la mise en forme
    const lines = text.split('\n').filter(line => line.trim());
    const sections = [];
    let currentSection = { title: '', content: [] as string[] };

    lines.forEach(line => {
      if (line.includes('##') || line.includes('**')) {
        if (currentSection.title) {
          sections.push(currentSection);
        }
        currentSection = { 
          title: line.replace(/[#*]/g, '').trim(), 
          content: [] 
        };
      } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        currentSection.content.push(line.trim());
      } else if (line.trim()) {
        currentSection.content.push(line.trim());
      }
    });

    if (currentSection.title) {
      sections.push(currentSection);
    }

    return sections;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Analyse Prédictive IA
          </CardTitle>
          <CardDescription>
            Utilisez l'intelligence artificielle pour analyser vos données et prédire les tendances futures
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="results">Résultats</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          {/* Sélection du type d'analyse */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Type d'Analyse</CardTitle>
              <CardDescription>
                Choisissez le type d'analyse prédictive à effectuer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedAnalysis.id === type.id
                          ? 'ring-2 ring-primary border-primary'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedAnalysis(type)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Icon className={`h-6 w-6 ${type.color} flex-shrink-0`} />
                          <div>
                            <h3 className="font-medium mb-1">{type.name}</h3>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Paramètres d'analyse */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Paramètres d'Analyse</CardTitle>
              <CardDescription>
                Configurez la période et le niveau de précision de l'analyse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="timeframe">Période de prédiction</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeframes.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="confidence">Niveau de confiance</Label>
                  <Select value={confidence} onValueChange={setConfidence}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {confidenceLevels.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex flex-col">
                            <span>{c.label}</span>
                            <span className="text-xs text-muted-foreground">{c.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Aperçu des données */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Données d'analyse sélectionnées
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedAnalysis.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(selectedAnalysis.sampleData).map((key) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={runAnalysis}
                disabled={isAnalyzing}
                size="lg"
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Lancer l'analyse prédictive
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {isAnalyzing ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Analyse en cours</h3>
                <p className="text-muted-foreground text-center mb-4">
                  L'IA analyse vos données pour générer des prédictions...
                </p>
                <Progress value={33} className="w-64" />
              </CardContent>
            </Card>
          ) : analysisResult ? (
            <div className="space-y-6">
              {/* Métadonnées de l'analyse */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Analyse Terminée
                      </CardTitle>
                      <CardDescription>
                        {selectedAnalysis.name} • {analysisResult.metadata.timeframe}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(analysisResult.metadata.generatedAt).toLocaleString()}
                      </Badge>
                      <Badge variant="outline">
                        {analysisResult.metadata.dataPoints} points de données
                      </Badge>
                      <Badge variant="default">
                        Confiance: {analysisResult.metadata.confidence}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Résultats de l'analyse */}
              <Card>
                <CardHeader>
                  <CardTitle>Résultats de l'Analyse</CardTitle>
                  <CardDescription>
                    Insights et prédictions générés par l'IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {formatAnalysisText(analysisResult.analysis).map((section, index) => (
                      <div key={index} className="space-y-3">
                        {section.title && (
                          <h3 className="text-lg font-semibold border-b pb-2">
                            {section.title}
                          </h3>
                        )}
                        <div className="space-y-2">
                          {section.content.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-start gap-2">
                              {item.startsWith('-') || item.startsWith('•') ? (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                  <p className="text-sm leading-relaxed">{item.replace(/^[-•]\s*/, '')}</p>
                                </>
                              ) : (
                                <p className="text-sm leading-relaxed">{item}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setActiveTab('config')}>
                      Nouvelle analyse
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const content = `${selectedAnalysis.name}\n\nGénéré le: ${new Date(analysisResult.metadata.generatedAt).toLocaleString()}\n\n${analysisResult.analysis}`;
                        navigator.clipboard.writeText(content);
                        toast({ title: "Copié !", description: "Analyse copiée dans le presse-papiers" });
                      }}
                    >
                      Copier l'analyse
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune analyse disponible</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Configurez une analyse dans l'onglet Configuration pour commencer
                </p>
                <Button variant="outline" onClick={() => setActiveTab('config')}>
                  Configurer une analyse
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};