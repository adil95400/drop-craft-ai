/**
 * Extension Install Welcome Modal
 * Affiché lorsque l'utilisateur arrive depuis l'extension Chrome nouvellement installée
 */
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Chrome, CheckCircle, Copy, Key, ArrowRight, 
  Loader2, Sparkles, Shield, Zap 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface ExtensionInstallWelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version?: string;
}

export function ExtensionInstallWelcomeModal({ 
  open, 
  onOpenChange,
  version = '4.3.10' 
}: ExtensionInstallWelcomeModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'welcome' | 'generate' | 'complete'>('welcome');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateToken = async () => {
    if (!user) {
      toast.error('Connectez-vous pour générer un token');
      return;
    }

    setIsGenerating(true);
    try {
      const token = 'ext_' + crypto.randomUUID().replace(/-/g, '').slice(0, 32);
      
      const { error } = await supabase
        .from('extension_auth_tokens')
        .insert({
          user_id: user.id,
          token: token,
          is_active: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      setGeneratedToken(token);
      setStep('complete');
      toast.success('Token généré avec succès !');
    } catch (error: any) {
      console.error('Token generation error:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToken = async () => {
    if (!generatedToken) return;
    
    try {
      await navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      toast.success('Token copié !');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Échec de la copie');
    }
  };

  const features = [
    { icon: Zap, text: 'Import produits en 1 clic' },
    { icon: Sparkles, text: 'Optimisation IA automatique' },
    { icon: Shield, text: 'Synchronisation sécurisée' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DialogHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Chrome className="h-8 w-8 text-white" />
                </div>
                <DialogTitle className="text-xl">
                  🎉 Extension ShopOpti+ installée !
                </DialogTitle>
                <DialogDescription>
                  Version {version} • Prêt à révolutionner votre dropshipping
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-3">
                {features.map((feature, index) => (
                  <motion.div 
                    key={feature.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{feature.text}</span>
                    <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                  </motion.div>
                ))}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                {user ? (
                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    onClick={() => setStep('generate')}
                  >
                    Connecter l'extension
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Connectez-vous à ShopOpti pour lier l'extension à votre compte.
                    </AlertDescription>
                  </Alert>
                )}
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Plus tard
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Générer un token de connexion
                </DialogTitle>
                <DialogDescription>
                  Ce token permet à l'extension d'accéder à votre compte ShopOpti de manière sécurisée.
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-4">
                <Alert className="bg-yellow-500/10 border-yellow-500/20">
                  <AlertDescription className="text-sm">
                    ⚠️ Gardez ce token secret. Il donne accès à votre compte depuis l'extension.
                  </AlertDescription>
                </Alert>

                <Button 
                  className="w-full"
                  onClick={generateToken}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Générer le token
                    </>
                  )}
                </Button>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('welcome')}>
                  Retour
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === 'complete' && generatedToken && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DialogHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <DialogTitle>Token généré avec succès !</DialogTitle>
                <DialogDescription>
                  Copiez ce token et collez-le dans l'extension Chrome.
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-4">
                <div className="space-y-2">
                  <Label>Votre token de connexion</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={generatedToken}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant={copied ? "secondary" : "default"}
                      onClick={copyToken}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                  <p className="font-medium">📋 Comment utiliser :</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Cliquez sur l'icône ShopOpti+ dans Chrome</li>
                    <li>Allez dans Paramètres → Connexion</li>
                    <li>Collez le token et validez</li>
                  </ol>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Terminé
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
