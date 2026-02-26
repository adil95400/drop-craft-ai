import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Package,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ArrowRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Return, useReturns } from '@/hooks/useReturns';
import { EnhancedReturnFlow } from './EnhancedReturnFlow';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'En attente', icon: <Clock className="h-4 w-4" />, variant: 'secondary' },
  approved: { label: 'Approuvé', icon: <CheckCircle className="h-4 w-4" />, variant: 'default' },
  received: { label: 'Reçu', icon: <Package className="h-4 w-4" />, variant: 'default' },
  inspecting: { label: 'Inspection', icon: <Eye className="h-4 w-4" />, variant: 'outline' },
  refunded: { label: 'Remboursé', icon: <RefreshCw className="h-4 w-4" />, variant: 'default' },
  completed: { label: 'Terminé', icon: <CheckCircle className="h-4 w-4" />, variant: 'default' },
  rejected: { label: 'Rejeté', icon: <XCircle className="h-4 w-4" />, variant: 'destructive' },
};

export function EnhancedReturnFlowWrapper() {
  const { returns, isLoading } = useReturns();
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter returns
  const filteredReturns = returns?.filter((r) => {
    const matchesSearch =
      r.rma_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Group returns by status
  const pendingReturns = filteredReturns.filter(r => r.status === 'pending');
  const inProgressReturns = filteredReturns.filter(r => 
    ['approved', 'received', 'inspecting'].includes(r.status)
  );
  const completedReturns = filteredReturns.filter(r => 
    ['refunded', 'completed', 'rejected'].includes(r.status)
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des retours...</p>
        </CardContent>
      </Card>
    );
  }

  if (!returns?.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <RotateCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Aucun retour</h3>
          <p className="text-muted-foreground">
            Les demandes de retour apparaîtront ici
          </p>
        </CardContent>
      </Card>
    );
  }

  const ReturnCard = ({ returnItem }: { returnItem: Return }) => {
    const statusConfig = STATUS_CONFIG[returnItem.status] || STATUS_CONFIG.pending;
    const itemCount = returnItem.items?.length || 0;
    const totalValue = returnItem.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setSelectedReturn(returnItem)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-mono font-bold">{returnItem.rma_number}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(returnItem.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
              </p>
            </div>
            <Badge variant={statusConfig.variant} className="flex items-center gap-1">
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>
          
          <p className="text-sm mb-2 line-clamp-1">{returnItem.reason}</p>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{itemCount} article{itemCount > 1 ? 's' : ''}</span>
            <span className="font-medium">{totalValue.toFixed(2)}€</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-3"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedReturn(returnItem);
            }}
          >
            Voir le détail
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Search and filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par RMA, commande ou raison..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'approved', 'received', 'inspecting', 'refunded', 'completed'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'all' ? 'Tous' : STATUS_CONFIG[status]?.label || status}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kanban-style columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold">En attente ({pendingReturns.length})</h3>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {pendingReturns.map((r) => (
                  <ReturnCard key={r.id} returnItem={r} />
                ))}
                {pendingReturns.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun retour en attente
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* In Progress column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">En cours ({inProgressReturns.length})</h3>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {inProgressReturns.map((r) => (
                  <ReturnCard key={r.id} returnItem={r} />
                ))}
                {inProgressReturns.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun retour en cours
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Completed column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Terminés ({completedReturns.length})</h3>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {completedReturns.map((r) => (
                  <ReturnCard key={r.id} returnItem={r} />
                ))}
                {completedReturns.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun retour terminé
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Détail du retour</SheetTitle>
          </SheetHeader>
          {selectedReturn && (
            <div className="mt-6">
              <EnhancedReturnFlow
                returnItem={selectedReturn}
                onClose={() => setSelectedReturn(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
