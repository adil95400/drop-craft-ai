import { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useStripeCoupons, CreateCouponInput } from '@/hooks/useStripeCoupons'
import { Ticket, Zap } from 'lucide-react'

interface CouponCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CouponCreationDialog({ open, onOpenChange }: CouponCreationDialogProps) {
  const { createCoupon, isCreating } = useStripeCoupons()

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: '',
    duration: 'once' as 'once' | 'repeating' | 'forever',
    duration_in_months: '',
    min_purchase_amount: '',
    max_redemptions: '',
    expires_at: '',
  })

  const generateCode = () => {
    const code = `PROMO${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setFormData({ ...formData, code })
  }

  const handleSubmit = () => {
    const input: CreateCouponInput = {
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      duration: formData.duration,
      description: formData.description || undefined,
    }

    if (formData.duration === 'repeating' && formData.duration_in_months) {
      input.duration_in_months = parseInt(formData.duration_in_months)
    }
    if (formData.min_purchase_amount) {
      input.min_purchase_amount = parseFloat(formData.min_purchase_amount)
    }
    if (formData.max_redemptions) {
      input.max_redemptions = parseInt(formData.max_redemptions)
    }
    if (formData.expires_at) {
      input.expires_at = new Date(formData.expires_at).toISOString()
    }

    createCoupon(input)
    onOpenChange(false)

    setFormData({
      code: '', description: '', discount_type: 'percentage',
      discount_value: '', duration: 'once', duration_in_months: '',
      min_purchase_amount: '', max_redemptions: '', expires_at: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Créer un coupon Stripe
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Synchronisé automatiquement avec Stripe — disponible au checkout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Code du coupon *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="PROMO2024"
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={generateCode}>
                  Générer
                </Button>
              </div>
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="20% de réduction pour les nouveaux clients"
                rows={2}
              />
            </div>

            <div>
              <Label>Type de réduction *</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(v: 'percentage' | 'fixed_amount') =>
                  setFormData({ ...formData, discount_type: v })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                  <SelectItem value="fixed_amount">Montant fixe (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Valeur * {formData.discount_type === 'percentage' ? '(%)' : '(€)'}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'}
              />
            </div>

            <div>
              <Label>Durée d'application</Label>
              <Select
                value={formData.duration}
                onValueChange={(v: 'once' | 'repeating' | 'forever') =>
                  setFormData({ ...formData, duration: v })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Une seule facture</SelectItem>
                  <SelectItem value="repeating">Plusieurs mois</SelectItem>
                  <SelectItem value="forever">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.duration === 'repeating' && (
              <div>
                <Label>Nombre de mois</Label>
                <Input
                  type="number"
                  value={formData.duration_in_months}
                  onChange={(e) => setFormData({ ...formData, duration_in_months: e.target.value })}
                  placeholder="3"
                />
              </div>
            )}

            <div>
              <Label>Montant min. (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.min_purchase_amount}
                onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                placeholder="Aucun"
              />
            </div>

            <div>
              <Label>Utilisations max.</Label>
              <Input
                type="number"
                value={formData.max_redemptions}
                onChange={(e) => setFormData({ ...formData, max_redemptions: e.target.value })}
                placeholder="Illimité"
              />
            </div>

            <div className="col-span-2">
              <Label>Date d'expiration</Label>
              <Input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || !formData.code || !formData.discount_value}
            >
              {isCreating ? 'Création Stripe...' : 'Créer le coupon'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
