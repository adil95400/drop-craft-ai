import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, ShoppingCart, Package, Users, DollarSign, Clock } from 'lucide-react'

export const RecentActivity: React.FC = () => {
  // Activités récentes simulées
  const activities = [
    {
      id: 1,
      type: 'order',
      title: 'Nouvelle commande',
      description: 'Commande #1234 de Marie Dubois',
      amount: '€125.00',
      time: 'Il y a 2 min',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 2,
      type: 'product',
      title: 'Produit ajouté',
      description: 'Casque Bluetooth Premium',
      amount: '+1',
      time: 'Il y a 15 min',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 3,
      type: 'customer',
      title: 'Nouveau client',
      description: 'Pierre Martin s\'est inscrit',
      amount: '+1',
      time: 'Il y a 32 min',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 4,
      type: 'payment',
      title: 'Paiement reçu',
      description: 'Commande #1230 confirmée',
      amount: '€89.50',
      time: 'Il y a 45 min',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 5,
      type: 'order',
      title: 'Commande expédiée',
      description: 'Commande #1228 en transit',
      amount: '€156.00',
      time: 'Il y a 1h',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  const getStatusBadge = (type: string) => {
    switch (type) {
      case 'order':
        return <Badge variant="default" className="text-xs">Commande</Badge>
      case 'product':
        return <Badge variant="secondary" className="text-xs">Produit</Badge>
      case 'customer':
        return <Badge variant="outline" className="text-xs">Client</Badge>
      case 'payment':
        return <Badge className="text-xs bg-green-100 text-green-800">Paiement</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">Activité</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600" />
          Activité Récente
        </CardTitle>
        <CardDescription>
          Les dernières actions sur votre boutique
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = activity.icon
            return (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-3 hover:bg-muted/30 rounded-lg transition-colors"
              >
                {/* Icône */}
                <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                  <Icon className={`h-4 w-4 ${activity.color}`} />
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    {getStatusBadge(activity.type)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>

                {/* Montant */}
                <div className="text-right">
                  <p className={`font-medium text-sm ${activity.color}`}>
                    {activity.amount}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer avec action */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">5 activités récentes</span>
            <button className="text-primary hover:underline font-medium">
              Voir tout l'historique
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}