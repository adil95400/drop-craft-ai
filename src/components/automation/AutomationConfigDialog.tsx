import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface AutomationConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: {
    id: number;
    name: string;
    description: string;
    trigger: string;
    status: string;
  };
}

export const AutomationConfigDialog = ({ open, onOpenChange, automation }: AutomationConfigDialogProps) => {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    name: automation.name,
    description: automation.description,
    trigger: automation.trigger,
    enabled: automation.status === "active",
    frequency: "1",
    conditions: "",
    actions: ""
  });

  const handleSave = () => {
    toast({
      title: "Configuration sauvegardée",
      description: `Les paramètres de "${config.name}" ont été mis à jour.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuration - {automation.name}</DialogTitle>
          <DialogDescription>
            Modifiez les paramètres de votre automation
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="triggers">Déclencheurs</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'automation</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
                  />
                  <span>{config.enabled ? "Activé" : "Désactivé"}</span>
                </div>
              </div>
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
          </TabsContent>

          <TabsContent value="triggers" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trigger-type">Type de déclencheur</Label>
                <Select defaultValue="schedule">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule">Planifié</SelectItem>
                    <SelectItem value="event">Événement</SelectItem>
                    <SelectItem value="condition">Condition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence</Label>
                <Select value={config.frequency} onValueChange={(value) => setConfig({ ...config, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Toutes les 15 minutes</SelectItem>
                    <SelectItem value="30">Toutes les 30 minutes</SelectItem>
                    <SelectItem value="1">Toutes les heures</SelectItem>
                    <SelectItem value="6">Toutes les 6 heures</SelectItem>
                    <SelectItem value="24">Quotidien</SelectItem>
                    <SelectItem value="168">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conditions">Conditions (optionnel)</Label>
                <Textarea
                  id="conditions"
                  placeholder="Définissez les conditions spécifiques..."
                  value={config.conditions}
                  onChange={(e) => setConfig({ ...config, conditions: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="action-type">Type d'action</Label>
                <Select defaultValue="update-prices">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update-prices">Mettre à jour les prix</SelectItem>
                    <SelectItem value="import-products">Importer des produits</SelectItem>
                    <SelectItem value="send-email">Envoyer un email</SelectItem>
                    <SelectItem value="update-stock">Mettre à jour le stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="actions">Actions à exécuter</Label>
                <Textarea
                  id="actions"
                  placeholder="Décrivez les actions à effectuer..."
                  value={config.actions}
                  onChange={(e) => setConfig({ ...config, actions: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retry-count">Nombre de tentatives</Label>
                <Input type="number" defaultValue="3" min="1" max="10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (secondes)</Label>
                <Input type="number" defaultValue="30" min="10" max="300" />
              </div>
              <div className="space-y-2">
                <Label>Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <span>Notifier en cas d'échec</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <span>Notifier en cas de succès</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};