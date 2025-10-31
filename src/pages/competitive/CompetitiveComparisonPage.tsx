import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';
import { ComparisonTable } from '@/components/competitive/comparison/ComparisonTable';
import { ComparisonCharts } from '@/components/competitive/comparison/ComparisonCharts';
import { CompetitivePositioning } from '@/components/competitive/comparison/CompetitivePositioning';
import { MarketGapsAnalysis } from '@/components/competitive/comparison/MarketGapsAnalysis';
import { CompetitorSelector } from '@/components/competitive/CompetitorSelector';
import { BarChart3, Target, TrendingUp, AlertTriangle } from 'lucide-react';

export default function CompetitiveComparisonPage() {
  const { analyses, isLoading, compareCompetitors, isComparing } = useCompetitiveAnalysis();
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  const handleCompare = async (selectedIds: string[]) => {
    try {
      const result = await compareCompetitors.mutateAsync({ competitorIds: selectedIds });
      setComparisonResult(result);
    } catch (error) {
      console.error('Error comparing competitors:', error);
    }
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
          <h1 className="text-4xl font-bold tracking-tight">
            Comparaison Concurrentielle
          </h1>
          <p className="text-xl text-muted-foreground">
            Analysez votre positionnement par rapport à vos concurrents
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !analyses || analyses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Aucune analyse disponible</h3>
                  <p className="text-muted-foreground">
                    Commencez par analyser vos concurrents dans la section Analyse Concurrentielle
                  </p>
                </div>
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
              
              {comparisonResult && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Résultat de la Comparaison</CardTitle>
                    <CardDescription>
                      Analyse comparative de {comparisonResult.analyzedCompetitors?.length || 0} concurrents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                      {JSON.stringify(comparisonResult.comparison, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="overview">
              <div className="space-y-6">
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
