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
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nom du workflow</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Alerte stock faible"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez ce que fait ce workflow..."
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TriggerIcon className="h-5 w-5" />
            Déclencheur
          </CardTitle>
          <CardDescription>Qu'est-ce qui déclenche ce workflow ?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Type de déclencheur</Label>
            <Select value={triggerType} onValueChange={(value: any) => setTriggerType(value)}>
              <SelectTrigger>
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
            <div>
              <Label>Seuil</Label>
              <Input
                type="number"
                value={triggerConfig.threshold || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, threshold: parseInt(e.target.value) })}
                placeholder="Ex: 10"
              />
            </div>
          )}

          {triggerType === 'time' && (
            <div>
              <Label>Fréquence</Label>
              <Select
                value={triggerConfig.frequency || ''}
                onValueChange={(value) => setTriggerConfig({ ...triggerConfig, frequency: value })}
              >
                <SelectTrigger>
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Étapes</h3>
            <p className="text-sm text-muted-foreground">Que doit faire le workflow ?</p>
          </div>
          <Button onClick={handleAddStep} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une étape
          </Button>
        </div>

        {steps.map((step, index) => {
          const selectedStep = STEP_TYPES.find(s => s.value === step.type);
          const StepIcon = selectedStep?.icon || Zap;

          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StepIcon className="h-5 w-5" />
                    <CardTitle className="text-base">Étape {index + 1}</CardTitle>
                  </div>
                  {steps.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStep(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Type d'étape</Label>
                  <Select
                    value={step.type}
                    onValueChange={(value) => handleStepChange(index, 'type', value)}
                  >
                    <SelectTrigger>
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
                  <div>
                    <Label>Action</Label>
                    <Input
                      value={step.config?.action_type || ''}
                      onChange={(e) => handleStepChange(index, 'action_type', e.target.value)}
                      placeholder="Type d'action (ex: reorder, notify)"
                    />
                  </div>
                )}

                {step.type === 'condition' && (
                  <div>
                    <Label>Condition</Label>
                    <Input
                      value={step.config?.condition_type || ''}
                      onChange={(e) => handleStepChange(index, 'condition_type', e.target.value)}
                      placeholder="Type de condition (ex: stock_level)"
                    />
                  </div>
                )}

                {step.type === 'delay' && (
                  <div>
                    <Label>Durée (ms)</Label>
                    <Input
                      type="number"
                      value={step.config?.duration_ms || ''}
                      onChange={(e) => handleStepChange(index, 'duration_ms', parseInt(e.target.value))}
                      placeholder="1000"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSave}>
          Enregistrer le workflow
        </Button>
      </div>
    </div>
  );
}
