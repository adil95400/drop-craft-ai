/**
 * Workflow Sandbox - Mode test sécurisé pour workflows
 * Permet de tester sans affecter les données réelles
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Pause,
  RotateCcw,
  Bug,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertTriangle,
  ArrowRight,
  Terminal,
  Eye,
  Download,
  Settings2,
  FlaskConical
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SandboxStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
  logs: string[];
}

interface SandboxExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  steps: SandboxStep[];
  startedAt?: Date;
  completedAt?: Date;
  totalDuration?: number;
}

export function WorkflowSandbox() {
  const [execution, setExecution] = useState<SandboxExecution | null>(null);
  const [testInput, setTestInput] = useState('{\n  "product_id": "test-123",\n  "quantity": 5,\n  "price": 29.99\n}');
  const [activeTab, setActiveTab] = useState('input');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const sampleWorkflow = {
    id: 'sandbox-workflow',
    name: 'Test Workflow - Stock Alert',
    steps: [
      { id: '1', name: 'Vérifier le stock', type: 'condition' },
      { id: '2', name: 'Calculer le niveau critique', type: 'action' },
      { id: '3', name: 'Envoyer notification', type: 'action' },
      { id: '4', name: 'Mettre à jour la base', type: 'action' },
      { id: '5', name: 'Logger l\'événement', type: 'action' }
    ]
  };

  const simulateStep = useCallback((stepIndex: number): Promise<SandboxStep> => {
    return new Promise((resolve) => {
      const step = sampleWorkflow.steps[stepIndex];
      const duration = 500 + Math.random() * 1500;
      const success = Math.random() > 0.15; // 85% success rate

      setTimeout(() => {
        resolve({
          id: step.id,
          name: step.name,
          status: success ? 'success' : 'failed',
          duration: Math.round(duration),
          input: { stepIndex, timestamp: new Date().toISOString() },
          output: success ? { result: 'OK', processed: true } : undefined,
          error: success ? undefined : 'Simulated error for testing',
          logs: [
            `[${new Date().toISOString()}] Starting step: ${step.name}`,
            `[${new Date().toISOString()}] Processing...`,
            success 
              ? `[${new Date().toISOString()}] ✓ Step completed successfully`
              : `[${new Date().toISOString()}] ✗ Step failed: Simulated error`
          ]
        });
      }, duration);
    });
  }, []);

  const runSandbox = useCallback(async () => {
    setIsRunning(true);
    setActiveTab('execution');
    
    const newExecution: SandboxExecution = {
      id: crypto.randomUUID(),
      workflowId: sampleWorkflow.id,
      workflowName: sampleWorkflow.name,
      status: 'running',
      steps: sampleWorkflow.steps.map(s => ({
        id: s.id,
        name: s.name,
        status: 'pending' as const,
        logs: []
      })),
      startedAt: new Date()
    };
    
    setExecution(newExecution);
    setCurrentStep(0);

    let allSuccess = true;
    const updatedSteps: SandboxStep[] = [];

    for (let i = 0; i < sampleWorkflow.steps.length; i++) {
      setCurrentStep(i);
      
      // Mark current step as running
      setExecution(prev => prev ? {
        ...prev,
        steps: prev.steps.map((s, idx) => 
          idx === i ? { ...s, status: 'running' } : s
        )
      } : null);

      const result = await simulateStep(i);
      updatedSteps.push(result);

      setExecution(prev => prev ? {
        ...prev,
        steps: prev.steps.map((s, idx) => idx === i ? result : s)
      } : null);

      if (result.status === 'failed') {
        allSuccess = false;
        // Mark remaining steps as skipped
        for (let j = i + 1; j < sampleWorkflow.steps.length; j++) {
          updatedSteps.push({
            id: sampleWorkflow.steps[j].id,
            name: sampleWorkflow.steps[j].name,
            status: 'skipped',
            logs: [`[${new Date().toISOString()}] Step skipped due to previous failure`]
          });
        }
        break;
      }
    }

    const finalExecution: SandboxExecution = {
      ...newExecution,
      status: allSuccess ? 'completed' : 'failed',
      steps: allSuccess ? updatedSteps : [
        ...updatedSteps,
        ...sampleWorkflow.steps.slice(updatedSteps.length).map(s => ({
          id: s.id,
          name: s.name,
          status: 'skipped' as const,
          logs: []
        }))
      ],
      completedAt: new Date(),
      totalDuration: Date.now() - newExecution.startedAt!.getTime()
    };

    setExecution(finalExecution);
    setIsRunning(false);

    if (allSuccess) {
      toast.success('🧪 Sandbox: Workflow exécuté avec succès!');
    } else {
      toast.error('🧪 Sandbox: Workflow échoué - Vérifiez les logs');
    }
  }, [simulateStep]);

  const resetSandbox = () => {
    setExecution(null);
    setCurrentStep(0);
    setIsRunning(false);
    setActiveTab('input');
  };

  const getStatusIcon = (status: SandboxStep['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'skipped': return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />;
    }
  };

  const progress = execution 
    ? (execution.steps.filter(s => s.status !== 'pending').length / execution.steps.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <FlaskConical className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Mode Sandbox</h2>
            <p className="text-sm text-muted-foreground">
              Testez vos workflows en toute sécurité
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950">
          <Bug className="h-3 w-3" />
          Environnement de test
        </Badge>
      </div>

      <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>Mode Sandbox actif:</strong> Aucune donnée réelle ne sera modifiée. 
          Les actions sont simulées pour validation avant mise en production.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5" />
              Configuration du test
            </CardTitle>
            <CardDescription>
              Définissez les données d'entrée pour simuler l'exécution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="input">Données d'entrée</TabsTrigger>
                <TabsTrigger value="execution">Exécution</TabsTrigger>
              </TabsList>

              <TabsContent value="input" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">JSON d'entrée</label>
                  <Textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="font-mono text-sm h-40"
                    placeholder='{"key": "value"}'
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={runSandbox} 
                    disabled={isRunning}
                    className="flex-1"
                  >
                    {isRunning ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Exécution...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Lancer le test
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetSandbox}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="execution" className="space-y-4">
                {execution ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          execution.status === 'completed' ? 'default' :
                          execution.status === 'failed' ? 'destructive' :
                          execution.status === 'running' ? 'secondary' : 'outline'
                        }>
                          {execution.status === 'completed' && 'Succès'}
                          {execution.status === 'failed' && 'Échoué'}
                          {execution.status === 'running' && 'En cours'}
                          {execution.status === 'idle' && 'En attente'}
                        </Badge>
                        {execution.totalDuration && (
                          <span className="text-sm text-muted-foreground">
                            {(execution.totalDuration / 1000).toFixed(2)}s
                          </span>
                        )}
                      </div>
                    </div>

                    <Progress value={progress} className="h-2" />

                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        <AnimatePresence>
                          {execution.steps.map((step, index) => (
                            <motion.div
                              key={step.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border",
                                step.status === 'running' && "border-blue-300 bg-blue-50 dark:bg-blue-950/30",
                                step.status === 'success' && "border-green-300 bg-green-50 dark:bg-green-950/30",
                                step.status === 'failed' && "border-red-300 bg-red-50 dark:bg-red-950/30"
                              )}
                            >
                              {getStatusIcon(step.status)}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{step.name}</p>
                                {step.duration && (
                                  <p className="text-xs text-muted-foreground">{step.duration}ms</p>
                                )}
                              </div>
                              {step.error && (
                                <span className="text-xs text-red-600">{step.error}</span>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Lancez un test pour voir les résultats</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Logs Console */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Terminal className="h-5 w-5" />
              Console de logs
            </CardTitle>
            <CardDescription>
              Logs détaillés de l'exécution en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] bg-gray-900 rounded-lg p-4">
              <div className="font-mono text-xs text-green-400 space-y-1">
                {execution?.steps.flatMap(step => 
                  step.logs.map((log, i) => (
                    <div key={`${step.id}-${i}`} className={cn(
                      log.includes('✓') && 'text-green-400',
                      log.includes('✗') && 'text-red-400',
                      log.includes('Processing') && 'text-yellow-400'
                    )}>
                      {log}
                    </div>
                  ))
                )}
                {!execution && (
                  <div className="text-gray-500">
                    En attente de l'exécution...
                  </div>
                )}
                {isRunning && (
                  <div className="text-blue-400 animate-pulse">
                    ▌ Exécution en cours...
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {execution?.status === 'completed' || execution?.status === 'failed' ? (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter les logs
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir le détail
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
