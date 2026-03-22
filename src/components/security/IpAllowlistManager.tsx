import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Shield, Plus, Trash2, Globe, AlertTriangle, Loader2, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

interface IpEntry {
  id: string;
  ip_address: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
}

export function IpAllowlistManager() {
  const { user } = useUnifiedAuth();
  const [entries, setEntries] = useState<IpEntry[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [currentIp, setCurrentIp] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchCurrentIp();
    }
  }, [user]);

  const fetchCurrentIp = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      setCurrentIp(data.ip);
    } catch {
      setCurrentIp(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('ip_restriction_enabled')
        .eq('id', user!.id)
        .single();

      setEnabled(profile?.ip_restriction_enabled ?? false);

      const { data: ips } = await supabase
        .from('user_ip_allowlist')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      setEntries((ips as any[]) ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (value: boolean) => {
    if (value && entries.length === 0) {
      toast.error('Ajoutez au moins une IP autorisée avant d\'activer la restriction');
      return;
    }

    // Safety check: make sure current IP is in the list
    if (value && currentIp && !entries.some(e => e.ip_address === currentIp && e.is_active)) {
      toast.error('Votre IP actuelle n\'est pas dans la liste. Ajoutez-la d\'abord pour éviter de vous bloquer.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ ip_restriction_enabled: value } as any)
      .eq('id', user!.id);

    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      setEnabled(value);
      toast.success(value ? 'Restriction IP activée' : 'Restriction IP désactivée');
    }
    setSaving(false);
  };

  const addIp = async () => {
    if (!newIp.trim()) return;

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIp.trim())) {
      toast.error('Format d\'adresse IP invalide (ex: 192.168.1.1)');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('user_ip_allowlist')
      .insert({
        user_id: user!.id,
        ip_address: newIp.trim(),
        label: newLabel.trim() || null,
      } as any);

    if (error) {
      if (error.code === '23505') {
        toast.error('Cette IP est déjà dans la liste');
      } else {
        toast.error('Erreur: ' + error.message);
      }
    } else {
      setNewIp('');
      setNewLabel('');
      toast.success('IP ajoutée');
      fetchData();
    }
    setSaving(false);
  };

  const addCurrentIp = () => {
    if (currentIp) {
      setNewIp(currentIp);
      setNewLabel('Mon IP actuelle');
    }
  };

  const removeIp = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (enabled && entries.filter(e => e.is_active).length <= 1) {
      toast.error('Impossible de supprimer la dernière IP active. Désactivez d\'abord la restriction.');
      return;
    }

    if (enabled && entry && currentIp && entry.ip_address === currentIp) {
      toast.error('Impossible de supprimer votre IP actuelle pendant que la restriction est active.');
      return;
    }

    const { error } = await supabase
      .from('user_ip_allowlist')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('IP supprimée');
      fetchData();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            Restriction d'accès par IP
          </CardTitle>
          <CardDescription>
            Limitez les connexions à votre compte aux adresses IP autorisées uniquement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Activer la restriction IP</Label>
              <p className="text-sm text-muted-foreground">
                Seules les IPs listées pourront se connecter à votre compte
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={toggleEnabled}
              disabled={saving}
            />
          </div>

          {enabled && (
            <Alert className="mt-4 border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                La restriction IP est active. Assurez-vous que votre IP actuelle est dans la liste pour ne pas vous bloquer.
              </AlertDescription>
            </Alert>
          )}

          {currentIp && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Wifi className="h-4 w-4" />
              Votre IP actuelle : <Badge variant="outline">{currentIp}</Badge>
              {!entries.some(e => e.ip_address === currentIp) && (
                <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={addCurrentIp}>
                  Ajouter à la liste
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add IP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-5 w-5 text-primary" />
            Ajouter une adresse IP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="ex: 82.226.139.20"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="flex-1 min-w-[180px]"
            />
            <Input
              placeholder="Label (optionnel)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="flex-1 min-w-[150px]"
            />
            <Button onClick={addIp} disabled={saving || !newIp.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* IP List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5 text-primary" />
            IPs autorisées ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune IP autorisée configurée
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-mono text-sm">{entry.ip_address}</p>
                      {entry.label && (
                        <p className="text-xs text-muted-foreground">{entry.label}</p>
                      )}
                    </div>
                    {currentIp && entry.ip_address === currentIp && (
                      <Badge variant="default" className="text-[10px]">IP actuelle</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeIp(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
