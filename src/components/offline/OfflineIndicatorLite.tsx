import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorLiteProps {
  className?: string;
}

/**
 * Lightweight offline indicator without framer-motion for initial page load
 * This component is used to show offline status without loading heavy animation libraries
 */
export function OfflineIndicatorLite({ className }: OfflineIndicatorLiteProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      // Hide after a short delay when back online
      setTimeout(() => setIsVisible(false), 2000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and not recently changed
  if (isOnline && !isVisible) return null;

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300',
        isOnline ? 'bg-success/10' : 'bg-destructive/10',
        isVisible ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0',
        className
      )}
    >
      <div className="container mx-auto px-4 py-2 flex items-center gap-3">
        <WifiOff className="h-4 w-4 text-destructive" />
        <div>
          <p className="text-sm font-medium text-destructive">
            {isOnline 
              ? 'Connexion rétablie'
              : 'Vous êtes hors ligne'}
          </p>
          {!isOnline && (
            <p className="text-xs text-muted-foreground">
              Les modifications seront synchronisées automatiquement
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
