import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useCreateRepricingRule, 
  useUpdateRepricingRule,
  type PricingRule 
} from '@/hooks/useRepricingEngine';

const formSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  rule_type: z.string(),
  target_margin: z.coerce.number().min(0).max(100).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  priority: z.coerce.number().min(0).max(100).default(50),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface RepricingRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule?: PricingRule | null;
}

export function RepricingRuleForm({ open, onOpenChange, editingRule }: RepricingRuleFormProps) {
  const createRule = useCreateRepricingRule();
  const updateRule = useUpdateRepricingRule();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingRule?.name || '',
      description: editingRule?.description || '',
      rule_type: editingRule?.rule_type || 'target_margin',
      target_margin: editingRule?.target_margin || 30,
      min_price: editingRule?.min_price || undefined,
      max_price: editingRule?.max_price || undefined,
      priority: editingRule?.priority || 50,
      is_active: editingRule?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (editingRule) {
      form.reset({
        name: editingRule.name,
        description: editingRule.description || '',
        rule_type: editingRule.rule_type || 'target_margin',
        target_margin: editingRule.target_margin || 30,
        min_price: editingRule.min_price || undefined,
        max_price: editingRule.max_price || undefined,
        priority: editingRule.priority || 50,
        is_active: editingRule.is_active ?? true,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        rule_type: 'target_margin',
        target_margin: 30,
        min_price: undefined,
        max_price: undefined,
        priority: 50,
        is_active: true,
      });
    }
  }, [editingRule, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (editingRule) {
        await updateRule.mutateAsync({ 
          id: editingRule.id, 
          updates: data 
        });
      } else {
        await createRule.mutateAsync({ ...data, name: data.name });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const ruleType = form.watch('rule_type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? 'Modifier la règle' : 'Nouvelle règle de repricing'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la règle</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Marge 30% catégorie Tech" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez le fonctionnement de cette règle..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rule_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de stratégie</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une stratégie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixed_margin">Marge Fixe</SelectItem>
                      <SelectItem value="target_margin">Marge Cible</SelectItem>
                      <SelectItem value="competitive">Prix Compétitif</SelectItem>
                      <SelectItem value="dynamic">Dynamique (stock)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {ruleType === 'fixed_margin' && 'Applique une marge fixe sur le coût'}
                    {ruleType === 'target_margin' && 'Ajuste le prix pour atteindre la marge cible'}
                    {ruleType === 'competitive' && 'Aligne les prix sur la concurrence'}
                    {ruleType === 'dynamic' && 'Ajuste selon le niveau de stock'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target_margin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marge cible (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité (0-100)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix minimum (€)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix maximum (€)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Règle active</FormLabel>
                    <FormDescription>
                      Activer immédiatement cette règle
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createRule.isPending || updateRule.isPending}
              >
                {editingRule ? 'Mettre à jour' : 'Créer la règle'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
