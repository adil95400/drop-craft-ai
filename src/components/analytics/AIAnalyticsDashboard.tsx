import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Brain, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { AIAnalyticsEngine, AnalyticsInsight, PredictiveAnalysis, PerformanceOptimization } from "@/services/analytics/AIAnalyticsEngine";

const aiEngine = new AIAnalyticsEngine();

export function AIAnalyticsDashboard() {
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [predictions, setPredictions] = useState<PredictiveAnalysis[]>([]);
  const [optimizations, setOptimizations] = useState<PerformanceOptimization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const userId = "current-user"; // Get from auth context
      
      const [insightsData, predictionsData, optimizationsData] = await Promise.all([
        aiEngine.generateInsights(userId),
        aiEngine.predictDemand(userId),
        aiEngine.getPerformanceOptimizations(userId)
      ]);

      setInsights(insightsData);
      setPredictions(predictionsData);
      setOptimizations(optimizationsData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <Target className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-primary';
      case 'low': return 'bg-secondary';
      default: return 'bg-muted';
    }
  };

  const mockChartData = [
    { name: 'Jan', value: 4000, predicted: 4200 },
    { name: 'Feb', value: 3000, predicted: 3400 },
    { name: 'Mar', value: 2000, predicted: 2800 },
    { name: 'Apr', value: 2780, predicted: 3200 },
    { name: 'May', value: 1890, predicted: 2400 },
    { name: 'Jun', value: 2390, predicted: 2900 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>AI is analyzing your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Analytics Dashboard</h1>
          <p className="text-muted-foreground">AI-powered insights and predictions for your business</p>
        </div>
        <Button onClick={loadAnalytics} disabled={loading}>
          <Zap className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getImpactColor(insight.impact)}>{insight.impact} impact</Badge>
                      <Badge variant="outline">{Math.round(insight.confidence * 100)}% confident</Badge>
                    </div>
                  </div>
                  <CardDescription>{insight.description}</CardDescription>
                </CardHeader>
                {insight.actionable && (
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">Recommended Actions:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {insight.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecasting</CardTitle>
              <CardDescription>AI predictions for the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="hsl(var(--accent))" strokeDasharray="5 5" name="Predicted" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {predictions.map((prediction, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base">{prediction.metric}</CardTitle>
                  <div className="flex items-center gap-2">
                    {prediction.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : prediction.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span className="text-2xl font-bold">{prediction.predictedValue.toLocaleString()}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current: {prediction.currentValue.toLocaleString()}</span>
                      <span>{Math.round(prediction.confidence * 100)}% confidence</span>
                    </div>
                    <Progress value={prediction.confidence * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-4">
          <div className="grid gap-4">
            {optimizations.map((opt, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{opt.category}</CardTitle>
                    <Badge className={getPriorityColor(opt.priority)}>{opt.priority} priority</Badge>
                  </div>
                  <CardDescription>
                    Current: {opt.current}% → Potential: {opt.potential}% 
                    <span className="text-green-600 font-medium ml-2">+{opt.improvement}% improvement</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress to Potential</span>
                        <span>{Math.round((opt.current / opt.potential) * 100)}%</span>
                      </div>
                      <Progress value={(opt.current / opt.potential) * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Action Plan:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {opt.actions.map((action, actionIdx) => (
                          <li key={actionIdx}>{action}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Estimated Impact: {opt.estimatedImpact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}