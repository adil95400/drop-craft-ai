/**
 * Workflow Studio - Visual drag & drop workflow builder
 * Automation Studio for creating complex workflows
 */
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Plus, Play, Save, Trash2, ArrowRight, Mail, Bell, Package, ShoppingCart, Clock, GitBranch, CheckCircle2, AlertTriangle, Settings, Workflow, Webhook, Globe, Send, History } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  name: string;
  config: Record<string, any>;
  icon: string;
}

const TRIGGER_TEMPLATES = [
  { id: 'new-order', name: 'Nouvelle commande', icon: 'ShoppingCart', description: 'Déclenché quand une commande est créée' },
  { id: 'low-stock', name: 'Stock bas', icon: 'AlertTriangle', description: 'Quand le stock passe sous un seuil' },
  { id: 'new-product', name: 'Nouveau produit', icon: 'Package', description: 'Quand un produit est importé' },
  { id: 'schedule', name: 'Planification', icon: 'Clock', description: 'À intervalles réguliers' },
];

const ACTION_TEMPLATES = [
  { id: 'send-email', name: 'Envoyer un email', icon: 'Mail', description: 'Notification par email' },
  { id: 'webhook', name: 'Appel Webhook', icon: 'Webhook', description: 'Envoyer un POST à une URL externe' },
  { id: 'update-stock', name: 'Mettre à jour le stock', icon: 'Package', description: 'Modifier les quantités' },
  { id: 'notify', name: 'Notification in-app', icon: 'Bell', description: 'Alerte dans l\'app' },
  { id: 'reorder', name: 'Réapprovisionnement', icon: 'ShoppingCart', description: 'Commander automatiquement' },
  { id: 'api-call', name: 'Appel API', icon: 'Globe', description: 'Requête vers un service externe' },
  { id: 'send-sms', name: 'Envoyer SMS/Push', icon: 'Send', description: 'Notification SMS ou push' },
];

const WORKFLOW_TEMPLATES = [
  {
    name: 'Relance panier abandonné',
    description: 'Envoie un email 1h après l\'abandon d\'un panier',
    steps: [
      { id: '1', type: 'trigger' as const, name: 'Panier abandonné', config: { delay: '1h' }, icon: 'ShoppingCart' },
      { id: '2', type: 'condition' as const, name: 'Valeur > 30€', config: { field: 'total', operator: '>', value: 30 }, icon: 'GitBranch' },
      { id: '3', type: 'action' as const, name: 'Email de relance', config: { template: 'cart-recovery' }, icon: 'Mail' },
    ],
  },
  {
    name: 'Alerte stock critique',
    description: 'Notification quand le stock passe sous 5 unités',
    steps: [
      { id: '1', type: 'trigger' as const, name: 'Stock bas', config: { threshold: 5 }, icon: 'AlertTriangle' },
      { id: '2', type: 'action' as const, name: 'Notification urgente', config: { priority: 'high' }, icon: 'Bell' },
      { id: '3', type: 'action' as const, name: 'Réapprovisionnement auto', config: { quantity: 50 }, icon: 'ShoppingCart' },
    ],
  },
  {
    name: 'Enrichissement produit IA',
    description: 'Optimise automatiquement les nouveaux produits importés',
    steps: [
      { id: '1', type: 'trigger' as const, name: 'Nouveau produit importé', config: {}, icon: 'Package' },
      { id: '2', type: 'action' as const, name: 'Optimisation IA titre/description', config: { ai: true }, icon: 'Zap' },
      { id: '3', type: 'action' as const, name: 'Notification de complétion', config: {}, icon: 'Bell' },
    ],
  },
];

const iconMap: Record<string, any> = {
  ShoppingCart, AlertTriangle, Package, Clock, Mail, Bell, Zap, GitBranch, Settings, Webhook, Globe, Send,
};

