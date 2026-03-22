/**
 * IpAllowlistManager - Gestion des IPs autorisées pour la connexion
 * Utilise le localStorage + profil pour stocker la config en attendant la table dédiée
 */
import { useState, useEffect, useCallback } from 'react';
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

interface IpEntry {
  id: string;
  ip: string;
  label: string;
  active: boolean;
  addedAt: string;
}

interface IpConfig {
  enabled: boolean;
  entries: IpEntry[];
}

const STORAGE_KEY = 'dropcraft_ip_allowlist';

function loadConfig(): IpConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { enabled: false, entries: [] };
  } catch {
    return { enabled: false, entries: [] };
  }
}

function saveConfig(config: IpConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function IpAllowlistManager() {
  const [config, setConfig] = useState<IpConfig>(loadConfig);
  const [newIp, setNewIp] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
    fetchCurrentIp();
    // Load from profile metadata if available
    loadFromProfile();
  }, []);

  const loadFromProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.ip_allowlist) {
        const profileConfig = user.user_metadata.ip_allowlist as IpConfig;
        setConfig(profileConfig);
        saveConfig(profileConfig);
      }
    } catch {
      // fallback to localStorage
    } finally {
      setLoading(false);
    }
  };

  const persistConfig = useCallback(async (newConfig: IpConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
    // Also save to user metadata for cross-device sync
    try {
      await supabase.auth.updateUser({
        data: { ip_allowlist: newConfig }
      });
    } catch {
      // localStorage fallback is fine
    }
  }, []);

  const fetchCurrentIp = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      setCurrentIp(data.ip);
    } catch {
      setCurrentIp(null);
    }
  };

  const toggleEnabled = async (value: boolean) => {
    if (value && config.entries.length === 0) {
      toast.error("Ajoutez au moins une IP autorisée avant d'activer la restriction");
      return;
    }

    if (value && currentIp && !config.entries.some(e => e.ip === currentIp && e.active)) {
      toast.error("Votre IP actuelle n'est pas dans la liste. Ajoutez-la d'abord.");
      return;
    }

    const newConfig = { ...config, enabled: value };
    await persistConfig(newConfig);

    // Log security event
    if (userId) {
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: value ? 'ip_restriction_enabled' : 'ip_restriction_disabled',
        severity: 'warning',
        description: value ? 'IP restriction activated' : 'IP restriction deactivated',
        metadata: { entries_count: config.entries.length }
      } as any);
    }

    toast.success(value ? 'Restriction IP activée' : 'Restriction IP désactivée');
  };

  const addIp = async () => {
    if (!newIp.trim()) return;

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIp.trim())) {
      toast.error("Format d'adresse IP invalide (ex: 192.168.1.1)");
      return;
    }

    if (config.entries.some(e => e.ip === newIp.trim())) {
      toast.error('Cette IP est déjà dans la liste');
      return;
    }

    const newEntry: IpEntry = {
      id: crypto.randomUUID(),
      ip: newIp.trim(),
      label: newLabel.trim() || 'IP personnalisée',
      active: true,
      addedAt: new Date().toISOString(),
    };

    const newConfig = { ...config, entries: [newEntry, ...config.entries] };
    await persistConfig(newConfig);

    setNewIp('');
    setNewLabel('');
    toast.success('IP ajoutée à la liste');
  };

  const addCurrentIp = () => {
    if (currentIp) {
      setNewIp(currentIp);
      setNewLabel('Mon IP actuelle');
    }
  };

  const removeIp = async (id: string) => {
    const entry = config.entries.find(e => e.id === id);
    const activeCount = config.entries.filter(e => e.active).length;

    if (config.enabled && activeCount <= 1) {
      toast.error("Impossible de supprimer la dernière IP active. Désactivez d'abord la restriction.");
      return;
    }

    if (config.enabled && entry && currentIp && entry.ip === currentIp) {
      toast.error("Impossible de supprimer votre IP actuelle pendant que la restriction est active.");
      return;
    }

    const newConfig = { ...config, entries: config.entries.filter(e => e.id !== id) };
    await persistConfig(newConfig);
    toast.success('IP supprimée');
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
              checked={config.enabled}
              onCheckedChange={toggleEnabled}
            />
          </div>

          {config.enabled && (
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
              {!config.entries.some(e => e.ip === currentIp) && (
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
            <Button onClick={addIp} disabled={!newIp.trim()}>
              <Plus className="h-4 w-4 mr-1" />
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
            IPs autorisées ({config.entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune IP autorisée configurée
            </p>
          ) : (
            <div className="space-y-2">
              {config.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-mono text-sm">{entry.ip}</p>
                      <p className="text-xs text-muted-foreground">{entry.label}</p>
                    </div>
                    {currentIp && entry.ip === currentIp && (
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
