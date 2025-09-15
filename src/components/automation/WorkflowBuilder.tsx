import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Play, 
  Save, 
  Trash2, 
  Move, 
  Settings, 
  Zap,
  Mail,
  Package,
  Bell,
  Brain,
  Clock,
  GitBranch,
  Workflow,
  CheckCircle
} from 'lucide-react';
import { logError } from '@/utils/consoleCleanup';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  delay?: number;
}

interface WorkflowTrigger {
  type: string;
  name: string;
  config: Record<string, any>;
}

export function WorkflowBuilder() {
  const [workflow, setWorkflow] = useState({
    name: '',
    description: '',
    triggers: [] as WorkflowTrigger[],
    steps: [] as WorkflowStep[],
    status: 'draft'
  });
  
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const stepTypes = [
    { 
      type: 'send_email', 
      name: 'Envoyer Email', 
      icon: Mail, 
      description: 'Envoyer un email automatisé',
      color: 'text-blue-600'
    },
    { 
      type: 'update_product', 
      name: 'Mettre à jour Produit', 
      icon: Package, 
      description: 'Modifier les données produit',
      color: 'text-green-600'
    },
    { 
      type: 'create_notification', 
      name: 'Créer Notification', 
      icon: Bell, 
      description: 'Générer une notification système',
      color: 'text-yellow-600'
    },
    { 
      type: 'ai_analysis', 
      name: 'Analyse IA', 
      icon: Brain, 
      description: 'Effectuer une analyse intelligente',
      color: 'text-purple-600'
    },
    { 
      type: 'conditional', 
      name: 'Condition', 
      icon: GitBranch, 
      description: 'Évaluer une condition logique',
      color: 'text-orange-600'
    },
    { 
      type: 'delay', 
      name: 'Délai', 
      icon: Clock, 
      description: 'Attendre avant la prochaine étape',
      color: 'text-gray-600'
    }
  ];

  const triggerTypes = [
    { type: 'order_status', name: 'Changement Statut Commande' },
    { type: 'product_update', name: 'Mise à jour Produit' },
    { type: 'customer_behavior', name: 'Comportement Client' },
    { type: 'inventory_level', name: 'Niveau Stock' },
    { type: 'time_based', name: 'Basé sur le Temps' },
    { type: 'manual', name: 'Déclenchement Manuel' }
  ];

  const addStep = useCallback((stepType: string) => {
    const stepTypeData = stepTypes.find(st => st.type === stepType);
    if (!stepTypeData) return;

    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      type: stepType,
      name: stepTypeData.name,
      config: getDefaultStepConfig(stepType)
    };

    setWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  }, [stepTypes]);

  const removeStep = useCallback((stepId: string) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }));
    setSelectedStep(null);
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  }, []);

  const addTrigger = useCallback((triggerType: string) => {
    const triggerTypeData = triggerTypes.find(tt => tt.type === triggerType);
    if (!triggerTypeData) return;

    const newTrigger: WorkflowTrigger = {
      type: triggerType,
      name: triggerTypeData.name,
      config: getDefaultTriggerConfig(triggerType)
    };

    setWorkflow(prev => ({
      ...prev,
      triggers: [...prev.triggers, newTrigger]
    }));
  }, [triggerTypes]);

  const saveWorkflow = async () => {
    if (!workflow.name.trim()) {
      toast.error('Veuillez saisir un nom pour le workflow');
      return;
    }

    if (workflow.steps.length === 0) {
      toast.error('Ajoutez au moins une étape au workflow');
      return;
    }

    setIsBuilding(true);

    try {
      const { data, error } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'create_workflow',
          name: workflow.name,
          description: workflow.description,
          triggers: workflow.triggers,
          actions: workflow.steps
        }
      });

      if (error) throw error;

      toast.success('Workflow créé avec succès !');
      
      // Reset form
      setWorkflow({
        name: '',
        description: '',
        triggers: [],
        steps: [],
        status: 'draft'
      });
      
    } catch (error) {
      logError(error as Error, 'Error saving workflow');
      toast.error('Erreur lors de la sauvegarde du workflow');
    } finally {
      setIsBuilding(false);
    }
  };

  const testWorkflow = async () => {
    if (workflow.steps.length === 0) {
      toast.error('Aucune étape à tester');
      return;
    }

    setIsTesting(true);

    try {
      // Create a temporary workflow for testing
      const testData = {
        action: 'create_workflow',
        name: `Test - ${workflow.name || 'Workflow'}`,
        description: 'Test workflow execution',
        triggers: workflow.triggers.length > 0 ? workflow.triggers : [{ type: 'manual', name: 'Test', config: {} }],
        actions: workflow.steps
      };

      const { data: createResult, error: createError } = await supabase.functions.invoke('automation-engine', {
        body: testData
      });

      if (createError) throw createError;

      // Execute the test workflow
      const { data: execResult, error: execError } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'execute_workflow',
          workflowId: createResult.workflow.id,
          inputData: { test: true, timestamp: new Date().toISOString() }
        }
      });

      if (execError) throw execError;

      toast.success(`Test réussi ! ${execResult.steps_executed} étapes exécutées`);

    } catch (error) {
      logError(error as Error, 'Error testing workflow');
      toast.error('Erreur lors du test du workflow');
    } finally {
      setIsTesting(false);
    }
  };

  function getDefaultStepConfig(stepType: string): Record<string, any> {
    switch (stepType) {
      case 'send_email':
        return {
          template: 'default',
          recipient: 'customer',
          subject: 'Notification automatique'
        };
      case 'update_product':
        return {
          product_id: '',
          updates: {}
        };
      case 'create_notification':
        return {
          type: 'info',
          message: 'Notification d\'automatisation'
        };
      case 'ai_analysis':
        return {
          analysis_type: 'product_optimization',
          include_recommendations: true
        };
      case 'conditional':
        return {
          condition: { field: '', operator: 'equals', value: '' },
          if_true: 'continue',
          if_false: 'stop'
        };
      case 'delay':
        return {
          delay: 60 // seconds
        };
      default:
        return {};
    }
  }

  function getDefaultTriggerConfig(triggerType: string): Record<string, any> {
    switch (triggerType) {
      case 'order_status':
        return { status: 'delivered' };
      case 'product_update':
        return { fields: ['price', 'stock'] };
      case 'customer_behavior':
        return { days_inactive: 30 };
      case 'inventory_level':
        return { threshold: 10 };
      case 'time_based':
        return { schedule: 'daily', time: '09:00' };
      default:
        return {};
    }
  }

  const renderStepConfig = (step: WorkflowStep) => {
    if (!selectedStep || selectedStep.id !== step.id) return null;

    switch (step.type) {
      case 'send_email':
        return (
          <div className="space-y-4">
            <div>
              <Label>Modèle d'email</Label>
              <Select 
                value={step.config.template} 
                onValueChange={(value) => updateStep(step.id, { 
                  config: { ...step.config, template: value } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Bienvenue</SelectItem>
                  <SelectItem value="order_confirmation">Confirmation Commande</SelectItem>
                  <SelectItem value="delivery_notification">Notification Livraison</SelectItem>
                  <SelectItem value="feedback_request">Demande d'Avis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destinataire</Label>
              <Select 
                value={step.config.recipient} 
                onValueChange={(value) => updateStep(step.id, { 
                  config: { ...step.config, recipient: value } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Client</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="custom">Email Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sujet</Label>
              <Input 
                value={step.config.subject || ''} 
                onChange={(e) => updateStep(step.id, { 
                  config: { ...step.config, subject: e.target.value } 
                })}
                placeholder="Sujet de l'email"
              />
            </div>
          </div>
        );

      case 'create_notification':
        return (
          <div className="space-y-4">
            <div>
              <Label>Type de notification</Label>
              <Select 
                value={step.config.type} 
                onValueChange={(value) => updateStep(step.id, { 
                  config: { ...step.config, type: value } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea 
                value={step.config.message || ''} 
                onChange={(e) => updateStep(step.id, { 
                  config: { ...step.config, message: e.target.value } 
                })}
                placeholder="Message de la notification"
              />
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <Label>Délai (en secondes)</Label>
              <Input 
                type="number"
                value={step.config.delay || 60} 
                onChange={(e) => updateStep(step.id, { 
                  config: { ...step.config, delay: parseInt(e.target.value) || 60 } 
                })}
                min="1"
                max="3600"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            Configuration avancée disponible pour ce type d'étape.
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Workflow Configuration */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Constructeur de Workflow
              </CardTitle>
              <CardDescription>
                Créez des workflows d'automatisation personnalisés
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testWorkflow}
                disabled={isTesting || workflow.steps.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                {isTesting ? 'Test...' : 'Tester'}
              </Button>
              <Button 
                size="sm" 
                onClick={saveWorkflow}
                disabled={isBuilding}
              >
                <Save className="h-4 w-4 mr-2" />
                {isBuilding ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workflow-name">Nom du Workflow</Label>
              <Input
                id="workflow-name"
                value={workflow.name}
                onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Mon workflow d'automatisation"
              />
            </div>
            <div>
              <Label htmlFor="workflow-status">Statut</Label>
              <Select 
                value={workflow.status} 
                onValueChange={(value) => setWorkflow(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="paused">En Pause</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="workflow-description">Description</Label>
            <Textarea
              id="workflow-description"
              value={workflow.description}
              onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description du workflow..."
            />
          </div>

          <Separator />

          {/* Triggers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Déclencheurs</h3>
              <Select onValueChange={addTrigger}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ajouter déclencheur" />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map(trigger => (
                    <SelectItem key={trigger.type} value={trigger.type}>
                      {trigger.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {workflow.triggers.length > 0 ? (
              <div className="space-y-2">
                {workflow.triggers.map((trigger, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <span className="flex-1">{trigger.name}</span>
                    <Badge variant="secondary">{trigger.type}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun déclencheur configuré</p>
                <p className="text-sm">Ajoutez un déclencheur pour activer le workflow</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Étapes du Workflow</h3>
              <div className="flex gap-2">
                {stepTypes.map(stepType => {
                  const Icon = stepType.icon;
                  return (
                    <Button
                      key={stepType.type}
                      variant="outline"
                      size="sm"
                      onClick={() => addStep(stepType.type)}
                      className="flex items-center gap-2"
                    >
                      <Icon className={`h-4 w-4 ${stepType.color}`} />
                      <span className="hidden sm:inline">{stepType.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {workflow.steps.length > 0 ? (
              <div className="space-y-3">
                {workflow.steps.map((step, index) => {
                  const stepTypeData = stepTypes.find(st => st.type === step.type);
                  const Icon = stepTypeData?.icon || Settings;
                  const isSelected = selectedStep?.id === step.id;

                  return (
                    <Card 
                      key={step.id} 
                      className={`transition-all cursor-pointer ${
                        isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedStep(isSelected ? null : step)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <Icon className={`h-5 w-5 ${stepTypeData?.color || 'text-gray-600'}`} />
                            <div>
                              <h4 className="font-medium">{step.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {stepTypeData?.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{step.type}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeStep(step.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="mt-4 pt-4 border-t">
                            {renderStepConfig(step)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Workflow vide</p>
                <p>Ajoutez des étapes pour construire votre workflow d'automatisation</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Library */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Bibliothèque d'Étapes
          </CardTitle>
          <CardDescription>
            Types d'étapes disponibles pour vos workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {stepTypes.map(stepType => {
                const Icon = stepType.icon;
                return (
                  <Card 
                    key={stepType.type}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => addStep(stepType.type)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${stepType.color}`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{stepType.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {stepType.description}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}