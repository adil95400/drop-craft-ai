import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCoupons } from '@/hooks/useCoupons'
import { Ticket } from 'lucide-react'

interface CouponCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CouponCreationDialog({
  open,
  onOpenChange,
}: CouponCreationDialogProps) {
  const { createCoupon, isCreating } = useCoupons()
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    coupon_type: 'percentage' as 'percentage' | 'fixed_amount' | 'free_trial',
    discount_value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    per_user_limit: '1',
    valid_until: '',
    trial_days: '',
  })

  const generateCode = () => {
    const code = `PROMO${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setFormData({ ...formData, code })
  }

  const handleSubmit = () => {
    const couponData: any = {
      code: formData.code.toUpperCase(),
      description: formData.description,
      coupon_type: formData.coupon_type,
      discount_value: parseFloat(formData.discount_value),
      is_active: true,
    }

    if (formData.min_purchase_amount) {
      couponData.min_purchase_amount = parseFloat(formData.min_purchase_amount)
    }

    if (formData.max_discount_amount && formData.coupon_type === 'percentage') {
      couponData.max_discount_amount = parseFloat(formData.max_discount_amount)
    }

    if (formData.usage_limit) {
      couponData.usage_limit = parseInt(formData.usage_limit)
    }

    if (formData.per_user_limit) {
      couponData.per_user_limit = parseInt(formData.per_user_limit)
    }

    if (formData.valid_until) {
      couponData.valid_until = new Date(formData.valid_until).toISOString()
    }

    if (formData.coupon_type === 'free_trial' && formData.trial_days) {
      couponData.trial_days = parseInt(formData.trial_days)
    }

    createCoupon(couponData)
    onOpenChange(false)
    
    // Reset form
    setFormData({
      code: '',
      description: '',
      coupon_type: 'percentage',
      discount_value: '',
      min_purchase_amount: '',
      max_discount_amount: '',
      usage_limit: '',
      per_user_limit: '1',
      valid_until: '',
      trial_days: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Créer un nouveau coupon
          </DialogTitle>
          <DialogDescription>
            Configurez votre code promo ou essai gratuit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Code du coupon *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
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
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du coupon"
                rows={2}
              />
            </div>

            <div>
              <Label>Type de coupon *</Label>
              <Select
                value={formData.coupon_type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, coupon_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage</SelectItem>
                  <SelectItem value="fixed_amount">Montant fixe</SelectItem>
                  <SelectItem value="free_trial">Essai gratuit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.coupon_type === 'free_trial' ? (
              <div>
                <Label>Nombre de jours *</Label>
                <Input
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) =>
                    setFormData({ ...formData, trial_days: e.target.value })
                  }
                  placeholder="14"
                />
              </div>
            ) : (
              <div>
                <Label>
                  Valeur *{' '}
                  {formData.coupon_type === 'percentage' ? '(%)' : '(€)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_value: e.target.value })
                  }
                  placeholder={formData.coupon_type === 'percentage' ? '20' : '10.00'}
                />
              </div>
            )}

            {formData.coupon_type === 'percentage' && (
              <div>
                <Label>Réduction max (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.max_discount_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, max_discount_amount: e.target.value })
                  }
                  placeholder="50.00"
                />
              </div>
            )}

            <div>
              <Label>Montant minimum (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.min_purchase_amount}
                onChange={(e) =>
                  setFormData({ ...formData, min_purchase_amount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Limite globale</Label>
              <Input
                type="number"
                value={formData.usage_limit}
                onChange={(e) =>
                  setFormData({ ...formData, usage_limit: e.target.value })
                }
                placeholder="Illimité"
              />
            </div>

            <div>
              <Label>Limite par utilisateur</Label>
              <Input
                type="number"
                value={formData.per_user_limit}
                onChange={(e) =>
                  setFormData({ ...formData, per_user_limit: e.target.value })
                }
                placeholder="1"
              />
            </div>

            <div className="col-span-2">
              <Label>Date d'expiration</Label>
              <Input
                type="datetime-local"
                value={formData.valid_until}
                onChange={(e) =>
                  setFormData({ ...formData, valid_until: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || !formData.code || !formData.discount_value}
            >
              {isCreating ? 'Création...' : 'Créer le coupon'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
