/**
 * AutomationExecutionTimeline - Real-time execution visualization
 * Shows step-by-step progress with timing, inputs/outputs, and errors
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight,
  RotateCcw, Eye, Activity, Timer, ArrowRight, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  retryCount?: number;
}

interface Execution {
  id: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  totalDurationMs?: number;
  steps: ExecutionStep[];
}

interface AutomationExecutionTimelineProps {
  executions?: Execution[];
  onRetry?: (executionId: string) => void;
}

const MOCK_EXECUTIONS: Execution[] = [
  {
    id: 'exec-1',
    workflowName: 'Alerte Stock Critique',
    status: 'completed',
    triggeredBy: 'event:stock_updated',
    startedAt: new Date(Date.now() - 300000).toISOString(),
    completedAt: new Date(Date.now() - 297000).toISOString(),
    totalDurationMs: 3200,
    steps: [
      { id: 's1', name: 'Vérifier stock', status: 'success', durationMs: 120, input: { product_id: 'P-1234' }, output: { stock: 3, threshold: 10 } },
      { id: 's2', name: 'Évaluer condition', status: 'success', durationMs: 15, input: { stock: 3, threshold: 10 }, output: { triggered: true } },
      { id: 's3', name: 'Envoyer notification', status: 'success', durationMs: 890, output: { channel: 'email', sent: true } },
      { id: 's4', name: 'Logger événement', status: 'success', durationMs: 45 },
    ]
  },
  {
    id: 'exec-2',
    workflowName: 'Repricing Dynamique',
    status: 'failed',
    triggeredBy: 'schedule:daily',
    startedAt: new Date(Date.now() - 600000).toISOString(),
    completedAt: new Date(Date.now() - 595000).toISOString(),
    totalDurationMs: 5100,
    steps: [
      { id: 's1', name: 'Scraping concurrents', status: 'success', durationMs: 2300 },
      { id: 's2', name: 'Analyse marge', status: 'success', durationMs: 450 },
      { id: 's3', name: 'Calcul nouveau prix', status: 'failed', durationMs: 120, error: 'Marge minimale non respectée: 8% < 15%', retryCount: 2 },
      { id: 's4', name: 'Mise à jour catalogue', status: 'skipped' },
      { id: 's5', name: 'Notification', status: 'skipped' },
    ]
  },
  {
    id: 'exec-3',
    workflowName: 'Sync Fournisseur',
    status: 'running',
    triggeredBy: 'manual',
    startedAt: new Date(Date.now() - 15000).toISOString(),
    steps: [
      { id: 's1', name: 'Connexion API', status: 'success', durationMs: 340 },
      { id: 's2', name: 'Fetch catalogue', status: 'running', startedAt: new Date(Date.now() - 5000).toISOString() },
      { id: 's3', name: 'Diff produits', status: 'pending' },
      { id: 's4', name: 'Mise à jour DB', status: 'pending' },
      { id: 's5', name: 'Rapport', status: 'pending' },
    ]
  }
];

export function AutomationExecutionTimeline({ executions = MOCK_EXECUTIONS, onRetry }: AutomationExecutionTimelineProps) {
  const [expandedExec, setExpandedExec] = useState<string | null>(executions[0]?.id || null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Succès' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Échoué' };
      case 'running':
        return { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'En cours' };
      case 'skipped':
        return { icon: ArrowRight, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Ignoré' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Annulé' };
      default:
        return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'En attente' };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Timer className="h-5 w-5 text-primary" />
          Historique d'exécution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {executions.map((exec) => {
              const statusConfig = getStatusConfig(exec.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedExec === exec.id;
              const successSteps = exec.steps.filter(s => s.status === 'success').length;
              const totalSteps = exec.steps.length;

              return (
                <Collapsible
                  key={exec.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedExec(isExpanded ? null : exec.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      exec.status === 'running' && "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20"
                    )}>
                      <div className={cn("p-2 rounded-full", statusConfig.bg)}>
                        <StatusIcon className={cn("h-4 w-4", statusConfig.color, exec.status === 'running' && "animate-spin")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{exec.workflowName}</span>
                          <Badge variant="outline" className="text-[10px]">{exec.triggeredBy}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{formatDistanceToNow(new Date(exec.startedAt), { addSuffix: true, locale: fr })}</span>
                          {exec.totalDurationMs && <span>{(exec.totalDurationMs / 1000).toFixed(1)}s</span>}
                          <span>{successSteps}/{totalSteps} étapes</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {exec.status === 'failed' && onRetry && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={(e) => { e.stopPropagation(); onRetry(exec.id); }}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Retry
                          </Button>
                        )}
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="ml-6 mt-2 space-y-1 border-l-2 border-border pl-4">
                      {exec.steps.map((step) => {
                        const stepStatus = getStatusConfig(step.status);
                        const StepIcon = stepStatus.icon;
                        const isStepExpanded = expandedStep === `${exec.id}-${step.id}`;

                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            <div
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors text-sm",
                                step.status === 'running' && "bg-blue-50/50 dark:bg-blue-950/20"
                              )}
                              onClick={() => setExpandedStep(isStepExpanded ? null : `${exec.id}-${step.id}`)}
                            >
                              <StepIcon className={cn("h-3.5 w-3.5 shrink-0", stepStatus.color, step.status === 'running' && "animate-spin")} />
                              <span className="flex-1 truncate">{step.name}</span>
                              {step.durationMs != null && (
                                <span className="text-xs text-muted-foreground font-mono">{step.durationMs}ms</span>
                              )}
                              {step.retryCount != null && step.retryCount > 0 && (
                                <Badge variant="outline" className="text-[10px]">
                                  <RotateCcw className="h-2.5 w-2.5 mr-0.5" />{step.retryCount}
                                </Badge>
                              )}
                            </div>

                            {isStepExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="ml-7 mb-2 p-3 rounded-md bg-muted/50 text-xs space-y-2"
                              >
                                {step.input && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Input:</span>
                                    <pre className="mt-1 font-mono text-[11px] bg-background p-2 rounded overflow-x-auto">
                                      {JSON.stringify(step.input, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {step.output && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Output:</span>
                                    <pre className="mt-1 font-mono text-[11px] bg-background p-2 rounded overflow-x-auto">
                                      {JSON.stringify(step.output, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {step.error && (
                                  <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded text-red-700 dark:text-red-300">
                                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                    <span>{step.error}</span>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
