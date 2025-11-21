import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useApi } from '@/hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Settings, AlertCircle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConfigAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automationId?: string;
}

export function ConfigAutomationDialog({ open, onOpenChange, automationId }: ConfigAutomationDialogProps) {
  const { supabaseFunction } = useApi();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [config, setConfig] = useState({
    name: '',
    description: '',
    is_active: true,
    priority: 5,
    trigger_conditions: {} as any,
    actions: [] as any[],
  });

  useEffect(() => {
    if (open && automationId) {
      loadAutomationConfig();
    }
  }, [open, automationId]);

  const loadAutomationConfig = async () => {
    if (!automationId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabaseFunction('automation-engine', {
        action: 'get_rule',
        rule_id: automationId,
      });

      if (error) throw new Error(error);

      if (data) {
        const automationData = data as any;
        setConfig({
          name: automationData.name || '',
          description: automationData.description || '',
          is_active: automationData.is_active ?? true,
          priority: automationData.priority || 5,
          trigger_conditions: automationData.trigger_conditions || {},
          actions: automationData.actions || [],
        });
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de la configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!automationId) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabaseFunction('automation-engine', {
        action: 'update_rule',
        rule_id: automationId,
        updates: config,
      });

      if (error) throw new Error(error);

      toast.success('Configuration mise à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAction = () => {
    setConfig({
      ...config,
      actions: [
        ...config.actions,
        { type: 'send_notification', config: { channel: 'email' } },
      ],
    });
  };

  const removeAction = (index: number) => {
    const newActions = [...config.actions];
    newActions.splice(index, 1);
    setConfig({ ...config, actions: newActions });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configuration de l'automation
          </DialogTitle>
          <DialogDescription>
            Modifiez les paramètres et conditions de votre automation
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'automation</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activer l'automation</Label>
                    <p className="text-sm text-muted-foreground">
                      L'automation sera exécutée automatiquement
                    </p>
                  </div>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité ({config.priority})</Label>
                  <Input
                    id="priority"
                    type="range"
                    min="1"
                    max="10"
                    value={config.priority}
                    onChange={(e) => setConfig({ ...config, priority: parseInt(e.target.value) })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="conditions" className="space-y-4 mt-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <Label>Conditions de déclenchement</Label>
                  </div>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-[200px]">
                    {JSON.stringify(config.trigger_conditions, null, 2)}
                  </pre>
                  <p className="text-xs text-muted-foreground">
                    Configuration avancée des conditions JSON
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Actions à exécuter</Label>
                    <Button type="button" size="sm" onClick={addAction}>
                      Ajouter une action
                    </Button>
                  </div>

                  {config.actions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune action configurée
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {config.actions.map((action, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                          <Check className="h-4 w-4 text-green-500" />
                          <div className="flex-1">
                            <Badge variant="secondary">{action.type}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(action.config)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAction(index)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || !config.name}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
