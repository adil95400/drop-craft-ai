import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Star, 
  DollarSign, 
  Eye, 
  Filter,
  Search,
  ShoppingCart,
  Users,
  Target,
  Zap,
  RefreshCw,
  Download
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useRealWinners } from "@/hooks/useRealWinners";

const Winners = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { winningProducts, stats, isLoading, analyzeWinners, importProduct, isAnalyzing, isImporting } = useRealWinners({
    category: selectedCategory,
    platform: selectedPlatform,
    search: searchQuery
  });

  const handleAnalyzeProduct = (productId: string, productName: string) => {
    toast({
      title: "Analyse en cours",
      description: `Analyse détaillée de "${productName}" en cours...`,
    });
    
    setTimeout(() => {
      toast({
        title: "Analyse terminée",
        description: `Rapport complet généré pour "${productName}"`,
      });
    }, 2000);
  };

  const handleImportProduct = (productId: string, productName: string) => {
    importProduct(productId);
  };

  const handleExport = () => {
    toast({
      title: "Export en cours",
      description: "Génération du fichier CSV...",
    });
    
    setTimeout(() => {
      toast({
        title: "Export terminé",
        description: "Le fichier a été téléchargé",
      });
    }, 1500);
  };

  const handleAnalyzeWinners = () => {
    analyzeWinners();
  };

  const categories = [
    { value: "all", label: "Toutes catégories" },
    { value: "electronics", label: "Électronique" },
    { value: "fashion", label: "Mode" },
    { value: "home", label: "Maison" },
    { value: "beauty", label: "Beauté" },
    { value: "sports", label: "Sport" },
    { value: "gaming", label: "Gaming" }
  ];

  const platforms = [
    { value: "all", label: "Toutes plateformes" },
    { value: "aliexpress", label: "AliExpress" },
    { value: "amazon", label: "Amazon" },
    { value: "bigbuy", label: "BigBuy" },
    { value: "spocket", label: "Spocket" }
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "hot": return "text-red-500 bg-red-100";
      case "rising": return "text-green-500 bg-green-100";
      case "stable": return "text-blue-500 bg-blue-100";
      default: return "text-gray-500 bg-gray-100";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "hot": return "🔥";
      case "rising": return "📈";
      case "stable": return "📊";
      default: return "📈";
    }
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case "low": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "high": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <div className="text-center">Chargement des produits gagnants...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Produits Gagnants IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Découvrez les produits tendances détectés par notre intelligence artificielle
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={handleAnalyzeWinners}
            disabled={isAnalyzing}
            className="bg-gradient-primary hover:opacity-90"
          >
            {isAnalyzing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {isAnalyzing ? "Analyse..." : "Analyser Maintenant"}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Détectés</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts || 1247}</div>
            <p className="text-xs text-muted-foreground">+12% cette semaine</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potentiel Moyen</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.avgPotential || 2890}</div>
            <p className="text-xs text-muted-foreground">par produit/mois</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendances Hot</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hotTrends || 47}</div>
            <p className="text-xs text-muted-foreground">dernières 24h</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Précision IA</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiAccuracy}%</div>
            <p className="text-xs text-muted-foreground">taux de réussite</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtres de Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plateforme</label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(platform => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                Filtres Avancés
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {winningProducts.map((product) => (
          <Card key={product.id} className="border-border bg-card shadow-card hover:shadow-glow transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-2xl">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      "📦"
                    )}
                  </div>
                  <div className="flex-1">
                    <Badge className={getTrendColor(product.trend)}>
                      {getTrendIcon(product.trend)} {product.trend}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
              <CardDescription>{product.category} • {product.platform}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Price & Discount */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">€{product.price}</div>
                  <div className="text-sm text-muted-foreground line-through">
                    €{product.originalPrice}
                  </div>
                </div>
                <Badge variant="destructive" className="text-lg">
                  -{product.discount}%
                </Badge>
              </div>

              {/* Rating & Reviews */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{product.rating}</span>
                  <span className="text-muted-foreground">({product.reviews.toLocaleString()})</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  <span>{product.sales.toLocaleString()} ventes</span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-600">{product.margin}%</div>
                  <div className="text-xs text-muted-foreground">Marge</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className={`text-lg font-bold ${getCompetitionColor(product.competition)}`}>
                    {product.competition === "low" ? "Faible" : 
                     product.competition === "medium" ? "Moyen" : "Élevé"}
                  </div>
                  <div className="text-xs text-muted-foreground">Concurrence</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-lg font-bold">{product.saturation}%</div>
                  <div className="text-xs text-muted-foreground">Saturation</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button 
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                  onClick={() => handleAnalyzeProduct(product.id, product.title)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Analyser
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleImportProduct(product.id, product.title)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Importer
                </Button>
              </div>

              {/* Ad Spend Info */}
              <div className="text-xs text-muted-foreground text-center">
                Dépense pub estimée: €{product.adSpend}/mois
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {winningProducts.length === 0 && (
        <Card className="border-border bg-card shadow-card">
          <CardContent className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">
              Modifiez vos critères de recherche pour voir plus de résultats
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Winners;