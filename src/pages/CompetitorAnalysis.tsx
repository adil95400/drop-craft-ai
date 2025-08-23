import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Eye, 
  TrendingUp, 
  Globe,
  RefreshCw,
  ExternalLink,
  BarChart3,
  Target,
  Users,
  Zap
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CompetitorAnalysis = () => {
  const [domain, setDomain] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const { toast } = useToast();

  // Données simulées d'analyse concurrentielle
  const analyzeCompetitor = async () => {
    if (!domain.trim()) {
      toast({
        title: "Domaine requis",
        description: "Veuillez saisir l'URL d'un concurrent à analyser",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulation d'analyse
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockData = {
        domain: domain,
        overview: {
          authorityScore: 65,
          organicKeywords: 12450,
          organicTraffic: 45600,
          paidKeywords: 234,
          paidTraffic: 8900,
          backlinks: 15600
        },
        topKeywords: [
          { keyword: "coque iphone 15", position: 3, volume: 22000, trend: "up" },
          { keyword: "protection écran iphone", position: 7, volume: 18000, trend: "stable" },
          { keyword: "accessoires iphone", position: 12, volume: 15000, trend: "down" },
          { keyword: "chargeur sans fil", position: 5, volume: 8900, trend: "up" },
          { keyword: "airpods pro case", position: 15, volume: 6700, trend: "up" }
        ],
        contentGaps: [
          { keyword: "coque iphone 15 pro max", theirPos: null, opportunity: "High", volume: 19000 },
          { keyword: "protection iphone transparente", theirPos: null, opportunity: "Medium", volume: 12000 },
          { keyword: "magsafe compatible", theirPos: null, opportunity: "High", volume: 8500 }
        ],
        techSEO: {
          pageSpeed: 78,
          mobileOptimization: 92,
          coreWebVitals: 65,
          httpsUsage: 100,
          structuredData: 45
        },
        topPages: [
          { url: "/coque-iphone-15", traffic: 5600, keywords: 89 },
          { url: "/protection-ecran", traffic: 4200, keywords: 67 },
          { url: "/accessoires-apple", traffic: 3800, keywords: 156 },
          { url: "/chargeurs", traffic: 2900, keywords: 34 }
        ]
      };
      
      setAnalysisData(mockData);
      
      toast({
        title: "Analyse terminée",
        description: `Analyse complète de ${domain} disponible`,
      });
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'analyser le concurrent",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity) {
      case 'High': return "bg-green-100 text-green-800";
      case 'Medium': return "bg-orange-100 text-orange-800";
      case 'Low': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Analyse Concurrentielle - SEO Tools</title>
        <meta name="description" content="Analysez vos concurrents SEO. Découvrez leurs mots-clés, stratégies et opportunités." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              Analyse Concurrentielle
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Découvrez les stratégies SEO de vos concurrents
            </p>
          </div>

          {/* Formulaire d'analyse */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Analyser un Concurrent
              </CardTitle>
              <CardDescription>
                Entrez le domaine d'un concurrent pour analyser sa stratégie SEO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="domain">Domaine du concurrent</Label>
                  <Input
                    id="domain"
                    placeholder="ex: concurrent.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && analyzeCompetitor()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={analyzeCompetitor} 
                    disabled={isAnalyzing}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analyse...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Analyser
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résultats d'analyse */}
          {analysisData && (
            <div className="space-y-8">
              {/* Vue d'ensemble */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Vue d'ensemble - {analysisData.domain}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center p-4 bg-accent/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{analysisData.overview.authorityScore}</div>
                      <div className="text-sm text-muted-foreground">Authority Score</div>
                    </div>
                    <div className="text-center p-4 bg-accent/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{analysisData.overview.organicKeywords.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Mots-clés Organic</div>
                    </div>
                    <div className="text-center p-4 bg-accent/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{analysisData.overview.organicTraffic.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Traffic Organic</div>
                    </div>
                    <div className="text-center p-4 bg-accent/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{analysisData.overview.paidKeywords.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Mots-clés Paid</div>
                    </div>
                    <div className="text-center p-4 bg-accent/50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{analysisData.overview.paidTraffic.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Traffic Paid</div>
                    </div>
                    <div className="text-center p-4 bg-accent/50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">{analysisData.overview.backlinks.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Backlinks</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Onglets détaillés */}
              <Tabs defaultValue="keywords" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="keywords">Mots-clés Top</TabsTrigger>
                  <TabsTrigger value="gaps">Opportunités</TabsTrigger>
                  <TabsTrigger value="technical">SEO Technique</TabsTrigger>
                  <TabsTrigger value="pages">Pages Top</TabsTrigger>
                </TabsList>

                <TabsContent value="keywords" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Leurs Meilleurs Mots-clés
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisData.topKeywords.map((kw: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                            <div className="flex items-center gap-4">
                              <Badge className="bg-blue-100 text-blue-800">#{kw.position}</Badge>
                              <div>
                                <div className="font-medium">{kw.keyword}</div>
                                <div className="text-sm text-muted-foreground">
                                  Volume: {kw.volume.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getTrendIcon(kw.trend)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="gaps" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Opportunités de Contenu
                      </CardTitle>
                      <CardDescription>
                        Mots-clés sur lesquels ils ne sont pas positionnés
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisData.contentGaps.map((gap: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div>
                              <div className="font-medium">{gap.keyword}</div>
                              <div className="text-sm text-muted-foreground">
                                Volume: {gap.volume.toLocaleString()} recherches/mois
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getOpportunityColor(gap.opportunity)}>
                                {gap.opportunity} Opportunity
                              </Badge>
                              <Button size="sm" variant="outline">
                                Cibler
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="technical" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        Performance SEO Technique
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Page Speed</span>
                            <span className="text-sm text-muted-foreground">{analysisData.techSEO.pageSpeed}%</span>
                          </div>
                          <Progress value={analysisData.techSEO.pageSpeed} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Mobile Optimization</span>
                            <span className="text-sm text-muted-foreground">{analysisData.techSEO.mobileOptimization}%</span>
                          </div>
                          <Progress value={analysisData.techSEO.mobileOptimization} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Core Web Vitals</span>
                            <span className="text-sm text-muted-foreground">{analysisData.techSEO.coreWebVitals}%</span>
                          </div>
                          <Progress value={analysisData.techSEO.coreWebVitals} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">HTTPS Usage</span>
                            <span className="text-sm text-muted-foreground">{analysisData.techSEO.httpsUsage}%</span>
                          </div>
                          <Progress value={analysisData.techSEO.httpsUsage} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Structured Data</span>
                            <span className="text-sm text-muted-foreground">{analysisData.techSEO.structuredData}%</span>
                          </div>
                          <Progress value={analysisData.techSEO.structuredData} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pages" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Pages les Plus Performantes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisData.topPages.map((page: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {page.url}
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {page.keywords} mots-clés
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-primary">{page.traffic.toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">visiteurs/mois</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* État vide */}
          {!analysisData && !isAnalyzing && (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analysez un concurrent</h3>
                <p className="text-muted-foreground mb-4">
                  Entrez le domaine d'un concurrent pour découvrir ses stratégies SEO
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default CompetitorAnalysis;