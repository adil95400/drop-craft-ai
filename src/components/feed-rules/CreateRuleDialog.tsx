/**
 * Create/Edit Rule Dialog
 * Formulaire de création et édition des règles if/then
 */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCreateFeedRule, useUpdateFeedRule, useFieldOptions, useActionOptions } from '@/hooks/useFeedRules';
import { FeedRule, RuleCondition, RuleAction, FeedRulesService } from '@/services/FeedRulesService';

interface CreateRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRule?: FeedRule | null;
  onClose?: () => void;
}

export function CreateRuleDialog({ open, onOpenChange, editRule, onClose }: CreateRuleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [matchType, setMatchType] = useState<'all' | 'any'>('all');
  const [conditions, setConditions] = useState<RuleCondition[]>([
    { field: 'price', operator: 'less_than', value: 10 }
  ]);
  const [actions, setActions] = useState<RuleAction[]>([
    { type: 'exclude', reason: '' }
  ]);

  const createRule = useCreateFeedRule();
  const updateRule = useUpdateFeedRule();
  const fieldOptions = useFieldOptions();
  const actionOptions = useActionOptions();

  useEffect(() => {
    if (editRule) {
      setName(editRule.name);
      setDescription(editRule.description || '');
      setMatchType(editRule.match_type);
      setConditions(editRule.conditions);
      setActions(editRule.actions);
    } else {
      resetForm();
    }
  }, [editRule]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setMatchType('all');
    setConditions([{ field: 'price', operator: 'less_than', value: 10 }]);
    setActions([{ type: 'exclude', reason: '' }]);
  };

  const handleClose = () => {
    onOpenChange(false);
    onClose?.();
    resetForm();
  };

  const handleSubmit = async () => {
    if (!name.trim() || conditions.length === 0 || actions.length === 0) return;

    if (editRule) {
      await updateRule.mutateAsync({
        ruleId: editRule.id,
        updates: {
          name,
          description,
          match_type: matchType,
          conditions,
          actions,
        },
      });
    } else {
      await createRule.mutateAsync({
        name,
        description,
        conditions,
        actions,
        match_type: matchType,
      });
    }

    handleClose();
  };

  const addCondition = () => {
    setConditions([...conditions, { field: 'title', operator: 'contains', value: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setConditions(conditions.map((c, i) => i === index ? { ...c, ...updates } : c));
  };

  const addAction = () => {
    setActions([...actions, { type: 'set_field', field: 'title', value: '' }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    setActions(actions.map((a, i) => i === index ? { ...a, ...updates } : a));
  };

  const getOperators = (field: string) => {
    const fieldDef = fieldOptions.find(f => f.value === field);
    return FeedRulesService.getOperatorOptions(fieldDef?.type || 'string');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editRule ? 'Modifier la règle' : 'Nouvelle règle'}</DialogTitle>
          <DialogDescription>
            Définissez les conditions et actions pour transformer vos produits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de la règle</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Exclure prix < 10€"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de la règle..."
                rows={2}
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>SI</Label>
                <Select value={matchType} onValueChange={(v) => setMatchType(v as 'all' | 'any')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="any">Au moins une</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">conditions sont vraies</span>
              </div>
              <Button size="sm" variant="outline" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-1" />
                Condition
              </Button>
            </div>

            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                  <Select
                    value={condition.field}
                    onValueChange={(v) => updateCondition(index, { field: v })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(v) => updateCondition(index, { operator: v })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getOperators(condition.field).map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                    <Input
                      value={String(condition.value || '')}
                      onChange={(e) => updateCondition(index, { 
                        value: fieldOptions.find(f => f.value === condition.field)?.type === 'number' 
                          ? Number(e.target.value) 
                          : e.target.value 
                      })}
                      placeholder="Valeur"
                      className="flex-1"
                    />
                  )}

                  {conditions.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCondition(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>ALORS</Label>
              <Button size="sm" variant="outline" onClick={addAction}>
                <Plus className="h-4 w-4 mr-1" />
                Action
              </Button>
            </div>

            <div className="space-y-2 pl-4 border-l-2 border-green-500/20">
              {actions.map((action, index) => {
                const actionDef = actionOptions.find(a => a.value === action.type);
                const isPricingAction = ['apply_margin', 'percentage_adjust', 'round_psychological', 'set_compare_at_price', 'min_price', 'max_price'].includes(action.type);
                
                return (
                  <div key={index} className={`flex items-center gap-2 p-2 rounded-lg ${isPricingAction ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-green-500/5'}`}>
                    <Select
                      value={action.type}
                      onValueChange={(v) => updateAction(index, { type: v })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__feed_header" disabled className="font-semibold text-xs text-muted-foreground">— Feed —</SelectItem>
                        {actionOptions.filter(a => (a as any).category === 'feed').map((a) => (
                          <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                        ))}
                        <SelectItem value="__content_header" disabled className="font-semibold text-xs text-muted-foreground">— Contenu —</SelectItem>
                        {actionOptions.filter(a => (a as any).category === 'content').map((a) => (
                          <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                        ))}
                        <SelectItem value="__pricing_header" disabled className="font-semibold text-xs text-muted-foreground">— Dynamic Pricing —</SelectItem>
                        {actionOptions.filter(a => (a as any).category === 'pricing').map((a) => (
                          <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {actionDef?.requiresField && (
                      <>
                        <Select
                          value={action.field || ''}
                          onValueChange={(v) => updateAction(index, { field: v })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Champ" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.map((f) => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {action.type === 'modify_field' && (
                          <Select
                            value={action.operation || 'multiply'}
                            onValueChange={(v) => updateAction(index, { operation: v })}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiply">× Multiplier</SelectItem>
                              <SelectItem value="divide">÷ Diviser</SelectItem>
                              <SelectItem value="add">+ Ajouter</SelectItem>
                              <SelectItem value="subtract">- Soustraire</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </>
                    )}

                    {action.type === 'round_psychological' ? (
                      <Select
                        value={String(action.value || '99')}
                        onValueChange={(v) => updateAction(index, { value: v })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="99">.99 (ex: 19,99€)</SelectItem>
                          <SelectItem value="95">.95 (ex: 19,95€)</SelectItem>
                          <SelectItem value="90">.90 (ex: 19,90€)</SelectItem>
                          <SelectItem value="00">.00 (arrondi sup.)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={String(action.value || action.reason || '')}
                        onChange={(e) => updateAction(index, { 
                          [action.type === 'exclude' ? 'reason' : 'value']: e.target.value 
                        })}
                        placeholder={
                          action.type === 'exclude' ? 'Raison (optionnel)' :
                          action.type === 'apply_margin' ? 'Marge % (ex: 40)' :
                          action.type === 'percentage_adjust' ? '% (+10 ou -15)' :
                          action.type === 'set_compare_at_price' ? 'Markup % (ex: 20)' :
                          action.type === 'min_price' ? 'Prix min (ex: 5.99)' :
                          action.type === 'max_price' ? 'Prix max (ex: 99.99)' :
                          'Valeur'
                        }
                        type={isPricingAction ? 'number' : 'text'}
                        className="flex-1"
                      />
                    )}

                    {actions.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeAction(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Aperçu de la règle:</p>
            <p className="text-sm text-muted-foreground">
              Si{' '}
              <Badge variant="outline">{matchType === 'all' ? 'toutes' : 'au moins une'}</Badge>
              {' '}des {conditions.length} condition(s) sont vraies, alors exécuter{' '}
              <Badge variant="secondary">{actions.length} action(s)</Badge>
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!name.trim() || createRule.isPending || updateRule.isPending}
          >
            {editRule ? 'Mettre à jour' : 'Créer la règle'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
