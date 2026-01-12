import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  ShoppingBag,
  Edit,
  MessageCircle,
  PhoneCall
} from 'lucide-react'
import { Customer } from '@/hooks/useRealCustomers'

interface CustomerDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
  onEdit: (customer: Customer) => void
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEdit
}) => {
  if (!customer) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Actif</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Inactif</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const averageOrderValue = customer.total_orders > 0 
    ? customer.total_spent / customer.total_orders 
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{customer.name}</DialogTitle>
                <DialogDescription>
                  Client depuis le {formatDate(customer.created_at)}
                </DialogDescription>
              </div>
            </div>
            {getStatusBadge(customer.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(customer)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Envoyer email
            </Button>
            <Button variant="outline" size="sm">
              <PhoneCall className="h-4 w-4 mr-2" />
              Appeler
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              SMS
            </Button>
          </div>

          <Separator />

          {/* Informations de contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations de contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    {(customer.address.line1 || customer.address.line2) && <div>{customer.address.line1 || customer.address.line2}</div>}
                    <div>
                      {customer.address.city && `${customer.address.city}`}
                      {customer.address.postal_code && ` ${customer.address.postal_code}`}
                    </div>
                    {customer.address.country && <div>{customer.address.country}</div>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">{customer.total_orders}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{customer.total_orders}</p>
                  <p className="text-xs text-muted-foreground">Commandes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">{formatCurrency(customer.total_spent)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{formatCurrency(customer.total_spent)}</p>
                  <p className="text-xs text-muted-foreground">Total dépensé</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">{formatCurrency(averageOrderValue)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</p>
                  <p className="text-xs text-muted-foreground">Panier moyen</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations système */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Créé le : </span>
                  <span>{formatDate(customer.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Dernière modification : </span>
                  <span>{formatDate(customer.updated_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">ID Client : </span>
                  <span className="font-mono text-sm">{customer.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}