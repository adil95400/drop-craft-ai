import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSupplierActions } from '@/hooks/useSupplierActions'
import { toast } from 'sonner'
import { 
  Zap, Key, Link2, FileText, Server, Upload, CheckCircle, Loader2 
} from 'lucide-react'

interface QuickConnectSuppliersProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierId?: string
  supplierName?: string
}

export function QuickConnectSuppliers({ 
  open, 
  onOpenChange, 
  supplierId, 
  supplierName 
}: QuickConnectSuppliersProps) {
  const { connectSupplier, isConnecting } = useSupplierActions()
  const [connectionType, setConnectionType] = useState<'api' | 'csv' | 'xml' | 'ftp'>('api')
  
  // API credentials
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  
  // CSV/XML settings
  const [feedUrl, setFeedUrl] = useState('')
  const [syncInterval, setSyncInterval] = useState('3600')
  
  // FTP settings
  const [ftpHost, setFtpHost] = useState('')
  const [ftpUsername, setFtpUsername] = useState('')
  const [ftpPassword, setFtpPassword] = useState('')
  const [ftpPath, setFtpPath] = useState('')

  const handleConnect = async () => {
    if (!supplierId) {
      toast.error('ID du fournisseur manquant')
      return
    }

    let credentials: any = {}
    
    switch (connectionType) {
      case 'api':
        if (!apiKey) {
          toast.error('Clé API requise')
          return
        }
        credentials = { apiKey, apiSecret }
        break
      case 'csv':
      case 'xml':
        if (!feedUrl) {
          toast.error('URL du flux requise')
          return
        }
        credentials = { feedUrl, syncInterval: parseInt(syncInterval) }
        break
      case 'ftp':
        if (!ftpHost || !ftpUsername || !ftpPassword) {
          toast.error('Informations FTP complètes requises')
          return
        }
        credentials = { ftpHost, ftpUsername, ftpPassword, ftpPath }
        break
    }

    const result = await connectSupplier(supplierId, undefined, {
      ...credentials,
      connectionType
    })

    if (result.success) {
      toast.success('Connexion établie avec succès')
      onOpenChange(false)
      // Reset form
      setApiKey('')
      setApiSecret('')
      setFeedUrl('')
      setFtpHost('')
      setFtpUsername('')
      setFtpPassword('')
      setFtpPath('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Connexion Rapide {supplierName && `- ${supplierName}`}
          </DialogTitle>
          <DialogDescription>
            Choisissez votre méthode de connexion préférée
          </DialogDescription>
        </DialogHeader>

        <Tabs value={connectionType} onValueChange={(v) => setConnectionType(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              API
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <FileText className="h-4 w-4" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="xml" className="gap-2">
              <FileText className="h-4 w-4" />
              XML
            </TabsTrigger>
            <TabsTrigger value="ftp" className="gap-2">
              <Server className="h-4 w-4" />
              FTP
            </TabsTrigger>
          </TabsList>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Clé API *
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Entrez votre clé API"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">
                Secret API (optionnel)
              </Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Entrez votre secret API"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
              />
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 Vous trouverez vos identifiants API dans les paramètres de votre compte fournisseur
              </p>
            </div>
          </TabsContent>

          {/* CSV Tab */}
          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csvUrl" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                URL du flux CSV *
              </Label>
              <Input
                id="csvUrl"
                type="url"
                placeholder="https://example.com/products.csv"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="syncInterval">
                Intervalle de synchronisation (secondes)
              </Label>
              <Input
                id="syncInterval"
                type="number"
                placeholder="3600"
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
              />
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Synchronisation automatique toutes les {parseInt(syncInterval) / 60} minutes
              </p>
            </div>
          </TabsContent>

          {/* XML Tab */}
          <TabsContent value="xml" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="xmlUrl" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                URL du flux XML *
              </Label>
              <Input
                id="xmlUrl"
                type="url"
                placeholder="https://example.com/products.xml"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="syncIntervalXml">
                Intervalle de synchronisation (secondes)
              </Label>
              <Input
                id="syncIntervalXml"
                type="number"
                placeholder="3600"
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
              />
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Synchronisation automatique toutes les {parseInt(syncInterval) / 60} minutes
              </p>
            </div>
          </TabsContent>

          {/* FTP Tab */}
          <TabsContent value="ftp" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ftpHost">
                  Hôte FTP *
                </Label>
                <Input
                  id="ftpHost"
                  placeholder="ftp.example.com"
                  value={ftpHost}
                  onChange={(e) => setFtpHost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ftpPath">
                  Chemin (optionnel)
                </Label>
                <Input
                  id="ftpPath"
                  placeholder="/products"
                  value={ftpPath}
                  onChange={(e) => setFtpPath(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ftpUsername">
                  Nom d'utilisateur *
                </Label>
                <Input
                  id="ftpUsername"
                  placeholder="username"
                  value={ftpUsername}
                  onChange={(e) => setFtpUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ftpPassword">
                  Mot de passe *
                </Label>
                <Input
                  id="ftpPassword"
                  type="password"
                  placeholder="••••••••"
                  value={ftpPassword}
                  onChange={(e) => setFtpPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                🔒 Vos identifiants FTP sont stockés de manière sécurisée et cryptée
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isConnecting}
          >
            Annuler
          </Button>
          <Button 
            className="flex-1 gap-2"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Connecter
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
