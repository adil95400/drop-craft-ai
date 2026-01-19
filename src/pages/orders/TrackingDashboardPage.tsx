import { useState } from 'react';
import { useRealtimeTracking, TrackingInfo } from '@/hooks/useRealtimeTracking';
import { TrackingList } from '@/components/tracking/TrackingList';
import { TrackingTimeline } from '@/components/tracking/TrackingTimeline';
import { TrackingStatsCards, DeliveryRateCard } from '@/components/tracking/TrackingStatsCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { 
  RefreshCw, 
  Bell, 
  Zap,
  ExternalLink,
  Copy,
  Mail,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function TrackingDashboardPage() {
  const { 
    trackingData, 
    stats, 
    isLoading, 
    syncSingle, 
    syncAll, 
    registerWebhook,
    isSyncing 
  } = useRealtimeTracking();
  
  const [selectedTracking, setSelectedTracking] = useState<TrackingInfo | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleSyncAll = () => {
    syncAll();
    toast.info('Synchronisation en cours...');
  };

  const handleRegisterWebhooks = () => {
    const pendingTrackings = trackingData
      .filter(t => t.status !== 'delivered' && t.status !== 'expired')
      .map(t => t.trackingNumber);
    
    if (pendingTrackings.length > 0) {
      registerWebhook(pendingTrackings);
    } else {
      toast.info('Aucun colis en cours à enregistrer');
    }
  };

  const handleViewDetails = (tracking: TrackingInfo) => {
    setSelectedTracking(tracking);
    setIsDetailOpen(true);
  };

  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    toast.success('Numéro de tracking copié');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Suivi Temps Réel</h1>
          <p className="text-muted-foreground">
            Tracking automatique avec 17Track • 2000+ transporteurs
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRegisterWebhooks}
          >
            <Bell className="mr-2 h-4 w-4" />
            Activer Notifications
          </Button>
          <Button 
            onClick={handleSyncAll}
            disabled={isSyncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Synchroniser Tout
          </Button>
        </div>
      </div>

      {/* Stats */}
      <TrackingStatsCards stats={stats} />

      {/* Delivery Rate + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DeliveryRateCard stats={stats} />
        
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleSyncAll}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync tous les colis
              </Button>
              <Button variant="outline" size="sm" onClick={handleRegisterWebhooks}>
                <Bell className="mr-2 h-4 w-4" />
                Activer alertes push
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://t.17track.net', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir 17Track
              </Button>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Astuce:</strong> Activez les notifications pour recevoir des alertes 
                automatiques lorsque le statut de vos colis change.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracking List */}
      <TrackingList
        trackingData={trackingData}
        isLoading={isLoading}
        onSync={syncSingle}
        onViewDetails={handleViewDetails}
        isSyncing={isSyncing}
      />

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedTracking && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  Commande #{selectedTracking.orderNumber}
                </SheetTitle>
                <SheetDescription>
                  Détails du suivi de colis
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Tracking Number */}
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Numéro de tracking</p>
                      <p className="font-mono font-medium">{selectedTracking.trackingNumber}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyTrackingNumber(selectedTracking.trackingNumber)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`https://t.17track.net/en#nums=${selectedTracking.trackingNumber}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Carrier Info */}
                <Card className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Transporteur</p>
                      <p className="font-medium">{selectedTracking.carrier}</p>
                    </div>
                    {selectedTracking.estimatedDelivery && (
                      <div>
                        <p className="text-xs text-muted-foreground">Livraison estimée</p>
                        <p className="font-medium">
                          {format(new Date(selectedTracking.estimatedDelivery), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Customer Info */}
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Client
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">{selectedTracking.customerName}</p>
                    {selectedTracking.customerEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {selectedTracking.customerEmail}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Timeline */}
                <TrackingTimeline 
                  events={selectedTracking.events} 
                  status={selectedTracking.status}
                />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => syncSingle(selectedTracking.trackingNumber)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Rafraîchir
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(`https://t.17track.net/en#nums=${selectedTracking.trackingNumber}`, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Voir sur 17Track
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
