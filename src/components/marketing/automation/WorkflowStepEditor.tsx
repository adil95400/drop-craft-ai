/**
 * Visual workflow step editor for marketing automation sequences.
 * Allows configuring delay, action type, and content per step.
 */
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Mail, Clock, MessageSquare, Bell, ArrowDown,
  Plus, Trash2, GripVertical, Zap, Filter, GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  id: string;
  type: 'email' | 'sms' | 'push' | 'delay' | 'condition';
  name: string;
  config: {
    delay_value?: number;
    delay_unit?: 'minutes' | 'hours' | 'days';
    subject?: string;
    content?: string;
    template_id?: string;
    condition_field?: string;
    condition_operator?: string;
    condition_value?: string;
  };
}

const STEP_ICONS = {
  email: Mail,
  sms: MessageSquare,
  push: Bell,
  delay: Clock,
  condition: GitBranch,
};

const STEP_COLORS = {
  email: 'border-info/30 bg-info/5',
  sms: 'border-success/30 bg-success/5',
  push: 'border-purple-500/30 bg-purple-500/5',
  delay: 'border-warning/30 bg-warning/5',
  condition: 'border-orange-500/30 bg-warning/5',
};

const STEP_LABELS = {
  email: 'Email',
  sms: 'SMS',
  push: 'Notification Push',
  delay: 'Délai',
  condition: 'Condition',
};

interface Props {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
  readOnly?: boolean;
}

export function WorkflowStepEditor({ steps, onChange, readOnly }: Props) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      type,
      name: STEP_LABELS[type],
      config: type === 'delay'
        ? { delay_value: 1, delay_unit: 'hours' }
        : type === 'email'
        ? { subject: '', content: '' }
        : {},
    };
    onChange([...steps, newStep]);
    setExpandedStep(newStep.id);
  };

  const removeStep = (id: string) => {
    onChange(steps.filter(s => s.id !== id));
    if (expandedStep === id) setExpandedStep(null);
  };

  const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
    onChange(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateStepConfig = (id: string, configUpdates: Partial<WorkflowStep['config']>) => {
    onChange(steps.map(s =>
      s.id === id ? { ...s, config: { ...s.config, ...configUpdates } } : s
    ));
  };

  return (
    <div className="space-y-2">
      {/* Trigger indicator */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Déclencheur</span>
        <Badge variant="secondary" className="text-xs">Configuré ci-dessus</Badge>
      </div>

      {steps.map((step, idx) => {
        const Icon = STEP_ICONS[step.type];
        const isExpanded = expandedStep === step.id;

        return (
          <div key={step.id}>
            {/* Connector line */}
            <div className="flex justify-center py-1">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Step card */}
            <Card
              className={cn(
                'border transition-all cursor-pointer',
                STEP_COLORS[step.type],
                isExpanded && 'ring-1 ring-primary/30'
              )}
              onClick={() => !readOnly && setExpandedStep(isExpanded ? null : step.id)}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  {!readOnly && (
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="p-1.5 rounded bg-background">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{step.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {step.type === 'delay'
                        ? `Attendre ${step.config.delay_value || 0} ${step.config.delay_unit === 'hours' ? 'heures' : step.config.delay_unit === 'days' ? 'jours' : 'minutes'}`
                        : step.type === 'email'
                        ? step.config.subject || 'Sans objet'
                        : step.type === 'condition'
                        ? `Si ${step.config.condition_field || '...'}`
                        : STEP_LABELS[step.type]}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Étape {idx + 1}
                  </Badge>
                  {!readOnly && (
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>

                {/* Expanded config */}
                {isExpanded && !readOnly && (
                  <div className="mt-4 pt-4 border-t space-y-3" onClick={e => e.stopPropagation()}>
                    <div>
                      <Label className="text-xs">Nom de l'étape</Label>
                      <Input
                        value={step.name}
                        onChange={e => updateStep(step.id, { name: e.target.value })}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>

                    {step.type === 'delay' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Durée</Label>
                          <Input
                            type="number" min={1}
                            value={step.config.delay_value || 1}
                            onChange={e => updateStepConfig(step.id, { delay_value: +e.target.value })}
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Unité</Label>
                          <Select
                            value={step.config.delay_unit || 'hours'}
                            onValueChange={v => updateStepConfig(step.id, { delay_unit: v as any })}
                          >
                            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minutes">Minutes</SelectItem>
                              <SelectItem value="hours">Heures</SelectItem>
                              <SelectItem value="days">Jours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {step.type === 'email' && (
                      <>
                        <div>
                          <Label className="text-xs">Objet</Label>
                          <Input
                            value={step.config.subject || ''}
                            onChange={e => updateStepConfig(step.id, { subject: e.target.value })}
                            placeholder="Objet de l'email..."
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Contenu</Label>
                          <Textarea
                            value={step.config.content || ''}
                            onChange={e => updateStepConfig(step.id, { content: e.target.value })}
                            placeholder="Corps de l'email (supporte {{variables}})..."
                            rows={4}
                            className="mt-1 text-sm"
                          />
                        </div>
                      </>
                    )}

                    {step.type === 'sms' && (
                      <div>
                        <Label className="text-xs">Message SMS</Label>
                        <Textarea
                          value={step.config.content || ''}
                          onChange={e => updateStepConfig(step.id, { content: e.target.value })}
                          placeholder="Message SMS (160 car. max)..."
                          rows={2} maxLength={160}
                          className="mt-1 text-sm"
                        />
                      </div>
                    )}

                    {step.type === 'condition' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Champ</Label>
                          <Select
                            value={step.config.condition_field || ''}
                            onValueChange={v => updateStepConfig(step.id, { condition_field: v })}
                          >
                            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email_opened">Email ouvert</SelectItem>
                              <SelectItem value="link_clicked">Lien cliqué</SelectItem>
                              <SelectItem value="order_placed">Commande passée</SelectItem>
                              <SelectItem value="cart_value">Valeur panier</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Opérateur</Label>
                          <Select
                            value={step.config.condition_operator || 'equals'}
                            onValueChange={v => updateStepConfig(step.id, { condition_operator: v })}
                          >
                            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Égal</SelectItem>
                              <SelectItem value="not_equals">Différent</SelectItem>
                              <SelectItem value="gt">Supérieur</SelectItem>
                              <SelectItem value="lt">Inférieur</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Valeur</Label>
                          <Input
                            value={step.config.condition_value || ''}
                            onChange={e => updateStepConfig(step.id, { condition_value: e.target.value })}
                            placeholder="true"
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        );
      })}

      {/* Add step buttons */}
      {!readOnly && (
        <>
          {steps.length > 0 && (
            <div className="flex justify-center py-1">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {(['email', 'delay', 'sms', 'push', 'condition'] as const).map(type => {
              const Icon = STEP_ICONS[type];
              return (
                <Button
                  key={type} variant="outline" size="sm"
                  onClick={() => addStep(type)}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  <Icon className="h-3 w-3" />
                  {STEP_LABELS[type]}
                </Button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
