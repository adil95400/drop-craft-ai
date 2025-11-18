/**
 * Optimized Error Boundary with Granular Error Handling
 * 
 * Features:
 * - Module-specific error boundaries
 * - Error recovery strategies
 * - User-friendly error messages
 * - Automatic error reporting to Sentry
 */

import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  module?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class OptimizedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { module, onError } = this.props;
    const { errorCount } = this.state;

    // Update error count
    this.setState({ errorInfo, errorCount: errorCount + 1 });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[ErrorBoundary${module ? ` - ${module}` : ''}]:`, error, errorInfo);
    }

    // Log to our logger
    logger.error(`Error in ErrorBoundary: ${module || 'unknown module'}`, error, {
      component: 'ErrorBoundary',
    });

    // Send to Sentry in production
    if (import.meta.env.PROD) {
      Sentry.withScope((scope) => {
        scope.setTag('error_boundary', module || 'unknown');
        scope.setContext('errorInfo', {
          componentStack: errorInfo.componentStack,
          errorCount: errorCount + 1,
        });
        Sentry.captureException(error);
      });
    }

    // Call custom error handler
    onError?.(error, errorInfo);

    // Auto-reset after 3 errors
    if (errorCount >= 2) {
      setTimeout(() => {
        this.handleReset();
      }, 3000);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    // Use window.location for full page reload to reset app state
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback, module, showDetails = false } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">
                    {errorCount > 1 ? 'Erreurs multiples détectées' : 'Une erreur est survenue'}
                  </CardTitle>
                  <CardDescription>
                    {module ? `Module: ${module}` : 'Une erreur inattendue s\'est produite'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-2">Message d'erreur:</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {error.message || 'Erreur inconnue'}
                  </p>
                </div>
              )}

              {showDetails && errorInfo && import.meta.env.DEV && (
                <details className="p-4 bg-muted rounded-lg">
                  <summary className="text-sm font-medium cursor-pointer mb-2">
                    Détails techniques (développement)
                  </summary>
                  <pre className="text-xs text-muted-foreground overflow-auto max-h-40 mt-2">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {errorCount > 1 && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-warning">
                    ⚠️ Cette erreur s'est produite {errorCount} fois. L'application va se recharger automatiquement.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="outline"
                >
                  Recharger la page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Accueil
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Notre équipe a été automatiquement notifiée de ce problème.
                {import.meta.env.PROD && ' Nous travaillons à le résoudre rapidement.'}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <OptimizedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </OptimizedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
