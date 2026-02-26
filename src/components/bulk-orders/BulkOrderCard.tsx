/**
 * Bulk Order Card Component
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BulkOrder } from '@/services/BulkOrdersService';
import { 
  Eye, Trash2, Send, Clock, CheckCircle, 
  Truck, XCircle, FileText, RefreshCw, Package
} from 'lucide-react';
import { useDeleteBulkSupplierOrder, useSubmitBulkSupplierOrder } from '@/hooks/useBulkSupplierOrders';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-500', icon: FileText },
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: Clock },
  processing: { label: 'Traitement', color: 'bg-blue-500', icon: RefreshCw },
  shipped: { label: 'Expédiée', color: 'bg-purple-500', icon: Truck },
  completed: { label: 'Terminée', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'bg-red-500', icon: XCircle },
};

interface BulkOrderCardProps {
  order: BulkOrder;
  onView: () => void;
}

export function BulkOrderCard({ order, onView }: BulkOrderCardProps) {
  const locale = useDateFnsLocale();
  const deleteMutation = useDeleteBulkSupplierOrder();
  const submitMutation = useSubmitBulkSupplierOrder();

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Order Info */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{order.order_number}</h3>
                <Badge className={`${statusConfig.color} text-white`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              {order.name && (
                <p className="text-sm text-muted-foreground">{order.name}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Créée {formatDistanceToNow(new Date(order.created_at), { locale, addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-lg font-bold">{order.total_items}</p>
              <p className="text-xs text-muted-foreground">Produits</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                {parseFloat(order.total_amount as any).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
              </p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </Button>
            
            {order.status === 'draft' && order.total_items > 0 && (
              <Button 
                size="sm"
                onClick={() => submitMutation.mutate(order.id)}
                disabled={submitMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Soumettre
              </Button>
            )}

            {order.status === 'draft' && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => deleteMutation.mutate(order.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
