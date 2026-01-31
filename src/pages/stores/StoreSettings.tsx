import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Trash2, Edit } from 'lucide-react'
import { useIntegrationsUnified } from '@/hooks/unified'

export function StoreSettings() {
  const { integrations, isLoading } = useIntegrationsUnified()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Paramètres des boutiques</h2>
        <p className="text-muted-foreground">Configurez et gérez vos intégrations</p>
      </div>

      <div className="grid gap-4">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {integration.platform_name}
                </CardTitle>
                <Badge 
                  variant={integration.connection_status === 'connected' ? 'default' : 'destructive'}
                >
                  {integration.connection_status === 'connected' ? 'Connecté' : 'Déconnecté'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Plateforme:</span>
                  <p className="font-medium">{integration.platform_type}</p>
                </div>
                {integration.shop_domain && (
                  <div>
                    <span className="text-muted-foreground">Domaine:</span>
                    <p className="font-medium">{integration.shop_domain}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Créé le:</span>
                  <p className="font-medium">
                    {new Date(integration.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dernière sync:</span>
                  <p className="font-medium">
                    {integration.last_sync_at ? 
                      new Date(integration.last_sync_at).toLocaleDateString('fr-FR') : 
                      'Jamais'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {integrations.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune boutique à configurer</h3>
              <p className="text-muted-foreground text-center">
                Connectez d'abord une boutique pour accéder aux paramètres
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}