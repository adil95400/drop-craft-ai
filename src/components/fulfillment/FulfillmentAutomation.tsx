import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Zap, 
  Truck, 
  Mail, 
  Printer, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Globe,
  Clock,
  Tag,
  CheckCircle,
  AlertTriangle,
  FileText,
  MapPin,
  Euro,
  Weight,
  Box,
  ShoppingCart,
  Bell,
  ArrowRight,
  Sparkles,
  Copy,
  MoreVertical,
  Play,
  Pause,
  ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  conditions: {
    trigger: string;
    carrier_selection: string;
    country_filter?: string[];
    min_order_value?: number;
    max_weight?: number;
  };
  actions: {
    auto_label: boolean;
    auto_print: boolean;
    auto_notify: boolean;
    add_insurance: boolean;
    priority_processing: boolean;
  };
  is_active: boolean;
  priority?: number;
  execution_count?: number;
}

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Trigger options with icons and descriptions
const TRIGGER_OPTIONS = [
  { value: 'paid', label: 'Commande payée', icon: Euro, color: 'text-green-500', description: 'Dès que le paiement est confirmé' },
  { value: 'confirmed', label: 'Commande confirmée', icon: CheckCircle, color: 'text-blue-500', description: 'Après validation manuelle' },
  { value: 'processing', label: 'En traitement', icon: Clock, color: 'text-amber-500', description: 'Lors du passage en préparation' },
  { value: 'stock_ready', label: 'Stock disponible', icon: Box, color: 'text-purple-500', description: 'Quand le stock est vérifié' },
];

// Carrier selection options
const CARRIER_OPTIONS = [
  { value: 'cheapest', label: 'Le moins cher', icon: Euro, description: 'Optimise les coûts d\'expédition' },
  { value: 'fastest', label: 'Le plus rapide', icon: Zap, description: 'Priorité à la vitesse de livraison' },
  { value: 'preferred', label: 'Transporteur préféré', icon: Truck, description: 'Utilise votre transporteur par défaut' },
  { value: 'rules_based', label: 'Règles personnalisées', icon: Settings, description: 'Selon vos critères avancés' },
  { value: 'eco_friendly', label: 'Éco-responsable', icon: Globe, description: 'Priorité aux options durables' },
];

