import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrackingInfo } from '@/hooks/useRealtimeTracking';
import { TrackingStatusBadge } from './UnifiedTrackingTimeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  RefreshCw, 
  ExternalLink,
  Search,
  Copy,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TrackingListProps {
  trackingData: TrackingInfo[];
  isLoading: boolean;
  onSync: (trackingNumber: string) => void;
  onViewDetails: (tracking: TrackingInfo) => void;
  isSyncing?: boolean;
}

export function TrackingList({ 
  trackingData, 
  isLoading, 
  onSync, 
  onViewDetails,
  isSyncing 
}: TrackingListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const locale = useDateFnsLocale();

  const filteredData = trackingData.filter(track => {
    const matchesSearch = 
      track.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.carrier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || track.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusFilters = [
    { key: 'all', label: 'Tous', count: trackingData.length },
    { key: 'pending', label: 'En attente', count: trackingData.filter(t => t.status === 'pending' || t.status === 'info_received').length },
    { key: 'in_transit', label: 'En transit', count: trackingData.filter(t => t.status === 'in_transit').length },
    { key: 'out_for_delivery', label: 'Livraison', count: trackingData.filter(t => t.status === 'out_for_delivery').length },
    { key: 'delivered', label: 'Livrés', count: trackingData.filter(t => t.status === 'delivered').length },
    { key: 'exception', label: 'Problèmes', count: trackingData.filter(t => t.status === 'exception' || t.status === 'expired').length }
  ];

  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    toast.success('Numéro copié');
  };

  const openExternalTracking = (trackingNumber: string) => {
    window.open(`https://t.17track.net/en#nums=${trackingNumber}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Chargement des trackings...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par tracking, commande, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map(filter => (
              <Button
                key={filter.key}
                variant={statusFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter.key)}
                className="gap-1"
              >
                {filter.label}
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5">
                  {filter.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tracking list */}
      <div className="grid gap-3">
        {filteredData.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun tracking trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Aucun tracking ne correspond à votre recherche'
                : 'Aucun colis en cours de livraison'
              }
            </p>
          </Card>
        ) : (
          filteredData.map(track => (
            <Card 
              key={track.id} 
              className={cn(
                "p-4 transition-all hover:shadow-md cursor-pointer",
                track.status === 'delivered' && "border-green-500/30 bg-green-50/30 dark:bg-green-900/10",
                track.status === 'exception' && "border-red-500/30 bg-red-50/30 dark:bg-red-900/10"
              )}
              onClick={() => onViewDetails(track)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg",
                    track.status === 'delivered' 
                      ? "bg-green-100 dark:bg-green-900/30" 
                      : track.status === 'exception'
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-primary/10"
                  )}>
                    <Truck className={cn(
                      "h-6 w-6",
                      track.status === 'delivered' 
                        ? "text-green-600 dark:text-green-400"
                        : track.status === 'exception'
                          ? "text-red-600 dark:text-red-400"
                          : "text-primary"
                    )} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold">#{track.orderNumber}</span>
                      <TrackingStatusBadge status={track.status} />
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <span className="font-mono truncate">{track.trackingNumber}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyTrackingNumber(track.trackingNumber);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>📦 {track.carrier}</span>
                      <span>👤 {track.customerName}</span>
                      {track.estimatedDelivery && (
                        <span>📅 Prévu: {format(new Date(track.estimatedDelivery), 'dd MMM', { locale })}</span>
                      )}
                      <span>🕐 MAJ: {format(new Date(track.lastUpdate), 'dd/MM HH:mm', { locale })}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSync(track.trackingNumber);
                    }}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openExternalTracking(track.trackingNumber);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(track);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
