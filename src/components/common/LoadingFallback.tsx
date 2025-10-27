import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingFallbackProps {
  variant?: 'spinner' | 'skeleton' | 'full';
  message?: string;
}

export const LoadingFallback = ({ 
  variant = 'full', 
  message = 'Chargement...' 
}: LoadingFallbackProps = {}) => {
  if (variant === 'skeleton') {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export const PageLoadingFallback = () => (
  <div className="flex items-center justify-center h-full py-12">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Chargement du contenu...</p>
    </div>
  </div>
);
