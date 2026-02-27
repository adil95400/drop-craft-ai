/**
 * Core Web Vitals Dashboard Widget
 * Displays real-time performance metrics with visual indicators
 */
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCoreWebVitals, VitalScore } from '@/hooks/useCoreWebVitals';
import { Activity, Gauge, Zap, Eye, MousePointer, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

const VITAL_ICONS: Record<string, React.ElementType> = {
  lcp: Eye,
  fid: MousePointer,
  cls: Activity,
  inp: Zap,
  ttfb: Timer,
  fcp: Gauge,
};

const VITAL_DESCRIPTIONS: Record<string, string> = {
  lcp: 'Temps de rendu du plus grand élément visible',
  fid: 'Délai avant la première interaction utilisateur',
  cls: 'Stabilité visuelle de la page (décalages de layout)',
  inp: 'Réactivité aux interactions utilisateur',
  ttfb: 'Temps de réponse du serveur',
  fcp: 'Premier rendu de contenu visible',
};

function getRatingColor(rating: VitalScore['rating']) {
  switch (rating) {
    case 'good': return 'text-green-600 dark:text-green-400';
    case 'needs-improvement': return 'text-yellow-600 dark:text-yellow-400';
    case 'poor': return 'text-red-600 dark:text-red-400';
    default: return 'text-muted-foreground';
  }
}

function getRatingBadge(rating: VitalScore['rating']) {
  switch (rating) {
    case 'good': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'needs-improvement': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'poor': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getRatingLabel(rating: VitalScore['rating']) {
  switch (rating) {
    case 'good': return 'Bon';
    case 'needs-improvement': return 'À améliorer';
    case 'poor': return 'Critique';
    default: return 'En attente';
  }
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) return '—';
  if (unit === '') return value.toFixed(3);
  return `${Math.round(value)}${unit}`;
}

function VitalMetric({ vital, name }: { vital: VitalScore; name: string }) {
  const Icon = VITAL_ICONS[name] || Activity;
  const progressValue = vital.value !== null 
    ? Math.min(100, (vital.value / vital.thresholds.poor) * 100)
    : 0;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className={cn("p-1.5 rounded-md", getRatingBadge(vital.rating))}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{vital.label}</span>
                <span className={cn("text-xs font-mono font-semibold", getRatingColor(vital.rating))}>
                  {formatValue(vital.value, vital.unit)}
                </span>
              </div>
              <Progress 
                value={vital.rating === 'pending' ? 0 : progressValue} 
                className="h-1" 
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[220px]">
          <p className="text-xs font-medium mb-1">{vital.label} — {getRatingLabel(vital.rating)}</p>
          <p className="text-xs text-muted-foreground">{VITAL_DESCRIPTIONS[name]}</p>
          <p className="text-xs mt-1">
            Bon: ≤{vital.thresholds.good}{vital.unit} | Critique: &gt;{vital.thresholds.poor}{vital.unit}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const CoreWebVitalsWidget = memo(function CoreWebVitalsWidget({ className }: { className?: string }) {
  const { getVitalScores, overallScore } = useCoreWebVitals();
  const scores = getVitalScores();
  const overall = overallScore();

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Core Web Vitals
          </CardTitle>
          <Badge 
            className={cn(
              "text-xs",
              overall >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              overall >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            Score: {overall}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {Object.entries(scores).map(([name, vital]) => (
          <VitalMetric key={name} name={name} vital={vital} />
        ))}
      </CardContent>
    </Card>
  );
});

CoreWebVitalsWidget.displayName = 'CoreWebVitalsWidget';
