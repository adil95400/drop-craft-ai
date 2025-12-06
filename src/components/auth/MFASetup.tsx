import React, { useState, useEffect } from 'react';
import { useMFA } from '@/hooks/useMFA';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldOff, Loader2, Key, Smartphone, Copy, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

export function MFASetup() {
  const {
    isEnabled,
    factors,
    isLoading,
    qrCode,
    secret,
    checkMFAStatus,
    enrollMFA,
    verifyMFA,
    unenrollMFA,
  } = useMFA();

  const [verificationCode, setVerificationCode] = useState('');
  const [currentFactorId, setCurrentFactorId] = useState<string | null>(null);
  const [step, setStep] = useState<'status' | 'setup' | 'verify'>('status');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, [checkMFAStatus]);

  const handleEnroll = async () => {
    const result = await enrollMFA();
    if (result) {
      setCurrentFactorId(result.factorId);
      setStep('setup');
    }
  };

  const handleVerify = async () => {
    if (!currentFactorId || !verificationCode) return;
    
    const success = await verifyMFA(currentFactorId, verificationCode);
    if (success) {
      setStep('status');
      setVerificationCode('');
      setCurrentFactorId(null);
    }
  };

  const handleDisable = async (factorId: string) => {
    await unenrollMFA(factorId);
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderStatus = () => (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <ShieldCheck className="h-6 w-6 text-green-500" />
            ) : (
              <Shield className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-lg">Authentification à deux facteurs (MFA)</CardTitle>
              <CardDescription>
                Protégez votre compte avec une couche de sécurité supplémentaire
              </CardDescription>
            </div>
          </div>
          <Badge variant={isEnabled ? "default" : "secondary"} className={isEnabled ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}>
            {isEnabled ? "Activé" : "Désactivé"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled ? (
          <div className="space-y-4">
            <Alert className="border-green-500/20 bg-green-500/5">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Votre compte est protégé par l'authentification à deux facteurs.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Méthodes configurées :</h4>
            {factors.filter(f => f.status === 'verified').map((factor) => (
                <div key={factor.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{factor.friendly_name || 'Application Authenticator'}</p>
                      <p className="text-xs text-muted-foreground">{factor.factor_type?.toUpperCase() || 'TOTP'}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisable(factor.id)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <ShieldOff className="h-4 w-4 mr-1" />
                    Désactiver
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                <Key className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Protection renforcée</h4>
                  <p className="text-xs text-muted-foreground">
                    Même si votre mot de passe est compromis, votre compte reste sécurisé.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Application mobile</h4>
                  <p className="text-xs text-muted-foreground">
                    Utilisez Google Authenticator, Authy ou toute autre app TOTP.
                  </p>
                </div>
              </div>
            </div>
            
            <Button onClick={handleEnroll} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Activer l'authentification à deux facteurs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSetup = () => (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Configuration MFA
        </CardTitle>
        <CardDescription>
          Scannez le QR code avec votre application d'authentification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          {qrCode && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 bg-white rounded-xl shadow-lg"
            >
              <img src={qrCode} alt="QR Code MFA" className="w-48 h-48" />
            </motion.div>
          )}
          
          {secret && (
            <div className="w-full max-w-md">
              <label className="text-sm text-muted-foreground">Clé secrète (si vous ne pouvez pas scanner) :</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 text-xs bg-muted rounded font-mono overflow-x-auto">
                  {secret}
                </code>
                <Button variant="ghost" size="icon" onClick={copySecret}>
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Entrez le code à 6 chiffres :</label>
          <div className="flex gap-2">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="text-center text-lg tracking-widest font-mono"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setStep('status');
              setVerificationCode('');
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isLoading || verificationCode.length !== 6}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            Vérifier et activer
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {step === 'status' && renderStatus()}
        {step === 'setup' && renderSetup()}
      </motion.div>
    </AnimatePresence>
  );
}
