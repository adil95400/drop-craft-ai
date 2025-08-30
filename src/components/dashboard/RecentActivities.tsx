import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity,
  ShoppingCart,
  Package,
  Users,
  Mail,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'order' | 'product' | 'user' | 'system' | 'marketing' | 'notification';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: {
    amount?: number;
    quantity?: number;
    category?: string;
  };
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'order',
    title: 'Nouvelle commande reçue',
    description: 'Commande #CMD-2024-001 de Marie Dupont',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'success',
    user: { name: 'Marie Dupont', avatar: '/avatars/marie.jpg' },
    metadata: { amount: 149.99, quantity: 3 }
  },
  {
    id: '2',
    type: 'product',
    title: 'Stock faible détecté',
    description: 'iPhone 15 Pro - Stock: 3 unités restantes',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    status: 'warning',
    metadata: { quantity: 3, category: 'Électronique' }
  },
  {
    id: '3',
    type: 'user',
    title: 'Nouvel utilisateur inscrit',
    description: 'Pierre Martin a créé un compte',
    timestamp: new Date(Date.now() - 32 * 60 * 1000),
    status: 'info',
    user: { name: 'Pierre Martin', avatar: '/avatars/pierre.jpg' }
  },
  {
    id: '4',
    type: 'system',
    title: 'Sauvegarde automatique',
    description: 'Sauvegarde des données terminée avec succès',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    status: 'success'
  },
  {
    id: '5',
    type: 'marketing',
    title: 'Campagne email lancée',
    description: 'Newsletter "Offres du mois" envoyée à 2,450 contacts',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    status: 'success',
    metadata: { quantity: 2450 }
  },
  {
    id: '6',
    type: 'order',
    title: 'Commande annulée',
    description: 'Commande #CMD-2024-002 annulée par le client',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'error',
    metadata: { amount: 299.99 }
  },
  {
    id: '7',
    type: 'product',
    title: 'Nouveau produit ajouté',
    description: 'MacBook Air M2 - 13" ajouté au catalogue',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    status: 'success',
    metadata: { category: 'Informatique' }
  },
  {
    id: '8',
    type: 'notification',
    title: 'Notification push envoyée',
    description: 'Rappel de panier abandonné envoyé à 156 utilisateurs',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: 'info',
    metadata: { quantity: 156 }
  }
];

export const RecentActivities: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [limit, setLimit] = useState(10);

  const getActivityIcon = (type: ActivityItem['type'], status: ActivityItem['status']) => {
    const iconClass = "h-4 w-4";
    
    switch (type) {
      case 'order':
        return <ShoppingCart className={iconClass} />;
      case 'product':
        return <Package className={iconClass} />;
      case 'user':
        return <Users className={iconClass} />;
      case 'marketing':
        return <Mail className={iconClass} />;
      case 'notification':
        return <Bell className={iconClass} />;
      default:
        return <Activity className={iconClass} />;
    }
  };

  const getStatusIcon = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeLabel = (type: ActivityItem['type']) => {
    const labels = {
      order: 'Commande',
      product: 'Produit',
      user: 'Utilisateur',
      system: 'Système',
      marketing: 'Marketing',
      notification: 'Notification'
    };
    return labels[type];
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  const filteredActivities = filter === 'all' 
    ? mockActivities 
    : mockActivities.filter(activity => activity.type === filter);

  const displayedActivities = filteredActivities.slice(0, limit);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activités récentes
          </CardTitle>
          
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="order">Commandes</SelectItem>
                <SelectItem value="product">Produits</SelectItem>
                <SelectItem value="user">Utilisateurs</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="notification">Notifications</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune activité récente</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Avatar or Icon */}
                  <div className="flex-shrink-0">
                    {activity.user ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                        <AvatarFallback>
                          {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        getStatusColor(activity.status)
                      )}>
                        {getActivityIcon(activity.type, activity.status)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{activity.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(activity.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                        
                        {/* Metadata */}
                        {activity.metadata && (
                          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                            {activity.metadata.amount && (
                              <span className="font-medium">
                                {activity.metadata.amount.toFixed(2)}€
                              </span>
                            )}
                            {activity.metadata.quantity && (
                              <span>
                                Qty: {activity.metadata.quantity}
                              </span>
                            )}
                            {activity.metadata.category && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.metadata.category}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {getStatusIcon(activity.status)}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {filteredActivities.length > limit && (
              <div className="text-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setLimit(prev => prev + 10)}
                >
                  Charger plus d'activités ({filteredActivities.length - limit} restantes)
                </Button>
              </div>
            )}

            {/* Summary */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Affichage de {displayedActivities.length} sur {filteredActivities.length} activité(s)
                {filter !== 'all' && ` (filtrée par ${getTypeLabel(filter as ActivityItem['type']).toLowerCase()})`}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};