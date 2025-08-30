import React from 'react';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';

type Props = { 
  adminOnly?: boolean;
}

export function RQDevtools({ adminOnly }: Props) {
  const { isAdmin, loading } = useEnhancedAuth();
  const enabled = import.meta.env.VITE_ENABLE_RQ_DEVTOOLS === 'true';
  const canShow = enabled && (!adminOnly || isAdmin);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!canShow || loading) return;
    
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'd') {
        setVisible(v => !v);
      }
    };
    
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canShow, loading]);

  const Devtools = React.useMemo(
    () => canShow && !loading 
      ? React.lazy(() => 
          import('@tanstack/react-query-devtools').then(m => ({ 
            default: m.ReactQueryDevtools 
          }))
        ) 
      : null,
    [canShow, loading]
  );

  if (!canShow || !Devtools || loading) return null;

  return (
    <React.Suspense fallback={null}>
      {visible && (
        <Devtools 
          initialIsOpen={false} 
          position="bottom"
        />
      )}
    </React.Suspense>
  );
}