import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Zap, Truck, Mail, Printer, Package, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  name: string;
  conditions: {
    trigger: string;
    carrier_selection: string;
  };
  actions: {
    auto_label: boolean;
    auto_print: boolean;
    auto_notify: boolean;
  };
  is_active: boolean;
}

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function FulfillmentAutomation() {
  const queryClient = useQueryClient();
  
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['fulfillment-automation-rules'],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('fulfilment_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((rule: any) => ({
        id: rule.id,
        name: rule.name,
        conditions: rule.conditions || { trigger: 'paid', carrier_selection: 'cheapest' },
        actions: rule.actions || { auto_label: true, auto_print: false, auto_notify: true },
        is_active: rule.is_active
      })) as AutomationRule[];
    }
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: Omit<AutomationRule, 'id'>) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const { error } = await supabase
        .from('fulfilment_rules')
        .insert([{
          user_id: user.id,
          name: data.name,
          conditions: data.conditions,
          actions: data.actions,
          is_active: data.is_active
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-automation-rules'] });
      toast.success('Règle créée');
    },
    onError: (err: Error) => toast.error(err.message)
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AutomationRule> & { id: string }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const { error } = await supabase
        .from('fulfilment_rules')
        .update({
          name: data.name,
          conditions: data.conditions,
          actions: data.actions,
          is_active: data.is_active
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-automation-rules'] });
      toast.success('Règle mise à jour');
    },
    onError: (err: Error) => toast.error(err.message)
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      const { error } = await supabase
        .from('fulfilment_rules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-automation-rules'] });
      toast.success('Règle supprimée');
    },
    onError: (err: Error) => toast.error(err.message)
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger: 'paid',
    carrier_selection: 'cheapest',
    auto_label: true,
    auto_print: false,
    auto_notify: true
  });
  
  const triggerLabels: Record<string, string> = {
    paid: 'Commande payée',
    confirmed: 'Commande confirmée',
    processing: 'En traitement'
  };
  
  const selectionLabels: Record<string, string> = {
    cheapest: 'Moins cher',
    fastest: 'Plus rapide',
    preferred: 'Préféré',
    rules_based: 'Selon règles'
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const ruleData = {
      name: formData.name,
      conditions: {
        trigger: formData.trigger,
        carrier_selection: formData.carrier_selection
      },
      actions: {
        auto_label: formData.auto_label,
        auto_print: formData.auto_print,
        auto_notify: formData.auto_notify
      },
      is_active: true
    };
    
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, ...ruleData });
    } else {
      createMutation.mutate(ruleData);
    }
    
    setIsDialogOpen(false);
    setEditingRule(null);
    setFormData({
      name: '',
      trigger: 'paid',
      carrier_selection: 'cheapest',
      auto_label: true,
      auto_print: false,
      auto_notify: true
    });
  };
  
  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      trigger: rule.conditions?.trigger || 'paid',
      carrier_selection: rule.conditions?.carrier_selection || 'cheapest',
      auto_label: rule.actions?.auto_label ?? true,
      auto_print: rule.actions?.auto_print ?? false,
      auto_notify: rule.actions?.auto_notify ?? true
    });
    setIsDialogOpen(true);
  };
  
  const toggleRule = (rule: AutomationRule) => {
    updateMutation.mutate({ id: rule.id, is_active: !rule.is_active });
  };
  
  const deleteRule = (id: string) => {
    if (confirm('Supprimer cette règle ?')) {
      deleteMutation.mutate(id);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Automatisation des expéditions</h3>
            <p className="text-sm text-muted-foreground">
              Configurez des règles pour automatiser la sélection du transporteur, la génération d'étiquettes et les notifications
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Rules List */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Règles d'automatisation ({rules.length})</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingRule(null);
            setFormData({
              name: '',
              trigger: 'paid',
              carrier_selection: 'cheapest',
              auto_label: true,
              auto_print: false,
              auto_notify: true
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-background border-border shadow-2xl">
            <DialogHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {editingRule ? 'Modifier la règle' : 'Nouvelle règle d\'automatisation'}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Configurez le déclenchement et les actions automatiques
                  </p>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              {/* Nom de la règle */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Nom de la règle
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Commandes France standard"
                  className="h-11 bg-muted/30 border-border focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              
              {/* Configuration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Déclencheur
                  </Label>
                  <Select
                    value={formData.trigger}
                    onValueChange={(value) => setFormData({ ...formData, trigger: value })}
                  >
                    <SelectTrigger className="h-11 bg-muted/30 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="paid">Commande payée</SelectItem>
                      <SelectItem value="confirmed">Commande confirmée</SelectItem>
                      <SelectItem value="processing">En traitement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-500" />
                    Sélection transporteur
                  </Label>
                  <Select
                    value={formData.carrier_selection}
                    onValueChange={(value) => setFormData({ ...formData, carrier_selection: value })}
                  >
                    <SelectTrigger className="h-11 bg-muted/30 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="cheapest">Le moins cher</SelectItem>
                      <SelectItem value="fastest">Le plus rapide</SelectItem>
                      <SelectItem value="preferred">Transporteur préféré</SelectItem>
                      <SelectItem value="rules_based">Selon règles personnalisées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Actions automatiques */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Actions automatiques
                </Label>
                <div className="bg-muted/20 rounded-xl p-4 space-y-4 border border-border/50">
                  <div className="flex items-center justify-between group hover:bg-muted/30 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <Label className="font-medium cursor-pointer">Générer l'étiquette</Label>
                        <p className="text-xs text-muted-foreground">Création automatique à l'expédition</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.auto_label}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_label: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between group hover:bg-muted/30 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Printer className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <Label className="font-medium cursor-pointer">Imprimer automatiquement</Label>
                        <p className="text-xs text-muted-foreground">Envoi direct à l'imprimante</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.auto_print}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_print: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between group hover:bg-muted/30 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Mail className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <Label className="font-medium cursor-pointer">Notifier le client</Label>
                        <p className="text-xs text-muted-foreground">Email avec suivi d'expédition</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.auto_notify}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_notify: checked })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="px-6"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isMutating || !formData.name.trim()}
                  className="px-6 bg-primary hover:bg-primary/90"
                >
                  {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingRule ? 'Mettre à jour' : 'Créer la règle'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Aucune règle configurée</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez des règles pour automatiser vos expéditions
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une règle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => {
            const trigger = rule.conditions?.trigger || 'paid';
            const carrierSelection = rule.conditions?.carrier_selection || 'cheapest';
            const autoLabel = rule.actions?.auto_label ?? false;
            const autoPrint = rule.actions?.auto_print ?? false;
            const autoNotify = rule.actions?.auto_notify ?? false;
            
            return (
              <Card key={rule.id} className={rule.is_active ? '' : 'opacity-60'}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {triggerLabels[trigger] || trigger}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {selectionLabels[carrierSelection] || carrierSelection}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className={autoLabel ? 'text-green-600' : ''}>
                          {autoLabel ? '✓' : '✗'} Étiquette auto
                        </span>
                        <span className={autoPrint ? 'text-green-600' : ''}>
                          {autoPrint ? '✓' : '✗'} Impression auto
                        </span>
                        <span className={autoNotify ? 'text-green-600' : ''}>
                          {autoNotify ? '✓' : '✗'} Notification client
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRule(rule)}
                        disabled={isMutating}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)} disabled={isMutating}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteRule(rule.id)} disabled={isMutating}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
