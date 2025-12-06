import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  variant?: 'banner' | 'badge' | 'minimal';
}

export function OfflineIndicator({ className, variant = 'banner' }: OfflineIndicatorProps) {
  const { isOnline, isSyncing, pendingCount, syncPendingActions } = useOfflineSync();

  if (variant === 'minimal') {
    return (
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn('flex items-center gap-2 text-destructive', className)}
          >
            <WifiOff className="h-4 w-4" />
            <span className="text-xs">Hors ligne</span>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <motion.div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            isOnline 
              ? 'bg-success/10 text-success' 
              : 'bg-destructive/10 text-destructive'
          )}
          animate={isSyncing ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: isSyncing ? Infinity : 0, duration: 1 }}
        >
          {isOnline ? (
            isSyncing ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                Sync...
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3" />
                En ligne
              </>
            )
          ) : (
            <>
              <CloudOff className="h-3 w-3" />
              Hors ligne
            </>
          )}
        </motion.div>
        
        {pendingCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-0.5 bg-warning/10 text-warning rounded-full text-xs font-medium"
          >
            {pendingCount} en attente
          </motion.span>
        )}
      </div>
    );
  }

  // Banner variant
  return (
    <AnimatePresence>
      {(!isOnline || pendingCount > 0) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={cn(
            'overflow-hidden',
            isOnline ? 'bg-warning/10' : 'bg-destructive/10',
            className
          )}
        >
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-warning" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <div>
                <p className={cn(
                  'text-sm font-medium',
                  isOnline ? 'text-warning' : 'text-destructive'
                )}>
                  {isOnline 
                    ? `${pendingCount} modification(s) en attente de synchronisation`
                    : 'Vous êtes hors ligne'}
                </p>
                {!isOnline && (
                  <p className="text-xs text-muted-foreground">
                    Les modifications seront synchronisées automatiquement
                  </p>
                )}
              </div>
            </div>
            
            {isOnline && pendingCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={syncPendingActions}
                disabled={isSyncing}
                className="gap-2"
              >
                <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
                {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
