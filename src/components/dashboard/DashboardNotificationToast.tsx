import { Bell, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useModalContext } from '@/hooks/useModalHelpers';

interface NotificationToastProps {
  message: string;
  type: 'stock' | 'order' | 'error' | 'success';
  severity: 'warning' | 'info' | 'error' | 'success';
  onDismiss?: () => void;
}

export function DashboardNotificationToast({ 
  message, 
  type, 
  severity, 
  onDismiss 
}: NotificationToastProps) {
  const { openModal } = useModalContext();

  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const handleClick = () => {
    switch (type) {
      case 'stock':
        openModal('stockAdjustment', { 
          productName: 'iPhone 15 Pro', 
          currentStock: 5 
        });
        break;
      case 'order':
        openModal('tracking', { 
          orderNumber: 'ORD-2024-001' 
        });
        break;
      case 'error':
        openModal('settings');
        break;
      case 'success':
        openModal('createCampaign', { 
          templateType: 'celebration' 
        });
        break;
    }
    onDismiss?.();
  };

  const getActionText = () => {
    switch (type) {
      case 'stock':
        return 'Ajuster stock';
      case 'order':
        return 'Voir détails';
      case 'error':
        return 'Corriger';
      case 'success':
        return 'Partager';
      default:
        return 'Voir';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <span className="text-sm font-medium">{message}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              severity === 'error' ? 'destructive' : 
              severity === 'warning' ? 'secondary' : 
              severity === 'success' ? 'default' : 'outline'
            }>
              {severity}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClick}
              className="hover-scale"
            >
              {getActionText()}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}