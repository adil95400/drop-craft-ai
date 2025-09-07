import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Star,
  Eye,
  Package,
  Users,
  Calendar,
  Settings
} from 'lucide-react';

interface ProductAnalytics {
  id: string;
  name: string;
  category: string;
  current_price: number;
  suggested_price: number;
  demand_score: number;
  competition_score: number;
  profit_margin: number;
  sales_velocity: number;
  stock_level: number;
  optimization_potential: number;
  ai_recommendations: string[];
  risk_factors: string[];
  performance_trend: 'improving' | 'stable' | 'declining';
}

export function ProductOptimizationPanel() {
  const [products, setProducts] = useState<ProductAnalytics[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductAnalytics | null>(null);
  const [optimizationSettings, setOptimizationSettings] = useState({
    profit_target: [25],
    market_position: 'competitive',
    price_sensitivity: [50],
    inventory_priority: 'balanced'
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateProductAnalytics();
  }, []);

  const generateProductAnalytics = async () => {
    setIsAnalyzing(true);
    
    // Simulation de données d'analyse produit
    const mockAnalytics: ProductAnalytics[] = [
      {
        id: '1',
        name: 'Chaise de Bureau Ergonomique',
        category: 'Mobilier',
        current_price: 299,
        suggested_price: 349,
        demand_score: 85,
        competition_score: 72,
        profit_margin: 35,
        sales_velocity: 4.2,
        stock_level: 45,
        optimization_potential: 78,
        ai_recommendations: [
          'Augmenter le prix de 16.7% pour optimiser la marge',
          'Mettre en avant les caractéristiques ergonomiques',
          'Créer un bundle avec accessoires de bureau'
        ],
        risk_factors: [
          'Concurrence forte sur ce segment',
          'Saisonnalité des ventes bureau'
        ],
        performance_trend: 'improving'
      },
      {
        id: '2',
        name: 'Table Basse Design',
        category: 'Mobilier',
        current_price: 450,
        suggested_price: 399,
        demand_score: 62,
        competition_score: 88,
        profit_margin: 28,
        sales_velocity: 2.1,
        stock_level: 23,
        optimization_potential: 65,
        ai_recommendations: [
          'Réduire le prix de 11.3% pour améliorer la compétitivité',
          'Optimiser les photos produit',
          'Proposer des options de personnalisation'
        ],
        risk_factors: [
          'Stock faible, risque de rupture',
          'Marge déjà serrée'
        ],
        performance_trend: 'declining'
      },
      {
        id: '3',
        name: 'Lampe LED Intelligente',
        category: 'Éclairage',
        current_price: 89,
        suggested_price: 95,
        demand_score: 91,
        competition_score: 65,
        profit_margin: 42,
        sales_velocity: 8.7,
        stock_level: 156,
        optimization_potential: 92,
        ai_recommendations: [
          'Augmenter légèrement le prix (+6.7%)',
          'Développer les fonctionnalités connectées',
          'Cibler le marché de la domotique'
        ],
        risk_factors: [
          'Évolution technologique rapide'
        ],
        performance_trend: 'improving'
      }
    ];

    setTimeout(() => {
      setProducts(mockAnalytics);
      setIsAnalyzing(false);
      toast({
        title: "Analyse terminée",
        description: `${mockAnalytics.length} produits analysés avec succès`,
      });
    }, 2000);
  };

  const applyOptimization = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      // Simulation de l'application des optimisations
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, current_price: p.suggested_price, optimization_potential: 95 }
          : p
      ));

      toast({
        title: "Optimisation appliquée",
        description: `Prix de "${product.name}" mis à jour avec succès`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer l'optimisation",
        variant: "destructive",
      });
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <BarChart3 className="w-4 h-4 text-blue-500" />;
    }
  };

  const getOptimizationColor = (potential: number) => {
    if (potential >= 80) return 'text-green-600';
    if (potential >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalOptimizationPotential = products.length > 0 ? 
    Math.round(products.reduce((sum, p) => sum + p.optimization_potential, 0) / products.length) : 0;
  
  const highPotentialProducts = products.filter(p => p.optimization_potential >= 80).length;
  const avgProfitMargin = products.length > 0 ? 
    Math.round(products.reduce((sum, p) => sum + p.profit_margin, 0) / products.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header avec métriques */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Optimisation Produits IA
          </CardTitle>
          <CardDescription>
            Analyse intelligente et recommandations d'optimisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{products.length}</div>
              <p className="text-sm text-muted-foreground">Produits Analysés</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalOptimizationPotential}%</div>
              <p className="text-sm text-muted-foreground">Potentiel Moyen</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{highPotentialProducts}</div>
              <p className="text-sm text-muted-foreground">Priorité Haute</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{avgProfitMargin}%</div>
              <p className="text-sm text-muted-foreground">Marge Moyenne</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Paramètres d'Optimisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Objectif de Marge (%)</Label>
              <div className="mt-2">
                <Slider
                  value={optimizationSettings.profit_target}
                  onValueChange={(value) => setOptimizationSettings(prev => ({ ...prev, profit_target: value }))}
                  max={50}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10%</span>
                  <span className="font-medium">{optimizationSettings.profit_target[0]}%</span>
                  <span>50%</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Position Marché</Label>
              <Select 
                value={optimizationSettings.market_position} 
                onValueChange={(value) => setOptimizationSettings(prev => ({ ...prev, market_position: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="competitive">Compétitif</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Sensibilité Prix</Label>
              <div className="mt-2">
                <Slider
                  value={optimizationSettings.price_sensitivity}
                  onValueChange={(value) => setOptimizationSettings(prev => ({ ...prev, price_sensitivity: value }))}
                  max={100}
                  min={0}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Faible</span>
                  <span className="font-medium">{optimizationSettings.price_sensitivity[0]}%</span>
                  <span>Élevée</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Priorité Inventaire</Label>
              <Select 
                value={optimizationSettings.inventory_priority} 
                onValueChange={(value) => setOptimizationSettings(prev => ({ ...prev, inventory_priority: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clearance">Déstockage</SelectItem>
                  <SelectItem value="balanced">Équilibré</SelectItem>
                  <SelectItem value="growth">Croissance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={generateProductAnalytics} 
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Relancer l'analyse
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Products List */}
        <div className="lg:col-span-2 space-y-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Package className="w-4 h-4" />
                      {product.category}
                      {getTrendIcon(product.performance_trend)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getOptimizationColor(product.optimization_potential)}`}>
                      {product.optimization_potential}%
                    </div>
                    <div className="text-xs text-muted-foreground">Potentiel</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Prix actuel vs suggéré */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold">{product.current_price}€</div>
                    <div className="text-xs text-muted-foreground">Prix Actuel</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      product.suggested_price > product.current_price ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.suggested_price}€
                    </div>
                    <div className="text-xs text-muted-foreground">Prix Suggéré</div>
                  </div>
                </div>

                {/* Métriques clés */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-sm font-medium">{product.demand_score}%</div>
                    <div className="text-xs text-muted-foreground">Demande</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{product.competition_score}%</div>
                    <div className="text-xs text-muted-foreground">Concurrence</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{product.profit_margin}%</div>
                    <div className="text-xs text-muted-foreground">Marge</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{product.stock_level}</div>
                    <div className="text-xs text-muted-foreground">Stock</div>
                  </div>
                </div>

                {/* Recommandations IA */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Recommandations IA
                  </h4>
                  <ul className="space-y-1">
                    {product.ai_recommendations.slice(0, 2).map((rec, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Facteurs de risque */}
                {product.risk_factors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      Facteurs de Risque
                    </h4>
                    <ul className="space-y-1">
                      {product.risk_factors.map((risk, index) => (
                        <li key={index} className="text-xs text-red-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => applyOptimization(product.id)}
                    disabled={Math.abs(product.suggested_price - product.current_price) < 1}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Appliquer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedProduct(product)}>
                    <Eye className="w-3 h-3 mr-1" />
                    Détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {products.length === 0 && !isAnalyzing && (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune analyse disponible</h3>
                  <p className="text-muted-foreground">
                    Lancez une analyse pour obtenir des recommandations d'optimisation
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}