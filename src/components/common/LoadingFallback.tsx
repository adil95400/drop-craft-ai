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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="flex flex-col items-center gap-4 animate-scale-in">
        <div className="relative">
          <div className="absolute inset-0 blur-xl opacity-30">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
        </div>
        <p className="text-sm text-muted-foreground font-medium animate-pulse-subtle">{message}</p>
      </div>
    </div>
  );
};

export const PageLoadingFallback = () => (
  <div className="flex items-center justify-center h-full py-12 animate-fade-in">
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 blur-lg opacity-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary relative" />
      </div>
      <p className="text-sm text-muted-foreground font-medium animate-pulse-subtle">Chargement du contenu...</p>
    </div>
  </div>
);
