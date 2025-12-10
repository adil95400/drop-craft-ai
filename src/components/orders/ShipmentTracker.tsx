// SHIPMENT TRACKER - Suivi d'expédition natif intégré
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

interface ShipmentInfo {
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

const CARRIERS = [
  { id: 'colissimo', name: 'Colissimo', logo: '📦' },
  { id: 'chronopost', name: 'Chronopost', logo: '⚡' },
  { id: 'ups', name: 'UPS', logo: '🟤' },
  { id: 'dhl', name: 'DHL', logo: '🟡' },
  { id: 'fedex', name: 'FedEx', logo: '🟣' },
  { id: 'mondial_relay', name: 'Mondial Relay', logo: '🔵' },
  { id: 'dpd', name: 'DPD', logo: '🔴' },
  { id: 'gls', name: 'GLS', logo: '🟢' },
];

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: Clock },
  in_transit: { label: 'En transit', color: 'bg-blue-500', icon: Truck },
  out_for_delivery: { label: 'En livraison', color: 'bg-purple-500', icon: MapPin },
  delivered: { label: 'Livré', color: 'bg-green-500', icon: CheckCircle2 },
  exception: { label: 'Exception', color: 'bg-red-500', icon: AlertCircle },
};

export default function ShipmentTracker() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shipment, setShipment] = useState<ShipmentInfo | null>(null);

  const trackShipment = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Veuillez entrer un numéro de suivi');
      return;
    }

    setIsLoading(true);
    
    // Simulation - En production, appel à l'API de suivi
    setTimeout(() => {
      setShipment({
        trackingNumber: trackingNumber,
        carrier: 'colissimo',
        status: 'in_transit',
        estimatedDelivery: '12 Déc 2025',
        events: [
          {
            date: '10 Déc 2025',
            time: '14:30',
            status: 'in_transit',
            location: 'Paris, France',
            description: 'Colis en cours de livraison vers le centre de distribution'
          },
          {
            date: '09 Déc 2025',
            time: '08:15',
            status: 'in_transit',
            location: 'Lyon, France',
            description: 'Colis parti du centre de tri'
          },
          {
            date: '08 Déc 2025',
            time: '16:45',
            status: 'pending',
            location: 'Marseille, France',
            description: 'Colis pris en charge par le transporteur'
          },
        ]
      });
      setIsLoading(false);
      toast.success('Informations de suivi récupérées');
    }, 1500);
  };

  const StatusIcon = shipment ? STATUS_CONFIG[shipment.status].icon : Package;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Suivi d'expédition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barre de recherche */}
        <div className="flex gap-2">
          <Input
            placeholder="Entrez le numéro de suivi..."
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && trackShipment()}
          />
          <Button onClick={trackShipment} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Transporteurs rapides */}
        <div className="flex flex-wrap gap-2">
          {CARRIERS.map((carrier) => (
            <Badge
              key={carrier.id}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10"
            >
              {carrier.logo} {carrier.name}
            </Badge>
          ))}
        </div>

        {/* Résultats du suivi */}
        {shipment && (
          <div className="space-y-4 animate-in fade-in-50">
            {/* En-tête du statut */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${STATUS_CONFIG[shipment.status].color}`}>
                  <StatusIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{STATUS_CONFIG[shipment.status].label}</p>
                  <p className="text-sm text-muted-foreground">
                    {shipment.trackingNumber}
                  </p>
                </div>
              </div>
              {shipment.estimatedDelivery && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Livraison estimée</p>
                  <p className="font-medium">{shipment.estimatedDelivery}</p>
                </div>
              )}
            </div>

            {/* Timeline des événements */}
            <ScrollArea className="h-[300px]">
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
                
                {shipment.events.map((event, index) => (
                  <div key={index} className="relative">
                    <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 border-background ${
                      index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`} />
                    
                    <div className="pl-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{event.date}</span>
                        <span>•</span>
                        <span>{event.time}</span>
                      </div>
                      <p className="font-medium">{event.description}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
