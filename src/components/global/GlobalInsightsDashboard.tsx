import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Globe, TrendingUp, Target, Lightbulb, MapPin } from 'lucide-react';

interface GlobalInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  confidence_score: number;
  impact_level: string;
  regions: string[];
  recommendations: any;
  created_at: string;
}

export function GlobalInsightsDashboard() {
  const { toast } = useToast();
  const [insights, setInsights] = useState<GlobalInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('global_insights')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('is_active', true)
        .order('confidence_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      setInsights(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'market_trend': return <TrendingUp className="h-4 w-4" />;
      case 'demand_shift': return <Target className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading global insights...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global Intelligence
          </CardTitle>
          <CardDescription>AI-powered insights from global market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-2xl font-bold">{insights.length}</p>
              <p className="text-sm text-muted-foreground">Active Insights</p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-2xl font-bold">
                {insights.filter(i => i.impact_level === 'high').length}
              </p>
              <p className="text-sm text-muted-foreground">High Impact</p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-2xl font-bold">
                {insights.reduce((sum, i) => sum + (i.confidence_score || 0), 0) / insights.length || 0}%
              </p>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {insights.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No insights available yet</p>
            </CardContent>
          </Card>
        ) : (
          insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(insight.insight_type)}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <CardDescription>{insight.description}</CardDescription>
                  </div>
                  <Badge variant={getImpactColor(insight.impact_level)}>
                    {insight.impact_level} impact
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>Confidence: {insight.confidence_score?.toFixed(0)}%</span>
                  </div>
                  {insight.regions && insight.regions.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{insight.regions.join(', ')}</span>
                    </div>
                  )}
                </div>

                {insight.recommendations && Array.isArray(insight.recommendations) && insight.recommendations.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Recommendations
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {insight.recommendations.slice(0, 3).map((rec: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-xs">•</span>
                          <span>{rec.action || rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
