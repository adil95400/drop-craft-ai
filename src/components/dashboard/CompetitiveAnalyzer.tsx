import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  DollarSign,
  BarChart3,
  Zap,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { productionLogger } from '@/utils/productionLogger';

interface Competitor {
  id: string;
  name: string;
  domain: string;
  marketShare: number;
  averagePrice: number;
  priceChange: number;
  threat: 'low' | 'medium' | 'high';
  strengths: string[];
  weaknesses: string[];
  products: number;
  lastUpdated: string;
}

interface CompetitiveInsight {
  type: 'price_gap' | 'product_gap' | 'market_opportunity' | 'threat_alert';
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export function CompetitiveAnalyzer() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [insights, setInsights] = useState<CompetitiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompetitiveData();
  }, [user]);

  const fetchCompetitiveData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Simuler les données concurrentielles (en production, cela viendrait d'une vraie API)
      const mockCompetitors: Competitor[] = [
        {
          id: '1',
          name: 'DropShip Pro',
          domain: 'dropshippro.com',
          marketShare: 23.5,
          averagePrice: 45.90,
          priceChange: -8.2,
          threat: 'high',
          strengths: ['Prix compétitifs', 'Large catalogue', 'SEO fort'],
          weaknesses: ['Support client', 'Temps de livraison'],
          products: 12450,
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          name: 'EconoMart',
          domain: 'economart.fr',
          marketShare: 18.7,
          averagePrice: 52.30,
          priceChange: 3.5,
          threat: 'medium',
          strengths: ['Qualité produits', 'Service client'],
          weaknesses: ['Prix élevés', 'Catalogue limité'],
          products: 8920,
          lastUpdated: new Date().toISOString()
        },
        {
          id: '3',
          name: 'FastDeal Store',
          domain: 'fastdeal.com',
          marketShare: 15.2,
          averagePrice: 38.75,
          priceChange: -12.1,
          threat: 'high',
          strengths: ['Prix très bas', 'Livraison rapide'],
          weaknesses: ['Qualité variable', 'Retours difficiles'],
          products: 15200,
          lastUpdated: new Date().toISOString()
        },
        {
          id: '4',
          name: 'PremiumShop',
          domain: 'premiumshop.fr',
          marketShare: 12.1,
          averagePrice: 78.90,
          priceChange: 5.8,
          threat: 'low',
          strengths: ['Produits premium', 'Marque forte'],
          weaknesses: ['Prix élevés', 'Niche limitée'],
          products: 3450,
          lastUpdated: new Date().toISOString()
        }
      ];

      const mockInsights: CompetitiveInsight[] = [
        {
          type: 'price_gap',
          title: 'Opportunité de Prix Identifiée',
          description: 'Vos prix sont 15% supérieurs à FastDeal Store sur 23 produits similaires',
          impact: 'Potentiel d\'augmentation des ventes : +35%',
          priority: 'high',
          actionable: true
        },
        {
          type: 'product_gap',
          title: 'Produits Manquants Détectés',
          description: 'DropShip Pro propose 8 catégories que vous n\'avez pas encore',
          impact: 'Expansion possible du catalogue',
          priority: 'medium',
          actionable: true
        },
        {
          type: 'market_opportunity',
          title: 'Niche Sous-Exploitée',
          description: 'Faible concurrence sur les accessoires gaming (seulement 2 concurrents)',
          impact: 'Opportunité de dominer ce segment',
          priority: 'high',
          actionable: true
        },
        {
          type: 'threat_alert',
          title: 'Concurrence Agressive',
          description: 'FastDeal Store a réduit ses prix de 12% en moyenne ce mois',
          impact: 'Risque de perte de parts de marché',
          priority: 'high',
          actionable: true
        }
      ];

      setCompetitors(mockCompetitors);
      setInsights(mockInsights);
      
    } catch (error) {
      productionLogger.error('Failed to fetch competitive data', error as Error, 'CompetitiveAnalyzer');
      toast({
        title: "Erreur",
        description: "Impossible de charger les données concurrentielles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runCompetitiveAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Appeler l'edge function d'analyse concurrentielle
      const { data, error } = await supabase.functions.invoke('competitive-analysis', {
        body: { 
          userId: user?.id,
          refreshData: true,
          analysisDepth: 'full'
        }
      });

      if (error) throw error;

      toast({
        title: "Analyse terminée",
        description: "Nouvelles données concurrentielles disponibles",
      });

      await fetchCompetitiveData();
    } catch (error) {
      productionLogger.error('Competitive analysis failed', error as Error, 'CompetitiveAnalyzer');
      toast({
        title: "Erreur",
        description: "Impossible de lancer l'analyse concurrentielle",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'price_gap': return DollarSign;
      case 'product_gap': return Target;
      case 'market_opportunity': return TrendingUp;
      case 'threat_alert': return AlertTriangle;
      default: return BarChart3;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'price_gap': return 'border-green-200 bg-green-50';
      case 'product_gap': return 'border-blue-200 bg-blue-50';
      case 'market_opportunity': return 'border-purple-200 bg-purple-50';
      case 'threat_alert': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Analyse Concurrentielle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Target className="h-5 w-5 mr-2 text-primary" />
          <h3 className="text-lg font-semibold">Analyse Concurrentielle</h3>
          <Badge variant="outline" className="ml-2">
            {competitors.length} concurrents
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runCompetitiveAnalysis}
          disabled={analyzing}
          className="flex items-center"
        >
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              Analyse...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Actualiser
            </>
          )}
        </Button>
      </div>

      {/* Insights stratégiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const Icon = getInsightIcon(insight.type);
          return (
            <Card
              key={index}
              className={`${getInsightColor(insight.type)} border`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={insight.priority === 'high' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {insight.priority === 'high' ? 'CRITIQUE' : 
                     insight.priority === 'medium' ? 'IMPORTANT' : 'INFO'}
                  </Badge>
                  <Icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-base">{insight.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>
                <div className="flex items-center text-xs font-medium text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {insight.impact}
                </div>
                {insight.actionable && (
                  <Button size="sm" className="w-full mt-2" variant="outline">
                    Agir maintenant
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tableau des concurrents */}
      <Card>
        <CardHeader>
          <CardTitle>Concurrents Principaux</CardTitle>
          <CardDescription>
            Analyse comparative de vos principaux concurrents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {competitors.map((competitor) => (
              <div
                key={competitor.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <h4 className="font-semibold">{competitor.name}</h4>
                      <Badge
                        className={`ml-2 text-xs ${getThreatColor(competitor.threat)}`}
                      >
                        {competitor.threat === 'high' ? 'MENACE' : 
                         competitor.threat === 'medium' ? 'SURVEILLER' : 'FAIBLE'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {competitor.products.toLocaleString()} produits
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Part de marché</div>
                      <div className="font-medium flex items-center">
                        {competitor.marketShare}%
                        <Progress 
                          value={competitor.marketShare} 
                          className="w-12 h-1 ml-2" 
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Prix moyen</div>
                      <div className="font-medium flex items-center">
                        €{competitor.averagePrice}
                        {competitor.priceChange !== 0 && (
                          <span className={`ml-1 text-xs ${
                            competitor.priceChange > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {competitor.priceChange > 0 ? '↗' : '↘'}
                            {Math.abs(competitor.priceChange)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Forces</div>
                      <div className="text-xs">
                        {competitor.strengths.slice(0, 2).join(', ')}
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Faiblesses</div>
                      <div className="text-xs">
                        {competitor.weaknesses.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations automatiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Stratégie Recommandée
          </CardTitle>
          <CardDescription>
            Actions basées sur l'analyse concurrentielle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h5 className="font-medium">Optimiser 23 produits à prix élevés</h5>
                <p className="text-sm text-muted-foreground">
                  Réduire les prix de 10-15% pour rester compétitif face à FastDeal Store
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h5 className="font-medium">Explorer les accessoires gaming</h5>
                <p className="text-sm text-muted-foreground">
                  Niche sous-exploitée avec fort potentiel de croissance
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h5 className="font-medium">Renforcer la qualité produit</h5>
                <p className="text-sm text-muted-foreground">
                  Se différencier de FastDeal Store par la qualité et le service
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}