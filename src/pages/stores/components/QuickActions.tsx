import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  Download, 
  Upload, 
  Settings, 
  BarChart3, 
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import { Store } from '@/hooks/useStores'

interface QuickActionsProps {
  store: Store
  onAction: (action: string) => void
}

export function QuickActions({ store, onAction }: QuickActionsProps) {
  const hasIssues = store.status === 'error' || 
    !store.credentials?.shop_domain || 
    !store.credentials?.access_token

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Actions rapides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={() => onAction('sync-products')}
          >
            <Download className="w-4 h-4" />
            Importer produits
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={() => onAction('sync-orders')}
          >
            <Upload className="w-4 h-4" />
            Importer commandes
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={() => onAction('view-analytics')}
          >
            <BarChart3 className="w-4 h-4" />
            Voir analytics
          </Button>
        </CardContent>
      </Card>

      {/* Statut du système */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Statut système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Connexion Shopify</span>
            <Badge variant={store.status === 'connected' ? 'default' : 'destructive'}>
              {store.status === 'connected' ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : (
                <AlertTriangle className="w-3 h-3 mr-1" />
              )}
              {store.status === 'connected' ? 'OK' : 'Erreur'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Configuration</span>
            <Badge variant={hasIssues ? 'secondary' : 'default'}>
              {hasIssues ? 'Incomplète' : 'OK'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Sync auto</span>
            <Badge variant={store.settings?.auto_sync ? 'default' : 'outline'}>
              {store.settings?.auto_sync ? 'Activée' : 'Désactivée'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Liens utiles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Liens utiles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={() => window.open(store.domain, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Voir boutique
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={() => window.open(`${store.domain}/admin`, '_blank')}
          >
            <Settings className="w-4 h-4" />
            Admin Shopify
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={() => onAction('help')}
          >
            <AlertTriangle className="w-4 h-4" />
            Aide & Support
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}