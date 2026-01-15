/**
 * Modal optimisé de création de retour
 * UX améliorée avec stepper, validation et animations
 */
import { useState, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, Plus, Trash2, Package, CreditCard, FileText, 
  CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft,
  RotateCcw, Wallet, RefreshCw, Euro, ShoppingBag
} from 'lucide-react'
import { useReturns, ReturnItem } from '@/hooks/useReturns'
import { cn } from '@/lib/utils'

interface CreateReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId?: string
}

type ReasonCategory = 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'damaged_shipping' | 'other'
type RefundMethod = 'original_payment' | 'store_credit' | 'exchange'

interface FormData {
  reason: string
  reason_category: ReasonCategory | ''
  description: string
  refund_method: RefundMethod | ''
  refund_amount: string
  items: ReturnItem[]
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
  { id: 1, label: 'Motif', icon: FileText },
  { id: 2, label: 'Articles', icon: Package },
  { id: 3, label: 'Remboursement', icon: CreditCard }
]

export function CreateReturnDialog({ open, onOpenChange, orderId }: CreateReturnDialogProps) {
  const { createReturn, isCreating } = useReturns()
  const [currentStep, setCurrentStep] = useState(1)
  
  const [formData, setFormData] = useState<FormData>({
    reason: '',
    reason_category: '',
    description: '',
    refund_method: '',
    refund_amount: '',
    items: []
  })

  const [newItem, setNewItem] = useState({
    product_name: '',
    quantity: 1,
    price: 0
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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

  // Soumission
  const handleSubmit = useCallback(() => {
    if (!validateStep(3)) return

    createReturn({
      order_id: orderId,
      reason: formData.reason,
      reason_category: formData.reason_category || undefined,
      description: formData.description || undefined,
      refund_method: formData.refund_method || undefined,
      refund_amount: formData.refund_amount ? parseFloat(formData.refund_amount) : totalRefund,
      items: formData.items,
      status: 'pending'
    }, {
      onSuccess: () => {
        onOpenChange(false)
        resetForm()
      }
    })
  }, [formData, orderId, totalRefund, validateStep, createReturn, onOpenChange])

  const resetForm = useCallback(() => {
    setFormData({
      reason: '',
      reason_category: '',
      description: '',
      refund_method: '',
      refund_amount: '',
      items: []
    })
    setCurrentStep(1)
    setErrors({})
  }, [])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }, [onOpenChange, resetForm])

  // Rendu des étapes
  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
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

        {/* Liste des articles */}
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
                  <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantité: {item.quantity} × {item.price.toFixed(2)} €
                    </p>
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

        {formData.items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aucun article ajouté</p>
            <p className="text-sm">Utilisez le formulaire ci-dessous pour ajouter des articles</p>
          </div>
        )}

        {errors.items && (
          <p className="text-sm text-destructive text-center">{errors.items}</p>
        )}

        {/* Formulaire d'ajout amélioré */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Ajouter un article</p>
                <p className="text-xs text-muted-foreground">Renseignez les détails du produit à retourner</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Nom du produit */}
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

              {/* Quantité et Prix */}
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

              {/* Sous-total et bouton */}
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
                  Ajouter l'article
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
