// INSIGHTS BUSINESS - Recommandations IA avec actions
import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Zap,
  ArrowRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Insight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  type: 'opportunity' | 'optimization' | 'warning';
  actionLabel: string;
  estimatedGain?: string;
}

const insightIcons = {
  opportunity: TrendingUp,
  optimization: Zap,
  warning: Target
};

const impactColors = {
  high: 'bg-green-500/20 text-green-600',
  medium: 'bg-amber-500/20 text-amber-600',
  low: 'bg-blue-500/20 text-blue-600'
};

const InsightCard = memo(({ 
  insight, 
  onAction 
}: { 
  insight: Insight; 
  onAction: (id: string) => Promise<void>;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const Icon = insightIcons[insight.type];

  const handleAction = async () => {
    setIsLoading(true);
    try {
      await onAction(insight.id);
      setIsCompleted(true);
      toast.success('Action appliquée avec succès');
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.6 }}
        className="p-3 rounded-lg bg-muted/50 border border-border"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm">Appliqué</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg shrink-0",
          insight.type === 'opportunity' ? 'bg-green-500/10 text-green-500' :
          insight.type === 'optimization' ? 'bg-blue-500/10 text-blue-500' :
          'bg-amber-500/10 text-amber-500'
        )}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground truncate">
              {insight.title}
            </h4>
            <Badge variant="secondary" className={cn("text-xs shrink-0", impactColors[insight.impact])}>
              {insight.impact === 'high' ? 'Impact élevé' : 
               insight.impact === 'medium' ? 'Impact moyen' : 'Impact faible'}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {insight.description}
          </p>
          
          {insight.estimatedGain && (
            <p className="text-xs text-green-500 font-medium mb-2">
              Gain estimé: {insight.estimatedGain}
            </p>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAction}
            disabled={isLoading}
            className="h-7 px-2 text-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <ArrowRight className="h-3 w-3 mr-1" />
            )}
            {insight.actionLabel}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

InsightCard.displayName = 'InsightCard';

const BusinessInsights = memo(() => {
  const insights: Insight[] = [
    {
      id: '1',
      title: 'Optimiser les prix',
      description: '12 produits pourraient bénéficier d\'une hausse de prix de 5-10% sans impact sur les ventes.',
      impact: 'high',
      type: 'opportunity',
      actionLabel: 'Appliquer',
      estimatedGain: '+850€/mois'
    },
    {
      id: '2',
      title: 'Améliorer les fiches produits',
      description: '8 produits ont des descriptions incomplètes affectant leur visibilité.',
      impact: 'medium',
      type: 'optimization',
      actionLabel: 'Optimiser'
    },
    {
      id: '3',
      title: 'Stock à surveiller',
      description: '3 best-sellers auront un stock épuisé dans 7 jours au rythme actuel.',
      impact: 'high',
      type: 'warning',
      actionLabel: 'Réapprovisionner'
    }
  ];

  const handleAction = async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Insights IA
          <Badge variant="secondary" className="ml-auto">
            {insights.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <InsightCard 
            key={insight.id} 
            insight={insight} 
            onAction={handleAction}
          />
        ))}
      </CardContent>
    </Card>
  );
});

BusinessInsights.displayName = 'BusinessInsights';

export default BusinessInsights;
