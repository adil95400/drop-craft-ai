import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, CheckCircle, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface SimpleExtension {
  id: string
  name: string
  description: string
  version: string
  price: number
  downloads_count: number
}

interface SimpleExtensionInstallerProps {
  extension: SimpleExtension
  onClose: () => void
}

const SimpleExtensionInstaller: React.FC<SimpleExtensionInstallerProps> = ({
  extension,
  onClose
}) => {
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const { toast } = useToast()

  const handleInstall = async () => {
    setIsInstalling(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      // Simple installation record using the extensions table
      const { error } = await supabase
        .from('extensions')
        .insert({
          name: extension.name,
          code: `extension_${extension.id}`,
          description: extension.description,
          version: extension.version,
          status: 'active',
          is_premium: extension.price > 0,
          config: {
            marketplace_install: true,
            price: extension.price,
            downloads_count: extension.downloads_count
          }
        })

      if (error) throw error

      setIsInstalled(true)
      toast({
        title: "Extension installée",
        description: `${extension.name} a été installée avec succès!`
      })
      
    } catch (error: any) {
      toast({
        title: "Erreur d'installation",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {extension.name}
              {isInstalled && <CheckCircle className="w-5 h-5 text-green-500" />}
            </CardTitle>
            <CardDescription>{extension.description}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">v{extension.version}</Badge>
            <span className="text-sm text-muted-foreground">
              {extension.downloads_count} téléchargements
            </span>
          </div>
          <div className="text-lg font-semibold">
            {extension.price === 0 ? 'Gratuit' : `€${extension.price}`}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleInstall}
            disabled={isInstalling || isInstalled}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {isInstalling ? 'Installation...' : isInstalled ? 'Installée' : 'Installer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default SimpleExtensionInstaller
