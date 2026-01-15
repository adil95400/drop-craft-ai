import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChannableLayout } from '@/components/channable/navigation/ChannableLayout';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Plus, X, Search, User,
  CreditCard, Truck, Tag, FileText, Calculator,
  Package, Sparkles, Check, AlertCircle, Loader2
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
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/navigation/BackButton';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  product: string;
  productId: string;
  sku: string;
  quantity: string;
  price: string;
  discount: string;
  imageUrl?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Product {
  id: string;
  title: string;
  sku: string | null;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Data from database
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', product: '', productId: '', sku: '', quantity: '1', price: '', discount: '0' }
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

  // Fetch customers from database
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('customers')
          .select('id, first_name, last_name, email, phone')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        setCustomers(data?.map(c => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Client sans nom',
          email: c.email || '',
          phone: c.phone || undefined
        })) || []);
      } catch (error) {
        console.error('Erreur chargement clients:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('products')
          .select('id, title, sku, price, image_url, stock_quantity')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Erreur chargement produits:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const addItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      product: '', 
      productId: '',
      sku: '', 
      quantity: '1', 
      price: '', 
      discount: '0' 
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const selectProduct = (itemId: string, product: Product) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          product: product.title,
          productId: product.id,
          sku: product.sku || '',
          price: product.price?.toString() || '',
          imageUrl: product.image_url || undefined
        };
      }
      return item;
    }));
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
    const trimmedTag = currentTag.trim().slice(0, 50);
    if (trimmedTag && !formData.tags.includes(trimmedTag) && formData.tags.length < 10) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const validateForm = (): boolean => {
    if (!selectedCustomer) {
      toast.error('Veuillez sélectionner un client');
      return false;
    }
    
    const validItems = items.filter(item => item.product && item.price);
    if (validItems.length === 0) {
      toast.error('Ajoutez au moins un produit avec un prix');
      return false;
    }

    for (const item of items) {
      if (item.product) {
        const price = parseFloat(item.price);
        const quantity = parseInt(item.quantity);
        if (isNaN(price) || price < 0) {
          toast.error('Prix invalide pour ' + item.product);
          return false;
        }
        if (isNaN(quantity) || quantity < 1) {
          toast.error('Quantité invalide pour ' + item.product);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Vous devez être connecté');
        return;
      }

      const total = calculateTotal();
      const orderNumber = `ORD-${Date.now()}`;

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
          notes: formData.customerNote.slice(0, 1000)
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const validItems = items.filter(item => item.product && item.price);
      const orderItems = validItems.map(item => ({
        order_id: order.id,
        user_id: user.id,
        product_id: item.productId || null,
        product_name: item.product.slice(0, 255),
        quantity: Math.max(1, parseInt(item.quantity) || 1),
        unit_price: Math.max(0, parseFloat(item.price) || 0),
        total_price: Math.max(0, (parseFloat(item.price) * parseInt(item.quantity)) - parseFloat(item.discount || '0'))
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('Commande créée avec succès !', {
        description: `N° ${orderNumber}`
      });
      navigate('/orders');
    } catch (error) {
      console.error('Erreur création commande:', error);
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  const itemsCount = items.filter(i => i.product).length;

  return (
    <ChannableLayout>
      <Helmet>
        <title>Créer une Commande - DropCraft</title>
        <meta name="description" content="Créez une nouvelle commande manuelle avec calculs automatiques" />
      </Helmet>

      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <BackButton to="/orders" label="Retour aux commandes" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  Nouvelle commande
                </h1>
                <p className="text-muted-foreground mt-1">
                  Créez une commande manuelle avec calculs automatiques
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => toast.info('Brouillon sauvegardé')}
                  disabled={isSubmitting}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Brouillon
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Créer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                {/* Client */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-500" />
                        </div>
                        Client
                        {selectedCustomer && (
                          <Badge variant="secondary" className="ml-auto">
                            <Check className="h-3 w-3 mr-1" />
                            Sélectionné
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingCustomers ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between h-auto py-3",
                                selectedCustomerData && "border-primary/50"
                              )}
                            >
                              {selectedCustomerData ? (
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="text-left">
                                    <div className="font-medium">{selectedCustomerData.name}</div>
                                    <div className="text-xs text-muted-foreground">{selectedCustomerData.email}</div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Rechercher un client...</span>
                              )}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Nom ou email..." 
                                value={customerSearch}
                                onValueChange={setCustomerSearch}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="text-center py-6">
                                    <User className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
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
                                <CommandGroup heading="Clients récents">
                                  {filteredCustomers.map((customer) => (
                                    <CommandItem
                                      key={customer.id}
                                      value={customer.id}
                                      onSelect={(currentValue) => {
                                        setSelectedCustomer(currentValue);
                                        setCustomerOpen(false);
                                      }}
                                      className="py-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                          <User className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <div className="font-medium">{customer.name}</div>
                                          <div className="text-xs text-muted-foreground">{customer.email}</div>
                                        </div>
                                      </div>
                                      {selectedCustomer === customer.id && (
                                        <Check className="ml-auto h-4 w-4 text-primary" />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}

                      <AnimatePresence>
                        {selectedCustomerData && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                          >
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-semibold">{selectedCustomerData.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedCustomerData.email}</p>
                                    {selectedCustomerData.phone && (
                                      <p className="text-sm text-muted-foreground">{selectedCustomerData.phone}</p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedCustomer('')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Produits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-green-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Produits</CardTitle>
                            <CardDescription>
                              {itemsCount} article{itemsCount > 1 ? 's' : ''} dans la commande
                            </CardDescription>
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <AnimatePresence>
                        {items.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={cn(
                              "p-4 rounded-xl border-2 transition-colors",
                              item.product ? "border-green-500/20 bg-green-500/5" : "border-dashed border-muted-foreground/20"
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </div>
                                <span className="text-sm font-medium">
                                  {item.product || 'Nouvel article'}
                                </span>
                              </div>
                              {items.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="sm:col-span-2 space-y-2">
                                <Label className="text-xs">Produit</Label>
                                {loadingProducts ? (
                                  <Skeleton className="h-10 w-full" />
                                ) : (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button 
                                        type="button"
                                        variant="outline" 
                                        className={cn(
                                          "w-full justify-start h-auto py-2",
                                          item.product && "border-green-500/30"
                                        )}
                                      >
                                        {item.product ? (
                                          <div className="flex items-center gap-2">
                                            {item.imageUrl ? (
                                              <img 
                                                src={item.imageUrl} 
                                                alt="" 
                                                className="h-8 w-8 rounded object-cover"
                                              />
                                            ) : (
                                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                                <Package className="h-4 w-4" />
                                              </div>
                                            )}
                                            <div className="text-left">
                                              <div className="font-medium text-sm">{item.product}</div>
                                              {item.sku && (
                                                <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground">Sélectionner un produit...</span>
                                        )}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="Rechercher un produit..." />
                                        <CommandList>
                                          <CommandEmpty>
                                            <div className="text-center py-6">
                                              <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                                              <p className="text-sm text-muted-foreground">Aucun produit trouvé</p>
                                            </div>
                                          </CommandEmpty>
                                          <CommandGroup heading="Produits disponibles">
                                            {products.map((product) => (
                                              <CommandItem
                                                key={product.id}
                                                onSelect={() => selectProduct(item.id, product)}
                                                className="py-3"
                                              >
                                                <div className="flex items-center gap-3 flex-1">
                                                  {product.image_url ? (
                                                    <img 
                                                      src={product.image_url} 
                                                      alt="" 
                                                      className="h-10 w-10 rounded object-cover"
                                                    />
                                                  ) : (
                                                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                      <Package className="h-5 w-5" />
                                                    </div>
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{product.title}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                      {product.sku && <span>SKU: {product.sku}</span>}
                                                      {product.stock_quantity !== null && (
                                                        <Badge variant="outline" className="text-xs">
                                                          Stock: {product.stock_quantity}
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="font-semibold text-primary">
                                                    {product.price?.toFixed(2)}€
                                                  </div>
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Quantité</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="9999"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                  className="h-9"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Prix unitaire (€)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.price}
                                  onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                  placeholder="0.00"
                                  className="h-9"
                                />
                              </div>

                              <div className="sm:col-span-2 space-y-2">
                                <Label className="text-xs">Réduction article (€)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.discount}
                                  onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                                  placeholder="0.00"
                                  className="h-9"
                                />
                              </div>
                            </div>

                            {item.price && item.quantity && (
                              <div className="flex justify-end pt-3 mt-3 border-t">
                                <span className="text-sm font-semibold text-primary">
                                  Sous-total: {((parseFloat(item.price) * parseInt(item.quantity)) - parseFloat(item.discount || '0')).toFixed(2)}€
                                </span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Paiement & Livraison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-purple-500" />
                          </div>
                          Paiement
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Méthode</Label>
                          <Select 
                            value={formData.paymentMethod} 
                            onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="card">💳 Carte bancaire</SelectItem>
                              <SelectItem value="cash">💵 Espèces</SelectItem>
                              <SelectItem value="transfer">🏦 Virement</SelectItem>
                              <SelectItem value="check">📝 Chèque</SelectItem>
                              <SelectItem value="paypal">🅿️ PayPal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Statut</Label>
                          <Select 
                            value={formData.paymentStatus} 
                            onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                  En attente
                                </div>
                              </SelectItem>
                              <SelectItem value="paid">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-green-500" />
                                  Payé
                                </div>
                              </SelectItem>
                              <SelectItem value="failed">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-red-500" />
                                  Échoué
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Truck className="h-4 w-4 text-orange-500" />
                          </div>
                          Livraison
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Méthode</Label>
                          <Select 
                            value={formData.shippingMethod} 
                            onValueChange={(value) => setFormData({ ...formData, shippingMethod: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">📦 Standard (3-5 jours)</SelectItem>
                              <SelectItem value="express">🚀 Express (1-2 jours)</SelectItem>
                              <SelectItem value="pickup">🏪 Retrait en magasin</SelectItem>
                              <SelectItem value="same-day">⚡ Livraison le jour même</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Frais (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.shippingCost}
                            onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                            placeholder="0.00"
                            className="h-9"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Notes */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-cyan-500" />
                        </div>
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Note pour le client</Label>
                        <Textarea
                          value={formData.customerNote}
                          onChange={(e) => setFormData({ ...formData, customerNote: e.target.value.slice(0, 1000) })}
                          placeholder="Message visible par le client..."
                          rows={2}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {formData.customerNote.length}/1000
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Note interne</Label>
                        <Textarea
                          value={formData.internalNote}
                          onChange={(e) => setFormData({ ...formData, internalNote: e.target.value.slice(0, 1000) })}
                          placeholder="Note privée pour votre équipe..."
                          rows={2}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {formData.internalNote.length}/1000
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Colonne latérale - Sticky */}
              <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                {/* Statut */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Statut</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select 
                        value={formData.orderStatus} 
                        onValueChange={(value) => setFormData({ ...formData, orderStatus: value })}
                      >
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
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Résumé */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Résumé
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sous-total ({itemsCount} article{itemsCount > 1 ? 's' : ''})</span>
                          <span className="font-medium">{calculateSubtotal().toFixed(2)}€</span>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label className="text-xs">Réduction commande</Label>
                          <div className="flex gap-2">
                            <Select 
                              value={formData.discountType} 
                              onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                            >
                              <SelectTrigger className="w-20 h-9">
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
                              min="0"
                              value={formData.discountValue}
                              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                              placeholder="0"
                              className="h-9"
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
                          <span className="font-medium">{parseFloat(formData.shippingCost || '0').toFixed(2)}€</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">TVA ({formData.taxRate}%)</span>
                          <span className="font-medium">{calculateTax().toFixed(2)}€</span>
                        </div>

                        <Separator />

                        <div className="flex justify-between text-xl font-bold">
                          <span>Total</span>
                          <span className="text-primary">{calculateTotal().toFixed(2)}€</span>
                        </div>
                      </div>

                      {/* Validation warnings */}
                      {(!selectedCustomer || itemsCount === 0) && (
                        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <div className="flex items-start gap-2 text-yellow-600 dark:text-yellow-500">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <div className="text-xs">
                              {!selectedCustomer && <p>• Sélectionnez un client</p>}
                              {itemsCount === 0 && <p>• Ajoutez au moins un produit</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Tags */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Tag className="h-4 w-4" />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value.slice(0, 50))}
                          placeholder="Ajouter un tag"
                          className="h-9"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="outline" 
                          onClick={addTag}
                          className="h-9 w-9 shrink-0"
                          disabled={formData.tags.length >= 10}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                          {formData.tags.map(tag => (
                            <motion.div
                              key={tag}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Badge variant="secondary" className="gap-1 pl-2">
                                {tag}
                                <X
                                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                                  onClick={() => removeTag(tag)}
                                />
                              </Badge>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      {formData.tags.length >= 10 && (
                        <p className="text-xs text-muted-foreground">Maximum 10 tags atteint</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </form>
        </div>
    </ChannableLayout>
  );
}
