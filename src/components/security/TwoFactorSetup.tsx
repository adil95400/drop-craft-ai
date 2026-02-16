import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Smartphone, Shield, CheckCircle2, AlertTriangle, Key, Copy, RefreshCw } from 'lucide-react';
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function TwoFactorSetup() {
  const { user } = useAuthOptimized();
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'done'>('intro');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep('setup');
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la configuration 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    setLoading(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });
      if (verify.error) throw verify.error;

      setIs2FAEnabled(true);
      setStep('done');
      toast.success('Authentification 2FA activée avec succès !');
    } catch (error: any) {
      toast.error(error.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!factorId) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setIs2FAEnabled(false);
      setStep('intro');
      setFactorId(null);
      toast.success('2FA désactivé');
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success('Clé copiée !');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${is2FAEnabled ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
              {is2FAEnabled ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Authentification à deux facteurs</h3>
              <p className="text-sm text-muted-foreground">
                {is2FAEnabled
                  ? 'Votre compte est protégé par la 2FA'
                  : 'Renforcez la sécurité de votre compte'}
              </p>
            </div>
          </div>
          <Badge variant={is2FAEnabled ? 'default' : 'secondary'}>
            {is2FAEnabled ? 'Activé' : 'Désactivé'}
          </Badge>
        </div>
      </Card>

      {/* Step: Intro */}
      {step === 'intro' && !is2FAEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4 text-primary" />
              Configurer la 2FA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { icon: Key, title: 'Plus sécurisé', desc: 'Protection contre le vol de mot de passe' },
                { icon: Smartphone, title: 'App Authenticator', desc: 'Google Authenticator, Authy, etc.' },
                { icon: Shield, title: 'Standard industrie', desc: 'TOTP conforme aux normes NIST' },
              ].map((item) => (
                <div key={item.title} className="p-4 bg-muted/30 rounded-lg text-center">
                  <item.icon className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            <Button onClick={handleEnroll} disabled={loading} className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              {loading ? 'Configuration...' : 'Activer la 2FA'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Setup QR */}
      {step === 'setup' && qrCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Étape 1 : Scanner le QR code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
            </p>
            <div className="flex justify-center p-6 bg-white rounded-lg">
              <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
            </div>
            {secret && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <code className="text-xs flex-1 break-all font-mono">{secret}</code>
                <Button variant="ghost" size="icon" onClick={copySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              ⚠️ Sauvegardez cette clé secrète. Elle sera nécessaire si vous perdez accès à votre téléphone.
            </p>
            <Button onClick={() => setStep('verify')} className="w-full">
              Suivant — Vérifier le code
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Verify */}
      {step === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Étape 2 : Vérification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Entrez le code à 6 chiffres affiché dans votre application d'authentification.
            </p>
            <Input
              placeholder="000000"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              maxLength={6}
            />
            <Button onClick={handleVerify} disabled={loading || verifyCode.length !== 6} className="w-full">
              {loading ? 'Vérification...' : 'Vérifier et activer'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {(step === 'done' || is2FAEnabled) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              2FA activée avec succès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Votre compte est désormais protégé par l'authentification à deux facteurs. 
              Un code vous sera demandé à chaque connexion.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={handleUnenroll} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Désactiver la 2FA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
