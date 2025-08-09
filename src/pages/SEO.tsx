import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Zap, 
  Target, 
  TrendingUp, 
  Eye, 
  Globe,
  FileText,
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  Download
} from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";
import { useNavigate } from "react-router-dom";

const SEO = () => {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAnalyticsRedirect = () => {
    navigate("/analytics");
    toast({
      title: "Redirection",
      description: "Ouverture de Google Analytics",
    });
  };

  const handleSearchConsole = () => {
    window.open("https://search.google.com/search-console", "_blank");
    toast({
      title: "Search Console",
      description: "Ouverture de Google Search Console",
    });
  };

  const handleCopyContent = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copié !",
      description: `${type} copié dans le presse-papiers`,
    });
  };

  const handleExportContent = () => {
    toast({
      title: "Export en cours",
      description: "Génération du fichier de contenu SEO...",
    });
    
    setTimeout(() => {
      toast({
        title: "Export terminé",
        description: "Le fichier SEO a été téléchargé",
      });
    }, 1500);
  };

  const handleSEOAnalysis = async () => {
    if (!url.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une URL valide",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setSeoScore(0);

    // Simulate SEO analysis
    const interval = setInterval(() => {
      setSeoScore(prev => {
        if (prev >= 85) {
          clearInterval(interval);
          setIsAnalyzing(false);
          
          // Generate mock SEO content
          setGeneratedContent({
            title: "iPhone 15 Pro Max Case - Protection Premium | Livraison Rapide",
            metaDescription: "Découvrez notre collection de coques iPhone 15 Pro Max. Protection maximale, design élégant, livraison gratuite. ⭐ 4.8/5 - Plus de 1000 avis clients.",
            h1: "Coque iPhone 15 Pro Max - Protection Premium",
            keywords: ["coque iphone 15 pro max", "protection iphone", "accessoire iphone", "étui téléphone"],
            schema: {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": "Coque iPhone 15 Pro Max Premium",
              "brand": "ShopName",
              "offers": {
                "@type": "Offer",
                "price": "24.99",
                "priceCurrency": "EUR"
              }
            },
            suggestions: [
              "Ajouter des images alt descriptives",
              "Optimiser la vitesse de chargement",
              "Améliorer le maillage interne",
              "Ajouter des avis clients structurés"
            ]
          });

          toast({
            title: "Analyse terminée !",
            description: "Score SEO: 85/100 - Bon niveau",
          });
          
          return 85;
        }
        return prev + 5;
      });
    }, 200);
  };

  const handleGenerateContent = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un mot-clé",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Génération en cours",
      description: "L'IA travaille sur votre contenu...",
    });

    // Simulate AI content generation
    setTimeout(() => {
      const mockContent = {
        title: `${keyword} - Guide Complet 2024 | Meilleurs Prix`,
        metaDescription: `Tout savoir sur ${keyword}. Comparatif, prix, avis clients. Guide d'achat complet avec livraison gratuite. ⭐ Note 4.8/5`,
        content: `
# ${keyword} - Guide Complet 2024

## Qu'est-ce qu'un ${keyword} ?

Le ${keyword} est un produit essentiel qui répond à de nombreux besoins. Dans ce guide complet, nous vous expliquons tout ce que vous devez savoir.

## Pourquoi choisir un ${keyword} ?

### Avantages principaux :
- **Qualité premium** : Matériaux de haute qualité
- **Prix compétitif** : Meilleur rapport qualité-prix
- **Livraison rapide** : Expédition sous 24h
- **Garantie** : 2 ans de garantie constructeur

## Comment choisir le bon ${keyword} ?

### Critères importants :
1. **Budget** : Définissez votre fourchette de prix
2. **Utilisation** : Identifiez vos besoins spécifiques  
3. **Marque** : Optez pour des marques reconnues
4. **Avis clients** : Consultez les retours d'expérience

## FAQ ${keyword}

**Q: Quelle est la garantie ?**
R: Tous nos ${keyword} sont garantis 2 ans.

**Q: Livraison gratuite ?**
R: Oui, livraison gratuite dès 49€ d'achat.
        `,
        keywords: [`${keyword}`, `acheter ${keyword}`, `${keyword} pas cher`, `meilleur ${keyword}`]
      };

      setGeneratedContent(mockContent);
      
      toast({
        title: "Contenu généré !",
        description: "Votre contenu SEO est prêt",
      });
    }, 3000);
  };

  const seoMetrics = [
    { name: "Performance", score: 92, color: "text-green-600" },
    { name: "Accessibilité", score: 88, color: "text-green-600" },
    { name: "Bonnes pratiques", score: 85, color: "text-green-600" },
    { name: "SEO", score: 78, color: "text-yellow-600" }
  ];

  const seoTasks = [
    {
      task: "Optimiser les titres H1-H6",
      status: "completed",
      impact: "High"
    },
    {
      task: "Ajouter des balises meta description",
      status: "completed", 
      impact: "High"
    },
    {
      task: "Optimiser les images (alt, compression)",
      status: "in_progress",
      impact: "Medium"
    },
    {
      task: "Améliorer le maillage interne",
      status: "pending",
      impact: "Medium"
    },
    {
      task: "Ajouter Schema.org markup",
      status: "pending",
      impact: "High"
    }
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SEO IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Optimisez vos pages produits avec l'intelligence artificielle
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleAnalyticsRedirect}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button variant="outline" onClick={handleSearchConsole}>
            <Globe className="mr-2 h-4 w-4" />
            Search Console
          </Button>
          <Button 
            variant="premium" 
            onClick={() => navigate("/seo/ultra-pro")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
          >
            <Zap className="mr-2 h-4 w-4" />
            Ultra Pro
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Side - SEO Tools */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SEO Analyzer */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Audit SEO Automatique
              </CardTitle>
              <CardDescription>
                Analysez n'importe quelle page avec notre IA SEO avancée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="seo-url">URL à analyser</Label>
                <div className="flex space-x-3">
                  <Input
                    id="seo-url"
                    placeholder="https://votre-site.com/produit"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSEOAnalysis}
                    disabled={isAnalyzing}
                    variant="hero"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    Analyser
                  </Button>
                </div>
              </div>

              {isAnalyzing && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm">Analyse SEO en cours...</span>
                  </div>
                  <Progress value={seoScore} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    Vérification: Performance, Accessibilité, SEO, Bonnes pratiques
                  </div>
                </div>
              )}

              {seoScore > 0 && !isAnalyzing && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Score SEO Global</h4>
                      <div className="text-2xl font-bold text-primary">{seoScore}/100</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {seoMetrics.map((metric, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{metric.name}</span>
                            <span className={`font-medium ${metric.color}`}>{metric.score}</span>
                          </div>
                          <Progress value={metric.score} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Generator */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Générateur de Contenu IA
              </CardTitle>
              <CardDescription>
                Créez du contenu SEO optimisé automatiquement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target-keyword">Mot-clé principal</Label>
                  <Input
                    id="target-keyword"
                    placeholder="ex: coque iphone 15"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleGenerateContent}
                    variant="gradient"
                    className="w-full"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Générer le Contenu
                  </Button>
                </div>
              </div>

              {generatedContent && (
                <div className="space-y-4 mt-6">
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Titre SEO</Label>
                        <div className="mt-1 p-2 bg-muted rounded text-sm font-mono flex items-center justify-between">
                          <span className="truncate">{generatedContent.title}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleCopyContent(generatedContent.title, "Titre SEO")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Meta Description</Label>
                        <div className="mt-1 p-2 bg-muted rounded text-sm font-mono flex items-center justify-between">
                          <span className="truncate">{generatedContent.metaDescription}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleCopyContent(generatedContent.metaDescription, "Meta Description")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                    </div>

                    {generatedContent.content && (
                      <div>
                        <Label className="text-sm font-medium">Contenu Article</Label>
                        <Textarea 
                          value={generatedContent.content}
                          className="mt-1 h-40 font-mono text-xs"
                          readOnly
                        />
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyContent(JSON.stringify(generatedContent), "Contenu complet")}
                      >
                        <Copy className="mr-2 h-3 w-3" />
                        Copier Tout
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportContent}>
                        <Download className="mr-2 h-3 w-3" />
                        Exporter
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Tasks */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Tâches SEO Recommandées</CardTitle>
              <CardDescription>Optimisations prioritaires pour améliorer votre ranking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seoTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center">
                        {task.status === "completed" ? (
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        ) : task.status === "in_progress" ? (
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{task.task}</div>
                        <div className="text-sm text-muted-foreground">
                          Impact: {task.impact}
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      task.status === "completed" ? "default" : 
                      task.status === "in_progress" ? "secondary" : "outline"
                    }>
                      {task.status === "completed" ? "Terminé" :
                       task.status === "in_progress" ? "En cours" : "À faire"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - SEO Insights */}
        <div className="space-y-6">
          
          {/* Quick Stats */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Performance SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pages indexées</span>
                <span className="font-semibold">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mots-clés trackés</span>
                <span className="font-semibold text-blue-600">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Top 3 positions</span>
                <span className="font-semibold text-green-600">34</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Trafic organique</span>
                <span className="font-semibold text-primary">+23%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Score moyen</span>
                <span className="font-semibold">87/100</span>
              </div>
            </CardContent>
          </Card>

          {/* Top Keywords */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Top Mots-clés</CardTitle>
              <CardDescription>Vos meilleurs positionnements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { keyword: "coque iphone 15", position: 2, searches: "12K/mois" },
                  { keyword: "accessoire telephone", position: 5, searches: "8.1K/mois" },
                  { keyword: "protection ecran", position: 8, searches: "6.5K/mois" },
                  { keyword: "chargeur sans fil", position: 12, searches: "4.2K/mois" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{item.keyword}</div>
                      <div className="text-xs text-muted-foreground">{item.searches}</div>
                    </div>
                    <Badge variant={item.position <= 3 ? "default" : "secondary"}>
                      #{item.position}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SEO Tools */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Outils SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Target className="mr-2 h-4 w-4" />
                Recherche de mots-clés
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Eye className="mr-2 h-4 w-4" />
                Analyse concurrentielle
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Génération Schema.org
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Suivi positions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AppLayout>
  );
};

export default SEO;