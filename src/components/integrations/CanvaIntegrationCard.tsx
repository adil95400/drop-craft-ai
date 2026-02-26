import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Palette, ExternalLink, Settings, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useCanvaIntegration } from '@/hooks/useCanvaIntegration'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { productionLogger } from '@/utils/productionLogger';

export const CanvaIntegrationCard = () => {
  const { toast } = useToast()
  const {
    isConnecting,
    isLoading,
    designs,
    connectCanva,
    checkConnectionStatus,
    getDesigns,
    openCanvaEditor
  } = useCanvaIntegration()

  const [isConnected, setIsConnected] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await checkConnectionStatus()
        setIsConnected(connected)
        if (connected) {
          await getDesigns()
          setLastSync(new Date())
        }
      } catch (error) {
        productionLogger.error('Failed to check Canva connection', error as Error, 'CanvaIntegrationCard')
      }
    }
    checkConnection()
  }, [checkConnectionStatus, getDesigns])

  const handleConnect = async () => {
    try {
      await connectCanva()
      setIsConnected(true)
      setLastSync(new Date())
      toast({
        title: "Connexion réussie",
        description: "Canva est maintenant connecté à votre compte",
      })
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de connecter Canva",
        variant: "destructive"
      })
    }
  }

  const handleSync = async () => {
    try {
      await getDesigns()
      setLastSync(new Date())
      toast({
        title: "Synchronisation réussie",
        description: `${designs.length} designs synchronisés`,
      })
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser avec Canva",
        variant: "destructive"
      })
    }
  }

  const StatusIcon = isConnected ? CheckCircle2 : AlertCircle
  const statusColor = isConnected ? 'text-green-600' : 'text-red-600'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Palette className="h-10 w-10 text-primary" />
              <StatusIcon className={`h-4 w-4 absolute -bottom-1 -right-1 ${statusColor}`} />
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Canva</h3>
              <p className="text-sm text-muted-foreground">
                Plateforme de création de designs
              </p>
              {lastSync && (
                <p className="text-xs text-muted-foreground">
                  Dernière sync: {formatDistanceToNow(lastSync, { addSuffix: true, locale: getDateFnsLocale() })}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </Badge>
            
            {isConnected && (
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            )}
            
            {isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCanvaEditor()}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                size="sm"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Connecter'
                )}
              </Button>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{designs.length}</p>
                <p className="text-xs text-muted-foreground">Designs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">✓</p>
                <p className="text-xs text-muted-foreground">Actif</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">API</p>
                <p className="text-xs text-muted-foreground">Connecté</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}