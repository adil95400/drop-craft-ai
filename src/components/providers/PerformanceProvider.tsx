import { memo, ReactNode, lazy, Suspense } from 'react';
import { useUnifiedPerformance } from '@/hooks/useUnifiedPerformance';
import { PerformanceMonitorWidget } from '@/components/monitoring/PerformanceMonitorWidget';

const CoreWebVitalsWidget = lazy(() => 
  import('@/components/monitoring/CoreWebVitalsWidget').then(m => ({ default: m.CoreWebVitalsWidget }))
);

interface PerformanceProviderProps {
  children: ReactNode;
  showWidget?: boolean;
}

export const PerformanceProvider = memo(function PerformanceProvider({
  children,
  showWidget = false,
}: PerformanceProviderProps) {
  // Active le monitoring global
  useUnifiedPerformance({ 
    componentName: 'App',
    trackFPS: true,
    trackMemory: true 
  });

  const isDev = import.meta.env.DEV;

  return (
    <>
      {children}
      
      {/* Widget de monitoring en dev mode ou si activé */}
      {(showWidget || isDev) && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-auto flex flex-col gap-2">
          <PerformanceMonitorWidget compact />
          <Suspense fallback={null}>
            <CoreWebVitalsWidget className="w-64" />
          </Suspense>
        </div>
      )}
    </>
  );
});

PerformanceProvider.displayName = 'PerformanceProvider';
