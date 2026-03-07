/**
 * ModuleInterconnectionBanner - Bannière contextuelle d'interconnexion
 * S'affiche en haut des pages pour suggérer des actions liées à d'autres modules
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCrossModuleEvents } from '@/services/cross-module/CrossModuleEventBus';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ModuleInterconnectionBannerProps {
  /** Current module ID to filter relevant suggestions */
  currentModule: string;
  className?: string;
}

export function ModuleInterconnectionBanner({ currentModule, className }: ModuleInterconnectionBannerProps) {
  const navigate = useNavigate();
  const events = useCrossModuleEvents(s => s.events);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Get suggestions targeting this module from recent events
  const relevantSuggestions = events
    .flatMap(e => e.suggestions)
    .filter(s => s.targetModule === currentModule && !dismissed.has(s.id))
    .slice(0, 1); // Show only the most important one

  if (relevantSuggestions.length === 0) return null;

  const suggestion = relevantSuggestions[0];

  return (
    <div className={cn(
      'flex items-center justify-between gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4',
      className
    )}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm text-foreground">
          <strong>{suggestion.title}</strong> — {suggestion.description}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          className="gap-1 h-7 text-xs"
          onClick={() => navigate(suggestion.targetRoute)}
        >
          {suggestion.actionLabel} <ArrowRight className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => setDismissed(prev => new Set([...prev, suggestion.id]))}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
