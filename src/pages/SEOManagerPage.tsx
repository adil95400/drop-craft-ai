import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, TrendingUp, Target, Globe, CheckCircle, AlertTriangle, Settings, Plus, Download, Upload, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useRealSEO } from '@/hooks/useRealSEO';
import { SEOAuditCard } from '@/components/seo/SEOAuditCard';
import { AddKeywordModal } from '@/components/seo/AddKeywordModal';
import { SEOAnalysisModal } from '@/components/seo/SEOAnalysisModal';
import { SEORecommendationsCard } from '@/components/seo/SEORecommendationsCard';
import { SEOContentGenerator } from '@/components/seo/SEOContentGenerator';
import { SEOTechnicalDetailsModal } from '@/components/seo/SEOTechnicalDetailsModal';
import { SEOPageOptimizationModal } from '@/components/seo/SEOPageOptimizationModal';
import { useToast } from '@/hooks/use-toast';

export default function SEOManagerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState('');
  const [showTechnicalModal, setShowTechnicalModal] = useState(false);
  const [selectedTechnicalDetail, setSelectedTechnicalDetail] = useState(null);
  const [showPageOptimizationModal, setShowPageOptimizationModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  
  const { 
    analyses, 
    keywords, 
    stats, 
    isLoading,
    analyzeUrl,
    isAnalyzing,
    addKeyword,
    isAddingKeyword,
    updateKeyword
  } = useRealSEO();
  
  const { toast } = useToast();

  const handleAnalyzeUrl = async () => {
    if (!analysisUrl.trim()) {
      toast({
        title: "URL manquante",
        description: "Veuillez saisir une URL à analyser",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await analyzeUrl(analysisUrl);
      setAnalysisUrl('');
      setShowAnalysisModal(false);
    } catch (error) {
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser cette URL",
        variant: "destructive"
      });
    }
  };

  const exportSEOData = () => {
    const data = {
      analyses,
      keywords,
      stats,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export réussi",
      description: "Les données SEO ont été exportées"
    });
  };

  const filteredKeywords = keywords.filter(keyword => 
    keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTechnicalDetails = (detail: any) => {
    setSelectedTechnicalDetail(detail);
    setShowTechnicalModal(true);
  };

  const handlePageOptimization = (page: any) => {
    setSelectedPage(page);
    setShowPageOptimizationModal(true);
  };

  const technicalChecks = [
    { 
      check: 'Vitesse de chargement', 
      status: 'success', 
      details: '2.1s (Bon)',
      score: 85,
      impact: 'Une vitesse de chargement rapide améliore l\'expérience utilisateur et le classement SEO'
    },
    { 
      check: 'Mobile-friendly', 
      status: 'success', 
      details: 'Compatible',
      score: 95,
      impact: 'La compatibilité mobile est essentielle pour le référencement Google'
    },
    { 
      check: 'HTTPS', 
      status: 'success', 
      details: 'Sécurisé',
      score: 100,
      impact: 'HTTPS est un facteur de classement confirmé par Google'
    },
    { 
      check: 'Sitemap XML', 
      status: 'warning', 
      details: 'À mettre à jour',
      score: 70,
      impact: 'Un sitemap à jour aide les moteurs de recherche à indexer vos pages'
    },
    { 
      check: 'Robots.txt', 
      status: 'success', 
      details: 'Configuré',
      score: 90,
      impact: 'Le fichier robots.txt guide les crawlers des moteurs de recherche'
    }
  ];

  const pagesData = [
    { url: '/products', score: 85, issues: 2, status: 'good' as const },
    { url: '/suppliers', score: 72, issues: 4, status: 'warning' as const },
    { url: '/analytics', score: 91, issues: 1, status: 'good' as const },
    { url: '/automation', score: 68, issues: 5, status: 'warning' as const }
  ];

  return (
    <>
      <Helmet>
        <title>SEO Manager - Optimisation SEO | Drop Craft AI</title>
        <meta name="description" content="Optimisez votre référencement naturel avec notre suite SEO complète. Suivi des mots-clés, analyse technique et recommandations IA." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SEO Manager</h1>
            <p className="text-muted-foreground">
              Optimisez votre référencement naturel et améliorez votre visibilité
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportSEOData}>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
            <Button variant="outline" onClick={() => setShowAddKeywordModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter mot-clé
            </Button>
            <Button onClick={() => setShowAnalysisModal(true)}>
              <Search className="mr-2 h-4 w-4" />
              Analyser URL
            </Button>
          </div>
        </div>

        {/* Métriques SEO */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Score SEO Global</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{Math.round(stats.averageScore)}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <Progress value={stats.averageScore} className="h-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mots-clés Trackés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{stats.totalKeywords}</span>
                <span className="text-sm text-muted-foreground">actifs</span>
              </div>
              <Progress value={(stats.trackingKeywords / Math.max(stats.totalKeywords, 1)) * 100} className="h-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pages Analysées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{stats.totalPages}</span>
                <span className="text-sm text-muted-foreground">pages</span>
              </div>
              <Progress value={(stats.totalPages / 50) * 100} className="h-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Analyses Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{stats.totalAnalyses}</span>
                <span className="text-sm text-muted-foreground">réalisées</span>
              </div>
              <Progress value={(stats.totalAnalyses / 100) * 100} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Contenu Principal */}
        <Tabs defaultValue="keywords" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
            <TabsTrigger value="analyses">Analyses</TabsTrigger>
            <TabsTrigger value="generator">Générateur</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="technical">Technique</TabsTrigger>
            <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Suivi des Mots-clés</CardTitle>
                    <CardDescription>
                      Suivez les positions de vos mots-clés stratégiques ({filteredKeywords.length} mots-clés)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Rechercher un mot-clé..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button onClick={() => setShowAddKeywordModal(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>Chargement des mots-clés...</p>
                    </div>
                  ) : filteredKeywords.length > 0 ? (
                    filteredKeywords.map((keyword) => (
                      <div key={keyword.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold">{keyword.keyword}</h4>
                          <p className="text-sm text-muted-foreground">
                            Volume: {keyword.search_volume?.toLocaleString() || 'N/A'} recherches/mois
                            {keyword.difficulty_score && ` • Difficulté: ${keyword.difficulty_score}/100`}
                          </p>
                          {keyword.target_url && (
                            <p className="text-xs text-blue-600">{keyword.target_url}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              #{keyword.current_position || '--'}
                            </div>
                            <Badge variant={keyword.tracking_active ? 'default' : 'secondary'}>
                              {keyword.tracking_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateKeyword({ 
                              id: keyword.id, 
                              updates: { tracking_active: !keyword.tracking_active } 
                            })}
                          >
                            {keyword.tracking_active ? 'Désactiver' : 'Activer'}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucun mot-clé trouvé</h3>
                      <p className="text-muted-foreground mb-4">
                        Ajoutez des mots-clés pour commencer le suivi SEO
                      </p>
                      <Button onClick={() => setShowAddKeywordModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter votre premier mot-clé
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyses" className="space-y-4">
            <div className="grid gap-4">
              {analyses.length > 0 ? (
                analyses.map((analysis) => (
                  <SEOAuditCard
                    key={analysis.id}
                    url={analysis.url}
                    score={analysis.overall_score}
                    issues={[
                      ...(analysis.issues?.critical || []).map((issue: any) => ({
                        type: 'critical' as const,
                        title: issue.title || 'Problème critique',
                        description: issue.description || '',
                        howToFix: issue.solution || 'Solution à définir',
                        impact: 'high' as const
                      })),
                      ...(analysis.issues?.warnings || []).map((issue: any) => ({
                        type: 'warning' as const,
                        title: issue.title || 'Avertissement',
                        description: issue.description || '',
                        howToFix: issue.solution || 'Solution à définir',
                        impact: 'medium' as const
                      }))
                    ]}
                    lastAudited={new Date(analysis.analyzed_at)}
                    onReaudit={() => analyzeUrl(analysis.url)}
                    loading={isAnalyzing}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune analyse SEO</h3>
                    <p className="text-muted-foreground mb-4">
                      Lancez votre première analyse pour obtenir des insights SEO
                    </p>
                    <Button onClick={() => setShowAnalysisModal(true)}>
                      <Search className="mr-2 h-4 w-4" />
                      Analyser une URL
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="generator" className="space-y-4">
            <SEOContentGenerator />
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analyse des Pages</CardTitle>
                <CardDescription>
                  Optimisation SEO de vos pages principales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pagesData.map((page, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h4 className="font-semibold">{page.url}</h4>
                          <p className="text-sm text-muted-foreground">
                            {page.issues} problème(s) détecté(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-bold">{page.score}/100</div>
                          <Badge variant={page.status === 'good' ? 'default' : 'secondary'}>
                            {page.status === 'good' ? 'Bon' : 'À améliorer'}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePageOptimization(page)}
                        >
                          Optimiser
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
                <CardTitle>Audit Technique</CardTitle>
                <CardDescription>
                  Vérification technique de votre site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {technicalChecks.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {item.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <h4 className="font-medium">{item.check}</h4>
                          <p className="text-sm text-muted-foreground">{item.details}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTechnicalDetails(item)}
                      >
                        Détails
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <SEORecommendationsCard loading={isLoading} />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <AddKeywordModal 
          open={showAddKeywordModal} 
          onOpenChange={setShowAddKeywordModal} 
        />
        
        <SEOAnalysisModal
          open={showAnalysisModal}
          onOpenChange={(open) => {
            setShowAnalysisModal(open);
            if (!open) setAnalysisUrl('');
          }}
          onAnalyze={async (url, options) => {
            setAnalysisUrl(url);
            await handleAnalyzeUrl();
          }}
          isAnalyzing={isAnalyzing}
        />
        
        <SEOTechnicalDetailsModal
          open={showTechnicalModal}
          onOpenChange={setShowTechnicalModal}
          detail={selectedTechnicalDetail}
        />
        
        <SEOPageOptimizationModal
          open={showPageOptimizationModal}
          onOpenChange={setShowPageOptimizationModal}
          page={selectedPage}
        />
      </div>
    </>
  );
}