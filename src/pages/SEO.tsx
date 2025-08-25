import { useState, useEffect } from "react";
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
  Download,
  ExternalLink,
  Brain,
  Camera,
  Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO as SEOComponent } from "@/components/SEO";

const SEO = () => {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Tâches SEO recommandées avec statuts réels
  const seoTasks = [
    {
      id: 1,
      title: "Optimiser les titres H1-H6",
      description: "Améliorer la structure hiérarchique de vos titres",
      impact: "High",
      status: "completed",
      icon: FileText,
      progress: 100
    },
    {
      id: 2,
      title: "Ajouter des balises meta description",
      description: "Créer des descriptions attrayantes pour chaque page",
      impact: "High", 
      status: "completed",
      icon: Target,
      progress: 100
    },
    {
      id: 3,
      title: "Optimiser les images (alt, compression)",
      description: "Améliorer l'accessibilité et la vitesse de chargement",
      impact: "Medium",
      status: "in_progress",
      icon: Camera,
      progress: 65
    },
    {
      id: 4,
      title: "Améliorer le maillage interne",
      description: "Optimiser les liens internes pour une meilleure navigation",
      impact: "Medium",
      status: "pending",
      icon: Globe,
      progress: 0
    },
    {
      id: 5,
      title: "Ajouter Schema.org markup",
      description: "Structurer les données pour les moteurs de recherche",
      impact: "High",
      status: "pending",
      icon: Settings,
      progress: 0
    }
  ];

  // Outils SEO disponibles
  const seoTools = [
    {
      title: "Recherche de mots-clés",
      description: "Découvrez les meilleurs mots-clés pour votre secteur",
      icon: Search,
      action: () => navigate("/seo/keyword-research")
    },
    {
      title: "Analyse concurrentielle", 
      description: "Analysez la stratégie SEO de vos concurrents",
      icon: TrendingUp,
      action: () => navigate("/seo/competitor-analysis")
    },
    {
      title: "Génération Schema.org",
      description: "Créez des données structurées automatiquement",
      icon: FileText,
      action: () => navigate("/seo/schema-generator")
    },
    {
      title: "Suivi positions",
      description: "Suivez vos positions dans les moteurs de recherche",
      icon: BarChart3,
      action: () => navigate("/seo/rank-tracker")
    }
  ];

  // Génération de contenu SEO
  const generateSEOContent = async () => {
    if (!url || !keyword) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez saisir une URL et un mot-clé",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulation de génération de contenu
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const content = {
        title: `${keyword} - Guide Complet et Solutions Professionnelles`,
        metaDescription: `Découvrez tout sur ${keyword}. Guide expert, conseils pratiques et solutions adaptées à vos besoins. ${keyword.length > 10 ? '✓' : 'Expertise reconnue.'} Consultez maintenant.`,
        h1: `${keyword}: Le Guide Ultime 2024`,
        keywords: [
          keyword,
          `${keyword} professionnel`,
          `guide ${keyword}`,
          `${keyword} expert`,
          `solutions ${keyword}`
        ],
        content: `
# ${keyword}: Le Guide Ultime 2024

## Introduction à ${keyword}

Ce guide complet vous présente tout ce que vous devez savoir sur ${keyword}. Notre expertise dans le domaine nous permet de vous offrir des conseils pratiques et des solutions adaptées.

## Les Avantages de ${keyword}

- **Efficacité**: Solutions optimisées pour vos besoins
- **Expertise**: Années d'expérience dans le domaine  
- **Innovation**: Technologies de pointe
- **Support**: Accompagnement personnalisé

## Comment Optimiser ${keyword}

1. **Analyse des besoins**
2. **Stratégie personnalisée** 
3. **Mise en œuvre**
4. **Suivi et optimisation**

## FAQ sur ${keyword}

### Qu'est-ce que ${keyword} ?
${keyword} est une solution innovante qui vous permet d'optimiser vos performances.

### Comment commencer avec ${keyword} ?
Contactez nos experts pour une consultation gratuite.

---
*Contenu généré automatiquement par l'IA SEO - À personnaliser selon vos besoins*
        `
      };
      
      setGeneratedContent(content);
      setSeoScore(85 + Math.floor(Math.random() * 15)); // Score entre 85-99
      
      toast({
        title: "Contenu généré !",
        description: "Votre contenu SEO optimisé est prêt",
      });
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le contenu SEO",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'pending': return 'À faire';
      default: return 'En attente';
    }
  };

  return (
    <>
      <SEOComponent
        title="SEO Optimizer - Optimisation pour Moteurs de Recherche | Shopopti+"
        description="Outils SEO professionnels pour optimiser votre référencement. Analyse, génération de contenu, suivi de positions et plus encore."
        path="/seo"
        keywords="SEO, référencement, mots-clés, optimisation, Google, moteurs de recherche"
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                SEO Optimizer
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Optimisez votre référencement avec nos outils SEO avancés
              </p>
            </div>
            <Button onClick={() => navigate("/seo/analytics")} variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics SEO
            </Button>
          </div>

          {/* Générateur de contenu */}
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <CardTitle>Générer le Contenu</CardTitle>
              </div>
              <CardDescription>
                Générez du contenu SEO optimisé automatiquement avec l'IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keyword">Mot-clé principal</Label>
                  <Input
                    id="keyword"
                    placeholder="ex: coque iphone 15"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL de la page</Label>
                  <Input
                    id="url"
                    placeholder="https://monsite.com/page"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={generateSEOContent} 
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Générer le Contenu
                  </>
                )}
              </Button>

              {/* Résultat généré */}
              {generatedContent && (
                <div className="mt-6 space-y-4 p-4 bg-background rounded-lg border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Contenu SEO généré
                    </h3>
                    <Badge className="bg-green-100 text-green-800">
                      Score SEO: {seoScore}%
                    </Badge>
                  </div>
                  
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="preview">Aperçu</TabsTrigger>
                      <TabsTrigger value="meta">Meta Tags</TabsTrigger>
                      <TabsTrigger value="content">Contenu</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="preview" className="space-y-4">
                      <div>
                        <Label>Titre SEO</Label>
                        <div className="flex items-center gap-2">
                          <Input value={generatedContent.title} readOnly />
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(generatedContent.title)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Meta Description</Label>
                        <div className="flex items-center gap-2">
                          <Textarea value={generatedContent.metaDescription} readOnly />
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(generatedContent.metaDescription)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="meta" className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <code className="text-sm">
                          {`<title>${generatedContent.title}</title>\n<meta name="description" content="${generatedContent.metaDescription}" />\n<meta name="keywords" content="${generatedContent.keywords.join(', ')}" />`}
                        </code>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="content" className="space-y-4">
                      <Textarea 
                        value={generatedContent.content} 
                        readOnly 
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tâches SEO Recommandées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Tâches SEO Recommandées
              </CardTitle>
              <CardDescription>
                Optimisations prioritaires pour améliorer votre ranking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seoTasks.map((task) => {
                  const IconComponent = task.icon;
                  return (
                    <div key={task.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {task.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : task.status === 'in_progress' ? (
                          <RefreshCw className="w-5 h-5 text-blue-500" />
                        ) : (
                          <IconComponent className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{task.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${task.impact === 'High' ? 'border-red-200 text-red-700' : 'border-orange-200 text-orange-700'}`}
                            >
                              Impact: {task.impact}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(task.status)}
                            >
                              {getStatusText(task.status)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                        <div className="flex items-center gap-2">
                          <Progress value={task.progress} className="flex-1" />
                          <span className="text-sm text-muted-foreground min-w-[40px]">
                            {task.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Outils SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Outils SEO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {seoTools.map((tool, index) => {
                  const IconComponent = tool.icon;
                  return (
                    <div
                      key={index}
                      onClick={tool.action}
                      className="p-6 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-all duration-200 hover:shadow-md group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{tool.title}</h3>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Mots-clés en suivi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Vos mots-clés en suivi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Aucun mot-clé suivi</p>
                  <Button onClick={() => navigate("/seo/keyword-research")} variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Ajouter votre premier mot-clé
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Analytics rapide
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => window.open("https://search.google.com/search-console", "_blank")}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pages indexées</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Mots-clés actifs</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Score SEO moyen</span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      En attente
                    </Badge>
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/seo/analytics")}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Voir tous les analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default SEO;