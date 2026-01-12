import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ArrowLeft, ShoppingCart, Plus, X, Search, User,
  CreditCard, Truck, Tag, FileText, Calculator
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface OrderItem {
  id: string;
  product: string;
  sku: string;
  quantity: string;
  price: string;
  discount: string;
}

// Données exemple pour la démo
const sampleCustomers = [
  { id: '1', name: 'Jean Dupont', email: 'jean.dupont@email.com' },
  { id: '2', name: 'Marie Martin', email: 'marie.martin@email.com' },
  { id: '3', name: 'Pierre Durant', email: 'pierre.durant@email.com' },
];

const sampleProducts = [
  { id: '1', name: 'T-shirt Premium', sku: 'TSH-001', price: 29.99 },
  { id: '2', name: 'Jean Slim', sku: 'JEA-001', price: 59.99 },
  { id: '3', name: 'Sneakers Urban', sku: 'SNE-001', price: 89.99 },
];

export default function CreateOrder() {
  const navigate = useNavigate();
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', product: '', sku: '', quantity: '1', price: '', discount: '0' }
  ]);
  
  const [formData, setFormData] = useState({
    paymentMethod: '',
    paymentStatus: 'pending',
    shippingMethod: '',
    shippingCost: '0',
    taxRate: '20',
    discountType: 'fixed',
    discountValue: '0',
    orderStatus: 'pending',
    customerNote: '',
    internalNote: '',
    tags: [] as string[]
  });

  const [currentTag, setCurrentTag] = useState('');

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), product: '', sku: '', quantity: '1', price: '', discount: '0' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const selectProduct = (itemId: string, product: typeof sampleProducts[0]) => {
    updateItem(itemId, 'product', product.name);
    updateItem(itemId, 'sku', product.sku);
    updateItem(itemId, 'price', product.price.toString());
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      const discount = parseFloat(item.discount) || 0;
      return sum + ((price * quantity) - discount);
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const taxRate = parseFloat(formData.taxRate) || 0;
    return (subtotal * taxRate) / 100;
  };

  const calculateOrderDiscount = () => {
    const subtotal = calculateSubtotal();
    const discountValue = parseFloat(formData.discountValue) || 0;
    if (formData.discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const shipping = parseFloat(formData.shippingCost) || 0;
    const orderDiscount = calculateOrderDiscount();
    return subtotal + tax + shipping - orderDiscount;
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] });
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('Client requis');
      return;
    }
    if (items.some(item => !item.product || !item.price)) {
      toast.error('Tous les produits doivent avoir un nom et un prix');
      return;
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Non authentifié');
        return;
      }

      const total = calculateTotal();
      const orderNumber = `ORD-${Date.now()}`;

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          customer_id: selectedCustomer,
          order_number: orderNumber,
          status: formData.orderStatus,
          total_amount: total,
          currency: 'EUR',
          payment_status: formData.paymentStatus,
          notes: formData.customerNote
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Créer les items de commande
      const orderItems = items.map(item => ({
        order_id: order.id,
        user_id: user.id,
        product_name: item.product,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.price),
        total_price: (parseFloat(item.price) * parseInt(item.quantity)) - parseFloat(item.discount || '0')
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('Commande créée avec succès');
      navigate('/orders');
    } catch (error) {
      console.error('Erreur création commande:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  };

  const selectedCustomerData = sampleCustomers.find(c => c.id === selectedCustomer);

  return (
    <>
      <Helmet>
        <title>Créer une Commande - ShopOpti</title>
        <meta name="description" content="Créez une nouvelle commande manuelle avec calculs automatiques" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/orders')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux commandes
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => toast.info('Brouillon sauvegardé')}>
                Sauvegarder
              </Button>
              <Button onClick={handleSubmit}>
                Créer la commande
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Client
                    </CardTitle>
                    <CardDescription>
                      Sélectionnez un client existant ou créez-en un nouveau
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {selectedCustomerData ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <div className="text-left">
                                <div className="font-medium">{selectedCustomerData.name}</div>
                                <div className="text-xs text-muted-foreground">{selectedCustomerData.email}</div>
                              </div>
                            </div>
                          ) : (
                            'Sélectionner un client...'
                          )}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Rechercher un client..." 
                            value={customerSearch}
                            onValueChange={setCustomerSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="text-center py-6">
                                <p className="text-sm text-muted-foreground mb-3">Aucun client trouvé</p>
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    setCustomerOpen(false);
                                    navigate('/customers/create');
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Créer un client
                                </Button>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {sampleCustomers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.id}
                                  onSelect={(currentValue) => {
                                    setSelectedCustomer(currentValue);
                                    setCustomerOpen(false);
                                  }}
                                >
                                  <div>
                                    <div className="font-medium">{customer.name}</div>
                                    <div className="text-xs text-muted-foreground">{customer.email}</div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {selectedCustomerData && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{selectedCustomerData.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedCustomerData.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustomer('')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5 text-primary" />
                          Produits
                        </CardTitle>
                        <CardDescription>
                          Ajoutez les produits à la commande
                        </CardDescription>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Article {index + 1}</span>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 space-y-2">
                            <Label>Produit</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                  {item.product || 'Sélectionner un produit...'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Rechercher un produit..." />
                                  <CommandList>
                                    <CommandEmpty>Aucun produit trouvé</CommandEmpty>
                                    <CommandGroup>
                                      {sampleProducts.map((product) => (
                                        <CommandItem
                                          key={product.id}
                                          onSelect={() => selectProduct(item.id, product)}
                                        >
                                          <div className="flex-1">
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                              SKU: {product.sku} • {product.price}€
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-2">
                            <Label>Quantité</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Prix unitaire (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                              placeholder="0.00"
                            />
                          </div>

                          <div className="col-span-2 space-y-2">
                            <Label>Réduction article (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {item.price && item.quantity && (
                          <div className="flex justify-end pt-2 border-t">
                            <span className="text-sm font-medium">
                              Sous-total: {((parseFloat(item.price) * parseInt(item.quantity)) - parseFloat(item.discount || '0')).toFixed(2)}€
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Paiement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment">Méthode de paiement</Label>
                        <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="card">Carte bancaire</SelectItem>
                            <SelectItem value="cash">Espèces</SelectItem>
                            <SelectItem value="transfer">Virement</SelectItem>
                            <SelectItem value="check">Chèque</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentStatus">Statut du paiement</Label>
                        <Select value={formData.paymentStatus} onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="paid">Payé</SelectItem>
                            <SelectItem value="failed">Échoué</SelectItem>
                            <SelectItem value="refunded">Remboursé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      Livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shipping">Méthode de livraison</Label>
                        <Select value={formData.shippingMethod} onValueChange={(value) => setFormData({ ...formData, shippingMethod: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard (3-5 jours)</SelectItem>
                            <SelectItem value="express">Express (1-2 jours)</SelectItem>
                            <SelectItem value="pickup">Retrait en magasin</SelectItem>
                            <SelectItem value="same-day">Livraison le jour même</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shippingCost">Frais de livraison (€)</Label>
                        <Input
                          id="shippingCost"
                          type="number"
                          step="0.01"
                          value={formData.shippingCost}
                          onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerNote">Note pour le client</Label>
                      <Textarea
                        id="customerNote"
                        value={formData.customerNote}
                        onChange={(e) => setFormData({ ...formData, customerNote: e.target.value })}
                        placeholder="Message visible par le client..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="internalNote">Note interne</Label>
                      <Textarea
                        id="internalNote"
                        value={formData.internalNote}
                        onChange={(e) => setFormData({ ...formData, internalNote: e.target.value })}
                        placeholder="Note privée pour votre équipe..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Statut de la commande</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="orderStatus">Statut</Label>
                      <Select value={formData.orderStatus} onValueChange={(value) => setFormData({ ...formData, orderStatus: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-yellow-500" />
                              En attente
                            </div>
                          </SelectItem>
                          <SelectItem value="processing">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                              En traitement
                            </div>
                          </SelectItem>
                          <SelectItem value="shipped">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-purple-500" />
                              Expédiée
                            </div>
                          </SelectItem>
                          <SelectItem value="delivered">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              Livrée
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                              Annulée
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-primary" />
                      Résumé
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span className="font-medium">{calculateSubtotal().toFixed(2)}€</span>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label className="text-sm">Réduction commande</Label>
                        <div className="flex gap-2">
                          <Select 
                            value={formData.discountType} 
                            onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">€</SelectItem>
                              <SelectItem value="percentage">%</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.discountValue}
                            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                        {parseFloat(formData.discountValue) > 0 && (
                          <div className="flex justify-between text-sm text-red-600">
                            <span>Réduction</span>
                            <span>-{calculateOrderDiscount().toFixed(2)}€</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Livraison</span>
                        <span className="font-medium">{parseFloat(formData.shippingCost).toFixed(2)}€</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">TVA ({formData.taxRate}%)</span>
                        <span className="font-medium">{calculateTax().toFixed(2)}€</span>
                      </div>

                      <Separator />

                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">{calculateTotal().toFixed(2)}€</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        placeholder="Ajouter un tag"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" size="icon" variant="outline" onClick={addTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
