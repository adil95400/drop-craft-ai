/**
 * Modal optimisé de création de retour
 * UX améliorée avec stepper, validation et animations
 * Recherche intelligente par SKU ou numéro de commande
 */
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, Plus, Trash2, Package, CreditCard, FileText, 
  CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft,
  RotateCcw, Wallet, RefreshCw, Euro, ShoppingBag, Search,
  Barcode, Hash, Image as ImageIcon, Keyboard, User, Mail, AtSign,
  ChevronDown, Upload, X, Paperclip
} from 'lucide-react'
import { useReturns, ReturnItem } from '@/hooks/useReturns'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'

interface Attachment {
  name: string
  url: string
  type: string
  size: number
}

interface CreateReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId?: string
}

type ReasonCategory = 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'damaged_shipping' | 'other'
type RefundMethod = 'original_payment' | 'store_credit' | 'exchange'

interface FormData {
  customer_id?: string
  customer_name?: string
  customer_email?: string
  reason: string
  reason_category: ReasonCategory | ''
  description: string
  refund_method: RefundMethod | ''
  refund_amount: string
  items: ReturnItem[]
  attachments: Attachment[]
}

interface CustomerSearchResult {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  total_orders: number | null
  total_spent: number | null
}

interface ProductSearchResult {
  id: string
  title: string
  sku: string | null
  barcode: string | null
  price: number | null
  image_url: string | null
  stock_quantity: number | null
}

interface OrderItemResult {
  id: string
  product_id: string | null
  product_name: string
  product_sku: string | null
  qty: number | null
  unit_price: number | null
  variant_title: string | null
}

interface OrderSearchResult {
  id: string
  order_number: string
  status: string | null
  total_amount: number | null
  customer_id: string | null
  customers: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  } | null
  order_items: OrderItemResult[]
}

interface SelectedProduct {
  product_id: string
  product_name: string
  sku?: string
  price: number
  quantity: number
  image_url?: string
  order_id?: string
  order_item_id?: string
}

const REASON_CATEGORIES = [
  { value: 'defective', label: 'Produit défectueux', icon: AlertTriangle, color: 'text-destructive' },
  { value: 'wrong_item', label: 'Mauvais article', icon: Package, color: 'text-orange-500' },
  { value: 'not_as_described', label: 'Non conforme', icon: FileText, color: 'text-yellow-500' },
  { value: 'changed_mind', label: 'Changement d\'avis', icon: RotateCcw, color: 'text-blue-500' },
  { value: 'damaged_shipping', label: 'Endommagé livraison', icon: Package, color: 'text-red-500' },
  { value: 'other', label: 'Autre', icon: FileText, color: 'text-muted-foreground' }
] as const

const REFUND_METHODS = [
  { value: 'original_payment', label: 'Moyen de paiement original', icon: CreditCard, description: 'Remboursement sur le mode de paiement initial' },
  { value: 'store_credit', label: 'Avoir boutique', icon: Wallet, description: 'Crédit utilisable sur votre boutique' },
  { value: 'exchange', label: 'Échange produit', icon: RefreshCw, description: 'Remplacement par un autre article' }
] as const

const STEPS = [
  { id: 1, label: 'Client & Motif', icon: User },
  { id: 2, label: 'Articles', icon: Package },
  { id: 3, label: 'Remboursement', icon: CreditCard }
]

