import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Chrome, Copy, Key, Shield, Trash2, RefreshCw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const ExtensionAuthManager = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [newToken, setNewToken] = useState<string>('')

  // Fetch extension tokens
  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['extension-tokens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extension_auth_tokens')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // Generate new token
  const generateToken = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate a unique token
      const token = 'ext_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Insert token into database
      const { error } = await supabase
        .from('extension_auth_tokens')
        .insert([{
          user_id: user.id,
          token: token,
          is_active: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          device_info: { userAgent: navigator.userAgent }
        }]);

      if (error) throw error;
      return { token };
    },
    onSuccess: (data) => {
      setNewToken(data.token)
      queryClient.invalidateQueries({ queryKey: ['extension-tokens'] })
      toast({
        title: '✅ Token généré',
        description: 'Nouveau token créé avec succès'
      })
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Revoke token
  const revokeToken = useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from('extension_auth_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extension-tokens'] })
      toast({
        title: '✅ Token révoqué',
        description: 'Le token a été désactivé'
      })
    }
  })

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    toast({
      title: '📋 Copié',
      description: 'Token copié dans le presse-papier'
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>Authentification Extension Chrome</CardTitle>
          </div>
          <CardDescription>
            Générez des tokens sécurisés pour l'extension Chrome
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Chrome className="w-4 h-4" />
            <AlertDescription>
              Installez l'extension Chrome depuis le dossier <code className="px-1 py-0.5 bg-muted rounded">public/chrome-extension</code>.
              Ensuite, générez un token et collez-le dans l'extension.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={() => generateToken.mutate()}
              disabled={generateToken.isPending}
              className="flex-1"
            >
              <Key className="w-4 h-4 mr-2" />
              {generateToken.isPending ? 'Génération...' : 'Générer un nouveau token'}
            </Button>
          </div>

          {newToken && (
            <div className="space-y-2">
              <Label>Nouveau token généré</Label>
              <div className="flex gap-2">
                <Input 
                  value={newToken} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button 
                  size="icon"
                  variant="outline"
                  onClick={() => copyToken(newToken)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Copiez ce token maintenant. Il ne sera plus affiché.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tokens actifs</CardTitle>
          <CardDescription>
            Gérez vos tokens d'authentification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tokens.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun token actif
            </p>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div 
                  key={token.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {token.token.substring(0, 20)}...
                      </code>
                      {token.is_active ? (
                        <Badge variant="default">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Créé le {new Date(token.created_at).toLocaleDateString('fr-FR')}
                      {token.last_used_at && (
                        <> • Dernière utilisation: {new Date(token.last_used_at).toLocaleDateString('fr-FR')}</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToken(token.token)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => revokeToken.mutate(token.id)}
                      disabled={!token.is_active}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
