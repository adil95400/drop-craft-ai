import { memo, ReactNode } from 'react';
import { useGlobalPerformanceMonitor } from '@/hooks/useGlobalPerformanceMonitor';
import { PerformanceMonitorWidget } from '@/components/monitoring/PerformanceMonitorWidget';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

interface PerformanceProviderProps {
  children: ReactNode;
  showWidget?: boolean;
}

export const PerformanceProvider = memo(function PerformanceProvider({
  children,
  showWidget = false,
}: PerformanceProviderProps) {
  // Active le monitoring global
  useGlobalPerformanceMonitor();

  const isDev = import.meta.env.DEV;

  return (
    <>
      {children}
      
      {/* Widget de monitoring en dev mode ou si activé */}
      {(showWidget || isDev) && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
          <PerformanceMonitorWidget compact />
        </div>
      )}
    </>
  );
});

PerformanceProvider.displayName = 'PerformanceProvider';
