import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdvancedAnalyticsService } from "@/hooks/useAdvancedAnalyticsService"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Activity, BarChart3, Zap, PlayCircle, PlusCircle } from "lucide-react"

export function AdvancedAnalyticsDashboard() {
  const {
    performanceMetrics,
    reports,
    predictiveAnalytics,
    abTests,
    isLoading,
    generateReport,
    createABTest,
    runPredictiveAnalysis,
    isGeneratingReport,
    isCreatingABTest,
    isRunningPredictive
  } = useAdvancedAnalyticsService()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Avancés</h2>
          <p className="text-muted-foreground">
            Analyses prédictives et métriques de performance en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => runPredictiveAnalysis()}
            disabled={isRunningPredictive}
            variant="outline"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isRunningPredictive ? "Analyse..." : "Analyse Prédictive"}
          </Button>
          <Button 
            onClick={() => generateReport({ reportType: 'comprehensive', config: {} })}
            disabled={isGeneratingReport}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {isGeneratingReport ? "Génération..." : "Générer Rapport"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Métriques Performance</TabsTrigger>
          <TabsTrigger value="predictive">Analyses Prédictives</TabsTrigger>
          <TabsTrigger value="abtests">Tests A/B</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics?.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.metric_name}
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.metric_value}</div>
                  <p className="text-xs text-muted-foreground">
                    Évolution depuis la dernière période
                  </p>
                  <div className="mt-2">
                    <Progress 
                      value={Number(metric.metric_value)} 
                      max={100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {performanceMetrics && performanceMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Métriques</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric_name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="metric_value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {predictiveAnalytics?.map((analysis, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {analysis.prediction_type}
                  </CardTitle>
                  <CardDescription>
                    Confiance: {(analysis.confidence_score * 100).toFixed(0)}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Prédictions</h4>
                      <div className="text-sm text-muted-foreground">
                        {JSON.stringify(analysis.predictions, null, 2)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Recommandations</h4>
                      <div className="text-sm">
                        Analyse prédictive générée avec succès
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="abtests" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Tests A/B Actifs</h3>
            <Button 
              onClick={() => createABTest({
                experimentName: 'Nouveau Test',
                experimentType: 'conversion',
                hypothesis: 'Test hypothèse',
                controlVariant: {},
                testVariants: [],
                successMetrics: [],
                trafficAllocation: {}
              })}
              disabled={isCreatingABTest}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {isCreatingABTest ? "Création..." : "Nouveau Test"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {abTests?.map((test, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {test.experiment_name}
                    <Badge variant={test.status === 'running' ? 'default' : 'secondary'}>
                      {test.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{test.hypothesis}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confiance statistique:</span>
                      <span>{test.statistical_significance ? (test.statistical_significance * 100).toFixed(1) + '%' : 'N/A'}</span>
                    </div>
                    <Progress 
                      value={(test.statistical_significance || 0) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports?.map((report, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{report.report_name}</CardTitle>
                  <CardDescription>
                    Type: {report.report_type} • 
                    <Badge variant={report.status === 'completed' ? 'default' : 'secondary'} className="ml-1">
                      {report.status}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>Généré: {new Date(report.generated_at).toLocaleDateString()}</div>
                    {report.file_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                          Télécharger
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}