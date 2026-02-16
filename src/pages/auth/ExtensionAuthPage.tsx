/**
 * Page d'authentification pour l'extension Chrome
 * URL: /auth/extension
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Chrome, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function ExtensionAuthPage() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [extensionToken, setExtensionToken] = useState<string | null>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Check for redirect param from extension
  const extensionRedirect = searchParams.get('redirect') === 'extension';

  // If user is already logged in, generate token automatically
  useEffect(() => {
    if (user && !authSuccess) {
      generateExtensionToken();
    }
  }, [user]);

  const generateExtensionToken = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('extension-hub', {
        body: {
          handler: 'login',
          action: 'generate_token',
        }
      });

      if (error) throw error;

      if (data?.token) {
        setExtensionToken(data.token);
        setAuthSuccess(true);
        
        // Notify extension if opened from extension
        if (extensionRedirect && window.opener) {
          window.opener.postMessage({
            type: 'SHOPOPTI_AUTH_SUCCESS',
            token: data.token,
            user: {
              id: user.id,
              email: user.email
            }
          }, '*');
        }
      }
    } catch (error) {
      console.error('Error generating extension token:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le token d\'extension',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('extension-hub', {
        body: {
          handler: 'login',
          action: 'login_credentials',
          email,
          password
        }
      });

      if (error) throw error;

      if (data?.success && data?.token) {
        setExtensionToken(data.token);
        setAuthSuccess(true);
        
        toast({
          title: 'Connexion réussie',
          description: 'Vous pouvez maintenant utiliser l\'extension'
        });

        // Notify extension
        if (extensionRedirect && window.opener) {
          window.opener.postMessage({
            type: 'SHOPOPTI_AUTH_SUCCESS',
            token: data.token,
            user: data.user
          }, '*');
        }
      } else {
        throw new Error(data?.error || 'Échec de la connexion');
      }
    } catch (error: any) {
      console.error('Extension login error:', error);
      toast({
        title: 'Erreur de connexion',
        description: error.message || 'Identifiants invalides',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = () => {
    if (extensionToken) {
      navigator.clipboard.writeText(extensionToken);
      toast({
        title: 'Token copié',
        description: 'Collez-le dans l\'extension Chrome'
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Connexion Extension - ShopOpti Pro</title>
        <meta name="description" content="Connectez votre extension Chrome ShopOpti Pro" />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Chrome className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Extension Chrome</CardTitle>
            <CardDescription>
              {authSuccess 
                ? 'Authentification réussie !' 
                : 'Connectez-vous pour utiliser l\'extension ShopOpti Pro'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {authSuccess ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-medium">Connexion réussie</span>
                </div>

                {extensionToken && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Votre token d'extension</Label>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        v6.0.0 • Expire dans 1 an
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        value={extensionToken.substring(0, 20) + '...'} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button onClick={copyToken} variant="outline">
                        Copier
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Si l'extension ne s'est pas connectée automatiquement, copiez ce token et collez-le dans les paramètres de l'extension.
                    </p>
                    <Button 
                      onClick={generateExtensionToken} 
                      variant="ghost" 
                      size="sm"
                      className="w-full text-xs"
                      disabled={isLoading}
                    >
                      🔄 Renouveler le token
                    </Button>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <Button asChild className="w-full">
                    <Link to="/extensions/chrome">
                      Retour à la page d'extension
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/dashboard">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Aller au tableau de bord
                    </Link>
                  </Button>
                </div>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Connecté en tant que</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                
                <Button 
                  onClick={generateExtensionToken} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération du token...
                    </>
                  ) : (
                    'Générer le token d\'extension'
                  )}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Pas encore de compte ?</p>
                  <Link to="/auth" className="text-primary hover:underline">
                    Créer un compte
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
