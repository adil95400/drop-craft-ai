/**
 * Timeline de suivi de colis - Style AutoDS
 * Affiche visuellement l'historique et les étapes de livraison
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, Truck, MapPin, CheckCircle2, Clock, 
  AlertCircle, Plane, Ship, Building, Home,
  ExternalLink, Copy, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
  isCompleted: boolean;
}

interface TrackingTimelineProps {
  trackingNumber?: string | null;
  carrier?: string;
  estimatedDelivery?: string;
  events?: TrackingEvent[];
  orderStatus?: string;
  originCountry?: string;
  destinationCountry?: string;
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// Étapes standard de livraison
const STANDARD_STEPS = [
  { key: 'ordered', label: 'Commandé', icon: Package },
  { key: 'processing', label: 'En préparation', icon: Building },
  { key: 'shipped', label: 'Expédié', icon: Truck },
  { key: 'in_transit', label: 'En transit', icon: Plane },
  { key: 'out_for_delivery', label: 'En livraison', icon: MapPin },
  { key: 'delivered', label: 'Livré', icon: Home },
];

const CARRIER_TRACKING_URLS: Record<string, string> = {
  '17track': 'https://t.17track.net/en#nums=',
  'cainiao': 'https://global.cainiao.com/detail.htm?mailNo=',
  'yanwen': 'https://track.yw56.com.cn/en-US/track?number=',
  'colissimo': 'https://www.laposte.fr/outils/suivre-vos-envois?code=',
  'chronopost': 'https://www.chronopost.fr/tracking-no-feedback?tracking=',
  'dhl': 'https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=',
  'ups': 'https://www.ups.com/track?tracknum=',
  'fedex': 'https://www.fedex.com/fedextrack/?trknbr=',
  'usps': 'https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=',
};

export function TrackingTimeline({
  trackingNumber,
  carrier = '17track',
  estimatedDelivery,
  events = [],
  orderStatus = 'pending',
  originCountry = 'Chine',
  destinationCountry = 'France',
  className,
  onRefresh,
  isRefreshing = false,
}: TrackingTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  // Déterminer l'étape actuelle basée sur le statut
  const currentStepIndex = useMemo(() => {
    const statusMap: Record<string, number> = {
      pending: 0,
      processing: 1,
      shipped: 2,
      in_transit: 3,
      out_for_delivery: 4,
      delivered: 5,
    };
    return statusMap[orderStatus] ?? 0;
  }, [orderStatus]);

  const copyTrackingNumber = () => {
    if (trackingNumber) {
      navigator.clipboard.writeText(trackingNumber);
      toast.success('Numéro de suivi copié');
    }
  };

  const openExternalTracking = () => {
    if (!trackingNumber) return;
    const baseUrl = CARRIER_TRACKING_URLS[carrier.toLowerCase()] || CARRIER_TRACKING_URLS['17track'];
    window.open(baseUrl + trackingNumber, '_blank');
  };

  const getStatusColor = () => {
    switch (orderStatus) {
      case 'delivered':
        return 'bg-green-500';
      case 'in_transit':
      case 'out_for_delivery':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'processing':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (orderStatus) {
      case 'delivered':
        return 'Livré';
      case 'out_for_delivery':
        return 'En cours de livraison';
      case 'in_transit':
        return 'En transit';
      case 'shipped':
        return 'Expédié';
      case 'processing':
        return 'En préparation';
      default:
        return 'En attente';
    }
  };

  // Simuler des événements si aucun n'est fourni
  const displayEvents = events.length > 0 ? events : generateMockEvents(orderStatus);

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Suivi de livraison
          </CardTitle>
          <Badge className={cn("text-white", getStatusColor())}>
            {getStatusLabel()}
          </Badge>
        </div>
        
        {trackingNumber && (
          <div className="flex items-center gap-2 mt-2">
            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
              {trackingNumber}
            </code>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyTrackingNumber}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openExternalTracking}>
              <ExternalLink className="h-4 w-4" />
            </Button>
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Route summary */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{originCountry}</span>
          </div>
          <div className="flex-1 mx-4 border-t border-dashed border-muted-foreground/30 relative">
            <Plane className="h-4 w-4 absolute left-1/2 -translate-x-1/2 -top-2 text-primary bg-background px-1" />
          </div>
          <div className="flex items-center gap-2">
            <span>{destinationCountry}</span>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Livraison estimée */}
        {estimatedDelivery && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Livraison estimée</span>
            </div>
            <span className="font-medium">
              {new Date(estimatedDelivery).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
        )}

        <Separator />

        {/* Timeline visuelle des étapes */}
        <div className="relative">
          <div className="flex justify-between">
            {STANDARD_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const StepIcon = step.icon;
              
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.2 : 1,
                      backgroundColor: isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted && index < currentStepIndex ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </motion.div>
                  <span className={cn(
                    "text-xs mt-2 text-center max-w-[60px]",
                    isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Ligne de connexion */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted -z-0">
            <motion.div
              initial={false}
              animate={{ width: `${(currentStepIndex / (STANDARD_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        <Separator />

        {/* Historique détaillé */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Historique détaillé</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Réduire' : 'Voir tout'}
            </Button>
          </div>
          
          <div className="relative pl-6 space-y-4">
            {/* Ligne verticale */}
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-muted" />
            
            {(expanded ? displayEvents : displayEvents.slice(0, 3)).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Point */}
                <div className={cn(
                  "absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2",
                  event.isCompleted 
                    ? "bg-primary border-primary" 
                    : "bg-background border-muted-foreground"
                )} />
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "font-medium text-sm",
                      event.isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {event.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action externe */}
        {trackingNumber && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={openExternalTracking}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Suivre sur {carrier || '17Track'}
          </Button>
        )}

        {/* Message si pas de tracking */}
        {!trackingNumber && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Numéro de suivi non disponible</p>
              <p className="text-xs text-muted-foreground">
                Le numéro de suivi sera ajouté une fois le colis expédié par le fournisseur.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Générer des événements de démonstration basés sur le statut
function generateMockEvents(status: string): TrackingEvent[] {
  const now = new Date();
  const events: TrackingEvent[] = [];
  
  const baseEvents = [
    { status: 'Commande reçue', description: 'La commande a été confirmée et transmise au fournisseur', offset: 0 },
    { status: 'En préparation', description: 'Le colis est en cours de préparation dans l\'entrepôt', offset: 1, location: 'Shenzhen, Chine' },
    { status: 'Expédié', description: 'Le colis a quitté l\'entrepôt du fournisseur', offset: 3, location: 'Shenzhen Airport, Chine' },
    { status: 'En transit international', description: 'Le colis est en route vers le pays de destination', offset: 5, location: 'En vol' },
    { status: 'Arrivé au pays de destination', description: 'Le colis est arrivé et en cours de dédouanement', offset: 10, location: 'Roissy CDG, France' },
    { status: 'En livraison', description: 'Le colis est en cours de livraison par le transporteur local', offset: 12, location: 'Centre de tri local' },
    { status: 'Livré', description: 'Le colis a été livré avec succès', offset: 13, location: 'Adresse de livraison' },
  ];

  const statusIndex: Record<string, number> = {
    pending: 0,
    processing: 1,
    shipped: 2,
    in_transit: 4,
    out_for_delivery: 5,
    delivered: 6,
  };

  const currentIndex = statusIndex[status] ?? 0;

  baseEvents.slice(0, currentIndex + 1).forEach((event, index) => {
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() - (baseEvents.length - index));
    
    events.push({
      id: `event-${index}`,
      status: event.status,
      description: event.description,
      location: event.location,
      timestamp: eventDate.toISOString(),
      isCompleted: index <= currentIndex,
    });
  });

  return events.reverse();
}

export default TrackingTimeline;
