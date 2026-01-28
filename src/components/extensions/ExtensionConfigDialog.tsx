/**
 * Dialog for configuring installed extensions
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Settings, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ExtensionConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extension: {
    id: string;
    name: string;
    config: Record<string, any> | null;
  } | null;
}

export function ExtensionConfigDialog({ open, onOpenChange, extension }: ExtensionConfigDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (extension?.config) {
      setConfig(extension.config);
    } else {
      setConfig({
        auto_sync: true,
        sync_interval_hours: 24,
        notifications_enabled: true,
      });
    }
  }, [extension]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extension) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('integrations')
        .update({
          config: {
            ...config,
            updated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', extension.id);

      if (error) throw error;

      toast.success('Configuration sauvegardée');
      queryClient.invalidateQueries({ queryKey: ['extensions'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Config save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!extension) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configuration - {extension.name}
          </DialogTitle>
          <DialogDescription>
            Personnalisez les paramètres de cette extension
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Auto Sync */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto_sync">Synchronisation automatique</Label>
              <p className="text-xs text-muted-foreground">
                Activer la synchronisation périodique
              </p>
            </div>
            <Switch
              id="auto_sync"
              checked={config.auto_sync ?? true}
              onCheckedChange={(checked) => setConfig({ ...config, auto_sync: checked })}
            />
          </div>

          {/* Sync Interval */}
          {config.auto_sync && (
            <div className="space-y-2">
              <Label htmlFor="sync_interval">Intervalle de synchronisation (heures)</Label>
              <Input
                id="sync_interval"
                type="number"
                min="1"
                max="168"
                value={config.sync_interval_hours ?? 24}
                onChange={(e) => setConfig({ ...config, sync_interval_hours: parseInt(e.target.value) || 24 })}
              />
            </div>
          )}

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Recevoir des alertes de cette extension
              </p>
            </div>
            <Switch
              id="notifications"
              checked={config.notifications_enabled ?? true}
              onCheckedChange={(checked) => setConfig({ ...config, notifications_enabled: checked })}
            />
          </div>

          {/* Custom API Key if needed */}
          <div className="space-y-2">
            <Label htmlFor="api_key">Clé API (optionnel)</Label>
            <Input
              id="api_key"
              type="password"
              value={config.api_key ?? ''}
              onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground">
              Certaines extensions nécessitent une clé API personnelle
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
