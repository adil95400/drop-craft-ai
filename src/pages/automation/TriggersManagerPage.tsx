/**
 * Triggers Manager - Gestion des déclencheurs d'automatisation
 * Permet de créer et gérer les événements qui lancent les workflows
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Play, Plus, Search, Zap, ShoppingCart, Package,
  DollarSign, AlertTriangle, Mail, Clock, RefreshCw,
  CheckCircle2, XCircle, MoreVertical, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Trigger {
  id: string;
  name: string;
  eventType: string;
  icon: typeof Zap;
  description: string;
  isActive: boolean;
  linkedWorkflows: number;
  triggerCount: number;
  lastTriggered: string | null;
  conditions: string[];
  category: string;
}

const MOCK_TRIGGERS: Trigger[] = [
  {
    id: '1', name: 'Nouvelle commande', eventType: 'order.created',
    icon: ShoppingCart, description: 'Se déclenche quand une nouvelle commande est reçue',
    isActive: true, linkedWorkflows: 3, triggerCount: 245,
    lastTriggered: 'Il y a 2 min', conditions: ['Montant > 50€'], category: 'orders'
  },
  {
    id: '2', name: 'Stock bas', eventType: 'inventory.low',
    icon: Package, description: 'Alerte quand le stock passe sous le seuil configuré',
    isActive: true, linkedWorkflows: 2, triggerCount: 18,
    lastTriggered: 'Il y a 1h', conditions: ['Stock < 5 unités'], category: 'inventory'
  },
  {
    id: '3', name: 'Prix concurrent modifié', eventType: 'competitor.price_change',
    icon: DollarSign, description: 'Détecte les changements de prix chez les concurrents',
    isActive: true, linkedWorkflows: 1, triggerCount: 67,
    lastTriggered: 'Il y a 30 min', conditions: ['Variation > 5%'], category: 'pricing'
  },
  {
    id: '4', name: 'Panier abandonné', eventType: 'cart.abandoned',
    icon: AlertTriangle, description: 'Détecte les paniers abandonnés après 30 minutes',
    isActive: false, linkedWorkflows: 1, triggerCount: 412,
    lastTriggered: 'Il y a 3h', conditions: ['Délai > 30 min', 'Montant > 20€'], category: 'marketing'
  },
  {
    id: '5', name: 'Avis client reçu', eventType: 'review.created',
    icon: Mail, description: 'Notification quand un client laisse un avis',
    isActive: true, linkedWorkflows: 1, triggerCount: 34,
    lastTriggered: 'Il y a 45 min', conditions: ['Note < 3 étoiles'], category: 'customers'
  },
  {
    id: '6', name: 'Sync boutique échouée', eventType: 'sync.failed',
    icon: RefreshCw, description: 'Alerte en cas d\'échec de synchronisation avec une boutique',
    isActive: true, linkedWorkflows: 2, triggerCount: 5,
    lastTriggered: 'Il y a 2 jours', conditions: ['3 échecs consécutifs'], category: 'integrations'
  },
  {
    id: '7', name: 'Planifié (Cron)', eventType: 'schedule.cron',
    icon: Clock, description: 'Exécution planifiée à intervalle régulier',
    isActive: true, linkedWorkflows: 4, triggerCount: 730,
    lastTriggered: 'Il y a 15 min', conditions: ['Toutes les 15 min'], category: 'system'
  },
];

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

export default function TriggersManagerPage() {
  const [triggers, setTriggers] = useState(MOCK_TRIGGERS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const toggleTrigger = (id: string) => {
    setTriggers(prev => prev.map(t =>
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
  };

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
        title="Déclencheurs"
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
              <div className="text-sm text-muted-foreground">Workflows liés</div>
              <div className="text-2xl font-bold text-foreground">{triggers.reduce((s, t) => s + t.linkedWorkflows, 0)}</div>
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
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Nouveau
          </Button>
        </div>

        {/* Liste */}
        <div className="space-y-3">
          {filtered.map(trigger => {
            const Icon = trigger.icon;
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
                          <span>{trigger.linkedWorkflows} workflow(s)</span>
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
                      onCheckedChange={() => toggleTrigger(trigger.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ChannablePageWrapper>
    </>
  );
}
