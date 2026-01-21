import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Flame, Zap, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UrgencyBannerProps {
  message?: string;
  endTime?: Date;
  type?: 'countdown' | 'stock' | 'flash';
  stockCount?: number;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
}

export const UrgencyBanner = ({
  message = 'Offre limitée !',
  endTime,
  type = 'countdown',
  stockCount = 5,
  onDismiss,
  dismissible = true,
  className
}: UrgencyBannerProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (type !== 'countdown' || !endTime) return;

    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, type]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const getIcon = () => {
    switch (type) {
      case 'countdown':
        return <Timer className="h-4 w-4" />;
      case 'stock':
        return <Flame className="h-4 w-4" />;
      case 'flash':
        return <Zap className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getBgClass = () => {
    switch (type) {
      case 'countdown':
        return 'bg-gradient-to-r from-primary to-primary/80';
      case 'stock':
        return 'bg-gradient-to-r from-destructive to-destructive/80';
      case 'flash':
        return 'bg-gradient-to-r from-amber-500 to-orange-500';
      default:
        return 'bg-primary';
    }
  };

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'w-full text-white overflow-hidden',
            getBgClass(),
            className
          )}
        >
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-3 relative">
            {/* Icon */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {getIcon()}
            </motion.div>

            {/* Message */}
            <span className="text-sm font-medium">{message}</span>

            {/* Countdown or Stock info */}
            {type === 'countdown' && (
              <div className="flex items-center gap-1 text-sm font-bold">
                <span className="bg-white/20 px-2 py-0.5 rounded">
                  {formatNumber(timeLeft.hours)}h
                </span>
                <span>:</span>
                <span className="bg-white/20 px-2 py-0.5 rounded">
                  {formatNumber(timeLeft.minutes)}m
                </span>
                <span>:</span>
                <span className="bg-white/20 px-2 py-0.5 rounded">
                  {formatNumber(timeLeft.seconds)}s
                </span>
              </div>
            )}

            {type === 'stock' && (
              <span className="text-sm font-bold bg-white/20 px-3 py-0.5 rounded-full">
                Plus que {stockCount} en stock !
              </span>
            )}

            {type === 'flash' && (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-sm font-bold"
              >
                ⚡ Vente Flash ⚡
              </motion.span>
            )}

            {/* Dismiss button */}
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="absolute right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
