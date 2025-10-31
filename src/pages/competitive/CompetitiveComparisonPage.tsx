import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';
import { ComparisonTable } from '@/components/competitive/comparison/ComparisonTable';
import { ComparisonCharts } from '@/components/competitive/comparison/ComparisonCharts';
import { CompetitivePositioning } from '@/components/competitive/comparison/CompetitivePositioning';
import { MarketGapsAnalysis } from '@/components/competitive/comparison/MarketGapsAnalysis';
import { CompetitorSelector } from '@/components/competitive/CompetitorSelector';
import { ComparisonResultCard } from '@/components/competitive/ComparisonResultCard';
import { ExportComparisonButton } from '@/components/competitive/ExportComparisonButton';
import { BarChart3, Target, TrendingUp, AlertTriangle, PlusCircle, GitCompare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CompetitiveComparisonPage() {
  const navigate = useNavigate();
  const { analyses, isLoading, compareCompetitors, isComparing } = useCompetitiveAnalysis();
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [selectedForVs, setSelectedForVs] = useState<string[]>([]);

  const handleCompare = async (selectedIds: string[]) => {
    try {
      const result = await compareCompetitors.mutateAsync({ competitorIds: selectedIds });
      setComparisonResult(result);
    } catch (error) {
      console.error('Error comparing competitors:', error);
    }
  };

  const handleVsComparison = () => {
    if (selectedForVs.length === 2) {
      navigate(`/competitive-comparison/${selectedForVs[0]}/vs/${selectedForVs[1]}`);
    }
  };

  const toggleVsSelection = (id: string) => {
    setSelectedForVs(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      return [prev[1], id];
    });
  };

  return (
    <>
      <Helmet>
        <title>Comparaison Concurrentielle | Drop Craft AI</title>
        <meta 
          name="description" 
          content="Comparez votre application avec vos concurrents et identifiez les opportunités" 
        />
      </Helmet>

      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Comparaison Concurrentielle
              </h1>
              <p className="text-xl text-muted-foreground">
                Analysez votre positionnement par rapport à vos concurrents
              </p>
            </div>
            {analyses && analyses.length > 0 && (
              <ExportComparisonButton analyses={analyses} comparisonResult={comparisonResult} />
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !analyses || analyses.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-6 max-w-md mx-auto">
                <div className="flex justify-center">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <AlertTriangle className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">Aucune analyse disponible</h3>
                  <p className="text-muted-foreground">
                    Pour comparer votre application avec vos concurrents, vous devez d'abord lancer des analyses concurrentielles.
                  </p>
                </div>
                <div className="space-y-3 pt-4">
                  <p className="text-sm font-medium">Comment démarrer :</p>
                  <ol className="text-sm text-muted-foreground space-y-2 text-left">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <span>Allez dans la section "Analyse Concurrentielle"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <span>Ajoutez les URLs de vos principaux concurrents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <span>Lancez les analyses IA pour chaque concurrent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">4.</span>
                      <span>Revenez ici pour voir la comparaison détaillée</span>
                    </li>
                  </ol>
                </div>
                <Button 
                  size="lg" 
                  className="gap-2"
                  onClick={() => navigate('/competitor-analysis')}
                >
                  <PlusCircle className="w-5 h-5" />
                  Analyser mes concurrents
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="selector" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="selector" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Sélection
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="positioning" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Positionnement
              </TabsTrigger>
              <TabsTrigger value="gaps" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Opportunités
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Détails
              </TabsTrigger>
            </TabsList>

            <TabsContent value="selector">
              <CompetitorSelector 
                analyses={analyses} 
                onCompare={handleCompare}
                isComparing={isComparing}
              />
              
              {comparisonResult && comparisonResult.comparison && (
                <div className="mt-6">
                  <ComparisonResultCard comparison={comparisonResult.comparison} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="overview">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitCompare className="w-5 h-5" />
                      Comparaison 1 vs 1
                    </CardTitle>
                    <CardDescription>
                      Sélectionnez deux concurrents pour une analyse approfondie
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        {analyses.slice(0, 5).map(analysis => (
                          <div
                            key={analysis.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                              selectedForVs.includes(analysis.id) ? 'bg-primary/10 border-primary' : ''
                            }`}
                            onClick={() => toggleVsSelection(analysis.id)}
                          >
                            <div className="flex-1">
                              <p className="font-medium">{analysis.competitor_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {analysis.competitive_data?.market_position || 'N/A'}
                              </p>
                            </div>
                            {selectedForVs.includes(analysis.id) && (
                              <div className="text-xs font-medium text-primary">
                                Sélectionné {selectedForVs.indexOf(analysis.id) + 1}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={handleVsComparison}
                        disabled={selectedForVs.length !== 2}
                        className="w-full gap-2"
                      >
                        <GitCompare className="w-4 h-4" />
                        Comparer en détail ({selectedForVs.length}/2 sélectionnés)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <ComparisonCharts analyses={analyses} />
              </div>
            </TabsContent>

            <TabsContent value="positioning">
              <CompetitivePositioning analyses={analyses} />
            </TabsContent>

            <TabsContent value="gaps">
              <MarketGapsAnalysis analyses={analyses} />
            </TabsContent>

            <TabsContent value="details">
              <ComparisonTable analyses={analyses} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
