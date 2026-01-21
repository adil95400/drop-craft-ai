import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MapPin, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  productName: string;
  location: string;
  timeAgo: string;
  imageUrl?: string;
}

interface SocialProofNotificationProps {
  notifications?: Notification[];
  interval?: number;
  position?: 'bottom-left' | 'bottom-right';
  enabled?: boolean;
}

// Default notifications (can be replaced with real data)
const defaultNotifications: Notification[] = [
  { id: '1', productName: 'Sneakers Premium', location: 'Paris', timeAgo: '2 min', imageUrl: '' },
  { id: '2', productName: 'Montre Sport', location: 'Lyon', timeAgo: '5 min', imageUrl: '' },
  { id: '3', productName: 'Sac Élégant', location: 'Marseille', timeAgo: '8 min', imageUrl: '' },
  { id: '4', productName: 'T-shirt Classic', location: 'Bordeaux', timeAgo: '12 min', imageUrl: '' },
];

export const SocialProofNotification = ({
  notifications = defaultNotifications,
  interval = 8000,
  position = 'bottom-left',
  enabled = true
}: SocialProofNotificationProps) => {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [notificationIndex, setNotificationIndex] = useState(0);

  useEffect(() => {
    if (!enabled || dismissed || notifications.length === 0) return;

    const showNotification = () => {
      setCurrentNotification(notifications[notificationIndex]);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      // Advance to next notification
      setNotificationIndex((prev) => (prev + 1) % notifications.length);
    };

    // Initial delay before first notification
    const initialDelay = setTimeout(showNotification, 3000);

    // Regular interval for subsequent notifications
    const intervalId = setInterval(showNotification, interval);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(intervalId);
    };
  }, [notifications, interval, enabled, dismissed, notificationIndex]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
  };

  const positionClasses = {
    'bottom-left': 'left-4 bottom-4',
    'bottom-right': 'right-4 bottom-4'
  };

  return (
    <AnimatePresence>
      {isVisible && currentNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={cn(
            'fixed z-50 max-w-sm',
            positionClasses[position]
          )}
        >
          <div className="bg-card border shadow-lg rounded-lg p-4 flex items-center gap-3">
            {/* Product image or icon */}
            <div className="flex-shrink-0">
              {currentNotification.imageUrl ? (
                <img
                  src={currentNotification.imageUrl}
                  alt={currentNotification.productName}
                  className="w-12 h-12 rounded-md object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                Quelqu'un a acheté
              </p>
              <p className="text-sm text-primary font-semibold truncate">
                {currentNotification.productName}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {currentNotification.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Il y a {currentNotification.timeAgo}
                </span>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
