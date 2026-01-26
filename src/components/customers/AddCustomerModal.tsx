/**
 * AddCustomerModal - Modal d'ajout client design Channable premium
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  UserPlus, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  Sparkles,
  CheckCircle2,
  Loader2,
  Crown,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AddCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface CustomerFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
  segment: string
  notes: string
  tags: string
}

const initialFormData: CustomerFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postal_code: '',
  country: 'France',
  segment: 'new',
  notes: '',
  tags: ''
}

const segmentOptions = [
  { value: 'new', label: 'Nouveau', icon: Sparkles, color: 'text-green-600 bg-green-500/10' },
  { value: 'regular', label: 'Régulier', icon: User, color: 'text-blue-600 bg-blue-500/10' },
  { value: 'vip', label: 'VIP', icon: Crown, color: 'text-purple-600 bg-purple-500/10' },
]

export function AddCustomerModal({ open, onOpenChange, onSuccess }: AddCustomerModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (stepNum === 1) {
      if (!formData.first_name.trim()) newErrors.first_name = 'Prénom requis'
      if (!formData.email.trim()) {
        newErrors.email = 'Email requis'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email invalide'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      setStep(1)
      return
    }

    setIsSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: 'Erreur', description: 'Vous devez être connecté', variant: 'destructive' })
        return
      }

      // Prepare address string
      const addressStr = [formData.address, formData.postal_code, formData.city, formData.country]
        .filter(Boolean)
        .join(', ') || null

      // Prepare notes
      const notesArr = [
        formData.segment !== 'new' ? `segment:${formData.segment}` : '',
        formData.tags ? `tags:${formData.tags}` : '',
        formData.notes
      ].filter(Boolean)

      const { error } = await supabase
        .from('customers')
        .insert([{
          user_id: user.id,
          first_name: formData.first_name.trim() || null,
          last_name: formData.last_name.trim() || null,
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          address: addressStr,
          notes: notesArr.join(' | ') || null,
          total_orders: 0,
          total_spent: formData.segment === 'vip' ? 1000 : 0
        }])

      if (error) throw error

      toast({ 
        title: 'Client créé avec succès',
        description: `${formData.first_name} ${formData.last_name} a été ajouté à votre base clients`
      })

      // Reset form
      setFormData(initialFormData)
      setStep(1)
      setErrors({})
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({ 
        title: 'Erreur', 
        description: error.message || 'Impossible de créer le client', 
        variant: 'destructive' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setStep(1)
    setErrors({})
    onOpenChange(false)
  }

  const updateField = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-gradient-to-b from-background to-muted/20">
        {/* Header with gradient */}
        <div className="relative p-6 pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Nouveau client</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Ajoutez un client à votre base CRM
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              step === 1 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-primary/10 text-primary"
            )}>
              {step > 1 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span>1</span>}
              Informations
            </div>
            <div className="h-0.5 w-8 bg-border rounded-full" />
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              step === 2 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-muted text-muted-foreground"
            )}>
              <span>2</span>
              Détails
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6 min-h-[300px]">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Prénom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => updateField('first_name', e.target.value)}
                      placeholder="Jean"
                      className={cn(
                        "h-11 bg-background/50 border-border/50 focus:border-primary/50",
                        errors.first_name && "border-destructive focus:border-destructive"
                      )}
                    />
                    {errors.first_name && (
                      <p className="text-xs text-destructive">{errors.first_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm text-muted-foreground">
                      Nom
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => updateField('last_name', e.target.value)}
                      placeholder="Dupont"
                      className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="jean.dupont@email.com"
                    className={cn(
                      "h-11 bg-background/50 border-border/50 focus:border-primary/50",
                      errors.email && "border-destructive focus:border-destructive"
                    )}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                {/* Segment */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="h-3.5 w-3.5" />
                    Segment client
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {segmentOptions.map((option) => {
                      const Icon = option.icon
                      const isSelected = formData.segment === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField('segment', option.value)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border transition-all",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-border/50 bg-background/50 hover:border-border hover:bg-muted/50"
                          )}
                        >
                          <div className={cn("p-1.5 rounded-lg", option.color)}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Adresse
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="123 rue de la Paix"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                {/* City & Postal Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm text-muted-foreground">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Paris"
                      className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code" className="text-sm text-muted-foreground">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => updateField('postal_code', e.target.value)}
                      placeholder="75001"
                      className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm text-muted-foreground">Pays</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => updateField('country', value)}
                  >
                    <SelectTrigger className="h-11 bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Belgique">Belgique</SelectItem>
                      <SelectItem value="Suisse">Suisse</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Maroc">Maroc</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-sm text-muted-foreground">Tags (séparés par des virgules)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => updateField('tags', e.target.value)}
                    placeholder="premium, newsletter, loyal"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm text-muted-foreground">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Informations complémentaires..."
                    className="min-h-[80px] resize-none bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border/50 bg-muted/30 flex items-center justify-between gap-4">
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleNext} className="gap-2 shadow-md shadow-primary/20">
                Continuer
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleBack}>
                Retour
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="gap-2 shadow-md shadow-primary/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Créer le client
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Icon component for the button
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}
