import { useState } from 'react';
import { useTrackingSync } from '@/hooks/useTrackingSync';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Package, Truck, MapPin, CheckCircle, Clock, RefreshCw, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TrackingDashboardPage() {
  const { toast } = useToast();
  const { trackingData, isLoading, syncAll, enableAutoTracking } = useTrackingSync();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTracking = trackingData?.filter((track: any) =>
    track.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      in_transit: Truck,
      out_for_delivery: MapPin,
      delivered: CheckCircle,
      failed: Package
    };
    return icons[status] || Package;
  };

  const handleSyncAll = async () => {
    try {
      syncAll();
      toast({
        title: "✅ Synchronisation lancée",
        description: "Mise à jour de tous les numéros de tracking en cours"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de synchroniser les trackings",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tracking Automatique</h1>
          <p className="text-muted-foreground">Suivez automatiquement vos expéditions</p>
        </div>
        <Button onClick={handleSyncAll}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Tous
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="Rechercher par commande ou numéro de tracking..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      {/* Tracking List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement des trackings...</p>
          </Card>
        ) : filteredTracking.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun tracking</h3>
            <p className="text-muted-foreground">Aucun tracking ne correspond à vos critères</p>
          </Card>
        ) : (
          filteredTracking.map((track: any) => {
            const StatusIcon = getStatusIcon(track.delivery_status);
            return (
              <Card key={track.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                      <StatusIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{track.order_id || 'N/A'}</h3>
                        <Badge variant="outline">
                          {track.tracking_number || 'Pas de tracking'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Transporteur: {track.carrier || 'N/A'}</p>
                        <p>Statut: {track.delivery_status || 'pending'}</p>
                        <p>Dernière MAJ: {track.last_update_at ? format(new Date(track.last_update_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                        {track.estimated_delivery_date && (
                          <p>Livraison estimée: {format(new Date(track.estimated_delivery_date), 'dd/MM/yyyy')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSyncAll}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
