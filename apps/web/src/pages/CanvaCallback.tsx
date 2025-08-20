import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCanva } from '@/hooks/useCanva';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, Palette } from 'lucide-react';

export default function CanvaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useCanva();
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Traitement de la connexion Canva...');

  useEffect(() => {
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`Erreur OAuth: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Paramètres OAuth manquants');
      }

      const success = await handleOAuthCallback(code, state);
      
      if (success) {
        setStatus('success');
        setMessage('Connexion Canva réussie ! Vous pouvez fermer cette fenêtre.');
        
        // Fermer automatiquement la popup après 3 secondes
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/integrations');
          }
        }, 3000);
      } else {
        throw new Error('Échec de la connexion');
      }
    } catch (error: any) {
      console.error('Callback processing error:', error);
      setStatus('error');
      setMessage(error.message || 'Erreur lors de la connexion à Canva');
    }
  };

  const handleRetry = () => {
    setStatus('processing');
    setMessage('Nouvelle tentative...');
    processCallback();
  };

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/integrations');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
            {status === 'processing' && (
              <RefreshCw className="h-8 w-8 text-white animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-8 w-8 text-white" />
            )}
            {status === 'error' && (
              <XCircle className="h-8 w-8 text-white" />
            )}
          </div>
          
          <CardTitle className="text-xl">
            {status === 'processing' && 'Connexion en cours...'}
            {status === 'success' && 'Connexion réussie !'}
            {status === 'error' && 'Erreur de connexion'}
          </CardTitle>
          
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <Palette className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Votre compte Canva est maintenant connecté
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Cette fenêtre se fermera automatiquement dans quelques secondes.
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Une erreur s'est produite lors de la connexion à Canva.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button
                  onClick={handleClose}
                  variant="default"
                  size="sm"
                  className="flex-1"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
          
          {status === 'processing' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}