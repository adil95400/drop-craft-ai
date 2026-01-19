/**
 * Page de callback OAuth Canva
 * Reçoit le code d'autorisation et finalise la connexion
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function CanvaOAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connexion à Canva en cours...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Vérifier si erreur OAuth
      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'Erreur lors de l\'autorisation Canva');
        notifyParent(false, errorDescription || error);
        return;
      }

      // Vérifier le code
      if (!code) {
        setStatus('error');
        setMessage('Code d\'autorisation manquant');
        notifyParent(false, 'Code d\'autorisation manquant');
        return;
      }

      try {
        // Appeler l'edge function pour échanger le code
        const redirectUri = `${window.location.origin}/tools/canva-callback`
        
        const { data, error: apiError } = await supabase.functions.invoke('canva-oauth', {
          body: { 
            action: 'callback',
            code,
            state,
            redirect_uri: redirectUri
          }
        });

        if (apiError) {
          throw apiError;
        }

        if (data?.success) {
          setStatus('success');
          setMessage('Connexion à Canva réussie !');
          notifyParent(true);
          
          // Fermer après 2 secondes
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          throw new Error(data?.error || 'Échec de la connexion');
        }
      } catch (err) {
        console.error('Canva OAuth callback error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Erreur lors de la connexion');
        notifyParent(false, err instanceof Error ? err.message : 'Erreur inconnue');
      }
    };

    handleCallback();
  }, [searchParams]);

  // Notifier la fenêtre parent
  const notifyParent = (success: boolean, error?: string) => {
    if (window.opener) {
      window.opener.postMessage({
        type: 'canva-oauth-callback',
        success,
        error
      }, window.location.origin);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-md w-full text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Connexion en cours</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h2 className="text-xl font-semibold text-green-600">Connexion réussie !</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Cette fenêtre va se fermer automatiquement...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold text-destructive">Erreur de connexion</h2>
            <p className="text-muted-foreground">{message}</p>
            <button 
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Fermer
            </button>
          </>
        )}
      </Card>
    </div>
  );
}
