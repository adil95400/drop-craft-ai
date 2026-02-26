import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useStockMovements } from '@/hooks/useStockManagement';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, RotateCcw, AlertTriangle, Package } from 'lucide-react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StockMovementsLogProps {
  limit?: number;
  compact?: boolean;
}

interface StockMovement {
  id: string;
  movement_type: 'inbound' | 'outbound' | 'transfer' | 'adjustment' | 'return';
  quantity: number;
  reason?: string;
  notes?: string;
  performed_by?: string;
  reference_id?: string;
  created_at: string;
}

export function StockMovementsLog({ limit = 50, compact = false }: StockMovementsLogProps) {
  const { data: movements = [], isLoading } = useStockMovements();
  
  const displayedMovements = movements.slice(0, limit) as StockMovement[];
  
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'inbound':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'outbound':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'transfer':
        return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
      case 'return':
        return <RotateCcw className="h-4 w-4 text-orange-500" />;
      case 'damage':
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getMovementLabel = (type: string) => {
    const labels: Record<string, string> = {
      inbound: 'Entrée',
      outbound: 'Sortie',
      transfer: 'Transfert',
      adjustment: 'Ajustement',
      return: 'Retour',
      damage: 'Dommage',
      expired: 'Périmé'
    };
    return labels[type] || type;
  };
  
  const getMovementColor = (type: string) => {
    switch (type) {
      case 'inbound':
      case 'return':
        return 'text-green-600';
      case 'outbound':
      case 'damage':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="h-8 w-8 bg-muted rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!displayedMovements || displayedMovements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucun mouvement enregistré</p>
      </div>
    );
  }
  
  if (compact) {
    return (
      <div className="space-y-3">
        {displayedMovements.slice(0, 5).map((movement) => (
          <div key={movement.id} className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-muted">
              {getMovementIcon(movement.movement_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getMovementLabel(movement.movement_type)}
                </Badge>
                <span className={`font-mono font-medium ${getMovementColor(movement.movement_type)}`}>
                  {movement.movement_type === 'inbound' || movement.movement_type === 'return' ? '+' : '-'}
                  {movement.quantity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {movement.reason || 'Sans description'}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(movement.created_at), 'HH:mm', { locale: getDateFnsLocale() })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique des mouvements</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {displayedMovements.map((movement) => (
              <div key={movement.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-muted flex-shrink-0">
                    {getMovementIcon(movement.movement_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">
                        {getMovementLabel(movement.movement_type)}
                      </Badge>
                      <span className={`font-mono font-bold ${getMovementColor(movement.movement_type)}`}>
                        {movement.movement_type === 'inbound' || movement.movement_type === 'return' ? '+' : '-'}
                        {movement.quantity} unités
                      </span>
                    </div>
                    <p className="text-sm mt-1">{movement.reason || 'Pas de description'}</p>
                    {movement.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{movement.notes}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(movement.created_at), 'dd MMM yyyy à HH:mm', { locale: getDateFnsLocale() })}
                      </span>
                      {movement.performed_by && (
                        <span>Par: {movement.performed_by}</span>
                      )}
                      {movement.reference_id && (
                        <span>Réf: {movement.reference_id}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
