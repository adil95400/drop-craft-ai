import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleRefresh = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Une erreur s'est produite</h2>
            <p className="text-muted-foreground mb-6">
              Quelque chose s'est mal passé. Essayez de rafraîchir la page.
            </p>
            {this.state.error && (
              <details className="text-left mb-6 p-4 bg-muted rounded-md">
                <summary className="font-mono text-sm cursor-pointer">Détails de l'erreur</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <Button onClick={this.handleRefresh} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir la page
            </Button>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}