// Country presets
const COUNTRY_PRESETS = [
  { id: 'france', label: 'France métropolitaine', countries: ['FR'] },
  { id: 'europe', label: 'Union Européenne', countries: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'AT'] },
  { id: 'worldwide', label: 'Monde entier', countries: [] },
];

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
        description: rule.description,
        conditions: rule.conditions || { trigger: 'paid', carrier_selection: 'cheapest' },
        actions: rule.actions || { auto_label: true, auto_print: false, auto_notify: true, add_insurance: false, priority_processing: false },
        is_active: rule.is_active,
        priority: rule.priority || 1,
        execution_count: rule.execution_count || 0
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
          description: data.description,
          conditions: data.conditions,
          actions: data.actions,
          is_active: data.is_active,
          priority: data.priority
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-automation-rules'] });
      toast.success('Règle créée avec succès');
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
          description: data.description,
          conditions: data.conditions,
          actions: data.actions,
          is_active: data.is_active,
          priority: data.priority
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
  const [activeModalTab, setActiveModalTab] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'paid',
    carrier_selection: 'cheapest',
    country_preset: 'france',
    min_order_value: '',
    max_weight: '',
    auto_label: true,
    auto_print: false,
    auto_notify: true,
    add_insurance: false,
    priority_processing: false,
    priority: 1
  });
  
  const triggerLabels: Record<string, string> = {
    paid: 'Commande payée',
    confirmed: 'Commande confirmée',
    processing: 'En traitement',
    stock_ready: 'Stock disponible'
  };
  
  const selectionLabels: Record<string, string> = {
    cheapest: 'Moins cher',
    fastest: 'Plus rapide',
    preferred: 'Préféré',
    rules_based: 'Selon règles',
    eco_friendly: 'Éco-responsable'
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: 'paid',
      carrier_selection: 'cheapest',
      country_preset: 'france',
      min_order_value: '',
      max_weight: '',
      auto_label: true,
      auto_print: false,
      auto_notify: true,
      add_insurance: false,
      priority_processing: false,
      priority: 1
    });
    setActiveModalTab('general');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const countryPreset = COUNTRY_PRESETS.find(p => p.id === formData.country_preset);
    
    const ruleData = {
      name: formData.name,
      description: formData.description || undefined,
      conditions: {
        trigger: formData.trigger,
        carrier_selection: formData.carrier_selection,
        country_filter: countryPreset?.countries,
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : undefined,
        max_weight: formData.max_weight ? parseFloat(formData.max_weight) : undefined
      },
      actions: {
        auto_label: formData.auto_label,
        auto_print: formData.auto_print,
        auto_notify: formData.auto_notify,
        add_insurance: formData.add_insurance,
        priority_processing: formData.priority_processing
      },
      is_active: true,
      priority: formData.priority
    };
    
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, ...ruleData });
    } else {
      createMutation.mutate(ruleData);
    }
    
    setIsDialogOpen(false);
    setEditingRule(null);
    resetForm();
  };
  
  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    const countryPreset = COUNTRY_PRESETS.find(p => 
      JSON.stringify(p.countries) === JSON.stringify(rule.conditions?.country_filter)
    );
    
    setFormData({
      name: rule.name,
      description: rule.description || '',
      trigger: rule.conditions?.trigger || 'paid',
      carrier_selection: rule.conditions?.carrier_selection || 'cheapest',
      country_preset: countryPreset?.id || 'france',
      min_order_value: rule.conditions?.min_order_value?.toString() || '',
      max_weight: rule.conditions?.max_weight?.toString() || '',
      auto_label: rule.actions?.auto_label ?? true,
      auto_print: rule.actions?.auto_print ?? false,
      auto_notify: rule.actions?.auto_notify ?? true,
      add_insurance: rule.actions?.add_insurance ?? false,
      priority_processing: rule.actions?.priority_processing ?? false,
      priority: rule.priority || 1
    });
    setActiveModalTab('general');
    setIsDialogOpen(true);
  };
  
  const toggleRule = (rule: AutomationRule) => {
    updateMutation.mutate({ id: rule.id, is_active: !rule.is_active });
  };
  
  const duplicateRule = (rule: AutomationRule) => {
    createMutation.mutate({
      ...rule,
      name: `${rule.name} (copie)`,
      is_active: false
    });
  };
  
  const deleteRule = (id: string) => {
    if (confirm('Supprimer cette règle ?')) {
      deleteMutation.mutate(id);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  
  // Count active actions for summary
  const getActiveActionsCount = () => {
    let count = 0;
    if (formData.auto_label) count++;
    if (formData.auto_print) count++;
    if (formData.auto_notify) count++;
    if (formData.add_insurance) count++;
    if (formData.priority_processing) count++;
    return count;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des règles...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <Card className="border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-primary/20 backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Automatisation intelligente</h3>
              <p className="text-sm text-muted-foreground max-w-xl">
                Créez des règles pour automatiser la sélection du transporteur, la génération d'étiquettes et les notifications clients. Gagnez du temps et réduisez les erreurs.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="text-center px-4 py-2 rounded-lg bg-background/50 backdrop-blur-sm">
                <p className="text-2xl font-bold text-primary">{rules.length}</p>
                <p className="text-xs text-muted-foreground">Règles</p>
              </div>
              <div className="text-center px-4 py-2 rounded-lg bg-background/50 backdrop-blur-sm">
                <p className="text-2xl font-bold text-green-500">{rules.filter(r => r.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Actives</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Rules Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Règles d'automatisation</h2>
          <p className="text-sm text-muted-foreground">{rules.length} règle{rules.length !== 1 ? 's' : ''} configurée{rules.length !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingRule(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
              <Plus className="h-4 w-4" />
              Nouvelle règle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 bg-background border-border overflow-hidden">
            {/* Modal Header */}
            <DialogHeader className="p-6 pb-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 ring-4 ring-primary/5">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-xl font-semibold">
                    {editingRule ? 'Modifier la règle' : 'Nouvelle règle d\'automatisation'}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configurez les conditions de déclenchement et les actions automatiques
                  </p>
                </div>
                {formData.name && (
                  <Badge variant="outline" className="hidden sm:flex gap-1 bg-background">
                    <Sparkles className="h-3 w-3" />
                    {getActiveActionsCount()} action{getActiveActionsCount() !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </DialogHeader>
            
            {/* Modal Tabs */}
            <Tabs value={activeModalTab} onValueChange={setActiveModalTab} className="flex-1">
              <div className="border-b border-border px-6">
                <TabsList className="h-12 bg-transparent gap-4 p-0">
                  <TabsTrigger 
                    value="general" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-3"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Général
                  </TabsTrigger>
                  <TabsTrigger 
                    value="conditions"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-3"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Conditions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="actions"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-3"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Actions
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <form onSubmit={handleSubmit}>
                <ScrollArea className="max-h-[calc(90vh-280px)]">
                  <div className="p-6">
                    {/* General Tab */}
                    <TabsContent value="general" className="mt-0 space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Nom de la règle <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Commandes France Express"
                            className="h-12 bg-muted/30 border-border focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            Description (optionnel)
                          </Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Décrivez le cas d'utilisation de cette règle..."
                            className="min-h-[80px] bg-muted/30 border-border resize-none"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            Priorité
                          </Label>
                          <Select
                            value={formData.priority.toString()}
                            onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
                          >
                            <SelectTrigger className="h-12 bg-muted/30 border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  Haute - S'exécute en premier
                                </div>
                              </SelectItem>
                              <SelectItem value="2">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  Moyenne - Priorité standard
                                </div>
                              </SelectItem>
                              <SelectItem value="3">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500" />
                                  Basse - Fallback
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Quick Preview */}
                      {formData.name && (
                        <Card className="bg-muted/30 border-dashed">
                          <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Aperçu</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="gap-1">
                                <Zap className="h-3 w-3" />
                                {triggerLabels[formData.trigger]}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              <Badge variant="outline" className="gap-1">
                                <Truck className="h-3 w-3" />
                                {selectionLabels[formData.carrier_selection]}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              <Badge className="gap-1 bg-primary/10 text-primary border-primary/20">
                                {getActiveActionsCount()} action{getActiveActionsCount() !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                    
                    {/* Conditions Tab */}
                    <TabsContent value="conditions" className="mt-0 space-y-6">
                      {/* Trigger Selection */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500" />
                          Déclencheur
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {TRIGGER_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isSelected = formData.trigger === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, trigger: option.value })}
                                className={cn(
                                  "flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left",
                                  isSelected 
                                    ? "border-primary bg-primary/5 shadow-sm" 
                                    : "border-border hover:border-primary/50 bg-muted/20"
                                )}
                              >
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  isSelected ? "bg-primary/10" : "bg-muted"
                                )}>
                                  <Icon className={cn("h-5 w-5", isSelected ? option.color : "text-muted-foreground")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("font-medium text-sm", isSelected && "text-primary")}>{option.label}</p>
                                  <p className="text-xs text-muted-foreground">{option.description}</p>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Carrier Selection */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Truck className="h-4 w-4 text-blue-500" />
                          Sélection du transporteur
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                          {CARRIER_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isSelected = formData.carrier_selection === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, carrier_selection: option.value })}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                                  isSelected 
                                    ? "border-primary bg-primary/5" 
                                    : "border-border hover:border-primary/50 bg-muted/20"
                                )}
                              >
                                <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                                <div className="flex-1">
                                  <p className={cn("font-medium text-sm", isSelected && "text-primary")}>{option.label}</p>
                                  <p className="text-xs text-muted-foreground">{option.description}</p>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Advanced Filters */}
                      <div className="space-y-4">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Filtres avancés (optionnel)
                        </Label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Zone géographique</Label>
                            <Select
                              value={formData.country_preset}
                              onValueChange={(value) => setFormData({ ...formData, country_preset: value })}
                            >
                              <SelectTrigger className="h-10 bg-muted/30 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COUNTRY_PRESETS.map((preset) => (
                                  <SelectItem key={preset.id} value={preset.id}>
                                    {preset.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Euro className="h-3 w-3" /> Montant min.
                            </Label>
                            <Input
                              type="number"
                              value={formData.min_order_value}
                              onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                              placeholder="0.00 €"
                              className="h-10 bg-muted/30 text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Weight className="h-3 w-3" /> Poids max.
                            </Label>
                            <Input
                              type="number"
                              value={formData.max_weight}
                              onChange={(e) => setFormData({ ...formData, max_weight: e.target.value })}
                              placeholder="0.00 kg"
                              className="h-10 bg-muted/30 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Actions Tab */}
                    <TabsContent value="actions" className="mt-0 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Sélectionnez les actions à exécuter automatiquement lorsque cette règle se déclenche.
                      </p>
                      
                      <div className="space-y-3">
                        {/* Auto Label */}
                        <div className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          formData.auto_label ? "border-green-500/50 bg-green-500/5" : "border-border bg-muted/20"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-xl",
                              formData.auto_label ? "bg-green-500/10" : "bg-muted"
                            )}>
                              <Package className={cn(
                                "h-5 w-5",
                                formData.auto_label ? "text-green-600" : "text-muted-foreground"
                              )} />
                            </div>
                            <div>
                              <Label className="font-medium text-base cursor-pointer">Générer l'étiquette</Label>
                              <p className="text-sm text-muted-foreground">Création automatique de l'étiquette d'expédition</p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.auto_label}
                            onCheckedChange={(checked) => setFormData({ ...formData, auto_label: checked })}
                            className="data-[state=checked]:bg-green-500"
                          />
                        </div>
                        
                        {/* Auto Print */}
                        <div className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          formData.auto_print ? "border-blue-500/50 bg-blue-500/5" : "border-border bg-muted/20"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-xl",
                              formData.auto_print ? "bg-blue-500/10" : "bg-muted"
                            )}>
                              <Printer className={cn(
                                "h-5 w-5",
                                formData.auto_print ? "text-blue-600" : "text-muted-foreground"
                              )} />
                            </div>
                            <div>
                              <Label className="font-medium text-base cursor-pointer">Imprimer automatiquement</Label>
                              <p className="text-sm text-muted-foreground">Envoi direct à l'imprimante configurée</p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.auto_print}
                            onCheckedChange={(checked) => setFormData({ ...formData, auto_print: checked })}
                            className="data-[state=checked]:bg-blue-500"
                          />
                        </div>
                        
                        {/* Auto Notify */}
                        <div className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          formData.auto_notify ? "border-purple-500/50 bg-purple-500/5" : "border-border bg-muted/20"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-xl",
                              formData.auto_notify ? "bg-purple-500/10" : "bg-muted"
                            )}>
                              <Mail className={cn(
                                "h-5 w-5",
                                formData.auto_notify ? "text-purple-600" : "text-muted-foreground"
                              )} />
                            </div>
                            <div>
                              <Label className="font-medium text-base cursor-pointer">Notifier le client</Label>
                              <p className="text-sm text-muted-foreground">Email avec numéro de suivi d'expédition</p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.auto_notify}
                            onCheckedChange={(checked) => setFormData({ ...formData, auto_notify: checked })}
                            className="data-[state=checked]:bg-purple-500"
                          />
                        </div>
                        
                        <Separator className="my-4" />
                        
                        {/* Premium Actions */}
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Options avancées</p>
                        
                        {/* Add Insurance */}
                        <div className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          formData.add_insurance ? "border-amber-500/50 bg-amber-500/5" : "border-border bg-muted/20"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-xl",
                              formData.add_insurance ? "bg-amber-500/10" : "bg-muted"
                            )}>
                              <AlertTriangle className={cn(
                                "h-5 w-5",
                                formData.add_insurance ? "text-amber-600" : "text-muted-foreground"
                              )} />
                            </div>
                            <div>
                              <Label className="font-medium text-base cursor-pointer">Ajouter une assurance</Label>
                              <p className="text-sm text-muted-foreground">Protection automatique des colis</p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.add_insurance}
                            onCheckedChange={(checked) => setFormData({ ...formData, add_insurance: checked })}
                            className="data-[state=checked]:bg-amber-500"
                          />
                        </div>
                        
                        {/* Priority Processing */}
                        <div className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          formData.priority_processing ? "border-rose-500/50 bg-rose-500/5" : "border-border bg-muted/20"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-xl",
                              formData.priority_processing ? "bg-rose-500/10" : "bg-muted"
                            )}>
                              <Zap className={cn(
                                "h-5 w-5",
                                formData.priority_processing ? "text-rose-600" : "text-muted-foreground"
                              )} />
                            </div>
                            <div>
                              <Label className="font-medium text-base cursor-pointer">Traitement prioritaire</Label>
                              <p className="text-sm text-muted-foreground">File d'attente prioritaire pour l'expédition</p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.priority_processing}
                            onCheckedChange={(checked) => setFormData({ ...formData, priority_processing: checked })}
                            className="data-[state=checked]:bg-rose-500"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
                
                {/* Modal Footer */}
                <div className="flex items-center justify-between gap-3 p-6 border-t border-border bg-muted/20">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {activeModalTab === 'general' && <span>Étape 1/3</span>}
                    {activeModalTab === 'conditions' && <span>Étape 2/3</span>}
                    {activeModalTab === 'actions' && <span>Étape 3/3</span>}
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="px-6"
                    >
                      Annuler
                    </Button>
                    {activeModalTab !== 'actions' ? (
                      <Button 
                        type="button"
                        onClick={() => {
                          if (activeModalTab === 'general') setActiveModalTab('conditions');
                          else if (activeModalTab === 'conditions') setActiveModalTab('actions');
                        }}
                        disabled={activeModalTab === 'general' && !formData.name.trim()}
                        className="px-6 gap-2"
                      >
                        Suivant
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={isMutating || !formData.name.trim()}
                        className="px-6 gap-2 bg-primary hover:bg-primary/90"
                      >
                        {isMutating && <Loader2 className="h-4 w-4 animate-spin" />}
                        <CheckCircle className="h-4 w-4" />
                        {editingRule ? 'Mettre à jour' : 'Créer la règle'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <div className="p-4 rounded-full bg-muted inline-block mb-4">
              <Settings className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Aucune règle configurée</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Créez votre première règle d'automatisation pour gagner du temps sur vos expéditions
            </p>
            <Button onClick={() => setIsDialogOpen(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Créer une règle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const trigger = rule.conditions?.trigger || 'paid';
            const carrierSelection = rule.conditions?.carrier_selection || 'cheapest';
            const autoLabel = rule.actions?.auto_label ?? false;
            const autoPrint = rule.actions?.auto_print ?? false;
            const autoNotify = rule.actions?.auto_notify ?? false;
            const addInsurance = rule.actions?.add_insurance ?? false;
            const priorityProcessing = rule.actions?.priority_processing ?? false;
            
            const triggerOption = TRIGGER_OPTIONS.find(t => t.value === trigger);
            const TriggerIcon = triggerOption?.icon || Zap;
            
            return (
              <Card 
                key={rule.id} 
                className={cn(
                  "transition-all hover:shadow-md",
                  rule.is_active ? "border-border" : "opacity-60 border-dashed"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={cn(
                        "p-3 rounded-xl shrink-0",
                        rule.is_active ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Zap className={cn(
                          "h-5 w-5",
                          rule.is_active ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold truncate">{rule.name}</h3>
                          <Badge 
                            variant={rule.is_active ? "default" : "secondary"}
                            className={cn(
                              "shrink-0",
                              rule.is_active && "bg-green-500/10 text-green-600 border-green-500/20"
                            )}
                          >
                            {rule.is_active ? (
                              <><Play className="h-3 w-3 mr-1" /> Active</>
                            ) : (
                              <><Pause className="h-3 w-3 mr-1" /> Inactive</>
                            )}
                          </Badge>
                        </div>
                        
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{rule.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="gap-1.5 text-xs">
                            <TriggerIcon className={cn("h-3 w-3", triggerOption?.color)} />
                            {triggerLabels[trigger] || trigger}
                          </Badge>
                          <Badge variant="outline" className="gap-1.5 text-xs">
                            <Truck className="h-3 w-3 text-blue-500" />
                            {selectionLabels[carrierSelection] || carrierSelection}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className={cn("flex items-center gap-1", autoLabel ? "text-green-600" : "text-muted-foreground")}>
                            {autoLabel ? <CheckCircle className="h-3 w-3" /> : <span className="w-3 h-3 rounded-full border" />}
                            Étiquette
                          </span>
                          <span className={cn("flex items-center gap-1", autoPrint ? "text-blue-600" : "text-muted-foreground")}>
                            {autoPrint ? <CheckCircle className="h-3 w-3" /> : <span className="w-3 h-3 rounded-full border" />}
                            Impression
                          </span>
                          <span className={cn("flex items-center gap-1", autoNotify ? "text-purple-600" : "text-muted-foreground")}>
                            {autoNotify ? <CheckCircle className="h-3 w-3" /> : <span className="w-3 h-3 rounded-full border" />}
                            Notification
                          </span>
                          {addInsurance && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <CheckCircle className="h-3 w-3" />
                              Assurance
                            </span>
                          )}
                          {priorityProcessing && (
                            <span className="flex items-center gap-1 text-rose-600">
                              <CheckCircle className="h-3 w-3" />
                              Prioritaire
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRule(rule)}
                        disabled={isMutating}
                      />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(rule)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateRule(rule)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteRule(rule.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
