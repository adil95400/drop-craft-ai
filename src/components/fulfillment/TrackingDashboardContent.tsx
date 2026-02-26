import { useState } from 'react';
import { useRealtimeTracking, TrackingInfo } from '@/hooks/useRealtimeTracking';
import { TrackingList } from '@/components/tracking/TrackingList';
import { TrackingTimeline } from '@/components/tracking';
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
  User,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { toast } from 'sonner';

export function TrackingDashboardContent() {
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
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleRegisterWebhooks}
          disabled={isSyncing}
        >
          <Bell className="h-4 w-4 mr-2" />
          Activer Webhooks
        </Button>
        <Button 
          onClick={handleSyncAll}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Synchroniser
        </Button>
      </div>

      {/* Stats Cards */}
      <TrackingStatsCards stats={stats} />

      {/* Delivery Rate */}
      <DeliveryRateCard stats={stats} />

      {/* Features Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Tracking automatique</p>
                <p className="text-sm text-muted-foreground">2000+ transporteurs supportés via 17Track</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-background">
              Temps réel
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tracking List */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Colis en cours</span>
            <Badge variant="secondary">{trackingData?.length || 0} colis</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrackingList 
            trackingData={trackingData}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onSync={syncSingle}
          />
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Détails du Suivi
            </SheetTitle>
            <SheetDescription>
              Historique complet du colis
            </SheetDescription>
          </SheetHeader>
          
          {selectedTracking && (
            <div className="mt-6 space-y-6">
              {/* Tracking Number */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Numéro de suivi</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm font-mono">
                    {selectedTracking.trackingNumber}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyTrackingNumber(selectedTracking.trackingNumber)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => window.open(`https://t.17track.net/en#nums=${selectedTracking.trackingNumber}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Status & Carrier */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge className="mt-1">{selectedTracking.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transporteur</p>
                  <p className="font-medium mt-1">{selectedTracking.carrier || 'Auto-détecté'}</p>
                </div>
              </div>

              {/* Customer Info */}
              {selectedTracking.customerEmail && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Client
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedTracking.customerEmail}
                  </p>
                </div>
              )}

              {/* Estimated Delivery */}
              {selectedTracking.estimatedDelivery && (
                <div>
                  <p className="text-sm text-muted-foreground">Livraison estimée</p>
                  <p className="font-medium mt-1">
                    {format(new Date(selectedTracking.estimatedDelivery), 'PPP', { locale: getDateFnsLocale() })}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">Historique</p>
                <TrackingTimeline events={selectedTracking.events} status={selectedTracking.status} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
