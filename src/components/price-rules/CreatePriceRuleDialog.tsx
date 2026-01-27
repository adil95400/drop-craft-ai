/**
 * Create Price Rule Dialog - Channable Design
 */
import { useState } from 'react';
import { ChannableModal, ChannableFormField } from '@/components/channable/ChannableModal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePriceRule, useRuleTypeOptions, useApplyToOptions } from '@/hooks/usePriceRules';
import { DollarSign } from 'lucide-react';

interface CreatePriceRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePriceRuleDialog({ open, onOpenChange }: CreatePriceRuleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState('markup');
  const [applyTo, setApplyTo] = useState('all');
  const [value, setValue] = useState('');
  const [priority, setPriority] = useState('0');

  const createRule = useCreatePriceRule();
  const ruleTypeOptions = useRuleTypeOptions();
  const applyToOptions = useApplyToOptions();

  const handleClose = () => {
    onOpenChange(false);
    setName(''); setDescription(''); setRuleType('markup'); setApplyTo('all'); setValue(''); setPriority('0');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !value.trim()) return;
    await createRule.mutateAsync({
      name,
      description,
      rule_type: ruleType as 'markup' | 'margin' | 'fixed' | 'rounding' | 'competitive' | 'tiered',
      apply_to: applyTo as 'all' | 'category' | 'supplier' | 'tag' | 'sku_pattern',
      priority: parseInt(priority) || 0,
      calculation: { type: 'percentage', value: parseFloat(value) || 0 },
    });
    handleClose();
  };

  return (
    <ChannableModal
      open={open}
      onOpenChange={handleClose}
      title="Nouvelle règle de prix"
      description="Définissez une règle de tarification automatique pour optimiser vos marges"
      icon={DollarSign}
      variant="premium"
      size="lg"
      onSubmit={handleSubmit}
      submitLabel="Créer la règle"
      isSubmitting={createRule.isPending}
      submitDisabled={!name.trim() || !value.trim()}
    >
      <div className="space-y-4">
        <ChannableFormField label="Nom de la règle" required>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Ex: Markup 30% fournisseur A"
            className="bg-background"
          />
        </ChannableFormField>

        <ChannableFormField label="Description" hint="Optionnel - Décrivez l'objectif de cette règle">
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Description de la règle..." 
            rows={2}
            className="bg-background resize-none"
          />
        </ChannableFormField>

        <div className="grid grid-cols-2 gap-4">
          <ChannableFormField label="Type de règle">
            <Select value={ruleType} onValueChange={setRuleType}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-popover">
                {ruleTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ChannableFormField>

          <ChannableFormField label="Appliquer à">
            <Select value={applyTo} onValueChange={setApplyTo}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-popover">
                {applyToOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ChannableFormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ChannableFormField label="Valeur (%)" required>
            <Input 
              type="number" 
              value={value} 
              onChange={(e) => setValue(e.target.value)} 
              placeholder="30"
              className="bg-background"
            />
          </ChannableFormField>

          <ChannableFormField label="Priorité" hint="Plus élevé = appliqué en premier">
            <Input 
              type="number" 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)} 
              placeholder="0"
              className="bg-background"
            />
          </ChannableFormField>
        </div>
      </div>
    </ChannableModal>
  );
}
