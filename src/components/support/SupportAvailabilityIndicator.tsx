import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Users, Headphones, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SupportSchedule {
  day: string;
  start: number;
  end: number;
}

const SUPPORT_SCHEDULE: SupportSchedule[] = [
  { day: 'monday', start: 8, end: 20 },
  { day: 'tuesday', start: 8, end: 20 },
  { day: 'wednesday', start: 8, end: 20 },
  { day: 'thursday', start: 8, end: 20 },
  { day: 'friday', start: 8, end: 20 },
  { day: 'saturday', start: 9, end: 17 },
  { day: 'sunday', start: 10, end: 16 },
];

const VIP_SCHEDULE: SupportSchedule[] = [
  { day: 'monday', start: 0, end: 24 },
  { day: 'tuesday', start: 0, end: 24 },
  { day: 'wednesday', start: 0, end: 24 },
  { day: 'thursday', start: 0, end: 24 },
  { day: 'friday', start: 0, end: 24 },
  { day: 'saturday', start: 0, end: 24 },
  { day: 'sunday', start: 0, end: 24 },
];

export type SupportTier = 'free' | 'pro' | 'business' | 'enterprise';

interface SupportAvailabilityIndicatorProps {
  tier?: SupportTier;
  showDetails?: boolean;
}

export function SupportAvailabilityIndicator({ 
  tier = 'free',
  showDetails = true 
}: SupportAvailabilityIndicatorProps) {
  const { user } = useAuth();
  const [isHumanAvailable, setIsHumanAvailable] = useState(false);
  const [nextAvailableTime, setNextAvailableTime] = useState<string>('');
  const [currentAgents, setCurrentAgents] = useState(0);

  // Determine tier from user metadata if not provided
  const effectiveTier = tier || (user?.user_metadata?.plan?.toLowerCase() as SupportTier) || 'free';
  const isVIP = ['business', 'enterprise'].includes(effectiveTier);

  useEffect(() => {
    const checkAvailability = () => {
      const now = new Date();
      const dayIndex = now.getDay();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = days[dayIndex];
      const currentHour = now.getHours() + now.getMinutes() / 60;

      const schedule = isVIP ? VIP_SCHEDULE : SUPPORT_SCHEDULE;
      const todaySchedule = schedule.find(s => s.day === currentDay);

      if (todaySchedule && currentHour >= todaySchedule.start && currentHour < todaySchedule.end) {
        setIsHumanAvailable(true);
        // Fixed agent count based on tier (real count would come from backend)
        setCurrentAgents(isVIP ? 3 : 1);
      } else {
        setIsHumanAvailable(false);
        setCurrentAgents(0);
        
        // Calculate next available time
        let nextDay = dayIndex;
        let daysToCheck = 7;
        
        while (daysToCheck > 0) {
          const daySchedule = schedule.find(s => s.day === days[nextDay]);
          if (daySchedule) {
            if (nextDay === dayIndex && currentHour < daySchedule.start) {
              // Later today
              const hours = Math.floor(daySchedule.start);
              const minutes = Math.floor((daySchedule.start % 1) * 60);
              setNextAvailableTime(`Aujourd'hui à ${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') : '00'}`);
              break;
            } else if (nextDay !== dayIndex) {
              // Another day
              const nextDayName = days[nextDay].charAt(0).toUpperCase() + days[nextDay].slice(1);
              const hours = Math.floor(daySchedule.start);
              setNextAvailableTime(`${nextDayName} à ${hours}h00`);
              break;
            }
          }
          nextDay = (nextDay + 1) % 7;
          daysToCheck--;
        }
      }
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isVIP]);

  if (!showDetails) {
    return (
      <Badge 
        variant={isHumanAvailable ? "default" : "secondary"}
        className={isHumanAvailable ? "bg-green-500" : ""}
      >
        {isHumanAvailable ? "En ligne" : "Hors ligne"}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Support Humain</span>
          </div>
          <div className="flex items-center gap-2">
            {isVIP && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500">
                    <Crown className="h-3 w-3 mr-1" />
                    VIP 24/7
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Support prioritaire 24h/24, 7j/7</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Badge 
              variant={isHumanAvailable ? "default" : "secondary"}
              className={isHumanAvailable ? "bg-green-500 hover:bg-green-600" : ""}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${isHumanAvailable ? 'bg-white animate-pulse' : 'bg-muted-foreground'}`} />
              {isHumanAvailable ? "Disponible" : "Indisponible"}
            </Badge>
          </div>
        </div>

        {isHumanAvailable ? (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{currentAgents} agent{currentAgents > 1 ? 's' : ''} en ligne</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Temps de réponse : ~{isVIP ? '2' : '15'} min</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Prochain créneau : {nextAvailableTime}</span>
            </div>
            <p className="mt-1">
              L'assistant IA reste disponible 24/7 pour vous aider.
            </p>
          </div>
        )}

        {!isVIP && (
          <div className="text-xs text-amber-600 bg-amber-500/10 p-2 rounded mt-1">
            <Crown className="h-3 w-3 inline mr-1" />
            Passez au plan Business pour un support 24/7 prioritaire
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
