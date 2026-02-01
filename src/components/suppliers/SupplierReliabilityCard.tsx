/**
 * Supplier Reliability Card
 * Displays reliability score and metrics for a supplier
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type ReliabilityMetrics } from '@/hooks/suppliers';
import { TrendingUp, TrendingDown, Minus, Truck, Star, MessageSquare, DollarSign, Package } from 'lucide-react';

interface SupplierReliabilityCardProps {
  data: ReliabilityMetrics;
  compact?: boolean;
}

export function SupplierReliabilityCard({ data, compact = false }: SupplierReliabilityCardProps) {
  const getRecommendationStyle = (rec: string) => {
    const styles: Record<string, string> = {
      excellent: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      good: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      fair: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      caution: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      avoid: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };
    return styles[rec] || styles.fair;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const score = Math.round(data.overallScore * 100);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                {score}%
              </div>
              <Badge className={getRecommendationStyle(data.recommendation)}>
                {getRecommendationLabel(data.recommendation)}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">{data.supplierName}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Livraison: {Math.round(data.metrics.deliverySpeed.score * 100)}%</div>
                <div>Qualité: {Math.round(data.metrics.productQuality.score * 100)}%</div>
                <div>Communication: {Math.round(data.metrics.communication.score * 100)}%</div>
                <div>Prix: {Math.round(data.metrics.pricing.score * 100)}%</div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{data.supplierName}</CardTitle>
          <Badge className={getRecommendationStyle(data.recommendation)}>
            {getRecommendationLabel(data.recommendation)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center gap-4">
          <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="flex-1">
            <Progress value={score} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">Score de fiabilité global</p>
          </div>
        </div>

        {/* Metric Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <MetricItem
            icon={Truck}
            label="Livraison"
            score={data.metrics.deliverySpeed.score}
            detail={`${data.metrics.deliverySpeed.avgDays}j en moyenne`}
          />
          <MetricItem
            icon={Star}
            label="Qualité"
            score={data.metrics.productQuality.score}
            detail={`${(data.metrics.productQuality.returnRate * 100).toFixed(1)}% retours`}
          />
          <MetricItem
            icon={MessageSquare}
            label="Communication"
            score={data.metrics.communication.score}
            detail={`${data.metrics.communication.responseTimeHours}h réponse`}
          />
          <MetricItem
            icon={DollarSign}
            label="Prix"
            score={data.metrics.pricing.score}
            detail={`Compétitivité: ${Math.round(data.metrics.pricing.competitiveness * 100)}%`}
          />
          <MetricItem
            icon={Package}
            label="Stock"
            score={data.metrics.stockAccuracy.score}
            detail={`${(data.metrics.stockAccuracy.accuracyRate * 100).toFixed(0)}% précision`}
          />
        </div>

        {/* Warnings & Strengths */}
        {data.warnings.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-orange-600">⚠️ Points d'attention:</p>
            {data.warnings.map((warning, i) => (
              <p key={i} className="text-xs text-muted-foreground pl-4">• {warning}</p>
            ))}
          </div>
        )}

        {data.strengths.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-green-600">✓ Points forts:</p>
            {data.strengths.map((strength, i) => (
              <p key={i} className="text-xs text-muted-foreground pl-4">• {strength}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricItem({ 
  icon: Icon, 
  label, 
  score, 
  detail 
}: { 
  icon: React.ElementType; 
  label: string; 
  score: number; 
  detail: string;
}) {
  const percentage = Math.round(score * 100);
  const getColor = (s: number) => {
    if (s >= 0.8) return 'text-green-600';
    if (s >= 0.6) return 'text-blue-600';
    if (s >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
      <Icon className={`w-4 h-4 mt-0.5 ${getColor(score)}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">{label}</span>
          <span className={`text-xs font-bold ${getColor(score)}`}>{percentage}%</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{detail}</p>
      </div>
    </div>
  );
}

function getRecommendationLabel(rec: string): string {
  const labels: Record<string, string> = {
    excellent: 'Excellent',
    good: 'Bon',
    fair: 'Correct',
    caution: 'Attention',
    avoid: 'À éviter',
  };
  return labels[rec] || rec;
}
