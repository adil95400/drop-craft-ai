import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface TrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
  orderNumber?: string;
}

export const TrackingDialog = ({ 
  open, 
  onOpenChange, 
  orderId, 
  orderNumber = "N/A" 
}: TrackingDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    trackingNumber: "",
    carrier: "",
    status: "in_transit",
    location: "",
    estimatedDelivery: "",
    notes: ""
  });

  const handleUpdate = () => {
    if (!formData.trackingNumber || !formData.carrier) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le numéro de suivi et le transporteur",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Suivi mis à jour",
      description: `Numéro de suivi ${formData.trackingNumber} ajouté pour la commande ${orderNumber}`,
    });

    onOpenChange(false);
    setFormData({
      trackingNumber: "",
      carrier: "",
      status: "in_transit",
      location: "",
      estimatedDelivery: "",
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mettre à jour le Suivi</DialogTitle>
          <DialogDescription>
            Informations de suivi pour la commande {orderNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Numéro de suivi</Label>
            <Input
              id="trackingNumber"
              value={formData.trackingNumber}
              onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
              placeholder="Ex: 1Z999AA1234567890"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carrier">Transporteur</Label>
            <Select value={formData.carrier} onValueChange={(value) => setFormData({ ...formData, carrier: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le transporteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="colissimo">Colissimo</SelectItem>
                <SelectItem value="chronopost">Chronopost</SelectItem>
                <SelectItem value="dhl">DHL</SelectItem>
                <SelectItem value="ups">UPS</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="dpd">DPD</SelectItem>
                <SelectItem value="gls">GLS</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
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
                <SelectItem value="shipped">Expédié</SelectItem>
                <SelectItem value="in_transit">En transit</SelectItem>
                <SelectItem value="out_for_delivery">En cours de livraison</SelectItem>
                <SelectItem value="delivered">Livré</SelectItem>
                <SelectItem value="failed_delivery">Échec de livraison</SelectItem>
                <SelectItem value="returned">Retourné</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Localisation actuelle</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Centre de tri Paris"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estimatedDelivery">Livraison estimée</Label>
            <Input
              id="estimatedDelivery"
              type="date"
              value={formData.estimatedDelivery}
              onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes additionnelles..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleUpdate}>
            Mettre à jour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};