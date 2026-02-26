/**
 * Extension Token Generator - Sprint 1
 * Composant professionnel pour générer et gérer les tokens SSO extension
 */
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Key, Copy, CheckCircle, Loader2, Shield, 
  RefreshCw, Trash2, Clock, Activity, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface TokenData {
  id: string;
  name: string | null;
  created_at: string;
  last_used_at: string | null;
  usage_count: number | null;
  expires_at: string;
  is_active: boolean;
  device_info: Record<string, unknown>;
  permissions: string[];
}

interface GeneratedToken {
  token: string;
  refreshToken: string;
  expiresAt: string;
  permissions: string[];
}

export function ExtensionTokenGenerator() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<GeneratedToken | null>(null);
  const [existingTokens, setExistingTokens] = useState<TokenData[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'token' | 'refresh' | null>(null);

  // Charger les tokens existants
  const loadTokens = async () => {
    if (!user) return;
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('extension-auth', {
        body: { action: 'list_tokens', data: { userId: user.id } }
      });
      
      if (error) throw error;
      if (data?.success) {
        setExistingTokens(Array.isArray(data.tokens) ? data.tokens : []);
      } else {
        throw new Error(data?.error || 'Failed to load tokens');
      }
    } catch (error: any) {
      console.error('Failed to load tokens:', error);
      setLoadError(error.message || 'Erreur de chargement');
      setExistingTokens([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      loadTokens();
    }
  }, [open, user]);

  const generateToken = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter');
      return;
    }

    setIsGenerating(true);
    try {
      const deviceInfo = {
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
        platform: navigator.platform,
        os: navigator.userAgent.includes('Windows') ? 'Windows' : 
            navigator.userAgent.includes('Mac') ? 'macOS' : 'Linux',
        screenWidth: window.screen.width,
        screenHeight: window.screen.height
      };

      const { data, error } = await supabase.functions.invoke('extension-auth', {
        body: { 
          action: 'generate_token', 
          data: { 
            userId: user.id,
            deviceInfo,
            permissions: ['import', 'sync', 'logs', 'bulk']
          }
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        setGeneratedToken({
          token: data.token,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
          permissions: data.permissions
        });
        await loadTokens();
        toast.success('Token généré avec succès !');
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Token generation error:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const revokeToken = async (tokenId: string) => {
    try {
      const tokenToRevoke = existingTokens.find(t => t.id === tokenId);
      if (!tokenToRevoke) return;

      // We need to get the actual token value - for now use the edge function with id
      await supabase
        .from('extension_auth_tokens')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('id', tokenId);

      await loadTokens();
      toast.success('Token révoqué');
    } catch (error) {
      toast.error('Erreur lors de la révocation');
    }
  };

  const revokeAllTokens = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase.functions.invoke('extension-auth', {
        body: { action: 'revoke_all', data: { userId: user.id } }
      });
      
      if (error) throw error;
      await loadTokens();
      toast.success('Tous les tokens ont été révoqués');
    } catch (error) {
      toast.error('Erreur lors de la révocation');
    }
  };

  const copyToClipboard = async (text: string, type: 'token' | 'refresh') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(`${type === 'token' ? 'Token' : 'Refresh token'} copié !`);
      setTimeout(() => setCopied(null), 3000);
    } catch {
      toast.error('Échec de la copie');
    }
  };

  const resetModal = () => {
    setGeneratedToken(null);
    setCopied(null);
  };

  const activeTokens = existingTokens.filter(t => t.is_active);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetModal();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Key className="h-4 w-4" />
          Connecter l'Extension
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Connexion Extension Chrome</DialogTitle>
              <DialogDescription>
                Générez un token sécurisé pour synchroniser l'extension
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Token nouvellement généré */}
          {generatedToken ? (
            <div className="space-y-4">
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  Token généré avec succès ! Copiez-le maintenant, il ne sera plus affiché.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Key className="h-3 w-3" />
                    Token d'accès (expire dans 30 jours)
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={generatedToken.token}
                      readOnly
                      className="font-mono text-xs bg-muted"
                    />
                    <Button 
                      variant={copied === 'token' ? "secondary" : "default"}
                      size="icon"
                      onClick={() => copyToClipboard(generatedToken.token, 'token')}
                    >
                      {copied === 'token' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <RefreshCw className="h-3 w-3" />
                    Refresh Token (expire dans 1 an)
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={generatedToken.refreshToken}
                      readOnly
                      className="font-mono text-xs bg-muted"
                    />
                    <Button 
                      variant={copied === 'refresh' ? "secondary" : "outline"}
                      size="icon"
                      onClick={() => copyToClipboard(generatedToken.refreshToken, 'refresh')}
                    >
                      {copied === 'refresh' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {generatedToken.permissions.map(perm => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                <p className="font-medium text-xs">Comment utiliser :</p>
                <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
                  <li>Ouvrez l'extension ShopOpti+ dans Chrome</li>
                  <li>Allez dans <strong>Paramètres</strong></li>
                  <li>Collez le <strong>Token d'accès</strong> dans le champ prévu</li>
                  <li>Cliquez sur <strong>Connecter</strong></li>
                </ol>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={resetModal}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Générer un nouveau token
              </Button>
            </div>
          ) : (
            <>
              {/* Bouton de génération */}
              <Button 
                className="w-full"
                onClick={generateToken}
                disabled={isGenerating || !user}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Générer un nouveau token
                  </>
                )}
              </Button>

              <Separator />

              {/* Tokens existants */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Tokens actifs ({activeTokens.length})
                  </h4>
                  {activeTokens.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={revokeAllTokens}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Tout révoquer
                    </Button>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : activeTokens.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Aucun token actif. Générez-en un pour connecter l'extension.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activeTokens.map((token) => (
                      <div 
                        key={token.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {(token.device_info as any)?.browser || 'Chrome'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {token.usage_count || 0} utilisations
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Créé {format(new Date(token.created_at), 'dd MMM yyyy', { locale: getDateFnsLocale() })}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => revokeToken(token.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
