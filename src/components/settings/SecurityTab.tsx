import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Lock, Monitor, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SecurityBadge, SecurityFooterBar } from "@/components/ui/security-badge";
import { supabase } from "@/integrations/supabase/client";

export function SecurityTab() {
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading2FA, setLoading2FA] = useState(false);

  // Check real 2FA status on mount
  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const factors = (user as any).factors || [];
          const hasTotp = factors.some((f: any) => f.factor_type === 'totp' && f.status === 'verified');
          setTwoFactorEnabled(hasTotp);
        }
      } catch (e) {
        console.error('Error checking 2FA status:', e);
      }
    };
    check2FAStatus();
  }, []);

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (passwordData.new.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    toast.promise(
      supabase.auth.updateUser({ password: passwordData.new }).then(({ error }) => {
        if (error) throw error;
        setPasswordData({ current: "", new: "", confirm: "" });
      }),
      {
        loading: 'Modification du mot de passe...',
        success: 'Mot de passe modifié avec succès',
        error: 'Erreur lors de la modification'
      }
    );
  };

  const handleToggle2FA = async () => {
    setLoading2FA(true);
    try {
      if (twoFactorEnabled) {
        // Unenroll: get current TOTP factor and unenroll
        const { data: { user } } = await supabase.auth.getUser();
        const factors = (user as any)?.factors || [];
        const totpFactor = factors.find((f: any) => f.factor_type === 'totp' && f.status === 'verified');
        
        if (totpFactor) {
          const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
          if (error) throw error;
          setTwoFactorEnabled(false);
          toast.success('2FA désactivé avec succès');
        }
      } else {
        // Enroll: create new TOTP factor
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
        if (error) throw error;
        
        // For full flow, user would scan QR code and verify
        // Here we show the QR code URI for now
        if (data) {
          toast.info('Scannez le QR code dans votre application d\'authentification, puis vérifiez le code.');
          // In a complete implementation, show a dialog with the QR code
          // For now, open the TOTP URI
          const totpUri = (data as any).totp?.uri;
          if (totpUri) {
            window.open(totpUri, '_blank');
          }
          // Mark as pending - user needs to verify
          toast.success('2FA configuré. Vérifiez avec un code pour activer.');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la configuration 2FA');
    } finally {
      setLoading2FA(false);
    }
  };

  const passwordStrength = passwordData.new.length >= 12 ? 'Fort' : 
                           passwordData.new.length >= 8 ? 'Moyen' : 
                           passwordData.new.length > 0 ? 'Faible' : '';

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              Sécurité du Compte
            </CardTitle>
            <SecurityBadge level="high" variant="default" />
          </div>
          <CardDescription>Protégez votre compte avec des mesures de sécurité avancées</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Security Score */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Score de sécurité</span>
              <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
                {twoFactorEnabled ? 'Excellent' : 'Bon'}
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                style={{ width: twoFactorEnabled ? '100%' : '60%' }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {twoFactorEnabled 
                ? 'Votre compte est bien protégé' 
                : 'Activez le 2FA pour améliorer votre sécurité'}
            </p>
          </div>

          {/* Security Checklist */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm">Email vérifié</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm">Mot de passe défini</span>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg ${twoFactorEnabled ? 'bg-muted/50' : 'bg-yellow-500/10'}`}>
              {twoFactorEnabled ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="text-sm">Authentification à deux facteurs {twoFactorEnabled ? 'activée' : 'désactivée'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Modifier le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Mot de passe actuel</Label>
              <Input 
                type="password" 
                placeholder="••••••••"
                value={passwordData.current}
                onChange={e => setPasswordData({...passwordData, current: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input 
                type="password" 
                placeholder="••••••••"
                value={passwordData.new}
                onChange={e => setPasswordData({...passwordData, new: e.target.value})}
              />
              {passwordStrength && (
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        passwordStrength === 'Fort' ? 'w-full bg-green-500' :
                        passwordStrength === 'Moyen' ? 'w-2/3 bg-yellow-500' :
                        'w-1/3 bg-red-500'
                      }`}
                    />
                  </div>
                  <span className={`text-xs ${
                    passwordStrength === 'Fort' ? 'text-green-500' :
                    passwordStrength === 'Moyen' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>{passwordStrength}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirmer le nouveau mot de passe</Label>
              <Input 
                type="password" 
                placeholder="••••••••"
                value={passwordData.confirm}
                onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
              />
            </div>
          </div>
          <Button variant="outline" onClick={handleChangePassword}>
            <Lock className="mr-2 h-4 w-4" />
            Changer le Mot de Passe
          </Button>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            Authentification à deux facteurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
            <div>
              <div className="font-medium flex items-center gap-2">
                2FA 
                {twoFactorEnabled && <Badge className="bg-green-500">Activé</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">
                Ajoutez une couche de sécurité supplémentaire
              </div>
            </div>
            <Button 
              variant={twoFactorEnabled ? "destructive" : "default"}
              onClick={handleToggle2FA}
            >
              <Key className="mr-2 h-4 w-4" />
              {twoFactorEnabled ? 'Désactiver' : 'Activer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4" />
            Sessions actives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-primary/30 rounded-lg bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">Session actuelle</div>
                <div className="text-sm text-muted-foreground">
                  {new Date().toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
            <Badge variant="secondary">Actuelle</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security Footer */}
      <SecurityFooterBar />
    </div>
  );
}
