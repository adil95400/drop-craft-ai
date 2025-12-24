import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DollarSign, ShoppingCart, Users, Package, AlertCircle, BarChart3, Target, Globe, Wallet, Activity, Megaphone, Truck, ArrowLeftRight } from 'lucide-react';
import { useDashboardConfig, DashboardWidgetConfig } from '@/hooks/useDashboardConfig';

interface WidgetLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const availableWidgets = [
  {
    id: 'revenue',
    type: 'revenue' as const,
    title: 'Revenus',
    description: 'Visualisez vos revenus avec graphiques et tendances',
    icon: DollarSign,
    color: 'text-green-500',
    defaultSize: 'lg' as const,
  },
  {
    id: 'orders',
    type: 'orders' as const,
    title: 'Commandes',
    description: 'Suivi du nombre et statut des commandes',
    icon: ShoppingCart,
    color: 'text-blue-500',
    defaultSize: 'md' as const,
  },
  {
    id: 'customers',
    type: 'customers' as const,
    title: 'Clients',
    description: 'Analyse de la base clients et acquisition',
    icon: Users,
    color: 'text-orange-500',
    defaultSize: 'md' as const,
  },
  {
    id: 'conversion',
    type: 'conversion' as const,
    title: 'Taux de conversion',
    description: 'Mesurez votre taux de conversion visiteurs/acheteurs',
    icon: Target,
    color: 'text-purple-500',
    defaultSize: 'sm' as const,
  },
  {
    id: 'topProducts',
    type: 'topProducts' as const,
    title: 'Top Produits',
    description: 'Vos produits les plus vendus',
    icon: BarChart3,
    color: 'text-indigo-500',
    defaultSize: 'lg' as const,
  },
  {
    id: 'inventory',
    type: 'inventory' as const,
    title: 'Inventaire',
    description: 'État des stocks et alertes rupture',
    icon: Package,
    color: 'text-amber-500',
    defaultSize: 'md' as const,
  },
  {
    id: 'alerts',
    type: 'alerts' as const,
    title: 'Alertes',
    description: 'Notifications et alertes importantes',
    icon: AlertCircle,
    color: 'text-red-500',
    defaultSize: 'md' as const,
  },
  {
    id: 'traffic',
    type: 'traffic' as const,
    title: 'Trafic',
    description: 'Visiteurs, pages vues et sources de trafic',
    icon: Globe,
    color: 'text-cyan-500',
    defaultSize: 'lg' as const,
  },
  {
    id: 'profit',
    type: 'profit' as const,
    title: 'Marges & Profits',
    description: 'Analyse des marges et rentabilité',
    icon: Wallet,
    color: 'text-emerald-500',
    defaultSize: 'md' as const,
  },
  {
    id: 'recentActivity',
    type: 'recentActivity' as const,
    title: 'Activité récente',
    description: 'Flux en temps réel des événements',
    icon: Activity,
    color: 'text-pink-500',
    defaultSize: 'md' as const,
  },
  {
    id: 'goals',
    type: 'goals' as const,
    title: 'Objectifs',
    description: 'Suivi de vos objectifs commerciaux',
    icon: Target,
    color: 'text-yellow-500',
    defaultSize: 'md' as const,
  },
  {
    id: 'marketing',
    type: 'marketing' as const,
    title: 'Marketing',
    description: 'Performance des campagnes publicitaires',
    icon: Megaphone,
    color: 'text-violet-500',
    defaultSize: 'lg' as const,
  },
  {
    id: 'shipping',
    type: 'shipping' as const,
    title: 'Expéditions',
    description: 'Suivi des livraisons et retours',
    icon: Truck,
    color: 'text-sky-500',
    defaultSize: 'md' as const,
  },
  {
    id: 'comparison',
    type: 'comparison' as const,
    title: 'Comparaison',
    description: 'Comparez les périodes pour analyser la croissance',
    icon: ArrowLeftRight,
    color: 'text-indigo-500',
    defaultSize: 'lg' as const,
  },
];

export function WidgetLibrary({ open, onOpenChange }: WidgetLibraryProps) {
  const { widgets, toggleWidget, addWidget } = useDashboardConfig();

  const isWidgetEnabled = (id: string) => {
    const widget = widgets.find(w => w.id === id);
    return widget?.enabled ?? false;
  };

  const handleToggleWidget = (widgetDef: typeof availableWidgets[0]) => {
    const existingWidget = widgets.find(w => w.id === widgetDef.id);
    
    if (existingWidget) {
      toggleWidget(widgetDef.id);
    } else {
      const newWidget: DashboardWidgetConfig = {
        id: widgetDef.id,
        type: widgetDef.type,
        title: widgetDef.title,
        enabled: true,
        position: widgets.length,
        size: widgetDef.defaultSize,
        settings: {
          showChart: true,
          showTrend: true,
        },
      };
      addWidget(newWidget);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bibliothèque de widgets</DialogTitle>
          <DialogDescription>
            Activez ou désactivez les widgets pour personnaliser votre tableau de bord
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {availableWidgets.map((widgetDef) => {
            const Icon = widgetDef.icon;
            const isEnabled = isWidgetEnabled(widgetDef.id);
            
            return (
              <Card
                key={widgetDef.id}
                className={`cursor-pointer transition-all ${isEnabled ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => handleToggleWidget(widgetDef)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-muted ${widgetDef.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base">{widgetDef.title}</CardTitle>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleToggleWidget(widgetDef)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    {widgetDef.description}
                  </CardDescription>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Taille: {widgetDef.defaultSize.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
