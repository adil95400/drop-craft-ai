import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Zap, Mail, Clock, Target, Plus, Play, Pause,
  ShoppingCart, Users, TrendingUp, BarChart3,
  ArrowRight, Repeat, Bell, Filter
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 'welcome_series',
    name: 'Série de Bienvenue',
    description: 'Séquence d\'emails automatique pour les nouveaux clients',
    icon: Mail,
    trigger: 'new_customer',
    steps: 3,
    color: 'text-blue-500',
  },
  {
    id: 'abandoned_cart',
    name: 'Relance Panier Abandonné',
    description: 'Rappels automatiques pour les paniers non finalisés',
    icon: ShoppingCart,
    trigger: 'cart_abandoned',
    steps: 2,
    color: 'text-orange-500',
  },
  {
    id: 'reengagement',
    name: 'Ré-engagement Client',
    description: 'Relance des clients inactifs depuis 30+ jours',
    icon: Users,
    trigger: 'customer_inactive',
    steps: 4,
    color: 'text-purple-500',
  },
  {
    id: 'post_purchase',
    name: 'Post-Achat & Avis',
    description: 'Suivi après commande et demande d\'avis',
    icon: Target,
    trigger: 'order_delivered',
    steps: 2,
    color: 'text-green-500',
  },
  {
    id: 'flash_sale',
    name: 'Alerte Vente Flash',
    description: 'Notification ciblée pour les ventes flash',
    icon: Zap,
    trigger: 'manual',
    steps: 1,
    color: 'text-yellow-500',
  },
  {
    id: 'stock_alert',
    name: 'Alerte Stock Client',
    description: 'Notifier les clients quand un produit est de retour en stock',
    icon: Bell,
    trigger: 'product_restocked',
    steps: 1,
    color: 'text-red-500',
  },
];

export default function MarketingAutomationPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

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

  const createFromTemplate = useMutation({
    mutationFn: async (template: typeof TEMPLATES[0]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('automated_campaigns')
        .insert({
          user_id: user.id,
          name: template.name,
          trigger_type: template.trigger,
          is_active: false,
          actions: {
            steps: template.steps,
            template_id: template.id,
          },
          trigger_config: {
            type: template.trigger,
            delay_minutes: template.trigger === 'cart_abandoned' ? 60 : 0,
          },
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-campaigns'] });
      toast.success('Automatisation créée ! Configurez-la puis activez-la.');
    },
  });

  const activeCampaigns = campaigns.filter((c: any) => c.is_active);
  const totalTriggers = campaigns.reduce((sum: number, c: any) => sum + (c.trigger_count || 0), 0);

  return (
    <>
      <Helmet>
        <title>Marketing Automation — Drop-Craft AI</title>
        <meta name="description" content="Automatisez vos campagnes marketing : emails, relances, ventes flash et plus encore." />
      </Helmet>

      <div className="space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              Marketing Automation
            </h1>
            <p className="text-muted-foreground mt-1">
              Créez des séquences automatisées pour engager vos clients au bon moment
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Automatisations', value: campaigns.length, icon: Repeat, color: 'text-primary' },
            { label: 'Actives', value: activeCampaigns.length, icon: Play, color: 'text-green-500' },
            { label: 'Déclenchements', value: totalTriggers, icon: Zap, color: 'text-yellow-500' },
            { label: 'Taux Ouverture', value: '—', icon: BarChart3, color: 'text-blue-500' },
          ].map((kpi) => (
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

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList>
            <TabsTrigger value="campaigns">Mes Automatisations</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Rechercher une automatisation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </Card>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <Card className="p-12 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">Aucune automatisation</p>
                <p className="text-muted-foreground mb-4">
                  Utilisez un template pour créer votre première automatisation marketing
                </p>
                <Button variant="outline" onClick={() => {}}>
                  Voir les Templates
                </Button>
              </Card>
            ) : (
              campaigns
                .filter((c: any) =>
                  !search || c.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((campaign: any) => (
                  <Card key={campaign.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                            {campaign.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {campaign.trigger_type}
                          </Badge>
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
                        </div>
                      </div>
                      <Switch
                        checked={campaign.is_active}
                        onCheckedChange={(checked) =>
                          toggleCampaign.mutate({ id: campaign.id, isActive: checked })
                        }
                      />
                    </div>
                  </Card>
                ))
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATES.map((template) => (
                <Card key={template.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent">
                      <template.icon className={`h-6 w-6 ${template.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3" />
                      {template.steps} étape{template.steps > 1 ? 's' : ''}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createFromTemplate.mutate(template)}
                      disabled={createFromTemplate.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Utiliser
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
