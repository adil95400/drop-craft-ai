import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Key, Link as LinkIcon, Shield, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'

interface SupplierConnectionModalProps {
  open: boolean
  onClose: () => void
  supplier: {
    id: string
    name: string
    auth_method?: string
    auth_fields?: string[]
    api_endpoint?: string
    website_url?: string
  }
  onConnect: (credentials: Record<string, string>) => void
  isConnecting: boolean
}

export default function SupplierConnectionModal({ 
  open, 
  onClose, 
  supplier, 
  onConnect,
  isConnecting 
}: SupplierConnectionModalProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('api_key')

  const handleConnect = () => {
    onConnect(credentials)
  }

  const authMethod = supplier.auth_method || 'api_key'
  const authFields = supplier.auth_fields || ['api_key']

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      api_key: 'Clé API',
      api_token: 'Token API',
      email: 'Email',
      password: 'Mot de passe',
      account_id: 'ID du compte',
      client_id: 'Client ID',
      client_secret: 'Client Secret'
    }
    return labels[field] || field
  }

  const getFieldPlaceholder = (field: string) => {
    const placeholders: Record<string, string> = {
      api_key: '••••••••••••••••',
      api_token: '••••••••••••••••',
      email: 'votre@email.com',
      password: '••••••••',
      account_id: '123456',
      client_id: '••••••••••••••••',
      client_secret: '••••••••••••••••'
    }
    return placeholders[field] || ''
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-primary" />
            Connecter {supplier.name}
          </DialogTitle>
          <DialogDescription>
            Configurez votre connexion sécurisée pour importer des produits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Méthodes d'authentification */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="api_key" disabled={authMethod !== 'api_key'}>
                <Key className="h-4 w-4 mr-2" />
                Clé API
              </TabsTrigger>
              <TabsTrigger value="oauth" disabled={authMethod !== 'oauth'}>
                <LinkIcon className="h-4 w-4 mr-2" />
                OAuth 2.0
              </TabsTrigger>
            </TabsList>

            {/* API Key Method */}
            <TabsContent value="api_key" className="space-y-4 mt-4">
              <div className="bg-primary/5 p-4 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Comment obtenir votre clé API?</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Connectez-vous à votre compte {supplier.name}</li>
                      <li>Allez dans Paramètres → API / Développeur</li>
                      <li>Créez une nouvelle clé API avec les permissions requises</li>
                      <li>Copiez et collez la clé ci-dessous</li>
                    </ol>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary"
                      onClick={() => window.open(supplier.website_url, '_blank')}
                    >
                      Ouvrir {supplier.name}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>

              {authFields.map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{getFieldLabel(field)}</Label>
                  <Input
                    id={field}
                    type={field.includes('password') || field.includes('secret') ? 'password' : 'text'}
                    placeholder={getFieldPlaceholder(field)}
                    value={credentials[field] || ''}
                    onChange={(e) => setCredentials({ ...credentials, [field]: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>
              ))}

              {supplier.api_endpoint && (
                <div className="bg-muted p-3 rounded text-xs">
                  <p className="font-semibold mb-1">Point d'accès API:</p>
                  <code className="text-primary">{supplier.api_endpoint}</code>
                </div>
              )}
            </TabsContent>

            {/* OAuth Method */}
            <TabsContent value="oauth" className="space-y-4 mt-4">
              <div className="bg-primary/5 p-6 rounded-lg text-center space-y-4">
                <LinkIcon className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <p className="font-semibold mb-2">Connexion OAuth 2.0</p>
                  <p className="text-sm text-muted-foreground">
                    Vous allez être redirigé vers {supplier.name} pour autoriser l'accès de manière sécurisée
                  </p>
                </div>
                
                {authFields.map((field) => (
                  <div key={field} className="space-y-2 text-left">
                    <Label htmlFor={field}>{getFieldLabel(field)}</Label>
                    <Input
                      id={field}
                      type={field.includes('secret') ? 'password' : 'text'}
                      placeholder={getFieldPlaceholder(field)}
                      value={credentials[field] || ''}
                      onChange={(e) => setCredentials({ ...credentials, [field]: e.target.value })}
                      className="font-mono text-sm"
                    />
                  </div>
                ))}

                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Connexion sécurisée SSL/TLS
                </Badge>
              </div>
            </TabsContent>
          </Tabs>

          {/* Permissions Info */}
          <div className="border rounded-lg p-4 space-y-2">
            <p className="font-semibold text-sm">Permissions requises:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Lecture produits</Badge>
              <Badge variant="secondary">Gestion commandes</Badge>
              <Badge variant="secondary">Mise à jour stock</Badge>
              <Badge variant="secondary">Webhooks</Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isConnecting} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting || authFields.some(field => !credentials[field])}
              className="flex-1"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Connecter maintenant
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
