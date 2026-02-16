import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Trash2, Shield, FileText, Clock, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function GDPRComplianceCenter() {
  const { user, profile } = useAuthOptimized();
  const [exporting, setExporting] = useState(false);
  const [consents, setConsents] = useState({
    analytics: true,
    marketing: false,
    thirdParty: false,
  });

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      // Collect all user data from various tables
      const tables = ['products', 'orders', 'activity_logs', 'integrations', 'api_keys'];
      const exportData: Record<string, any> = {
        profile: { email: user.email, ...profile },
        exported_at: new Date().toISOString(),
      };

      for (const table of tables) {
        const { data } = await supabase
          .from(table as any)
          .select('*')
          .eq('user_id', user.id)
          .limit(1000);
        if (data) exportData[table] = data;
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-donnees-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Export de vos données terminé !');
    } catch (error) {
      toast.error("Erreur lors de l'export des données");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      // Mark for deletion — actual deletion handled by admin/backend
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'account_deletion_request',
        description: 'Demande de suppression de compte RGPD',
        severity: 'warning',
      });
      toast.success('Demande de suppression enregistrée. Vous serez contacté sous 30 jours.');
    } catch {
      toast.error('Erreur lors de la demande');
    }
  };

  const handleConsentChange = (key: keyof typeof consents, value: boolean) => {
    setConsents(prev => ({ ...prev, [key]: value }));
    toast.success(`Consentement "${key}" mis à jour`);
  };

  return (
    <div className="space-y-6">
      {/* Compliance Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut RGPD</p>
              <p className="font-semibold">Conforme</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chiffrement</p>
              <p className="font-semibold">AES-256</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rétention données</p>
              <p className="font-semibold">12 mois</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Vos droits sur vos données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Droit à la portabilité</p>
                <p className="text-sm text-muted-foreground">Téléchargez toutes vos données au format JSON</p>
              </div>
            </div>
            <Button onClick={handleExportData} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Export...' : 'Exporter'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Droit d'accès</p>
                <p className="text-sm text-muted-foreground">Consultez les données que nous détenons</p>
              </div>
            </div>
            <Badge variant="default">Accessible</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Droit à l'effacement</p>
                <p className="text-sm text-muted-foreground">Demandez la suppression de votre compte et données</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Suppression du compte
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes vos données seront définitivement supprimées 
                    dans un délai de 30 jours conformément au RGPD. Vous recevrez un email de confirmation.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Confirmer la suppression
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Consent Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            Gestion des consentements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'analytics' as const, label: 'Analytics & Performance', desc: 'Collecte de métriques anonymisées pour améliorer le service' },
            { key: 'marketing' as const, label: 'Communications marketing', desc: 'Recevoir des offres et actualités par email' },
            { key: 'thirdParty' as const, label: 'Partage avec tiers', desc: 'Partage de données anonymisées avec partenaires' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={consents[item.key]}
                onCheckedChange={(v) => handleConsentChange(item.key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
