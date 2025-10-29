import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, AlertTriangle, Info, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface VersionInfo {
  current: string
  latest: string
  updateAvailable: boolean
  updateRequired: boolean
  changelog: string[]
  downloadUrl: string
}

export function ExtensionUpdateNotification() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkForUpdates()
    // Check every hour
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const checkForUpdates = async () => {
    try {
      // Get current extension version from localStorage or default
      const currentVersion = localStorage.getItem('extension_version') || '1.0.0'

      const { data, error } = await supabase.functions.invoke('extension-version-check', {
        headers: {
          'x-extension-version': currentVersion
        }
      })

      if (error) throw error

      if (data.updateAvailable) {
        setVersionInfo(data)
      }
    } catch (error) {
      console.error('Failed to check for updates:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleDownload = () => {
    window.open('/extension-download', '_blank')
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Remember dismissal for this version
    if (versionInfo) {
      localStorage.setItem(`dismissed_update_${versionInfo.latest}`, 'true')
    }
  }

  if (checking || !versionInfo || dismissed) return null

  // Check if this version was already dismissed
  const wasDismissed = localStorage.getItem(`dismissed_update_${versionInfo.latest}`)
  if (wasDismissed && !versionInfo.updateRequired) return null

  return (
    <Alert 
      className={
        versionInfo.updateRequired 
          ? 'border-destructive bg-destructive/10'
          : 'border-primary bg-primary/10'
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {versionInfo.updateRequired ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <Info className="h-5 w-5 text-primary" />
          )}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <AlertDescription className="font-semibold m-0">
              {versionInfo.updateRequired 
                ? '🚨 Mise à jour critique disponible'
                : '✨ Nouvelle version disponible'
              }
            </AlertDescription>
            <Badge variant={versionInfo.updateRequired ? 'destructive' : 'default'}>
              v{versionInfo.latest}
            </Badge>
          </div>

          <AlertDescription className="text-sm space-y-1">
            {versionInfo.updateRequired ? (
              <p className="text-destructive font-medium">
                Votre version ({versionInfo.current}) n'est plus supportée. 
                Mettez à jour immédiatement pour continuer à utiliser l'extension.
              </p>
            ) : (
              <p>
                Passez de la v{versionInfo.current} à la v{versionInfo.latest} 
                pour bénéficier des dernières fonctionnalités et améliorations.
              </p>
            )}

            {versionInfo.changelog.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="font-medium">Nouveautés :</p>
                <ul className="text-xs space-y-0.5 ml-4">
                  {versionInfo.changelog.slice(0, 3).map((change, i) => (
                    <li key={i}>• {change}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>

          <div className="flex items-center gap-2 mt-3">
            <Button 
              size="sm" 
              onClick={handleDownload}
              variant={versionInfo.updateRequired ? 'destructive' : 'default'}
            >
              <Download className="mr-2 h-4 w-4" />
              {versionInfo.updateRequired ? 'Mettre à jour maintenant' : 'Télécharger'}
            </Button>
            
            {!versionInfo.updateRequired && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
              >
                Plus tard
              </Button>
            )}
          </div>
        </div>

        {!versionInfo.updateRequired && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}
