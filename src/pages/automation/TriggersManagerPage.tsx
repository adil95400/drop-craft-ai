/**
 * Triggers Manager - Gestion des déclencheurs d'automatisation
 * Connecté à la table automation_workflows (trigger_type)
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Play, Plus, Search, Zap, ShoppingCart, Package,
  DollarSign, AlertTriangle, Mail, Clock, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, typeof Zap> = {
  'order.created': ShoppingCart,
  'inventory.low': Package,
  'competitor.price_change': DollarSign,
  'cart.abandoned': AlertTriangle,
  'review.created': Mail,
  'sync.failed': RefreshCw,
  'schedule.cron': Clock,
};

const CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'orders', label: 'Commandes' },
  { id: 'inventory', label: 'Stock' },
  { id: 'pricing', label: 'Prix' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'customers', label: 'Clients' },
  { id: 'integrations', label: 'Intégrations' },
  { id: 'system', label: 'Système' },
];

function guessCategoryFromType(triggerType: string | null): string {
  if (!triggerType) return 'system';
  const t = triggerType.toLowerCase();
  if (t.includes('order') || t.includes('cart')) return 'orders';
  if (t.includes('stock') || t.includes('inventory')) return 'inventory';
  if (t.includes('price') || t.includes('competitor')) return 'pricing';
  if (t.includes('marketing') || t.includes('campaign') || t.includes('cart.abandoned')) return 'marketing';
  if (t.includes('customer') || t.includes('review')) return 'customers';
  if (t.includes('sync') || t.includes('webhook')) return 'integrations';
  return 'system';
}

export default function TriggersManagerPage() {
  const { t: tPages } = useTranslation('pages');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['trigger-workflows', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('id, name, description, trigger_type, trigger_config, is_active, trigger_count, last_triggered_at, conditions')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trigger-workflows'] });
      toast.success('Déclencheur mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const triggers = (workflows || []).map(w => ({
    id: w.id,
    name: w.name,
    eventType: w.trigger_type || 'custom',
    description: w.description || '',
    isActive: w.is_active ?? false,
    triggerCount: w.trigger_count ?? 0,
    lastTriggered: w.last_triggered_at
      ? new Date(w.last_triggered_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
      : null,
    conditions: Array.isArray(w.conditions) ? (w.conditions as any[]).map((c: any) => c.label || c.field || String(c)) : [],
    category: guessCategoryFromType(w.trigger_type),
  }));

  const filtered = triggers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.eventType.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeTriggers = triggers.filter(t => t.isActive).length;
  const totalFired = triggers.reduce((sum, t) => sum + t.triggerCount, 0);

  return (
    <>
      <Helmet>
        <title>Déclencheurs d'Automatisation | Drop Craft AI</title>
        <meta name="description" content="Gérez les événements qui déclenchent vos workflows automatisés" />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('declencheurs.title')}
        description="Événements qui déclenchent vos scénarios d'automatisation"
        heroImage="automation"
        badge={{ label: 'Automatisation', icon: Play }}
      >
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-sm text-muted-foreground">Déclencheurs actifs</div>
              <div className="text-2xl font-bold text-foreground">{activeTriggers}/{triggers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-sm text-muted-foreground">Total déclenchements</div>
              <div className="text-2xl font-bold text-foreground">{totalFired.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-sm text-muted-foreground">Catégories</div>
              <div className="text-2xl font-bold text-foreground">
                {new Set(triggers.map(t => t.category)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un déclencheur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {triggers.length === 0
                ? 'Aucun déclencheur configuré. Créez un workflow avec un trigger pour commencer.'
                : 'Aucun déclencheur ne correspond aux filtres.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(trigger => {
              const Icon = ICON_MAP[trigger.eventType] || Zap;
              return (
                <Card key={trigger.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn(
                          'p-2 rounded-lg',
                          trigger.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{trigger.name}</h3>
                            <Badge variant="outline" className="text-xs font-mono">{trigger.eventType}</Badge>
                            {trigger.isActive && (
                              <Badge variant="default" className="text-xs">Actif</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{trigger.description}</p>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                            <span>{trigger.triggerCount} déclenchements</span>
                            {trigger.lastTriggered && <span>Dernier: {trigger.lastTriggered}</span>}
                          </div>
                          {trigger.conditions.length > 0 && (
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {trigger.conditions.map((c, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={trigger.isActive}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: trigger.id, isActive: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ChannablePageWrapper>
    </>
  );
}