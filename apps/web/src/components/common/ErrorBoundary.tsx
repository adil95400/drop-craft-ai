import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-lg w-full shadow-floating">
            <CardContent className="text-center p-8 space-y-6">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-destructive to-warning rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="h-12 w-12 text-white" />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    Erreur inattendue
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Nous sommes désolés, une erreur inattendue s'est produite. 
                    Veuillez actualiser la page ou retourner à l'accueil.
                  </p>
                </div>
                
                {this.state.error && process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive font-mono text-left">
                      {this.state.error.message}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-gradient-primary hover:opacity-90 transition-all"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Actualiser
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="border-primary/20 hover:bg-primary/5"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}