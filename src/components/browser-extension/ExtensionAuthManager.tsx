import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, Key, Shield, Trash2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface ExtensionToken {
  id: string
  token: string
  device_info?: any
  created_at: string
  last_used_at?: string
  expires_at: string
  usage_count: number
  is_active: boolean
}

export function ExtensionAuthManager() {
  const [tokens, setTokens] = useState<ExtensionToken[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTokens()
  }, [])

  const loadTokens = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('extension_auth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTokens(data)
    }
  }

  const generateToken = async () => {
    setIsGenerating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('extension-auth', {
        body: {
          action: 'generate_token',
          data: {
            userId: user.id,
            deviceInfo: {
              userAgent: navigator.userAgent,
              platform: navigator.platform
            }
          }
        }
      })

      if (error) throw error

      toast({
        title: 'Token généré',
        description: 'Votre token d\'extension a été créé avec succès'
      })

      loadTokens()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le token',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
    
    toast({
      title: 'Token copié',
      description: 'Le token a été copié dans le presse-papier'
    })
  }

  const revokeToken = async (tokenId: string, token: string) => {
    try {
      await supabase.functions.invoke('extension-auth', {
        body: {
          action: 'revoke_token',
          data: { token }
        }
      })

      toast({
        title: 'Token révoqué',
        description: 'Le token a été désactivé'
      })

      loadTokens()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de révoquer le token',
        variant: 'destructive'
      })
    }
  }

  const maskToken = (token: string) => {
    return token.substring(0, 12) + '...' + token.substring(token.length - 8)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentification Extension
              </CardTitle>
              <CardDescription>
                Générez des tokens sécurisés pour connecter votre extension navigateur
              </CardDescription>
            </div>
            <Button onClick={generateToken} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Nouveau Token
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Sécurité :</strong> Ne partagez jamais vos tokens d'extension. 
              Ils donnent un accès direct à votre compte depuis l'extension navigateur.
            </AlertDescription>
          </Alert>

          {tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun token généré</p>
              <p className="text-sm">Cliquez sur "Nouveau Token" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <Card key={token.id} className={!token.is_active ? 'opacity-60' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-3 py-1 rounded">
                            {maskToken(token.token)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToken(token.token)}
                          >
                            {copiedToken === token.token ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Badge variant={token.is_active ? 'default' : 'secondary'}>
                            {token.is_active ? 'Actif' : 'Révoqué'}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Créé : {new Date(token.created_at).toLocaleDateString()}</div>
                          {token.last_used_at && (
                            <div>Dernière utilisation : {new Date(token.last_used_at).toLocaleString()}</div>
                          )}
                          <div>Utilisations : {token.usage_count}</div>
                          <div>Expire : {new Date(token.expires_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      {token.is_active && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => revokeToken(token.id, token.token)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Révoquer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Comment utiliser :</strong> Copiez le token et collez-le dans les paramètres 
              de votre extension Chrome/Firefox pour l'authentifier avec votre compte.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
