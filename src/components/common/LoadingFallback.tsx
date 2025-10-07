import { Loader2 } from 'lucide-react'

export const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Chargement...</p>
    </div>
  </div>
)

export const PageLoadingFallback = () => (
  <div className="flex items-center justify-center h-full py-12">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Chargement du contenu...</p>
    </div>
  </div>
)
