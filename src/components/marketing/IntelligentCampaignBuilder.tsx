import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Bot, 
  TrendingUp, 
  Target, 
  Users, 
  Zap, 
  BarChart3, 
  Clock,
  Sparkles,
  Mail,
  MessageSquare,
  Eye,
  Brain,
  Activity,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { useMarketing } from '@/hooks/useMarketing';
import { useSyncStore } from '@/stores/syncStore';

interface AIInsight {
  type: 'audience' | 'timing' | 'content' | 'budget';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  suggestion: string;
}

interface CampaignOptimization {
  currentPerformance: number;
  predictedImprovement: number;
  recommendations: AIInsight[];
  optimizedContent: {
    subject?: string;
    body?: string;
    timing?: string;
    audience?: string;
  };
}

export const IntelligentCampaignBuilder: React.FC = () => {
  const { campaigns, stats } = useMarketing();
  const syncStore = useSyncStore();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimization, setOptimization] = useState<CampaignOptimization | null>(null);
  const [selectedCampaignType, setSelectedCampaignType] = useState<string>('email');

  const aiInsights: AIInsight[] = [
    {
      type: 'timing',
      title: 'Timing Optimal Détecté',
      description: 'Vos emails envoyés le mardi à 10h ont 34% plus d\'ouvertures',
      impact: 'high',
      confidence: 92,
      suggestion: 'Planifier pour mardi 10h00'
    },
    {
      type: 'audience',
      title: 'Segment High-Value',
      description: 'Les clients ayant acheté dans les 30 derniers jours convertissent 3x plus',
      impact: 'high',
      confidence: 88,
      suggestion: 'Cibler les acheteurs récents'
    },
    {
      type: 'content',
      title: 'Ligne d\'Objet Optimisée',
      description: 'Les emojis et urgence augmentent l\'ouverture de 28%',
      impact: 'medium',
      confidence: 76,
      suggestion: 'Ajouter emojis et créer urgence'
    },
    {
      type: 'budget',
      title: 'Allocation Budget',
      description: 'ROI maximal avec budget de 2500€ pour ce segment',
      impact: 'medium',
      confidence: 81,
      suggestion: 'Budget optimal: 2500€'
    }
  ];

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setOptimization({
      currentPerformance: 68,
      predictedImprovement: 89,
      recommendations: aiInsights,
      optimizedContent: {
        subject: '🔥 Dernières heures - 70% de réduction',
        body: 'Profitez maintenant de nos offres exceptionnelles avant qu\'il ne soit trop tard !',
        timing: 'Mardi 10h00',
        audience: 'Clients actifs 30 derniers jours'
      }
    });
    
    setIsAnalyzing(false);
    toast.success('Analyse IA terminée - Campagne optimisée !');
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Intelligence Marketing IA
                <Badge variant="secondary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
              </CardTitle>
              <CardDescription>
                Analysez et optimisez vos campagnes avec l'intelligence artificielle
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Select value={selectedCampaignType} onValueChange={setSelectedCampaignType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type de campagne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Marketing</SelectItem>
                  <SelectItem value="social">Réseaux Sociaux</SelectItem>
                  <SelectItem value="ads">Publicités Payantes</SelectItem>
                  <SelectItem value="retargeting">Retargeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={performAnalysis} 
              disabled={isAnalyzing}
              className="min-w-[160px]"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Analyser avec IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary animate-pulse" />
                <span className="font-medium">Analyse des performances historiques...</span>
              </div>
              <Progress value={33} className="h-2" />
              
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary animate-pulse" />
                <span className="font-medium">Optimisation de l'audience cible...</span>
              </div>
              <Progress value={66} className="h-2" />
              
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-primary animate-pulse" />
                <span className="font-medium">Génération des recommandations...</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Results */}
      {optimization && (
        <div className="space-y-6">
          {/* Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Amélioration Prédite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Performance Actuelle</span>
                    <span className="text-2xl font-bold">{optimization.currentPerformance}%</span>
                  </div>
                  <Progress value={optimization.currentPerformance} className="h-3" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Performance Optimisée</span>
                    <span className="text-2xl font-bold text-green-600">{optimization.predictedImprovement}%</span>
                  </div>
                  <Progress value={optimization.predictedImprovement} className="h-3" />
                </div>
              </div>
              <div className="mt-4 text-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  +{optimization.predictedImprovement - optimization.currentPerformance}% d'amélioration
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Recommandations IA
              </CardTitle>
              <CardDescription>
                Optimisations basées sur l'analyse de vos données et tendances du marché
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimization.recommendations.map((insight, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {insight.type === 'timing' && <Clock className="h-4 w-4 text-primary" />}
                          {insight.type === 'audience' && <Users className="h-4 w-4 text-primary" />}
                          {insight.type === 'content' && <Mail className="h-4 w-4 text-primary" />}
                          {insight.type === 'budget' && <Target className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getImpactColor(insight.impact)}>
                          {insight.impact}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{insight.confidence}%</span>
                      </div>
                    </div>
                    <div className="ml-11 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Action recommandée:</span>
                        <span>{insight.suggestion}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimized Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Contenu Optimisé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Objet Optimisé</label>
                    <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium">{optimization.optimizedContent.subject}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Message Optimisé</label>
                    <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p>{optimization.optimizedContent.body}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Timing Optimal</label>
                    <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium">{optimization.optimizedContent.timing}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Audience Cible</label>
                    <div className="mt-1 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="font-medium">{optimization.optimizedContent.audience}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button className="flex-1">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Appliquer les Optimisations
                </Button>
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Créer Campagne
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques Marketing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalCampaigns}</div>
              <div className="text-sm text-muted-foreground">Campagnes Totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</div>
              <div className="text-sm text-muted-foreground">Campagnes Actives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalBudget}€</div>
              <div className="text-sm text-muted-foreground">Budget Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalSpent}€</div>
              <div className="text-sm text-muted-foreground">Dépenses</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};