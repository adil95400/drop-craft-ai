import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Target,
  DollarSign,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AIInsightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  category: string;
  insight_type: string;
  confidence_score: number;
  impact_level: string;
  status: string;
  estimated_revenue_impact: number;
  recommended_actions: any;
  created_at: string;
}

export function AIInsightsDialog({ open, onOpenChange }: AIInsightsDialogProps) {
  const { user } = useAuth();
  const { supabaseQuery } = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (open) {
      loadInsights();
    }
  }, [open]);

  const loadInsights = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabaseQuery(
        async () => {
          const { data, error } = await (await import('@/integrations/supabase/client')).supabase
            .from('ai_insights')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);
          return { data, error };
        },
        { showToast: false }
      );

      if (error) throw new Error(error);
      setInsights(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des insights');
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <Target className="h-5 w-5 text-amber-500" />;
      case 'low':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'implemented':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const handleDismiss = async (insightId: string) => {
    try {
      const { error } = await (await import('@/integrations/supabase/client')).supabase
        .from('ai_insights')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
        .eq('id', insightId);

      if (error) throw error;

      toast.success('Insight ignoré');
      loadInsights();
    } catch (error) {
      toast.error('Erreur lors du rejet de l\'insight');
    }
  };

  const handleImplement = async (insightId: string) => {
    try {
      const { error } = await (await import('@/integrations/supabase/client')).supabase
        .from('ai_insights')
        .update({ status: 'implemented', acted_upon_at: new Date().toISOString() })
        .eq('id', insightId);

      if (error) throw error;

      toast.success('Insight marqué comme implémenté');
      loadInsights();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'insight');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Insights IA
          </DialogTitle>
          <DialogDescription>
            Recommandations intelligentes basées sur l'analyse de vos données
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            {insights.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun insight disponible pour le moment</p>
                <p className="text-sm mt-2">Les insights seront générés automatiquement</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <Card key={insight.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {getImpactIcon(insight.impact_level)}
                          <div className="flex-1">
                            <CardTitle className="text-base">{insight.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {insight.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(insight.status)}
                          <Badge variant="outline" className="whitespace-nowrap">
                            {insight.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>Confiance: {(insight.confidence_score * 100).toFixed(0)}%</span>
                        </div>

                        {insight.estimated_revenue_impact && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Impact: +{insight.estimated_revenue_impact.toFixed(0)}€
                            </span>
                          </div>
                        )}
                      </div>

                      {insight.recommended_actions && Array.isArray(insight.recommended_actions) && insight.recommended_actions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Actions recommandées:</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {insight.recommended_actions.map((action: any, index: number) => (
                              <li key={index}>
                                {typeof action === 'string' ? action : action.title || action.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insight.status === 'active' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleImplement(insight.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Implémenter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismiss(insight.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Ignorer
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
