/**
 * Timeline de suivi de colis - Version unifiée
 * Combine les fonctionnalités avancées (animations, carrier URLs) avec les badges de statut
 * Consolidation v6.0
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, Truck, MapPin, CheckCircle2, Clock, 
  AlertCircle, Plane, Building, Home,
  ExternalLink, Copy, RefreshCw, AlertTriangle, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import type { TrackingEvent as BaseTrackingEvent } from '@/hooks/useRealtimeTracking';

// Extended interface supporting both simple and advanced usage
export interface TrackingEvent {
  id?: string;
  status: string;
  description?: string;
  location?: string;
  timestamp: string;
  isCompleted?: boolean;
}

interface UnifiedTrackingTimelineProps {
  trackingNumber?: string | null;
  carrier?: string;
  estimatedDelivery?: string;
  events?: TrackingEvent[] | BaseTrackingEvent[];
  status?: string;
  orderStatus?: string;
  originCountry?: string;
  destinationCountry?: string;
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  compact?: boolean;
}

// Étapes standard de livraison
const STANDARD_STEPS = [
  { key: 'ordered', label: 'Commandé', icon: Package },
  { key: 'processing', label: 'Préparation', icon: Building },
  { key: 'shipped', label: 'Expédié', icon: Truck },
  { key: 'in_transit', label: 'En transit', icon: Plane },
  { key: 'out_for_delivery', label: 'Livraison', icon: MapPin },
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

const statusColors: Record<string, string> = {
  'pending': 'bg-muted text-muted-foreground',
  'ordered': 'bg-muted text-muted-foreground',
  'info_received': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'processing': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'shipped': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'in_transit': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'out_for_delivery': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'delivered': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'exception': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'expired': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const statusLabels: Record<string, string> = {
  'pending': 'En attente',
  'ordered': 'Commandé',
  'info_received': 'Info reçue',
  'processing': 'En préparation',
  'shipped': 'Expédié',
  'in_transit': 'En transit',
  'out_for_delivery': 'En livraison',
  'delivered': 'Livré',
  'exception': 'Problème',
  'expired': 'Expiré',
};

export function TrackingStatusBadge({ status }: { status: string }) {
  const statusIcons: Record<string, React.ReactNode> = {
    'pending': <Clock className="h-3 w-3" />,
    'info_received': <Info className="h-3 w-3" />,
    'in_transit': <Truck className="h-3 w-3" />,
    'out_for_delivery': <MapPin className="h-3 w-3" />,
    'delivered': <CheckCircle2 className="h-3 w-3" />,
    'exception': <AlertTriangle className="h-3 w-3" />,
    'expired': <AlertTriangle className="h-3 w-3" />,
  };

  return (
    <Badge className={cn("gap-1", statusColors[status] || statusColors.pending)}>
      {statusIcons[status] || statusIcons.pending}
      {statusLabels[status] || status}
    </Badge>
  );
}

export function UnifiedTrackingTimeline({
  trackingNumber,
  carrier = '17track',
  estimatedDelivery,
  events = [],
  status,
  orderStatus,
  originCountry = 'Chine',
  destinationCountry = 'France',
  className,
  onRefresh,
  isRefreshing = false,
  compact = false,
}: UnifiedTrackingTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const currentStatus = orderStatus || status || 'pending';

  const currentStepIndex = useMemo(() => {
    const statusMap: Record<string, number> = {
      pending: 0,
      ordered: 0,
      processing: 1,
      info_received: 1,
      shipped: 2,
      in_transit: 3,
      out_for_delivery: 4,
      delivered: 5,
    };
    return statusMap[currentStatus] ?? 0;
  }, [currentStatus]);

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

  // Normalize events to unified format
  const normalizedEvents = useMemo(() => {
    return events.map((event, index) => ({
      id: (event as TrackingEvent).id || `event-${index}`,
      status: event.status,
      description: event.description || event.status,
      location: event.location,
      timestamp: event.timestamp,
      isCompleted: (event as TrackingEvent).isCompleted ?? true,
    }));
  }, [events]);

  // Empty state
  if (!events.length && !trackingNumber) {
    return (
      <Card className={cn("border-border/50", className)}>
        <CardContent className="py-8">
          <div className="flex items-center gap-3 text-muted-foreground justify-center">
            <Package className="h-5 w-5" />
            <span>Aucun suivi disponible</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-5 w-5 text-primary" />
            Suivi de livraison
          </CardTitle>
          <TrackingStatusBadge status={currentStatus} />
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
        {/* Route summary - only show if not compact */}
        {!compact && (
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
        )}

        {/* Estimated delivery */}
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

        {/* Visual timeline steps */}
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
                    }}
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors",
                      isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted && index < currentStepIndex ? (
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      <StepIcon className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </motion.div>
                  <span className={cn(
                    "text-[10px] md:text-xs mt-2 text-center max-w-[50px] md:max-w-[60px]",
                    isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Connection line */}
          <div className="absolute top-4 md:top-5 left-4 md:left-5 right-4 md:right-5 h-0.5 bg-muted -z-0">
            <motion.div
              initial={false}
              animate={{ width: `${(currentStepIndex / (STANDARD_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        {/* Detailed history */}
        {normalizedEvents.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Historique
                </h4>
                {normalizedEvents.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? 'Réduire' : `Voir tout (${normalizedEvents.length})`}
                  </Button>
                )}
              </div>
              
              <div className="relative pl-6 space-y-3">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-muted" />
                
                {(expanded ? normalizedEvents : normalizedEvents.slice(0, 3)).map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <div className={cn(
                      "absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2",
                      event.isCompleted 
                        ? "bg-primary border-primary" 
                        : "bg-background border-muted-foreground"
                    )} />
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "font-medium text-sm",
                          event.isCompleted ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {event.description}
                        </span>
                        <time className="text-xs text-muted-foreground whitespace-nowrap">
                          {event.timestamp 
                            ? format(new Date(event.timestamp), 'dd MMM HH:mm', { locale: getDateFnsLocale() })
                            : 'N/A'
                          }
                        </time>
                      </div>
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
          </>
        )}

        {/* External tracking button */}
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

        {/* No tracking warning */}
        {!trackingNumber && normalizedEvents.length === 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Numéro de suivi non disponible</p>
              <p className="text-xs text-muted-foreground">
                Le numéro de suivi sera ajouté une fois le colis expédié.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export as default and named for compatibility
export { UnifiedTrackingTimeline as TrackingTimeline };
export default UnifiedTrackingTimeline;
