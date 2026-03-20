/**
 * TwoFactorSettings - Double authentification TOTP + Gestion des sessions
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Shield, Smartphone, Key, Monitor, Globe, Clock,
  CheckCircle2, XCircle, Loader2, AlertTriangle, LogOut
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TwoFactorSettings() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [otpCode, setOtpCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  // Check if 2FA is already set up
  const { data: mfaFactors = [], isLoading: factorsLoading } = useQuery({
    queryKey: ['mfa-factors'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data?.totp || [];
    },
  });

  const isEnabled = mfaFactors.some(f => f.status === 'verified');

  // Fetch active sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      // Get security events for session tracking
      const { data } = await supabase
        .from('security_events')
        .select('id, event_type, created_at, metadata, ip_address')
        .in('event_type', ['login', 'session_start', 'token_refresh'])
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Enroll in 2FA
  const startEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });
      if (error) throw error;
      setQrUri(data.totp.uri);
      setFactorId(data.id);
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
      setEnrolling(false);
    }
  };

  // Verify OTP to complete enrollment
  const verifyEnroll = async () => {
    if (!factorId || !otpCode) return;
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: otpCode,
      });
      if (verify.error) throw verify.error;

      toast.success('2FA activée avec succès');
      setEnrolling(false);
      setQrUri(null);
      setFactorId(null);
      setOtpCode('');
      queryClient.invalidateQueries({ queryKey: ['mfa-factors'] });
    } catch (err: any) {
      toast.error('Code invalide', { description: err.message });
    }
  };

  // Unenroll (disable 2FA)
  const disableMutation = useMutation({
    mutationFn: async () => {
      for (const factor of mfaFactors) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('2FA désactivée');
      queryClient.invalidateQueries({ queryKey: ['mfa-factors'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Sign out all sessions
  const signOutAll = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      toast.success('Toutes les sessions ont été déconnectées');
      window.location.href = '/auth';
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 2FA Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Double authentification (2FA)
              </CardTitle>
              <CardDescription>
                Protégez votre compte avec un code à usage unique
              </CardDescription>
            </div>
            <Badge variant={isEnabled ? 'default' : 'secondary'}>
              {isEnabled ? 'Activée' : 'Désactivée'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {factorsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
            </div>
          ) : isEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">2FA active</p>
                  <p className="text-xs text-muted-foreground">
                    Votre compte est protégé par l'authentification à deux facteurs.
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => disableMutation.mutate()}
                disabled={disableMutation.isPending}
              >
                {disableMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Désactiver la 2FA
              </Button>
            </div>
          ) : enrolling && qrUri ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`}
                    alt="QR Code 2FA"
                    className="w-48 h-48"
                  />
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Étape 1</h4>
                    <p className="text-xs text-muted-foreground">
                      Scannez ce QR code avec votre application d'authentification
                      (Google Authenticator, Authy, etc.)
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Étape 2</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Entrez le code à 6 chiffres affiché dans l'application
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="w-32 font-mono text-center text-lg tracking-widest"
                      />
                      <Button onClick={verifyEnroll} disabled={otpCode.length !== 6}>
                        Vérifier
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setEnrolling(false); setQrUri(null); }}>
                Annuler
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Compte non protégé</p>
                  <p className="text-xs text-muted-foreground">
                    Activez la 2FA pour sécuriser votre compte contre les accès non autorisés.
                  </p>
                </div>
              </div>
              <Button onClick={startEnroll}>
                <Smartphone className="h-4 w-4 mr-2" />
                Activer la 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Sessions actives
              </CardTitle>
              <CardDescription>
                Gérez les appareils connectés à votre compte
              </CardDescription>
            </div>
            <Button variant="destructive" size="sm" onClick={signOutAll}>
              <LogOut className="h-4 w-4 mr-1" /> Tout déconnecter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Aucun historique de session disponible
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, i) => {
                const meta = session.metadata as Record<string, any> || {};
                return (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {i === 0 ? <Monitor className="h-4 w-4 text-primary" /> : <Globe className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground flex items-center gap-2">
                          {meta.user_agent ? 'Navigateur' : 'Session'}
                          {i === 0 && <Badge variant="outline" className="text-xs">Actuelle</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.ip_address || 'IP inconnue'} ·{' '}
                          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: fr })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
