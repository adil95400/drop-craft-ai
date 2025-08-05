import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, 
  TrendingUp, 
  Target, 
  Zap, 
  Star,
  Package,
  Eye,
  Brain
} from "lucide-react";

interface WinnerProduct {
  id: string;
  name: string;
  supplier: string;
  price: number;
  margin: number;
  potential: number;
  trend: string;
  niche: string;
  reason: string;
  confidence: number;
}

interface WinnerSuggestionsProps {
  onViewProduct: (productId: string) => void;
  onAnalyzeNiche: (niche: string) => void;
}

export const WinnerSuggestions = ({ onViewProduct, onAnalyzeNiche }: WinnerSuggestionsProps) => {
  const winnerProducts: WinnerProduct[] = [
    {
      id: "w1",
      name: "Casque Gaming RGB Pro",
      supplier: "TechDirect",
      price: 89.99,
      margin: 55,
      potential: 92,
      trend: "+45%",
      niche: "Gaming",
      reason: "Forte demande, faible concurrence, marge excellente",
      confidence: 94
    },
    {
      id: "w2", 
      name: "Montre Connectée Fitness",
      supplier: "FitTech",
      price: 149.99,
      margin: 48,
      potential: 88,
      trend: "+38%",
      niche: "Fitness",
      reason: "Marché en croissance, excellent rating client",
      confidence: 89
    },
    {
      id: "w3",
      name: "Projecteur LED Portable",
      supplier: "VisionMax",
      price: 199.99,
      margin: 52,
      potential: 85,
      trend: "+42%",
      niche: "Tech Maison",
      reason: "Innovation récente, peu de concurrents",
      confidence: 87
    }
  ];

  const niches = [
    { name: "Gaming", growth: "+45%", products: 89, competition: "Faible" },
    { name: "Fitness", growth: "+38%", products: 156, competition: "Moyenne" },
    { name: "Smart Home", growth: "+52%", products: 67, competition: "Faible" },
    { name: "Eco-friendly", growth: "+65%", products: 34, competition: "Très faible" }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 80) return "text-blue-600";
    if (confidence >= 70) return "text-orange-600";
    return "text-red-600";
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case "Très faible": return "text-green-600";
      case "Faible": return "text-blue-600";
      case "Moyenne": return "text-orange-600";
      default: return "text-red-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Winners Détectés par IA
          </h2>
          <p className="text-muted-foreground">
            Produits à fort potentiel identifiés par notre algorithme
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
          <Brain className="w-4 h-4 mr-2" />
          Nouvelle Analyse
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Winner Products */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold">Produits Winners</h3>
          {winnerProducts.map((product) => (
            <Card key={product.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">Par {product.supplier}</p>
                    </div>
                    <Badge className="bg-yellow-500 text-black">
                      <Crown className="w-3 h-3 mr-1" />
                      Winner
                    </Badge>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Prix</p>
                      <p className="font-bold text-primary">{product.price}€</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Marge</p>
                      <p className="font-bold text-green-600">{product.margin}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tendance</p>
                      <p className="font-bold text-blue-600">{product.trend}</p>
                    </div>
                  </div>

                  {/* Potential */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Potentiel Winner</span>
                      <span className={`text-sm font-medium ${getConfidenceColor(product.confidence)}`}>
                        {product.confidence}% confiance
                      </span>
                    </div>
                    <Progress value={product.potential} className="h-2" />
                  </div>

                  {/* Reason */}
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Pourquoi Winner:</strong> {product.reason}
                    </p>
                  </div>

                  {/* Niche Badge */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-purple-600">
                      <Target className="w-3 h-3 mr-1" />
                      Niche: {product.niche}
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewProduct(product.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-gradient-primary hover:opacity-90 transition-opacity"
                      >
                        <Package className="w-3 h-3 mr-1" />
                        Importer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Niches Rentables */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Niches Rentables</h3>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Top Niches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {niches.map((niche, index) => (
                <div 
                  key={niche.name}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onAnalyzeNiche(niche.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{niche.name}</h4>
                    <Badge variant="outline" className="text-green-600">
                      {niche.growth}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Produits</span>
                      <span>{niche.products}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Concurrence</span>
                      <span className={getCompetitionColor(niche.competition)}>
                        {niche.competition}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Insights IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span>Le gaming représente 34% des winners ce mois</span>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Les produits éco-friendly croissent de +65%</span>
              </div>
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-500 mt-0.5" />
                <span>Meilleur moment pour lancer en fitness: maintenant</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};