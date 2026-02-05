import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, Info } from "lucide-react";
import { VersionInfo } from "@/components/shared/VersionInfo";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    displayName: "Utilisateur",
    email: "user@example.com",
    notifications: true
  });

  const handleSave = () => {
    toast.success("Paramètres sauvegardés");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              À propos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="displayName">Nom d'affichage</Label>
              <Input
                id="displayName"
                value={settings.displayName}
                onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Notifications</Label>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                Sauvegarder
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="about" className="mt-4">
            <VersionInfo />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}