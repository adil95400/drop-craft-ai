/**
 * Marketing Automation Hub — Module complet
 * 
 * Fonctionnalités :
 * - Gestion des automatisations (CRUD, activation/désactivation)
 * - Éditeur visuel de workflows (étapes email, SMS, push, délais, conditions)
 * - Performance & analytics en temps réel
 * - Ciblage par segments d'audience
 * - Templates pré-configurés pour les scénarios courants
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Zap, Mail, Clock, Target, Plus, Play, Pause,
  ShoppingCart, Users, TrendingUp, BarChart3,
  ArrowRight, Repeat, Bell, Filter, Settings2,
  Eye, Send, Pencil, Copy, Trash2, Sparkles
} from 'lucide-react';
import { WorkflowStepEditor, type WorkflowStep } from '@/components/marketing/automation/WorkflowStepEditor';
import { AutomationPerformance } from '@/components/marketing/automation/AutomationPerformance';
import { AudienceSegmentPicker } from '@/components/marketing/automation/AudienceSegmentPicker';

// ─── Templates ─────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'welcome_series',
    name: 'Série de Bienvenue',
    description: 'Séquence de 3 emails pour accueillir les nouveaux clients et les guider vers leur premier achat',
    icon: Mail,
    trigger: 'new_customer',
    color: 'text-info',
    defaultSteps: [
      { id: '1', type: 'email' as const, name: 'Email de bienvenue', config: { subject: 'Bienvenue chez {{store_name}} !', content: 'Découvrez notre sélection...' } },
      { id: '2', type: 'delay' as const, name: 'Attente 2 jours', config: { delay_value: 2, delay_unit: 'days' as const } },
      { id: '3', type: 'email' as const, name: 'Guide produits', config: { subject: 'Nos meilleures ventes pour vous', content: 'Voici nos produits les plus populaires...' } },
      { id: '4', type: 'delay' as const, name: 'Attente 3 jours', config: { delay_value: 3, delay_unit: 'days' as const } },
      { id: '5', type: 'email' as const, name: 'Offre spéciale', config: { subject: '🎁 -10% sur votre première commande', content: 'Profitez de votre code WELCOME10...' } },
    ],
  },
  {
    id: 'abandoned_cart',
    name: 'Relance Panier Abandonné',
    description: 'Séquence multi-canal pour récupérer les paniers non finalisés avec email et SMS',
    icon: ShoppingCart,
    trigger: 'cart_abandoned',
    color: 'text-warning',
    defaultSteps: [
      { id: '1', type: 'delay' as const, name: 'Attente 1h', config: { delay_value: 1, delay_unit: 'hours' as const } },
      { id: '2', type: 'email' as const, name: 'Rappel panier', config: { subject: 'Vous avez oublié quelque chose...', content: 'Votre panier vous attend !' } },
      { id: '3', type: 'delay' as const, name: 'Attente 24h', config: { delay_value: 24, delay_unit: 'hours' as const } },
      { id: '4', type: 'condition' as const, name: 'A acheté ?', config: { condition_field: 'order_placed', condition_operator: 'equals', condition_value: 'false' } },
      { id: '5', type: 'sms' as const, name: 'SMS de relance', config: { content: '{{name}}, votre panier vous attend ! -5% avec le code CART5' } },
    ],
  },
  {
    id: 'reengagement',
    name: 'Ré-engagement Client',
    description: 'Relance des clients inactifs depuis 30+ jours avec une offre personnalisée',
    icon: Users,
    trigger: 'customer_inactive',
    color: 'text-purple-500',
    defaultSteps: [
      { id: '1', type: 'email' as const, name: 'Vous nous manquez', config: { subject: '{{name}}, vous nous manquez !', content: 'Ça fait un moment...' } },
      { id: '2', type: 'delay' as const, name: 'Attente 5 jours', config: { delay_value: 5, delay_unit: 'days' as const } },
      { id: '3', type: 'condition' as const, name: 'A ouvert ?', config: { condition_field: 'email_opened', condition_operator: 'equals', condition_value: 'true' } },
      { id: '4', type: 'email' as const, name: 'Offre exclusive', config: { subject: '🎁 Une surprise pour votre retour !', content: 'Code promo exclusif COMEBACK15...' } },
    ],
  },
  {
    id: 'post_purchase',
    name: 'Post-Achat & Avis',
    description: 'Suivi après commande avec demande d\'avis et recommandations personnalisées',
    icon: Target,
    trigger: 'order_delivered',
    color: 'text-success',
    defaultSteps: [
      { id: '1', type: 'delay' as const, name: 'Attente livraison +3j', config: { delay_value: 3, delay_unit: 'days' as const } },
      { id: '2', type: 'email' as const, name: 'Demande avis', config: { subject: 'Comment trouvez-vous votre achat ?', content: 'Votre avis compte...' } },
      { id: '3', type: 'delay' as const, name: 'Attente 7 jours', config: { delay_value: 7, delay_unit: 'days' as const } },
      { id: '4', type: 'email' as const, name: 'Recommandations', config: { subject: 'Produits qui pourraient vous plaire', content: 'Basé sur votre achat...' } },
    ],
  },
  {
    id: 'flash_sale',
    name: 'Alerte Vente Flash',
    description: 'Notification urgente multi-canal pour les ventes flash et promotions limitées',
    icon: Zap,
    trigger: 'manual',
    color: 'text-warning',
    defaultSteps: [
      { id: '1', type: 'email' as const, name: 'Email promo', config: { subject: '⚡ Vente Flash : -30% pendant 24h !', content: 'Ne manquez pas cette offre...' } },
      { id: '2', type: 'push' as const, name: 'Push notification', config: { content: '⚡ Vente Flash -30% ! Seulement 24h' } },
    ],
  },
  {
    id: 'stock_alert',
    name: 'Alerte Retour en Stock',
    description: 'Notifier automatiquement les clients quand un produit souhaité est de retour',
    icon: Bell,
    trigger: 'product_restocked',
    color: 'text-destructive',
    defaultSteps: [
      { id: '1', type: 'email' as const, name: 'Retour en stock', config: { subject: '🎉 {{product_name}} est de retour !', content: 'Le produit que vous attendiez...' } },
      { id: '2', type: 'push' as const, name: 'Push alerte', config: { content: '{{product_name}} est de retour en stock !' } },
    ],
  },
];

const TRIGGER_LABELS: Record<string, string> = {
  new_customer: 'Nouveau client',
  cart_abandoned: 'Panier abandonné',
  customer_inactive: 'Client inactif (30j+)',
  order_delivered: 'Commande livrée',
  manual: 'Déclenchement manuel',
  product_restocked: 'Retour en stock',
};

// ─── Page ──────────────────────────────────────────────────
export default function MarketingAutomationPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('campaigns');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'new_customer',
    description: '',
    segment_ids: [] as string[],
    steps: [] as WorkflowStep[],
  });

  // ─── Data fetching ────────────────────────────────────────
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['automated-campaigns'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('automated_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // ─── Mutations ────────────────────────────────────────────
  const toggleCampaign = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('automated_campaigns')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-campaigns'] });
      toast.success('Statut mis à jour');
    },
  });

  const saveCampaign = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const payload = {
        user_id: user.id,
        name: formData.name,
        trigger_type: formData.trigger_type,
        is_active: false,
        actions: JSON.parse(JSON.stringify({
          steps: formData.steps,
          segment_ids: formData.segment_ids,
          description: formData.description,
        })),
        trigger_config: JSON.parse(JSON.stringify({
          type: formData.trigger_type,
        })),
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from('automated_campaigns')
          .update(payload)
          .eq('id', editingCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('automated_campaigns')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-campaigns'] });
      toast.success(editingCampaign ? 'Automatisation mise à jour !' : 'Automatisation créée !');
      closeEditor();
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('automated_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-campaigns'] });
      toast.success('Automatisation supprimée');
    },
  });

  const duplicateCampaign = useMutation({
    mutationFn: async (campaign: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const { id, created_at, updated_at, trigger_count, last_triggered_at, ...rest } = campaign;
      const { error } = await supabase.from('automated_campaigns').insert({
        ...rest,
        user_id: user.id,
        name: `${campaign.name} (copie)`,
        is_active: false,
        trigger_count: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-campaigns'] });
      toast.success('Automatisation dupliquée');
    },
  });

  // ─── Helpers ──────────────────────────────────────────────
  const openEditor = (campaign?: any) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name,
        trigger_type: campaign.trigger_type || 'new_customer',
        description: campaign.actions?.description || '',
        segment_ids: campaign.actions?.segment_ids || [],
        steps: campaign.actions?.steps || [],
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        name: '',
        trigger_type: 'new_customer',
        description: '',
        segment_ids: [],
        steps: [],
      });
    }
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingCampaign(null);
  };

  const createFromTemplate = (template: typeof TEMPLATES[0]) => {
    setEditingCampaign(null);
    setFormData({
      name: template.name,
      trigger_type: template.trigger,
      description: template.description,
      segment_ids: [],
      steps: template.defaultSteps,
    });
    setEditorOpen(true);
  };

  const activeCampaigns = campaigns.filter((c: any) => c.is_active);
  const totalTriggers = campaigns.reduce((sum: number, c: any) => sum + (c.trigger_count || 0), 0);

  const filteredCampaigns = campaigns.filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Marketing Automation — Drop-Craft AI</title>
        <meta name="description" content="Automatisez vos campagnes marketing : séquences email, SMS, push notifications, relances et plus encore." />
      </Helmet>

      <ChannablePageWrapper
        title="Marketing Automation"
        description="Créez des séquences automatisées multi-canal pour engager vos clients au bon moment"
        heroImage="marketing"
        badge={{ label: 'Automation', icon: Zap }}
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Automatisations', value: campaigns.length, icon: Repeat, color: 'text-primary' },
            { label: 'Actives', value: activeCampaigns.length, icon: Play, color: 'text-success' },
            { label: 'Déclenchements', value: totalTriggers.toLocaleString('fr-FR'), icon: Zap, color: 'text-warning' },
            { label: 'Taux Ouverture', value: '—', icon: Eye, color: 'text-info' },
          ].map(kpi => (
            <Card key={kpi.label} className="p-4">
              <div className="flex items-center gap-3">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="campaigns">Mes Automatisations</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* ─── Automatisations ─────────────────────────────── */}
          <TabsContent value="campaigns" className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <Input
                  placeholder="Rechercher une automatisation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-sm"
                />
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>
              <Button onClick={() => openEditor()} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle automatisation
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </Card>
                ))}
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <Card className="p-12 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">
                  {search ? 'Aucun résultat' : 'Aucune automatisation'}
                </p>
                <p className="text-muted-foreground mb-4">
                  {search
                    ? 'Essayez avec d\'autres termes de recherche'
                    : 'Créez votre première automatisation ou utilisez un template'}
                </p>
                {!search && (
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setActiveTab('templates')}>
                      Voir les Templates
                    </Button>
                    <Button onClick={() => openEditor()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer manuellement
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              filteredCampaigns.map((campaign: any) => {
                const stepCount = campaign.actions?.steps?.length || 0;
                return (
                  <Card key={campaign.id} className="p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg truncate">{campaign.name}</h3>
                          <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                            {campaign.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="capitalize text-xs">
                            {TRIGGER_LABELS[campaign.trigger_type] || campaign.trigger_type}
                          </Badge>
                          {stepCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {stepCount} étape{stepCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {campaign.trigger_count || 0} déclenchements
                          </span>
                          {campaign.last_triggered_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Dernier : {new Date(campaign.last_triggered_at).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                          {campaign.actions?.description && (
                            <span className="truncate max-w-[200px]">
                              {campaign.actions.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => openEditor(campaign)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => duplicateCampaign.mutate(campaign)}
                          title="Dupliquer"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => {
                            if (confirm('Supprimer cette automatisation ?')) {
                              deleteCampaign.mutate(campaign.id);
                            }
                          }}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Switch
                          checked={campaign.is_active}
                          onCheckedChange={(checked) =>
                            toggleCampaign.mutate({ id: campaign.id, isActive: checked })
                          }
                        />
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* ─── Templates ───────────────────────────────────── */}
          <TabsContent value="templates" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATES.map(template => (
                <Card key={template.id} className="p-6 hover:shadow-md transition-shadow group">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent">
                      <template.icon className={`h-6 w-6 ${template.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        {template.defaultSteps.length} étapes
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {TRIGGER_LABELS[template.trigger] || template.trigger}
                      </Badge>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => createFromTemplate(template)}
                      className="gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Utiliser
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ─── Performance ─────────────────────────────────── */}
          <TabsContent value="performance" className="mt-6">
            <AutomationPerformance />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>

      {/* ─── Workflow Editor Dialog ─────────────────────────── */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Modifier l\'automatisation' : 'Nouvelle automatisation'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* General info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nom de l'automatisation</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Série de bienvenue"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Déclencheur</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={v => setFormData(p => ({ ...p, trigger_type: v }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description (optionnel)</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Décrivez le but de cette automatisation..."
                rows={2}
                className="mt-1"
              />
            </div>

            <Separator />

            {/* Audience targeting */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">Ciblage Audience</Label>
                <Badge variant="outline" className="text-xs">Optionnel</Badge>
              </div>
              <AudienceSegmentPicker
                selectedIds={formData.segment_ids}
                onChange={ids => setFormData(p => ({ ...p, segment_ids: ids }))}
                compact
              />
            </div>

            <Separator />

            {/* Workflow steps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Settings2 className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">Séquence d'actions</Label>
              </div>
              <WorkflowStepEditor
                steps={formData.steps}
                onChange={steps => setFormData(p => ({ ...p, steps }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditor}>Annuler</Button>
            <Button
              onClick={() => saveCampaign.mutate()}
              disabled={!formData.name || saveCampaign.isPending}
              className="gap-2"
            >
              {saveCampaign.isPending ? (
                <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {editingCampaign ? 'Mettre à jour' : 'Créer l\'automatisation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
