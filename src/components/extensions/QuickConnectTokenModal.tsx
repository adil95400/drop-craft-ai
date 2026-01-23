/**
 * Quick Connect Token Modal
 * Modal simplifié pour générer et copier un token en 1 clic
 */
import { useState } from 'react';
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
import { 
  Key, Copy, CheckCircle, Loader2, Shield, 
  RefreshCw, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface QuickConnectTokenModalProps {
  trigger?: React.ReactNode;
  onTokenGenerated?: (token: string) => void;
}

export function QuickConnectTokenModal({ 
  trigger,
  onTokenGenerated 
}: QuickConnectTokenModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateToken = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter');
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
      onTokenGenerated?.(token);
      toast.success('Token généré !');
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
      toast.success('Token copié dans le presse-papier !');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Échec de la copie');
    }
  };

  const resetModal = () => {
    setGeneratedToken(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetModal();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Key className="h-4 w-4 mr-2" />
            Générer Token
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Connexion Extension</DialogTitle>
              <DialogDescription>
                Générez un token pour connecter l'extension Chrome
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {!generatedToken ? (
            <>
              <Alert>
                <AlertDescription className="text-sm">
                  Ce token permet à l'extension d'accéder à votre compte ShopOpti de manière sécurisée. 
                  Il expire dans 1 an.
                </AlertDescription>
              </Alert>

              <Button 
                className="w-full"
                onClick={generateToken}
                disabled={isGenerating || !user}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Générer un nouveau token
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Token généré avec succès
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={generatedToken}
                    readOnly
                    className="font-mono text-xs bg-muted"
                  />
                  <Button 
                    variant={copied ? "secondary" : "default"}
                    size="icon"
                    onClick={copyToken}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                <p className="font-medium text-xs">Comment utiliser :</p>
                <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
                  <li>Ouvrez l'extension ShopOpti+ dans Chrome</li>
                  <li>Allez dans <strong>Paramètres</strong></li>
                  <li>Collez le token dans le champ "Token API"</li>
                  <li>Cliquez sur <strong>Connecter</strong></li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={resetModal}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Nouveau token
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open('/extensions/download', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
