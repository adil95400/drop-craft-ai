import React from 'react';
import { useSecureAdmin } from '@/hooks/useSecureAdmin';

type Props = { 
  adminOnly?: boolean;
}

export function RQDevtools({ adminOnly }: Props) {
  const { isAdmin, isLoading } = useSecureAdmin();
  const enabled = import.meta.env.VITE_ENABLE_RQ_DEVTOOLS === 'true';
  const canShow = enabled && (!adminOnly || isAdmin);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!canShow || isLoading) return;
    
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'd') {
        setVisible(v => !v);
      }
    };
    
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canShow, isLoading]);

  const Devtools = React.useMemo(
    () => canShow && !isLoading 
      ? React.lazy(() => 
          import('@tanstack/react-query-devtools').then(m => ({ 
            default: m.ReactQueryDevtools 
          }))
        ) 
      : null,
    [canShow, isLoading]
  );

  if (!canShow || !Devtools || isLoading) return null;

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