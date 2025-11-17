import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, RefreshCw, Settings, BarChart3 } from 'lucide-react';
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
      label: 'Synchroniser Tout',
      icon: RefreshCw,
      onClick: onSync,
      variant: 'outline' as const,
      loading: isSyncing,
    },
    {
      label: 'Intégrations',
      icon: Settings,
      onClick: () => navigate('/dashboard/stores/integrations'),
      variant: 'outline' as const,
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      onClick: () => navigate('/dashboard/analytics'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Actions Rapides</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
