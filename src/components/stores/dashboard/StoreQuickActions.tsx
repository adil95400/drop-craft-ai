import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, RefreshCw, Settings, Activity, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StoreQuickActionsProps {
  onSync?: () => void;
  isSyncing?: boolean;
}

export function StoreQuickActions({ onSync, isSyncing }: StoreQuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Nouvelle Boutique',
      icon: Plus,
      onClick: () => navigate('/dashboard/stores/connect'),
      variant: 'default' as const,
    },
    {
      label: 'Multi-Store',
      icon: Settings,
      onClick: () => navigate('/dashboard/multi-store'),
      variant: 'outline' as const,
    },
    {
      label: 'Stock IA',
      icon: TrendingUp,
      onClick: () => navigate('/dashboard/stores/stock-intelligence'),
      variant: 'outline' as const,
    },
    {
      label: 'Synchronisation',
      icon: Activity,
      onClick: () => navigate('/dashboard/stores/sync'),
      variant: 'outline' as const,
    },
    {
      label: 'Synchroniser',
      icon: RefreshCw,
      onClick: onSync,
      variant: 'outline' as const,
      loading: isSyncing,
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Actions Rapides</h3>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            onClick={action.onClick}
            disabled={action.loading}
            className="w-full"
          >
            <action.icon className={`h-4 w-4 mr-2 ${action.loading ? 'animate-spin' : ''}`} />
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
