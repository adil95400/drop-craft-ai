import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Server, Trash2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Connector {
  id: string
  name: string
  provider: string
  config: any
  status?: string
  last_sync_at?: string
  created_at: string
}

interface FTPConnectorManagerProps {
  connectors: Connector[]
  onDelete?: (id: string) => void
  onTest?: (id: string) => void
  isTestingId?: string
}

export const FTPConnectorManager = ({ 
  connectors, 
  onDelete, 
  onTest,
  isTestingId 
}: FTPConnectorManagerProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Connecteurs FTP ({connectors.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connectors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun connecteur configuré. Créez-en un dans l'onglet FTP.
            </p>
          ) : (
            connectors.map((connector) => (
              <div
                key={connector.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{connector.name}</span>
                    <Badge variant="outline">{connector.provider}</Badge>
                  </div>

                  {connector.config?.url && (
                    <p className="text-xs text-muted-foreground">
                      {connector.config.url}
                    </p>
                  )}

                  {connector.last_sync_at ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Dernière sync: {new Date(connector.last_sync_at).toLocaleString()}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <XCircle className="h-3 w-3 text-gray-400" />
                      Jamais synchronisé
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onTest && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTest(connector.id)}
                      disabled={isTestingId === connector.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${isTestingId === connector.id ? 'animate-spin' : ''}`} />
                    </Button>
                  )}

                  {onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le connecteur ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Le connecteur "{connector.name}" sera définitivement supprimé.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(connector.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
