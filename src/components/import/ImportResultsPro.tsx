import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Star, 
  Eye, 
  ShoppingCart,
  Zap,
  Brain,
  Target,
  BarChart3,
  Package,
  Globe,
  Clock,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Search
} from "lucide-react";

interface ImportResult {
  success: boolean;
  products: any[];
  analysis: any;
  source: string;
  count: number;
  timestamp: string;
  processing_time: number;
  ai_confidence: number;
}

interface ImportResultsProProps {
  result: ImportResult;
  onAddToStore: (product: any) => void;
  onOptimizeProduct: (product: any) => void;
  onViewDetails: (product: any) => void;
}

export const ImportResultsPro = ({ 
  result, 
  onAddToStore, 
  onOptimizeProduct, 
  onViewDetails 
}: ImportResultsProProps) => {
  const product = result.products[0]; // Premier produit pour la démo
  const analysis = result.analysis;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "rising": return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "stable": return <BarChart3 className="w-4 h-4 text-blue-600" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPotentialIcon = (potential: string) => {
    switch (potential) {
      case "very_high": case "high": return <Target className="w-4 h-4 text-green-600" />;
      case "medium": return <Target className="w-4 h-4 text-yellow-600" />;
      default: return <Target className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/30 rounded-lg border">
      {/* Header avec statut */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-100">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Import Réussi !</h3>
            <p className="text-sm text-gray-600">
              Analysé en {Math.round(result.processing_time)}ms • Confiance IA: {Math.round(result.ai_confidence)}%
            </p>
          </div>
        </div>
        <Badge variant="outline" className="px-4 py-2 bg-green-50 text-green-700 border-green-200">
          <Zap className="w-4 h-4 mr-2" />
          {analysis.platform}
        </Badge>
      </div>

      {/* Scores d'analyse */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{Math.round(analysis.trustScore)}</div>
            <div className="text-sm text-gray-600">Fiabilité</div>
            <Progress value={analysis.trustScore} className="w-full mt-2" />
          </CardContent>
        </Card>
        
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{Math.round(analysis.seoScore)}</div>
            <div className="text-sm text-gray-600">SEO Score</div>
            <Progress value={analysis.seoScore} className="w-full mt-2" />
          </CardContent>
        </Card>
        
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{Math.round(analysis.competitiveness)}</div>
            <div className="text-sm text-gray-600">Compétitivité</div>
            <Progress value={analysis.competitiveness} className="w-full mt-2" />
          </CardContent>
        </Card>
        
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(analysis.potentialMargin)}%</div>
            <div className="text-sm text-gray-600">Marge Potentielle</div>
            <Progress value={analysis.potentialMargin} className="w-full mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Produit détaillé */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="secondary">{product.category}</Badge>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{product.product_rating}</span>
                  <span className="text-sm text-gray-500">({product.reviews_count} avis)</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{product.price}€</div>
              <div className="text-sm text-gray-500">Coût: {product.cost_price}€</div>
              <div className="text-sm font-medium text-blue-600">
                Marge: {Math.round(product.profit_margin)}%
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="font-medium">Description optimisée par IA</span>
            </div>
            <p className="text-gray-700 line-clamp-3">{product.description}</p>
          </div>

          <Separator />

          {/* Métriques détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Données produit */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Package className="w-4 h-4" />
                Données Produit
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">SKU:</span>
                  <span className="font-mono">{product.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock:</span>
                  <span className="font-medium">{product.stock_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison:</span>
                  <span>{product.shipping_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Poids:</span>
                  <span>{product.weight}</span>
                </div>
              </div>
            </div>

            {/* Scores IA */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Optimisation IA
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Titre SEO</span>
                  <Badge className={getScoreColor(product.ai_optimization.title_score)}>
                    {product.ai_optimization.title_score}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Description</span>
                  <Badge className={getScoreColor(product.ai_optimization.description_score)}>
                    {product.ai_optimization.description_score}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Images</span>
                  <Badge className={getScoreColor(product.ai_optimization.image_score)}>
                    {product.ai_optimization.image_score}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Prix</span>
                  <Badge className={getScoreColor(product.ai_optimization.price_competitiveness)}>
                    {product.ai_optimization.price_competitiveness}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Analyse marché */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analyse Marché
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tendance</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(product.market_analysis.demand_trend)}
                    <span className="text-sm capitalize">{product.market_analysis.demand_trend}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Concurrence</span>
                  <span className="text-sm capitalize">{product.market_analysis.competition_level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Potentiel</span>
                  <div className="flex items-center gap-1">
                    {getPotentialIcon(product.market_analysis.profit_potential)}
                    <span className="text-sm capitalize">{product.market_analysis.profit_potential}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Saisonnalité</span>
                  <span className="text-sm capitalize">{product.market_analysis.seasonality}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Recommandations IA */}
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" />
              Recommandations IA
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analysis.recommendedActions.map((action: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={() => onAddToStore(product)} 
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Ajouter au Catalogue
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOptimizeProduct(product)}
              className="flex-1"
            >
              <Brain className="w-4 h-4 mr-2" />
              Optimiser avec IA
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onViewDetails(product)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Détails
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métadonnées d'import */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(result.timestamp).toLocaleString('fr-FR')}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {analysis.domain}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Search className="w-4 h-4" />
              Source: {result.source}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};