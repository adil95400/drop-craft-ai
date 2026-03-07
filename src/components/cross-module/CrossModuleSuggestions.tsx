/**
 * CrossModuleSuggestions - Widget de suggestions inter-modules
 * Affiche des actions suggérées basées sur les événements récents
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCrossModuleEvents, type ModuleSuggestion } from '@/services/cross-module/CrossModuleEventBus';
import {
  DollarSign, Sparkles, Megaphone, Truck, TrendingUp,
  Target, Zap, Brain, RefreshCw, PackageCheck, X,
  ArrowRight, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, typeof Zap> = {
  DollarSign, Sparkles, Megaphone, Truck, TrendingUp,
  Target, Zap, Brain, RefreshCw, PackageCheck,
};

const PRIORITY_STYLES = {
  high: 'border-l-destructive bg-destructive/5',
  medium: 'border-l-amber-500 bg-amber-500/5',
  low: 'border-l-blue-500 bg-blue-500/5',
};

interface CrossModuleSuggestionsProps {
  maxItems?: number;
  className?: string;
  compact?: boolean;
}

export function CrossModuleSuggestions({ maxItems = 4, className, compact = false }: CrossModuleSuggestionsProps) {
  const navigate = useNavigate();
  const suggestions = useCrossModuleEvents(s => s.getLatestSuggestions(maxItems));
  const events = useCrossModuleEvents(s => s.events);
  const dismissSuggestion = useCrossModuleEvents(s => s.dismissSuggestion);

  // Find event ID for a suggestion
  const findEventForSuggestion = (suggestionId: string) => {
    return events.find(e => e.suggestions.some(s => s.id === suggestionId));
  };

  if (suggestions.length === 0) return null;

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {suggestions.map(suggestion => {
          const Icon = ICON_MAP[suggestion.icon] || Lightbulb;
          return (
            <div
              key={suggestion.id}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded-md p-1.5 transition-colors"
              onClick={() => navigate(suggestion.targetRoute)}
            >
              <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground truncate flex-1">{suggestion.title}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Actions suggérées
          <Badge variant="secondary" className="text-xs">{suggestions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map(suggestion => {
          const Icon = ICON_MAP[suggestion.icon] || Lightbulb;
          const event = findEventForSuggestion(suggestion.id);
          return (
            <div
              key={suggestion.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-md border-l-2 transition-colors',
                PRIORITY_STYLES[suggestion.priority]
              )}
            >
              <div className="p-1.5 rounded bg-background">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground">{suggestion.title}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs gap-1"
                    onClick={() => navigate(suggestion.targetRoute)}
                  >
                    {suggestion.actionLabel}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  {event && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => dismissSuggestion(event.id, suggestion.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
