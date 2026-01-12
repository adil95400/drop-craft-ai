import { useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useCustomersUnified } from '@/hooks/unified'
import { useProductsUnified } from '@/hooks/unified'
import { OrdersService } from '@/services/orders.service'
import { orderSchema, OrderFormData, OrderItem } from '@/lib/validation/orderSchema'
import { 
  ShoppingCart, 
  User, 
  Truck, 
  CreditCard, 
  Plus, 
  Trash2, 
  Loader2,
  Package,
  AlertCircle,
  Search
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const SHIPPING_METHODS = [
  { value: 'standard', label: 'Standard (5-7 jours)', cost: 4.99 },
  { value: 'express', label: 'Express (2-3 jours)', cost: 9.99 },
  { value: 'overnight', label: 'Overnight (24h)', cost: 19.99 },
  { value: 'pickup', label: 'Retrait en magasin', cost: 0 },
]

const COUNTRIES = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'DE', label: 'Allemagne' },
  { value: 'ES', label: 'Espagne' },
  { value: 'IT', label: 'Italie' },
]

export function CreateOrderDialog({ open, onOpenChange, onSuccess }: CreateOrderDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { customers, isLoading: loadingCustomers } = useCustomersUnified()
  const { products, isLoading: loadingProducts } = useProductsUnified()
  
  const [activeTab, setActiveTab] = useState('items')
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: undefined,
      customer_name: '',
      customer_email: '',
      items: [],
      shipping_address: {
        name: '',
        line1: '',
        line2: '',
        city: '',
        postal_code: '',
        country: 'FR',
        phone: '',
      },
      shipping_method: 'standard',
      shipping_cost: 4.99,
      notes: '',
      status: 'pending',
      payment_status: 'pending',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  // Filter customers and products
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 5)
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase())
    ).slice(0, 5)
  }, [customers, customerSearch])

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 10)
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10)
  }, [products, productSearch])

  // Calculate totals
  const subtotal = form.watch('items')?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0
  const shippingCost = form.watch('shipping_cost') || 0
  const total = subtotal + shippingCost

  // Create order mutation
  const createMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      if (!user) throw new Error('Non authentifié')
      return OrdersService.createOrder(user.id, data) as any
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-orders'] })
      toast.success('Commande créée avec succès')
      form.reset()
      setActiveTab('items')
      setSelectedCustomer(null)
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    },
  })

  // Select a customer
  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setSelectedCustomer(customerId)
      form.setValue('customer_id', customerId)
      form.setValue('customer_name', customer.name)
      form.setValue('customer_email', customer.email)
      
      // Pre-fill address if available
      if (customer.address) {
        form.setValue('shipping_address', {
          name: customer.name,
          line1: customer.address.line1 || '',
          line2: customer.address.line2 || '',
          city: customer.address.city || '',
          postal_code: customer.address.postal_code || '',
          country: customer.address.country || 'FR',
          phone: customer.phone || '',
        })
      }
    }
  }

  // Add product to order
  const handleAddProduct = (product: any) => {
    const existingIndex = fields.findIndex(f => f.product_id === product.id)
    
    if (existingIndex >= 0) {
      // Update quantity
      const currentQty = form.getValues(`items.${existingIndex}.quantity`)
      form.setValue(`items.${existingIndex}.quantity`, currentQty + 1)
      form.setValue(`items.${existingIndex}.total_price`, (currentQty + 1) * product.price)
    } else {
      // Add new item
      append({
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
      })
    }
    setProductSearch('')
  }

  // Update quantity
  const handleQuantityChange = (index: number, quantity: number) => {
    const unitPrice = form.getValues(`items.${index}.unit_price`)
    form.setValue(`items.${index}.quantity`, quantity)
    form.setValue(`items.${index}.total_price`, quantity * unitPrice)
  }

  // Update shipping cost based on method
  const handleShippingMethodChange = (method: string) => {
    const shipping = SHIPPING_METHODS.find(s => s.value === method)
    form.setValue('shipping_method', method)
    form.setValue('shipping_cost', shipping?.cost || 0)
  }

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data)
  })

  const handleClose = () => {
    if (!createMutation.isPending) {
      form.reset()
      setActiveTab('items')
      setSelectedCustomer(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Nouvelle Commande
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="items" className="gap-2">
                  <Package className="h-4 w-4" />
                  Produits
                </TabsTrigger>
                <TabsTrigger value="customer" className="gap-2">
                  <User className="h-4 w-4" />
                  Client
                </TabsTrigger>
                <TabsTrigger value="shipping" className="gap-2">
                  <Truck className="h-4 w-4" />
                  Livraison
                </TabsTrigger>
                <TabsTrigger value="payment" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Paiement
                </TabsTrigger>
              </TabsList>

              {/* Products Tab */}
              <TabsContent value="items" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {productSearch && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {loadingProducts ? (
                      <div className="p-4 text-center">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Aucun produit trouvé
                      </div>
                    ) : (
                      filteredProducts.map(product => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-accent cursor-pointer flex justify-between items-center border-b last:border-b-0"
                          onClick={() => handleAddProduct(product)}
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.sku && <span className="mr-2">SKU: {product.sku}</span>}
                              Stock: {product.stock_quantity || 0}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{product.price?.toFixed(2)}€</Badge>
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Order items list */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Articles ({fields.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Aucun produit ajouté</p>
                        <p className="text-sm">Recherchez et ajoutez des produits ci-dessus</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{field.product_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {field.unit_price.toFixed(2)}€ / unité
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={999}
                                value={form.watch(`items.${index}.quantity`)}
                                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                                className="w-20 text-center"
                              />
                              <span className="text-muted-foreground">×</span>
                              <span className="font-medium w-20 text-right">
                                {form.watch(`items.${index}.total_price`)?.toFixed(2)}€
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-muted-foreground">Sous-total</span>
                          <span className="font-bold text-lg">{subtotal.toFixed(2)}€</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {form.formState.errors.items && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{form.formState.errors.items.message}</AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Customer Tab */}
              <TabsContent value="customer" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un client existant..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {customerSearch && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {loadingCustomers ? (
                      <div className="p-4 text-center">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Aucun client trouvé
                      </div>
                    ) : (
                      filteredCustomers.map(customer => (
                        <div
                          key={customer.id}
                          className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                          onClick={() => handleSelectCustomer(customer.id)}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {selectedCustomer && (
                  <Alert>
                    <User className="h-4 w-4" />
                    <AlertDescription>
                      Client sélectionné: <strong>{form.watch('customer_name')}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du client *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Jean Dupont" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customer_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="jean@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Shipping Tab */}
              <TabsContent value="shipping" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Adresse de livraison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="shipping_address.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du destinataire *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Jean Dupont" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="shipping_address.line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 rue de la Paix" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="shipping_address.line2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complément d'adresse</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Apt 4B, Bâtiment C" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="shipping_address.postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code postal *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="75001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="shipping_address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Paris" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="shipping_address.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pays *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[100] bg-popover">
                                {COUNTRIES.map(country => (
                                  <SelectItem key={country.value} value={country.value}>
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="shipping_address.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+33 6 12 34 56 78" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Mode de livraison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="shipping_method"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-2 gap-3">
                            {SHIPPING_METHODS.map(method => (
                              <div
                                key={method.value}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                  field.value === method.value 
                                    ? 'border-primary bg-primary/5' 
                                    : 'hover:bg-accent'
                                }`}
                                onClick={() => handleShippingMethodChange(method.value)}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{method.label}</span>
                                  <Badge variant={method.cost === 0 ? 'secondary' : 'default'}>
                                    {method.cost === 0 ? 'Gratuit' : `${method.cost.toFixed(2)}€`}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Tab */}
              <TabsContent value="payment" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total ({fields.length} articles)</span>
                      <span>{subtotal.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frais de livraison</span>
                      <span>{shippingCost.toFixed(2)}€</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{total.toFixed(2)}€</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut commande</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[100] bg-popover">
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="processing">En traitement</SelectItem>
                            <SelectItem value="shipped">Expédiée</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="payment_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut paiement</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[100] bg-popover">
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="paid">Payé</SelectItem>
                            <SelectItem value="failed">Échoué</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes internes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Notes sur la commande..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || fields.length === 0}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer la commande ({total.toFixed(2)}€)
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
