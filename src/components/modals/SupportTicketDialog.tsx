import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface SupportTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportTicketDialog = ({ open, onOpenChange }: SupportTicketDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium",
    category: "",
    customer: "",
    assignee: "",
    status: "open",
    internal: false
  });

  const handleCreate = () => {
    if (!formData.subject || !formData.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le sujet et la description",
        variant: "destructive"
      });
      return;
    }

    const ticketNumber = `TK-${Date.now().toString().slice(-6)}`;
    
    toast({
      title: "Ticket créé avec succès",
      description: `Ticket ${ticketNumber} : "${formData.subject}" créé avec priorité ${formData.priority}.`,
    });

    onOpenChange(false);
    setFormData({
      subject: "",
      description: "",
      priority: "medium",
      category: "",
      customer: "",
      assignee: "",
      status: "open",
      internal: false
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un Ticket de Support</DialogTitle>
          <DialogDescription>
            Enregistrez une nouvelle demande de support
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Résumé du problème ou de la demande"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description détaillée</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez le problème en détail..."
              rows={5}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technique</SelectItem>
                  <SelectItem value="billing">Facturation</SelectItem>
                  <SelectItem value="account">Compte</SelectItem>
                  <SelectItem value="integration">Intégration</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Nouvelle fonctionnalité</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer">Client concerné</Label>
            <Input
              id="customer"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              placeholder="Nom ou email du client"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assigné à</Label>
              <Select value={formData.assignee} onValueChange={(value) => setFormData({ ...formData, assignee: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support1">Agent Support 1</SelectItem>
                  <SelectItem value="support2">Agent Support 2</SelectItem>
                  <SelectItem value="tech1">Technicien 1</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="waiting">En attente</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="internal"
              checked={formData.internal}
              onCheckedChange={(checked) => setFormData({ ...formData, internal: checked })}
            />
            <Label htmlFor="internal">Ticket interne (non visible par le client)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate}>
            Créer le ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};