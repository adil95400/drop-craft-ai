/**
 * Liste des extensions installées
 * Gestion, configuration et monitoring
 */

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { 
  Settings, Trash2, RefreshCw, Activity,
  AlertCircle, CheckCircle2
} from 'lucide-react'
import { useExtensions } from '@/hooks/useExtensions'
import { useToast } from '@/hooks/use-toast'

export const InstalledExtensionsList: React.FC = () => {
  const { extensions, isLoading, toggleExtension, uninstallExtension } = useExtensions()
  const { toast } = useToast()

  const handleToggle = async (extensionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    toggleExtension({
      id: extensionId,
      status: newStatus
    })
  }

  const handleUninstall = async (extensionId: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir désinstaller ${name} ?`)) return

    try {
      uninstallExtension(extensionId)
      toast({
        title: "Extension désinstallée",
        description: `${name} a été désinstallée avec succès`
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de désinstaller l'extension",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des extensions...</p>
        </CardContent>
      </Card>
    )
  }

  if (!extensions || extensions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Aucune extension installée</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par installer des extensions depuis le marketplace
          </p>
          <Button>Explorer le marketplace</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {extensions.map((extension) => {
        // Use name as display_name fallback
        const displayName = extension.name || 'Extension'
        const config = extension.config as Record<string, any> | null
        const lastSyncAt = config?.last_sync_at as string | undefined
        
        return (
          <Card key={extension.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {extension.status === 'active' ? (
                      <Activity className="w-6 h-6 text-primary" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold truncate">{displayName}</h3>
                      <Badge 
                        variant={extension.status === 'active' ? 'default' : 'secondary'}
                      >
                        {extension.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>

                    {extension.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {extension.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {lastSyncAt ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Dernière sync: {new Date(lastSyncAt).toLocaleDateString()}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            <span>Jamais synchronisé</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <Switch
                    checked={extension.status === 'active'}
                    onCheckedChange={() => handleToggle(extension.id, extension.status || 'inactive')}
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => console.log('Configure', extension.id)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUninstall(extension.id, displayName)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Configuration rapide */}
              {extension.status === 'active' && config && typeof config === 'object' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Configuration actuelle:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(config).slice(0, 3).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                    {Object.keys(config).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.keys(config).length - 3} autres
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
