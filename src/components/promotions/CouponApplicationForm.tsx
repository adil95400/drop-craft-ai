import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCoupons } from '@/hooks/useCoupons'
import { Ticket, Check } from 'lucide-react'

interface CouponApplicationFormProps {
  amount: number
  onCouponApplied?: (discount: number) => void
  orderId?: string
  subscriptionId?: string
}

export function CouponApplicationForm({
  amount,
  onCouponApplied,
  orderId,
  subscriptionId,
}: CouponApplicationFormProps) {
  const [code, setCode] = useState('')
  const [validatedDiscount, setValidatedDiscount] = useState<any>(null)
  const { validateCoupon, redeemCoupon, isValidating, isRedeeming } = useCoupons()

  const handleValidate = () => {
    validateCoupon(
      { code, amount },
      {
        onSuccess: (data: any) => {
          if (data.valid) {
            setValidatedDiscount(data)
          }
        },
      }
    )
  }

  const handleApply = () => {
    redeemCoupon(
      {
        code,
        amount,
        orderId,
        subscriptionId,
      },
      {
        onSuccess: (data: any) => {
          if (onCouponApplied) {
            onCouponApplied(data.discount.amount)
          }
          setCode('')
          setValidatedDiscount(null)
        },
      }
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-muted-foreground" />
          <Label className="text-base font-medium">Code promo</Label>
        </div>

        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setValidatedDiscount(null)
            }}
            placeholder="ENTREZ VOTRE CODE"
            className="font-mono"
            disabled={!!validatedDiscount}
          />
          {!validatedDiscount ? (
            <Button
              onClick={handleValidate}
              disabled={!code || isValidating}
              variant="outline"
            >
              {isValidating ? 'Validation...' : 'Valider'}
            </Button>
          ) : (
            <Button onClick={handleApply} disabled={isRedeeming}>
              <Check className="w-4 h-4 mr-2" />
              {isRedeeming ? 'Application...' : 'Appliquer'}
            </Button>
          )}
        </div>

        {validatedDiscount && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">
                  Coupon valide : {validatedDiscount.coupon.code}
                </p>
                {validatedDiscount.coupon.description && (
                  <p className="text-xs text-muted-foreground">
                    {validatedDiscount.coupon.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  -{validatedDiscount.discount.amount.toFixed(2)}€
                </p>
                <p className="text-xs text-muted-foreground">
                  {validatedDiscount.discount.original_amount.toFixed(2)}€ →{' '}
                  {validatedDiscount.discount.final_amount.toFixed(2)}€
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
