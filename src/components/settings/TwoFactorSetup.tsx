/**
 * TwoFactorSetup - Composant pour configurer la 2FA via TOTP
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Loader2, CheckCircle, Copy } from 'lucide-react';

export function TwoFactorSetup() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'start' | 'verify' | 'done'>('start');
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);

  const startEnroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Drop-Craft AI' });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep('verify');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la configuration 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (verify.error) throw verify.error;

      setStep('done');
      setIsEnrolled(true);
      toast.success('Double authentification activée !');
    } catch (err: any) {
      toast.error(err.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const unenroll = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const totpFactor = data?.totp?.[0];
      if (totpFactor) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
        if (error) throw error;
        setIsEnrolled(false);
        toast.success('2FA désactivée');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success('Clé copiée');
  };

  if (isEnrolled) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-green-500/10 text-success border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" /> Activée
        </Badge>
        <Button variant="outline" size="sm" onClick={unenroll} disabled={loading}>
          Désactiver
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { setOpen(true); setStep('start'); }}>
        <Shield className="h-4 w-4 mr-1" /> Configurer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Double Authentification (2FA)</DialogTitle>
            <DialogDescription>
              Protégez votre compte avec une application d'authentification (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          {step === 'start' && (
            <div className="space-y-4 py-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  La 2FA ajoute une couche de sécurité supplémentaire en demandant un code temporaire à chaque connexion.
                </AlertDescription>
              </Alert>
              <Button onClick={startEnroll} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Commencer la configuration
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Scannez ce QR code avec votre application d'authentification :
              </p>
              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48 rounded-lg border" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input value={secret} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Entrez le code à 6 chiffres affiché dans votre application :
              </p>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <Button onClick={verifyCode} disabled={loading || code.length !== 6} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Vérifier et activer
              </Button>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
              <p className="text-lg font-semibold">2FA activée avec succès !</p>
              <p className="text-sm text-muted-foreground mt-2">
                Un code sera demandé à chaque connexion.
              </p>
              <DialogFooter className="mt-6">
                <Button onClick={() => setOpen(false)}>Terminé</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
