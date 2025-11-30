import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useCoupons } from '@/hooks/useCoupons'
import { Plus, Ticket, TrendingUp, Users, Calendar } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CouponCreationDialog } from '@/components/promotions/CouponCreationDialog'

export default function CouponsManagementPage() {
  const { coupons, isLoading, updateCoupon, deleteCoupon } = useCoupons()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => c.is_active).length,
    totalUsage: coupons.reduce((sum, c) => sum + c.usage_count, 0),
    totalDiscount: coupons
      .reduce((sum, c) => sum + c.discount_value * c.usage_count, 0)
      .toFixed(2),
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      percentage: 'bg-blue-500/10 text-blue-500',
      fixed_amount: 'bg-green-500/10 text-green-500',
      free_trial: 'bg-purple-500/10 text-purple-500',
    }
    return colors[type] || 'bg-muted'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      percentage: 'Pourcentage',
      fixed_amount: 'Montant fixe',
      free_trial: 'Essai gratuit',
    }
    return labels[type] || type
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons de réduction</h1>
          <p className="text-muted-foreground">
            Gérez vos codes promo et essais gratuits
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau coupon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Coupons</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Ticket className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Actifs</p>
              <p className="text-2xl font-bold text-green-500">{stats.active}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Utilisations</p>
              <p className="text-2xl font-bold">{stats.totalUsage}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Réduction totale</p>
              <p className="text-2xl font-bold text-purple-500">{stats.totalDiscount}€</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement des coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Aucun coupon créé pour le moment
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
                <TableHead>Utilisations</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium font-mono">{coupon.code}</p>
                      {coupon.description && (
                        <p className="text-xs text-muted-foreground">
                          {coupon.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(coupon.coupon_type)}>
                      {getTypeLabel(coupon.coupon_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.coupon_type === 'percentage' && `${coupon.discount_value}%`}
                    {coupon.coupon_type === 'fixed_amount' &&
                      `${coupon.discount_value}${coupon.currency}`}
                    {coupon.coupon_type === 'free_trial' &&
                      `${coupon.trial_days} jours`}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{coupon.usage_count}</span>
                    {coupon.usage_limit && (
                      <span className="text-muted-foreground">
                        {' '}
                        / {coupon.usage_limit}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {coupon.valid_until
                        ? formatDistanceToNow(new Date(coupon.valid_until), {
                            addSuffix: true,
                            locale: fr,
                          })
                        : 'Illimité'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={(checked) =>
                        updateCoupon({ id: coupon.id, updates: { is_active: checked } })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCoupon(coupon.id)}
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CouponCreationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
