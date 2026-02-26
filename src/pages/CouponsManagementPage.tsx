import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useStripeCoupons } from '@/hooks/useStripeCoupons'
import { Plus, Ticket, Zap, Calendar, Trash2, Copy } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { CouponCreationDialog } from '@/components/promotions/CouponCreationDialog'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { toast } from 'sonner'

export default function CouponsManagementPage() {
  const { coupons, isLoading, toggleCoupon, deleteCoupon } = useStripeCoupons()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => c.is_active).length,
    synced: coupons.filter((c) => c.synced_to_stripe).length,
    totalUsage: coupons.reduce((sum, c) => sum + (c.current_uses || 0), 0),
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      percentage: 'bg-blue-500/10 text-blue-500',
      fixed_amount: 'bg-green-500/10 text-green-500',
    }
    return colors[type] || 'bg-muted text-muted-foreground'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      percentage: 'Pourcentage',
      fixed_amount: 'Montant fixe',
    }
    return labels[type] || type
  }

  const getDurationLabel = (duration: string, months?: number | null) => {
    if (duration === 'once') return 'Une fois'
    if (duration === 'forever') return 'Permanent'
    if (duration === 'repeating') return `${months || 0} mois`
    return duration
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copié !')
  }

  return (
    <ChannablePageWrapper
      title="Coupons & Codes Promo"
      description={`${stats.total} coupons • ${stats.active} actifs • ${stats.synced} synchronisés Stripe • ${stats.totalUsage} utilisations`}
      heroImage="marketing"
      badge={{ label: 'Stripe', icon: Ticket }}
      actions={
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau coupon
        </Button>
      }
    >
      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement des coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Aucun coupon créé pour le moment</p>
            <p className="text-xs text-muted-foreground mb-4">
              Les coupons sont automatiquement synchronisés avec Stripe et disponibles au checkout.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer votre premier coupon
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Utilisations</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium font-mono text-sm">{coupon.code}</p>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground">{coupon.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyCode(coupon.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(coupon.discount_type)}>
                      {getTypeLabel(coupon.discount_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}%`
                      : `${coupon.discount_value}€`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getDurationLabel(coupon.duration, coupon.duration_in_months)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{coupon.current_uses || 0}</span>
                    {coupon.max_redemptions && (
                      <span className="text-muted-foreground"> / {coupon.max_redemptions}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {coupon.expires_at
                        ? formatDistanceToNow(new Date(coupon.expires_at), { addSuffix: true, locale: getDateFnsLocale() })
                        : 'Illimité'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.synced_to_stripe ? (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Zap className="w-3 h-3" /> Sync
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Local</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={(checked) =>
                        toggleCoupon({ coupon_id: coupon.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteCoupon(coupon.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CouponCreationDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </ChannablePageWrapper>
  )
}
