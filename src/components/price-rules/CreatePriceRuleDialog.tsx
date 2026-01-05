/**
 * Create Price Rule Dialog
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePriceRule, useRuleTypeOptions, useApplyToOptions } from '@/hooks/usePriceRules';

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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle règle de prix</DialogTitle>
          <DialogDescription>Définissez une règle de tarification automatique</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Markup 30% fournisseur A" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type de règle</Label>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ruleTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Appliquer à</Label>
              <Select value={applyTo} onValueChange={setApplyTo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {applyToOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valeur (%)</Label>
              <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="30" />
            </div>
            <div>
              <Label>Priorité</Label>
              <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !value.trim() || createRule.isPending}>
            Créer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
