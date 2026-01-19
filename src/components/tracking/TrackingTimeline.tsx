import { TrackingEvent } from '@/hooks/useRealtimeTracking';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TrackingTimelineProps {
  events: TrackingEvent[];
  status: string;
  className?: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  'pending': <Clock className="h-4 w-4" />,
  'info_received': <Info className="h-4 w-4" />,
  'in_transit': <Truck className="h-4 w-4" />,
  'out_for_delivery': <MapPin className="h-4 w-4" />,
  'delivered': <CheckCircle className="h-4 w-4" />,
  'exception': <AlertTriangle className="h-4 w-4" />,
  'expired': <AlertTriangle className="h-4 w-4" />
};

const statusColors: Record<string, string> = {
  'pending': 'bg-muted text-muted-foreground',
  'info_received': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'in_transit': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'out_for_delivery': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'delivered': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'exception': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'expired': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
};

export function TrackingTimeline({ events, status, className }: TrackingTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Package className="h-5 w-5" />
          <span>Aucun événement de suivi disponible</span>
        </div>
      </Card>
    );
  }

  // Progress steps for visual tracking
  const progressSteps = [
    { key: 'info_received', label: 'Info reçue', icon: Info },
    { key: 'in_transit', label: 'En transit', icon: Truck },
    { key: 'out_for_delivery', label: 'Livraison', icon: MapPin },
    { key: 'delivered', label: 'Livré', icon: CheckCircle }
  ];

  const currentStepIndex = progressSteps.findIndex(step => step.key === status);
  const activeStep = status === 'exception' || status === 'expired' 
    ? -1 
    : currentStepIndex;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-muted -translate-y-1/2 z-0" />
          
          {/* Progress line */}
          <div 
            className="absolute left-0 top-1/2 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
            style={{ 
              width: activeStep >= 0 
                ? `${(activeStep / (progressSteps.length - 1)) * 100}%` 
                : '0%' 
            }}
          />
          
          {/* Steps */}
          {progressSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index <= activeStep;
            const isCurrent = index === activeStep;
            
            return (
              <div 
                key={step.key}
                className={cn(
                  "relative z-10 flex flex-col items-center gap-2",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isActive 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "bg-background border-muted",
                    isCurrent && "ring-4 ring-primary/20"
                  )}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center whitespace-nowrap">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Exception/Error state */}
        {(status === 'exception' || status === 'expired') && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                {status === 'exception' ? 'Problème de livraison signalé' : 'Tracking expiré'}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Timeline events */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Historique des événements
        </h4>
        
        <div className="space-y-1">
          {events.map((event, index) => (
            <div 
              key={index}
              className={cn(
                "relative pl-6 pb-4",
                index !== events.length - 1 && "border-l-2 border-muted ml-2"
              )}
            >
              {/* Timeline dot */}
              <div 
                className={cn(
                  "absolute left-0 w-4 h-4 rounded-full -translate-x-1/2 border-2",
                  index === 0 
                    ? "bg-primary border-primary" 
                    : "bg-background border-muted"
                )}
              />
              
              <div className="ml-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={cn(
                      "font-medium text-sm",
                      index === 0 && "text-primary"
                    )}>
                      {event.description || event.status}
                    </p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {event.timestamp 
                      ? format(new Date(event.timestamp), 'dd MMM HH:mm', { locale: fr })
                      : 'N/A'
                    }
                  </time>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function TrackingStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    'pending': 'En attente',
    'info_received': 'Info reçue',
    'in_transit': 'En transit',
    'out_for_delivery': 'Livraison',
    'delivered': 'Livré',
    'exception': 'Problème',
    'expired': 'Expiré'
  };

  return (
    <Badge className={cn("gap-1", statusColors[status] || statusColors.pending)}>
      {statusIcons[status] || statusIcons.pending}
      {labels[status] || status}
    </Badge>
  );
}
