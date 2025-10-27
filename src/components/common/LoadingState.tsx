import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = 'Chargement...' }: LoadingStateProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
      <div className="text-center space-y-4 animate-scale-in">
        <div className="relative">
          <div className="absolute inset-0 blur-xl opacity-30">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary relative" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse-subtle">{message}</p>
      </div>
    </div>
  );
};