export function CreateReturnDialog({ open, onOpenChange, orderId }: CreateReturnDialogProps) {
  const { createReturn, isCreating } = useReturns()
  const [currentStep, setCurrentStep] = useState(1)
  
  const [formData, setFormData] = useState<FormData>({
    customer_id: undefined,
    customer_name: undefined,
    customer_email: undefined,
    reason: '',
    reason_category: '',
    description: '',
    refund_method: '',
    refund_amount: '',
    items: [],
    attachments: []
  })

  // États pour la recherche client
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null)
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [showAllCustomers, setShowAllCustomers] = useState(false)
  const [allCustomers, setAllCustomers] = useState<CustomerSearchResult[]>([])
  const [isLoadingAllCustomers, setIsLoadingAllCustomers] = useState(false)
  const debouncedCustomerQuery = useDebounce(customerSearchQuery, 300)

  // États pour la recherche intelligente
  const [searchMode, setSearchMode] = useState<'sku' | 'order' | 'manual'>('sku')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([])
  const [orderResults, setOrderResults] = useState<OrderSearchResult[]>([])
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const [newItem, setNewItem] = useState({
    product_name: '',
    quantity: 1,
    price: 0
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)

  // Calcul du total
  const totalRefund = useMemo(() => 
    formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [formData.items]
  )

  // Validation par étape
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.reason_category) {
        newErrors.reason_category = 'Veuillez sélectionner une catégorie'
      }
      if (!formData.reason.trim()) {
        newErrors.reason = 'Veuillez décrire la raison du retour'
      }
    }

    if (step === 2) {
      if (formData.items.length === 0) {
        newErrors.items = 'Ajoutez au moins un article'
      }
    }

    if (step === 3) {
      if (!formData.refund_method) {
        newErrors.refund_method = 'Veuillez choisir une méthode de remboursement'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Navigation
  const handleNext = useCallback(() => {
    if (validateStep(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, validateStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // Gestion des articles
  const handleAddItem = useCallback(() => {
    if (!newItem.product_name.trim()) {
      setErrors({ ...errors, newItem: 'Nom du produit requis' })
      return
    }
    if (newItem.price <= 0) {
      setErrors({ ...errors, newItem: 'Prix invalide' })
      return
    }
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: `prod_${Date.now()}`,
        product_name: newItem.product_name,
        quantity: newItem.quantity,
        price: newItem.price
      }]
    }))
    setNewItem({ product_name: '', quantity: 1, price: 0 })
    setErrors(prev => ({ ...prev, items: '', newItem: '' }))
  }, [newItem, errors])

  const handleRemoveItem = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }, [])

  // Sélectionner un client
  const handleSelectCustomer = useCallback((customer: CustomerSearchResult) => {
    setSelectedCustomer(customer)
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email.split('@')[0],
      customer_email: customer.email
    }))
    setCustomerSearchQuery('')
    setCustomerResults([])
  }, [])

  // Effacer le client sélectionné
  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null)
    setFormData(prev => ({
      ...prev,
      customer_id: undefined,
      customer_name: undefined,
      customer_email: undefined
    }))
  }, [])

  // Upload de fichiers
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    
    setIsUploadingFiles(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Vous devez être connecté pour uploader des fichiers')
        return
      }
      
      const newAttachments: Attachment[] = []
      
      for (const file of Array.from(files)) {
        // Validation taille
        if (file.size > maxSize) {
          toast.error(`Le fichier "${file.name}" dépasse 5MB`)
          continue
        }
        
        // Validation type
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Type de fichier non supporté: ${file.name}`)
          continue
        }
        
        // Upload vers Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { data, error } = await supabase.storage
          .from('return-attachments')
          .upload(fileName, file)
        
        if (error) {
          console.error('Upload error:', error)
          toast.error(`Erreur upload: ${file.name}`)
          continue
        }
        
        // Obtenir l'URL publique
        const { data: publicUrl } = supabase.storage
          .from('return-attachments')
          .getPublicUrl(data.path)
        
        newAttachments.push({
          name: file.name,
          url: publicUrl.publicUrl,
          type: file.type,
          size: file.size
        })
      }
      
      if (newAttachments.length > 0) {
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...newAttachments]
        }))
        toast.success(`${newAttachments.length} fichier(s) ajouté(s)`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erreur lors de l\'upload')
    } finally {
      setIsUploadingFiles(false)
    }
  }, [])

  // Supprimer un fichier
  const handleRemoveAttachment = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }, [])

  // Soumission
  const handleSubmit = useCallback(() => {
    if (!validateStep(3)) return

    createReturn({
      customer_id: selectedCustomer?.id || formData.customer_id,
      order_id: orderId,
      reason: formData.reason,
      reason_category: formData.reason_category || undefined,
      description: formData.description || undefined,
      refund_method: formData.refund_method || undefined,
      refund_amount: formData.refund_amount ? parseFloat(formData.refund_amount) : totalRefund,
      items: formData.items,
      attachments: formData.attachments,
      status: 'pending'
    }, {
      onSuccess: () => {
        onOpenChange(false)
        resetForm()
      }
    })
  }, [formData, orderId, totalRefund, validateStep, createReturn, onOpenChange, selectedCustomer])

  const resetForm = useCallback(() => {
    setFormData({
      customer_id: undefined,
      customer_name: undefined,
      customer_email: undefined,
      reason: '',
      reason_category: '',
      description: '',
      refund_method: '',
      refund_amount: '',
      items: [],
      attachments: []
    })
    setCurrentStep(1)
    setErrors({})
    setSearchQuery('')
    setSearchResults([])
    setOrderResults([])
    setSelectedProduct(null)
    setSearchMode('sku')
    setCustomerSearchQuery('')
    setCustomerResults([])
    setSelectedCustomer(null)
    setShowAllCustomers(false)
    setAllCustomers([])
    setIsUploadingFiles(false)
  }, [])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }, [onOpenChange, resetForm])

  // Recherche par SKU/barcode
  const searchProductBySku = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data, error } = await supabase
        .from('products')
        .select('id, title, sku, barcode, price, image_url, stock_quantity')
        .eq('user_id', user.id)
        .or(`sku.ilike.%${query}%,barcode.ilike.%${query}%,title.ilike.%${query}%`)
        .limit(5)
      
      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Erreur recherche produit:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Recherche par numéro de commande (avec info client)
  const searchOrderByNumber = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setOrderResults([])
      return
    }
    
    setIsSearching(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, total_amount, customer_id,
          customers (id, email, first_name, last_name),
          order_items (
            id, product_id, product_name, product_sku, 
            qty, unit_price, variant_title
          )
        `)
        .eq('user_id', user.id)
        .ilike('order_number', `%${query}%`)
        .limit(3)
      
      if (error) throw error
      setOrderResults((data || []) as OrderSearchResult[])
    } catch (error) {
      console.error('Erreur recherche commande:', error)
      setOrderResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Recherche client par email ou nom
  const searchCustomerByQuery = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setCustomerResults([])
      return
    }
    
    setIsSearchingCustomer(true)
    setShowAllCustomers(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data, error } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name, total_orders, total_spent')
        .eq('user_id', user.id)
        .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(5)
      
      if (error) throw error
      setCustomerResults(data || [])
    } catch (error) {
      console.error('Erreur recherche client:', error)
      setCustomerResults([])
    } finally {
      setIsSearchingCustomer(false)
    }
  }, [])

  // Charger tous les clients (dropdown)
  const loadAllCustomers = useCallback(async () => {
    if (showAllCustomers) {
      setShowAllCustomers(false)
      return
    }
    
    setIsLoadingAllCustomers(true)
    setCustomerResults([])
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data, error } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name, total_orders, total_spent')
        .eq('user_id', user.id)
        .order('first_name', { ascending: true })
        .limit(50)
      
      if (error) throw error
      setAllCustomers(data || [])
      setShowAllCustomers(true)
    } catch (error) {
      console.error('Erreur chargement clients:', error)
      setAllCustomers([])
    } finally {
      setIsLoadingAllCustomers(false)
    }
  }, [showAllCustomers])

  // Effet pour recherche client
  useEffect(() => {
    if (debouncedCustomerQuery) {
      searchCustomerByQuery(debouncedCustomerQuery)
    } else {
      setCustomerResults([])
    }
  }, [debouncedCustomerQuery, searchCustomerByQuery])

  // Effet pour déclencher la recherche
  useEffect(() => {
    if (debouncedSearchQuery && searchMode !== 'manual') {
      if (searchMode === 'sku') {
        searchProductBySku(debouncedSearchQuery)
      } else if (searchMode === 'order') {
        searchOrderByNumber(debouncedSearchQuery)
      }
    } else {
      setSearchResults([])
      setOrderResults([])
    }
  }, [debouncedSearchQuery, searchMode, searchProductBySku, searchOrderByNumber])

  // Sélectionner un produit depuis la recherche
  const handleSelectProduct = useCallback((product: ProductSearchResult) => {
    setSelectedProduct({
      product_id: product.id,
      product_name: product.title,
      sku: product.sku || undefined,
      price: product.price || 0,
      quantity: 1,
      image_url: product.image_url || undefined
    })
    setSearchQuery('')
    setSearchResults([])
  }, [])

  // Sélectionner un article depuis une commande (avec auto-remplissage client)
  const handleSelectOrderItem = useCallback((order: OrderSearchResult, item: OrderItemResult) => {
    setSelectedProduct({
      product_id: item.product_id || `order_item_${item.id}`,
      product_name: item.product_name + (item.variant_title ? ` - ${item.variant_title}` : ''),
      sku: item.product_sku || undefined,
      price: item.unit_price || 0,
      quantity: item.qty || 1,
      order_id: order.id,
      order_item_id: item.id
    })
    setSearchQuery('')
    setOrderResults([])
    
    // Auto-remplir le client depuis la commande si disponible
    if (order.customers && !selectedCustomer) {
      const customer = order.customers
      setSelectedCustomer({
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        total_orders: null,
        total_spent: null
      })
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email.split('@')[0],
        customer_email: customer.email
      }))
    }
  }, [selectedCustomer])

  // Ajouter le produit sélectionné aux articles
  const handleAddSelectedProduct = useCallback(() => {
    if (!selectedProduct) return
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: selectedProduct.product_id,
        product_name: selectedProduct.product_name,
        sku: selectedProduct.sku,
        quantity: selectedProduct.quantity,
        price: selectedProduct.price,
        order_item_id: selectedProduct.order_item_id,
        image_url: selectedProduct.image_url
      }]
    }))
    setSelectedProduct(null)
    setErrors(prev => ({ ...prev, items: '' }))
  }, [selectedProduct])

  // Rendu des étapes
  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Identification client */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Client concerné</p>
              <p className="text-xs text-muted-foreground">Recherchez par email ou nom (recommandé)</p>
            </div>
          </div>

          {/* Client sélectionné */}
          {selectedCustomer ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-primary/5 border-primary/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {selectedCustomer.first_name || selectedCustomer.last_name 
                        ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim()
                        : selectedCustomer.email.split('@')[0]}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{selectedCustomer.email}</span>
                    </div>
                    {(selectedCustomer.total_orders !== null || selectedCustomer.total_spent !== null) && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {selectedCustomer.total_orders !== null && (
                          <span>{selectedCustomer.total_orders} commande(s)</span>
                        )}
                        {selectedCustomer.total_spent !== null && (
                          <span>{selectedCustomer.total_spent.toFixed(2)} € dépensés</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Identifié
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={handleClearCustomer}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {/* Recherche client avec dropdown */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {isSearchingCustomer && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Input
                    placeholder="Rechercher par email ou nom..."
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value)
                      setShowAllCustomers(false)
                    }}
                    className="pl-10 pr-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={cn(
                    "flex-shrink-0 transition-all",
                    showAllCustomers && "bg-primary/10 border-primary"
                  )}
                  onClick={loadAllCustomers}
                  disabled={isLoadingAllCustomers}
                >
                  {isLoadingAllCustomers ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      showAllCustomers && "rotate-180"
                    )} />
                  )}
                </Button>
              </div>

              {/* Liste tous les clients (dropdown) */}
              {showAllCustomers && allCustomers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {allCustomers.length} client(s) disponible(s)
                  </p>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-lg p-2 bg-background">
                    {allCustomers.map((customer) => (
                      <Card 
                        key={customer.id}
                        className="cursor-pointer hover:border-primary/50 transition-all"
                        onClick={() => {
                          handleSelectCustomer(customer)
                          setShowAllCustomers(false)
                        }}
                      >
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {customer.first_name || customer.last_name 
                                ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                                : customer.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            {customer.total_orders !== null && (
                              <p>{customer.total_orders} cmd</p>
                            )}
                            {customer.total_spent !== null && (
                              <p>{customer.total_spent.toFixed(2)} €</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {showAllCustomers && allCustomers.length === 0 && !isLoadingAllCustomers && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Aucun client enregistré
                </p>
              )}

              {/* Résultats de recherche client */}
              {!showAllCustomers && customerResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{customerResults.length} client(s) trouvé(s)</p>
                  {customerResults.map((customer) => (
                    <Card 
                      key={customer.id}
                      className="cursor-pointer hover:border-primary/50 transition-all"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {customer.first_name || customer.last_name 
                              ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                              : customer.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {customer.total_orders !== null && (
                            <p>{customer.total_orders} cmd</p>
                          )}
                          {customer.total_spent !== null && (
                            <p>{customer.total_spent.toFixed(2)} €</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!showAllCustomers && debouncedCustomerQuery && !isSearchingCustomer && customerResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Aucun client trouvé pour "{debouncedCustomerQuery}"
                </p>
              )}

              {!showAllCustomers && !debouncedCustomerQuery && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                  <span>Sans client identifié, le retour sera créé sans lien avec un compte client.</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Catégorie de retour */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Pourquoi ce retour ? *</Label>
        <div className="grid grid-cols-2 gap-3">
          {REASON_CATEGORIES.map(({ value, label, icon: Icon, color }) => (
            <Card
              key={value}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                formData.reason_category === value 
                  ? "border-primary bg-primary/5 ring-1 ring-primary" 
                  : "hover:border-primary/50"
              )}
              onClick={() => {
                setFormData(prev => ({ ...prev, reason_category: value as ReasonCategory }))
                setErrors(prev => ({ ...prev, reason_category: '' }))
              }}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("p-2 rounded-lg bg-muted", color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{label}</span>
                {formData.reason_category === value && (
                  <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {errors.reason_category && (
          <p className="text-sm text-destructive">{errors.reason_category}</p>
        )}
      </div>

      {/* Raison détaillée */}
      <div className="space-y-2">
        <Label htmlFor="reason">Décrivez le problème *</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, reason: e.target.value }))
            setErrors(prev => ({ ...prev, reason: '' }))
          }}
          placeholder="Expliquez brièvement pourquoi vous souhaitez retourner cet article..."
          rows={3}
          className={cn(errors.reason && "border-destructive")}
        />
        {errors.reason && (
          <p className="text-sm text-destructive">{errors.reason}</p>
        )}
      </div>

      {/* Zone d'upload de fichiers */}
      <div className="space-y-3">
        <Label className="text-muted-foreground flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Pièces jointes (optionnel)
        </Label>
        
        {/* Zone de drop */}
        <div 
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer",
            "hover:border-primary/50 hover:bg-primary/5",
            isUploadingFiles && "opacity-50 pointer-events-none"
          )}
          onClick={() => document.getElementById('file-upload')?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.classList.add('border-primary', 'bg-primary/10')
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('border-primary', 'bg-primary/10')
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('border-primary', 'bg-primary/10')
            handleFileUpload(e.dataTransfer.files)
          }}
        >
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          {isUploadingFiles ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Upload en cours...</span>
            </div>
          ) : (
            <div className="py-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Glissez vos fichiers ici</p>
              <p className="text-xs text-muted-foreground mt-1">
                ou cliquez pour sélectionner (JPG, PNG, GIF, WEBP, PDF - max 5MB)
              </p>
            </div>
          )}
        </div>

        {/* Liste des fichiers uploadés */}
        {formData.attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {formData.attachments.length} fichier(s) ajouté(s)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {formData.attachments.map((attachment, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-2">
                    <div className="flex items-center gap-2">
                      {attachment.type.startsWith('image/') ? (
                        <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={attachment.url} 
                            alt={attachment.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Description complémentaire */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-muted-foreground">
          Informations complémentaires (optionnel)
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Détails supplémentaires, numéro de lot, etc."
          rows={2}
        />
      </div>
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Articles à retourner *</Label>
          <Badge variant="outline" className="gap-1">
            <ShoppingBag className="h-3 w-3" />
            {formData.items.length} article{formData.items.length > 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Liste des articles ajoutés */}
        <AnimatePresence mode="popLayout">
          {formData.items.map((item, index) => (
            <motion.div
              key={`${item.product_id}-${index}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="bg-muted/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {item.sku && (
                        <Badge variant="secondary" className="text-xs">
                          SKU: {item.sku}
                        </Badge>
                      )}
                      <span>Qté: {item.quantity} × {item.price.toFixed(2)} €</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{(item.price * item.quantity).toFixed(2)} €</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {formData.items.length === 0 && !selectedProduct && (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Recherchez un article par SKU ou numéro de commande</p>
          </div>
        )}

        {errors.items && (
          <p className="text-sm text-destructive text-center">{errors.items}</p>
        )}

        {/* Zone de recherche intelligente */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Rechercher un article</p>
                <p className="text-xs text-muted-foreground">Par SKU, code-barres ou numéro de commande</p>
              </div>
            </div>

            {/* Tabs de recherche */}
            <Tabs value={searchMode} onValueChange={(v) => {
              setSearchMode(v as 'sku' | 'order' | 'manual')
              setSearchQuery('')
              setSearchResults([])
              setOrderResults([])
              setSelectedProduct(null)
            }}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sku" className="gap-2 text-xs">
                  <Barcode className="h-3 w-3" />
                  SKU / Code-barres
                </TabsTrigger>
                <TabsTrigger value="order" className="gap-2 text-xs">
                  <Hash className="h-3 w-3" />
                  N° Commande
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2 text-xs">
                  <Keyboard className="h-3 w-3" />
                  Saisie manuelle
                </TabsTrigger>
              </TabsList>

              {/* Recherche par SKU */}
              <TabsContent value="sku" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Input
                    placeholder="Entrez le SKU, code-barres ou nom du produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                </div>

                {/* Résultats de recherche produit */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{searchResults.length} résultat(s)</p>
                    {searchResults.map((product) => (
                      <Card 
                        key={product.id}
                        className="cursor-pointer hover:border-primary/50 transition-all"
                        onClick={() => handleSelectProduct(product)}
                      >
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {product.sku && <span>SKU: {product.sku}</span>}
                              {product.barcode && <span>• {product.barcode}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{(product.price || 0).toFixed(2)} €</p>
                            <p className="text-xs text-muted-foreground">
                              Stock: {product.stock_quantity || 0}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {debouncedSearchQuery && !isSearching && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun produit trouvé pour "{debouncedSearchQuery}"
                  </p>
                )}
              </TabsContent>

              {/* Recherche par commande */}
              <TabsContent value="order" className="space-y-4 mt-4">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Input
                    placeholder="Entrez le numéro de commande..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                </div>

                {/* Résultats de recherche commande */}
                {orderResults.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-3 bg-muted/50 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span className="font-medium">{order.order_number}</span>
                          </div>
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="divide-y">
                        {order.order_items.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center gap-3 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() => handleSelectOrderItem(order, item)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.product_name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {item.product_sku && <span>SKU: {item.product_sku}</span>}
                                {item.variant_title && <span>• {item.variant_title}</span>}
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <p>{item.qty}x {(item.unit_price || 0).toFixed(2)} €</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {debouncedSearchQuery && !isSearching && orderResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune commande trouvée pour "{debouncedSearchQuery}"
                  </p>
                )}
              </TabsContent>

              {/* Saisie manuelle */}
              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_name" className="text-sm">
                      Nom du produit <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="product_name"
                        placeholder="Ex: T-shirt bleu taille M"
                        value={newItem.product_name}
                        onChange={(e) => {
                          setNewItem(prev => ({ ...prev, product_name: e.target.value }))
                          if (errors.newItem) setErrors(prev => ({ ...prev, newItem: '' }))
                        }}
                        className={cn("pl-10", errors.newItem?.includes('Nom') && "border-destructive")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-sm">Quantité</Label>
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-r-none"
                          onClick={() => setNewItem(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                        >
                          <span className="text-lg">−</span>
                        </Button>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                          className="h-10 rounded-none text-center border-x-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-l-none"
                          onClick={() => setNewItem(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                        >
                          <span className="text-lg">+</span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm">
                        Prix unitaire <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={newItem.price || ''}
                          onChange={(e) => {
                            setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                            if (errors.newItem) setErrors(prev => ({ ...prev, newItem: '' }))
                          }}
                          className={cn("pl-10", errors.newItem?.includes('Prix') && "border-destructive")}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Sous-total: </span>
                      <span className="font-semibold">
                        {(newItem.price * newItem.quantity).toFixed(2)} €
                      </span>
                    </div>
                    <Button 
                      type="button" 
                      onClick={handleAddItem}
                      disabled={!newItem.product_name.trim() || newItem.price <= 0}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>

                  {errors.newItem && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {errors.newItem}
                    </motion.p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Article sélectionné (depuis recherche) */}
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <Separator className="mb-4" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Article sélectionné</span>
                    <Badge variant="secondary" className="ml-auto text-xs">Auto-rempli</Badge>
                  </div>
                  
                  <Card className="bg-primary/5 border-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-lg bg-background flex items-center justify-center overflow-hidden">
                          {selectedProduct.image_url ? (
                            <img src={selectedProduct.image_url} alt={selectedProduct.product_name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{selectedProduct.product_name}</p>
                          {selectedProduct.sku && (
                            <p className="text-xs text-muted-foreground">SKU: {selectedProduct.sku}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setSelectedProduct(null)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Quantité à retourner</Label>
                          <div className="flex items-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-r-none"
                              onClick={() => setSelectedProduct(prev => prev ? {...prev, quantity: Math.max(1, prev.quantity - 1)} : null)}
                            >
                              <span className="text-base">−</span>
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={selectedProduct.quantity}
                              onChange={(e) => setSelectedProduct(prev => prev ? {...prev, quantity: Math.max(1, parseInt(e.target.value) || 1)} : null)}
                              className="h-9 rounded-none text-center border-x-0 w-14 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-l-none"
                              onClick={() => setSelectedProduct(prev => prev ? {...prev, quantity: prev.quantity + 1} : null)}
                            >
                              <span className="text-base">+</span>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Prix unitaire (€)</Label>
                          <div className="relative">
                            <Euro className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              value={selectedProduct.price}
                              onChange={(e) => setSelectedProduct(prev => prev ? {...prev, price: parseFloat(e.target.value) || 0} : null)}
                              className="h-9 pl-8"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Sous-total: </span>
                          <span className="font-bold text-primary">
                            {(selectedProduct.price * selectedProduct.quantity).toFixed(2)} €
                          </span>
                        </div>
                        <Button onClick={handleAddSelectedProduct} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Ajouter l'article
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Total */}
        {formData.items.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="font-medium">Valeur totale des articles</span>
            <span className="text-xl font-bold">{totalRefund.toFixed(2)} €</span>
          </div>
        )}
      </div>
    </motion.div>
  )

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Méthode de remboursement */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Comment souhaitez-vous être remboursé ? *</Label>
        <div className="space-y-3">
          {REFUND_METHODS.map(({ value, label, icon: Icon, description }) => (
            <Card
              key={value}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                formData.refund_method === value 
                  ? "border-primary bg-primary/5 ring-1 ring-primary" 
                  : "hover:border-primary/50"
              )}
              onClick={() => {
                setFormData(prev => ({ ...prev, refund_method: value as RefundMethod }))
                setErrors(prev => ({ ...prev, refund_method: '' }))
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                {formData.refund_method === value && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {errors.refund_method && (
          <p className="text-sm text-destructive">{errors.refund_method}</p>
        )}
      </div>

      {/* Montant personnalisé */}
      <div className="space-y-2">
        <Label htmlFor="refund_amount">
          Montant du remboursement
          <span className="text-muted-foreground ml-2">(optionnel - par défaut: {totalRefund.toFixed(2)} €)</span>
        </Label>
        <div className="relative">
          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="refund_amount"
            type="number"
            step="0.01"
            value={formData.refund_amount}
            onChange={(e) => setFormData(prev => ({ ...prev, refund_amount: e.target.value }))}
            placeholder={totalRefund.toFixed(2)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Laissez vide pour utiliser le total des articles
        </p>
      </div>

      {/* Récapitulatif */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 space-y-3">
          <p className="font-medium">Récapitulatif de la demande</p>
          <Separator />
          <div className="space-y-2 text-sm">
            {/* Client */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium">
                {selectedCustomer ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {formData.customer_name || formData.customer_email}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Non identifié</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Motif</span>
              <span className="font-medium">
                {REASON_CATEGORIES.find(c => c.value === formData.reason_category)?.label || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Articles</span>
              <span className="font-medium">{formData.items.length} article(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remboursement</span>
              <span className="font-medium">
                {REFUND_METHODS.find(m => m.value === formData.refund_method)?.label || '-'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-medium">Montant total</span>
              <span className="font-bold text-primary">
                {formData.refund_amount ? parseFloat(formData.refund_amount).toFixed(2) : totalRefund.toFixed(2)} €
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Nouvelle demande de retour</DialogTitle>
          <DialogDescription>
            Créez une demande de retour en 3 étapes simples
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 py-4">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex items-center">
                <div 
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full transition-all",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-primary/20 text-primary",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                )}
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto py-6 px-1">
          <AnimatePresence mode="wait">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </AnimatePresence>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
            >
              Annuler
            </Button>

            {currentStep < 3 ? (
              <Button onClick={handleNext} className="gap-2">
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isCreating}
                className="gap-2"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle2 className="h-4 w-4" />
                Créer le retour
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
