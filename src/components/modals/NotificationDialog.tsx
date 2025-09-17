import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell } from "lucide-react";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDialog({ open, onOpenChange }: NotificationDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "",
    priority: "",
    targetUsers: "",
    scheduleDate: "",
    pushNotification: true,
    emailNotification: false,
    smsNotification: false
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message || !formData.type) {
      toast.error("Titre, message et type requis");
      return;
    }
    
    toast.success("Notification créée avec succès");
    onOpenChange(false);
    setFormData({
      title: "",
      message: "",
      type: "",
      priority: "",
      targetUsers: "",
      scheduleDate: "",
      pushNotification: true,
      emailNotification: false,
      smsNotification: false
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Nouvelle Notification
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="targetUsers">Utilisateurs cibles</Label>
              <Input
                id="targetUsers"
                value={formData.targetUsers}
                onChange={(e) => setFormData(prev => ({ ...prev, targetUsers: e.target.value }))}
                placeholder="Tous, Admin, Clients..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="scheduleDate">Date de programmation (optionnel)</Label>
            <Input
              id="scheduleDate"
              type="datetime-local"
              value={formData.scheduleDate}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduleDate: e.target.value }))}
            />
          </div>

          <div className="space-y-3">
            <Label>Canaux de notification</Label>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="pushNotification">Notification push</Label>
              <Switch
                id="pushNotification"
                checked={formData.pushNotification}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pushNotification: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotification">Email</Label>
              <Switch
                id="emailNotification"
                checked={formData.emailNotification}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailNotification: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="smsNotification">SMS</Label>
              <Switch
                id="smsNotification"
                checked={formData.smsNotification}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smsNotification: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer la notification</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}