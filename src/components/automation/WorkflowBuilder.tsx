import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AutomationWorkflow, AutomationStep } from "@/services/automation/AutomationEngine";
import { Plus, Trash2, Zap, Clock, Mail, Database, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface WorkflowBuilderProps {
  workflow?: AutomationWorkflow | null;
  onSave: (workflow: AutomationWorkflow) => void;
  onCancel: () => void;
}

const TRIGGER_TYPES = [
  { value: 'event', label: 'Événement', icon: ShoppingCart },
  { value: 'condition', label: 'Condition', icon: Database },
  { value: 'time', label: 'Programmation', icon: Clock },
];

const STEP_TYPES = [
  { value: 'action', label: 'Action', icon: Zap },
  { value: 'condition', label: 'Condition', icon: Database },
  { value: 'delay', label: 'Délai', icon: Clock },
];

export function WorkflowBuilder({ workflow, onSave, onCancel }: WorkflowBuilderProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [triggerType, setTriggerType] = useState<'time' | 'event' | 'condition'>(workflow?.trigger_type || 'event');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>(
    workflow?.trigger_config || {}
  );
  const [steps, setSteps] = useState<Array<Partial<AutomationStep>>>(
    workflow?.steps || [{ type: 'action' as const, config: {}, order: 1 }]
  );

  const handleAddStep = () => {
    setSteps([...steps, { type: 'action' as const, config: {}, order: steps.length + 1 }]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index).map((step, idx) => ({
      ...step,
      order: idx + 1
    }));
    setSteps(newSteps);
  };

  const handleStepChange = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    if (field === 'type') {
      newSteps[index].type = value;
    } else {
      newSteps[index].config = { ...newSteps[index].config, [field]: value };
    }
    setSteps(newSteps);
  };

  const handleSave = () => {
    if (!name || !triggerType || steps.some(s => !s.type)) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }

    const newWorkflow: AutomationWorkflow = {
      id: workflow?.id || crypto.randomUUID(),
      name,
      description,
      trigger_type: triggerType,
      trigger_config: triggerConfig,
      steps: steps.map((step, idx) => ({
        id: step.id || crypto.randomUUID(),
        type: step.type!,
        config: step.config || {},
        order: idx + 1
      })),
      status: workflow?.status || 'active',
      user_id: workflow?.user_id || '',
      created_at: workflow?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      execution_count: workflow?.execution_count || 0,
      success_count: workflow?.success_count || 0,
      failure_count: workflow?.failure_count || 0
    };

    onSave(newWorkflow);
  };

  const selectedTrigger = TRIGGER_TYPES.find(t => t.value === triggerType);
  const TriggerIcon = selectedTrigger?.icon || Zap;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-4 sm:space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm">Nom du workflow</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Alerte stock faible"
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez ce que fait ce workflow..."
            className="min-h-[100px]"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TriggerIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Déclencheur
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Qu'est-ce qui déclenche ce workflow ?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Type de déclencheur</Label>
            <Select value={triggerType} onValueChange={(value: any) => setTriggerType(value)}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Sélectionner un déclencheur" />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map((trigger) => {
                  const Icon = trigger.icon;
                  return (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {trigger.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {triggerType === 'condition' && (
            <div className="space-y-2">
              <Label className="text-sm">Seuil</Label>
              <Input
                type="number"
                value={triggerConfig.threshold || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, threshold: parseInt(e.target.value) })}
                placeholder="Ex: 10"
                className="min-h-[44px]"
              />
            </div>
          )}

          {triggerType === 'time' && (
            <div className="space-y-2">
              <Label className="text-sm">Fréquence</Label>
              <Select
                value={triggerConfig.frequency || ''}
                onValueChange={(value) => setTriggerConfig({ ...triggerConfig, frequency: value })}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Sélectionner une fréquence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Toutes les heures</SelectItem>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className={cn(
          'flex gap-3',
          isMobile ? 'flex-col' : 'items-center justify-between'
        )}>
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Étapes</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Que doit faire le workflow ?</p>
          </div>
          <Button onClick={handleAddStep} variant="outline" size="sm" className="min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une étape
          </Button>
        </div>

        {steps.map((step, index) => {
          const selectedStep = STEP_TYPES.find(s => s.value === step.type);
          const StepIcon = selectedStep?.icon || Zap;

          return (
            <Card key={index}>
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <CardTitle className="text-sm sm:text-base">Étape {index + 1}</CardTitle>
                  </div>
                  {steps.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStep(index)}
                      className="h-11 w-11 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Type d'étape</Label>
                  <Select
                    value={step.type}
                    onValueChange={(value) => handleStepChange(index, 'type', value)}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {STEP_TYPES.map((stepType) => {
                        const Icon = stepType.icon;
                        return (
                          <SelectItem key={stepType.value} value={stepType.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {stepType.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {step.type === 'action' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Action</Label>
                    <Input
                      value={step.config?.action_type || ''}
                      onChange={(e) => handleStepChange(index, 'action_type', e.target.value)}
                      placeholder="Type d'action (ex: reorder, notify)"
                      className="min-h-[44px]"
                    />
                  </div>
                )}

                {step.type === 'condition' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Condition</Label>
                    <Input
                      value={step.config?.condition_type || ''}
                      onChange={(e) => handleStepChange(index, 'condition_type', e.target.value)}
                      placeholder="Type de condition (ex: stock_level)"
                      className="min-h-[44px]"
                    />
                  </div>
                )}

                {step.type === 'delay' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Durée (ms)</Label>
                    <Input
                      type="number"
                      value={step.config?.duration_ms || ''}
                      onChange={(e) => handleStepChange(index, 'duration_ms', parseInt(e.target.value))}
                      placeholder="1000"
                      className="min-h-[44px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className={cn(
        'flex gap-3 pt-4 border-t',
        isMobile ? 'flex-col-reverse' : 'justify-end'
      )}>
        <Button 
          variant="outline" 
          onClick={onCancel}
          className={cn('min-h-[44px]', isMobile && 'w-full')}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSave}
          className={cn('min-h-[44px]', isMobile && 'w-full')}
        >
          Enregistrer le workflow
        </Button>
      </div>
    </div>
  );
}
