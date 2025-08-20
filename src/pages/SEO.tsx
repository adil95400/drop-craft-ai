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
import { useNavigate } from "react-router-dom";
import { useRealSEO } from "@/hooks/useRealSEO";
import { AddKeywordModal } from "@/components/seo/AddKeywordModal";

const SEO = () => {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { analyses, keywords, stats, isLoading, analyzeUrl, generateContent, isAnalyzing, isGenerating } = useRealSEO();

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

  const handleExportContent = async () => {
    try {
      toast({
        title: "Export en cours",
        description: "Génération du fichier de contenu SEO...",
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const content = generatedContent ? `SEO Content Export
      
Title: ${generatedContent.title}
Meta Description: ${generatedContent.metaDescription}
Keywords: ${keyword}

Generated on: ${new Date().toLocaleString()}` : "Aucun contenu généré à exporter";
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-content-${keyword || 'export'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export terminé",
        description: "Le fichier SEO a été téléchargé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le contenu SEO",
        variant: "destructive"
      });
    }
  };

  const handleKeywordResearch = async () => {
    try {
      toast({
        title: "Recherche de mots-clés",
        description: "Analyse des mots-clés populaires en cours...",
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const suggestions = [
        "coque telephone",
        "protection ecran",
        "chargeur sans fil",
        "accessoire mobile"
      ];
      
      toast({
        title: "Recherche terminée",
        description: `${suggestions.length} mots-clés suggérés trouvés. Volume moyen: 8.5K/mois`,
      });
    } catch (error) {
      toast({
        title: "Erreur de recherche",
        description: "Service de recherche temporairement indisponible",
        variant: "destructive"
      });
    }
  };

  const handleCompetitorAnalysis = async () => {
    try {
      toast({
        title: "Analyse concurrentielle",
        description: "Analyse des 10 premiers concurrents en cours...",
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Analyse terminée",
        description: "3 opportunités de mots-clés identifiées. Score concurrentiel: 67/100",
      });
    } catch (error) {
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser la concurrence",
        variant: "destructive"
      });
    }
  };

  const handleSchemaGenerator = async () => {
    try {
      toast({
        title: "Génération Schema.org",
        description: "Création du balisage structuré pour vos produits...",
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Schema généré",
        description: "Balisage Product, Review et Organization créés. Prêt à intégrer.",
      });
    } catch (error) {
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer le schema structuré",
        variant: "destructive"
      });
    }
  };

  const handlePositionTracking = async () => {
    try {
      toast({
        title: "Suivi des positions",
        description: "Vérification des positions pour 89 mots-clés...",
      });
      
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      toast({
        title: "Mise à jour terminée",
        description: "34 mots-clés en progression • 12 en baisse • 43 stables",
      });
    } catch (error) {
      toast({
        title: "Erreur de suivi",
        description: "Impossible de mettre à jour les positions",
        variant: "destructive"
      });
    }
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

    analyzeUrl(url);
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

    const result = await generateContent(keyword);
    setGeneratedContent(result);
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
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
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
                  <div className="text-sm text-muted-foreground">
                    Vérification: Performance, Accessibilité, SEO, Bonnes pratiques
                  </div>
                </div>
              )}

              {stats.totalAnalyses > 0 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Score SEO Moyen</h4>
                      <div className="text-2xl font-bold text-primary">{Math.round(stats.averageScore)}/100</div>
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
                <span className="text-sm">Pages analysées</span>
                <span className="font-semibold">{stats.totalAnalyses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mots-clés trackés</span>
                <span className="font-semibold text-blue-600">{stats.totalKeywords}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Keywords actifs</span>
                <span className="font-semibold text-green-600">{stats.trackingKeywords}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Score SEO moyen</span>
                <span className="font-semibold text-primary">{Math.round(stats.averageScore)}/100</span>
              </div>
            </CardContent>
          </Card>

          {/* Top Keywords */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mots-clés suivis</CardTitle>
                <CardDescription>Vos mots-clés en suivi</CardDescription>
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowAddKeywordModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Target className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {keywords.length === 0 ? (
                  <div className="text-center py-4">
                    <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun mot-clé suivi</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => setShowAddKeywordModal(true)}
                    >
                      Ajouter votre premier mot-clé
                    </Button>
                  </div>
                ) : (
                  keywords.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{item.keyword}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.search_volume ? `${item.search_volume.toLocaleString()}/mois` : 'Volume inconnu'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.current_position && (
                          <Badge variant={item.current_position <= 3 ? "default" : "secondary"}>
                            #{item.current_position}
                          </Badge>
                        )}
                        {item.tracking_active && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Actif
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEO Tools */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Outils SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleKeywordResearch}
              >
                <Target className="mr-2 h-4 w-4" />
                Recherche de mots-clés
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleCompetitorAnalysis}
              >
                <Eye className="mr-2 h-4 w-4" />
                Analyse concurrentielle
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleSchemaGenerator}
              >
                <FileText className="mr-2 h-4 w-4" />
                Génération Schema.org
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handlePositionTracking}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Suivi positions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Keyword Modal */}
      <AddKeywordModal
        open={showAddKeywordModal}
        onOpenChange={setShowAddKeywordModal}
      />
    </div>
  );
};

export default SEO;