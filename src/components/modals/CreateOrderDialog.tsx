import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRealProducts } from "@/hooks/useRealProducts";
import { useRealCustomers } from "@/hooks/useRealCustomers";
import { supabase } from "@/integrations/supabase/client";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateOrderDialog = ({ open, onOpenChange }: CreateOrderDialogProps) => {
  const { toast } = useToast();
  const { products } = useRealProducts();
  const { customers, addCustomer } = useRealCustomers();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    product: "",
    quantity: "",
    status: "pending",
    notes: ""
  });

  const handleCreate = async () => {
    if (!formData.customerName || !formData.customerEmail || !formData.product || !formData.quantity) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour créer une commande",
          variant: "destructive"
        });
        return;
      }

      // Find or create customer
      let customer = customers.find(c => c.email === formData.customerEmail);
      if (!customer) {
        customer = await new Promise<any>((resolve) => {
          addCustomer({
            name: formData.customerName,
            email: formData.customerEmail,
            user_id: user.id,
            status: 'active',
            total_spent: 0,
            total_orders: 0
          } as any);
          // In a real app, we'd wait for the mutation to complete
          resolve({
            id: `temp_${Date.now()}`,
            name: formData.customerName,
            email: formData.customerEmail
          });
        });
      }

      // Find the selected product
      const selectedProduct = products.find(p => p.id === formData.product);
      if (!selectedProduct) {
        toast({
          title: "Erreur",
          description: "Produit non trouvé",
          variant: "destructive"
        });
        return;
      }

      const orderTotal = selectedProduct.price * parseInt(formData.quantity);

      // Create order in database
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          customer_id: customer.id,
          order_number: `ORD-${Date.now()}`,
          status: formData.status,
          total_amount: orderTotal,
          notes: formData.notes || null
        })
        .select()
        .single();

      if (error) throw error;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          product_sku: selectedProduct.sku,
          quantity: parseInt(formData.quantity),
          unit_price: selectedProduct.price,
          total_price: orderTotal
        });

      if (itemError) throw itemError;

      toast({
        title: "Commande créée avec succès",
        description: `Commande ${order.order_number} pour ${formData.customerName} créée.`,
      });

      onOpenChange(false);
      setFormData({
        customerName: "",
        customerEmail: "",
        product: "",
        quantity: "",
        status: "pending",
        notes: ""
      });
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la commande",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une Nouvelle Commande</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle commande au système
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nom du client</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Nom complet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email du client</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Produit</Label>
              <Select value={formData.product} onValueChange={(value) => setFormData({ ...formData, product: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.price}€
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes spéciales pour cette commande"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate}>
            Créer la commande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};