export default function WorkflowStudioPage() {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['studio-workflows'],
    queryFn: async () => {
      const { data } = await supabase.from('automation_workflows').select('*').order('created_at', { ascending: false }).limit(20);
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase.from('automation_workflows').insert({
        name: workflowName,
        description: workflowDesc,
        steps: steps as unknown as Json,
        trigger_type: steps[0]?.name || 'manual',
        is_active: false,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: '✅ Workflow sauvegardé' });
      queryClient.invalidateQueries({ queryKey: ['studio-workflows'] });
      setShowCreate(false);
      setSteps([]);
      setWorkflowName('');
      setWorkflowDesc('');
    },
    onError: (err: any) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const addStep = (type: 'trigger' | 'condition' | 'action', template: any) => {
    setSteps(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      name: template.name,
      config: {},
      icon: template.icon,
    }]);
  };

  const removeStep = (id: string) => setSteps(prev => prev.filter(s => s.id !== id));

  const loadTemplate = (template: typeof WORKFLOW_TEMPLATES[0]) => {
    setSteps(template.steps);
    setWorkflowName(template.name);
    setWorkflowDesc(template.description);
    setShowCreate(true);
  };

  const StepNode = ({ step, index }: { step: WorkflowStep; index: number }) => {
    const Icon = iconMap[step.icon] || Zap;
    const colorMap = { trigger: 'border-blue-500 bg-blue-50 dark:bg-blue-950', condition: 'border-amber-500 bg-amber-50 dark:bg-amber-950', action: 'border-green-500 bg-green-50 dark:bg-green-950' };
    
    return (
      <div className="flex items-center gap-3">
        {index > 0 && <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />}
        <Card className={cn('border-2 min-w-[180px]', colorMap[step.type])}>
          <CardContent className="p-3 flex items-center gap-2">
            <Icon className="h-5 w-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{step.name}</p>
              <Badge variant="outline" className="text-[10px] mt-1">{step.type}</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeStep(step.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <ChannablePageWrapper
      title="Workflow Studio"
      subtitle="Automatisation visuelle"
      description="Créez des workflows d'automatisation avec un builder visuel drag & drop"
      heroImage="automation"
      badge={{ label: 'Studio', icon: Workflow }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/automation/history"><History className="h-4 w-4 mr-2" /> Historique</Link>
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau Workflow
          </Button>
        </div>
      }
    >
      {/* Templates */}
      <div>
        <h3 className="text-lg font-semibold mb-3">🚀 Templates prêts à l'emploi</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WORKFLOW_TEMPLATES.map((tpl, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadTemplate(tpl)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{tpl.name}</CardTitle>
                <CardDescription className="text-xs">{tpl.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-1 flex-wrap">
                  {tpl.steps.map((s, j) => {
                    const SIcon = iconMap[s.icon] || Zap;
                    return (
                      <div key={j} className="flex items-center gap-1">
                        {j > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <SIcon className="h-3 w-3" /> {s.name}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Existing workflows */}
      <div>
        <h3 className="text-lg font-semibold mb-3">📋 Vos Workflows</h3>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2].map(i => <Card key={i}><CardContent className="p-6"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>)}
          </div>
        ) : workflows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Workflow className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun workflow. Utilisez un template ci-dessus pour commencer !</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map(wf => (
              <Card key={wf.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{wf.name}</CardTitle>
                    <Badge variant={wf.is_active ? 'default' : 'secondary'}>{wf.is_active ? 'Actif' : 'Inactif'}</Badge>
                  </div>
                  <CardDescription className="text-xs">{wf.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{wf.execution_count || 0} exécutions</span>
                    <span>Trigger: {wf.trigger_type}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un Workflow</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nom du workflow" value={workflowName} onChange={e => setWorkflowName(e.target.value)} />
              <Input placeholder="Description (optionnel)" value={workflowDesc} onChange={e => setWorkflowDesc(e.target.value)} />
            </div>

            {/* Visual Builder */}
            <div className="border rounded-lg p-4 bg-muted/30 min-h-[120px]">
              {steps.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Ajoutez un trigger pour commencer →</p>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {steps.map((s, i) => <StepNode key={s.id} step={s} index={i} />)}
                </div>
              )}
            </div>

            {/* Add steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-blue-600">⚡ Triggers</h4>
                <div className="space-y-1">
                  {TRIGGER_TEMPLATES.map(t => (
                    <Button key={t.id} variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => addStep('trigger', t)} disabled={steps.some(s => s.type === 'trigger')}>
                      {(() => { const I = iconMap[t.icon] || Zap; return <I className="h-3 w-3 mr-2" />; })()}
                      {t.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-amber-600">🔀 Conditions</h4>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => addStep('condition', { name: 'Condition', icon: 'GitBranch' })}>
                  <GitBranch className="h-3 w-3 mr-2" /> Ajouter une condition
                </Button>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-green-600">✅ Actions</h4>
                <div className="space-y-1">
                  {ACTION_TEMPLATES.map(a => (
                    <Button key={a.id} variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => addStep('action', a)}>
                      {(() => { const I = iconMap[a.icon] || Zap; return <I className="h-3 w-3 mr-2" />; })()}
                      {a.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!workflowName || steps.length === 0 || saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" /> Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChannablePageWrapper>
  );
}
