/**
 * Unified Loading States
 * Wrapper pour unifier tous les états de chargement de l'application
 * Remplace les multiples implémentations de skeleton loaders
 */
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  CardSkeleton,
  TableSkeleton,
  StatsGridSkeleton,
  ProductCardSkeleton,
  DashboardSkeleton,
  FormSkeleton,
  WidgetSkeleton,
  ListItemSkeleton,
} from './consistent-skeleton';
import { ContextualEmptyState } from '@/components/common/ContextualEmptyState';
import { Loader2 } from 'lucide-react';

type LoadingVariant = 
  | 'card' 
  | 'table' 
  | 'stats' 
  | 'products' 
  | 'dashboard' 
  | 'form' 
  | 'widget' 
  | 'list'
  | 'spinner'
  | 'inline';

type EmptyVariant = 'products' | 'orders' | 'customers' | 'stores' | 'suppliers' | 'custom';

interface UnifiedLoadingProps {
  loading: boolean;
  error?: Error | null;
  empty?: boolean;
  children: ReactNode;
  // Loading customization
  loadingVariant?: LoadingVariant;
  loadingCount?: number;
  loadingClassName?: string;
  // Empty state customization
  emptyVariant?: EmptyVariant;
  emptyTitle?: string;
  emptyDescription?: string;
  // Error customization
  onRetry?: () => void;
  className?: string;
}

export function UnifiedLoading({
  loading,
  error,
  empty = false,
  children,
  loadingVariant = 'card',
  loadingCount = 3,
  loadingClassName,
  emptyVariant = 'custom',
  emptyTitle = 'Aucun élément',
  emptyDescription = 'Aucune donnée à afficher pour le moment.',
  onRetry,
  className,
}: UnifiedLoadingProps) {
  // Error state
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 px-6', className)}>
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Une erreur est survenue</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          {error.message || 'Impossible de charger les données.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn(loadingClassName, className)}>
        <LoadingSkeleton variant={loadingVariant} count={loadingCount} />
      </div>
    );
  }

  // Empty state
  if (empty) {
    return (
      <ContextualEmptyState
        type={emptyVariant}
        title={emptyVariant === 'custom' ? emptyTitle : undefined}
        description={emptyVariant === 'custom' ? emptyDescription : undefined}
        className={className}
      />
    );
  }

  // Normal content
  return <>{children}</>;
}

// Internal loading skeleton renderer
function LoadingSkeleton({ 
  variant, 
  count 
}: { 
  variant: LoadingVariant; 
  count: number;
}) {
  switch (variant) {
    case 'card':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      );
    case 'table':
      return <TableSkeleton rows={count} />;
    case 'stats':
      return <StatsGridSkeleton count={count} />;
    case 'products':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      );
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'form':
      return <FormSkeleton />;
    case 'widget':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <WidgetSkeleton key={i} />
          ))}
        </div>
      );
    case 'list':
      return (
        <div className="space-y-2">
          {Array.from({ length: count }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      );
    case 'spinner':
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    case 'inline':
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      );
    default:
      return <CardSkeleton />;
  }
}

// Inline loading spinner for buttons and small areas
export function InlineLoader({ 
  text = 'Chargement...', 
  className 
}: { 
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

// Full page loading overlay
export function PageLoader({ 
  message = 'Chargement en cours...' 
}: { 
  message?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-muted animate-pulse" />
          <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

export default UnifiedLoading;
