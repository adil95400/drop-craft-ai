import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Settings, 
  Check, 
  X, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Globe,
  Zap,
  Clock,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'sync';
  category: 'products' | 'orders' | 'customers' | 'inventory' | 'analytics' | 'seo' | 'integrations' | 'system';
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  categories: {
    products: boolean;
    orders: boolean;
    customers: boolean;
    inventory: boolean;
    analytics: boolean;
    seo: boolean;
    integrations: boolean;
    system: boolean;
  };
}

export function UnifiedNotificationCenter() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Stock faible détecté',
      message: 'Le produit "Chaise ergonomique" a un stock inférieur au seuil minimum (5 unités restantes)',
      type: 'warning',
      category: 'inventory',
      timestamp: new Date(Date.now() - 300000), // 5 min ago
      read: false,
      actionable: true,
      priority: 'high'
    },
    {
      id: '2',
      title: 'Nouvelle commande reçue',
      message: 'Commande #ORD-2024-001 de 450€ en provenance de Jean Dupont',
      type: 'success',
      category: 'orders',
      timestamp: new Date(Date.now() - 600000), // 10 min ago
      read: false,
      actionable: true,
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Synchronisation terminée',
      message: 'Synchronisation Shopify complétée avec succès - 25 produits mis à jour',
      type: 'sync',
      category: 'integrations',
      timestamp: new Date(Date.now() - 900000), // 15 min ago
      read: true,
      actionable: false,
      priority: 'low'
    },
    {
      id: '4',
      title: 'Analyse SEO disponible',
      message: 'Le rapport d\'analyse SEO de votre site est maintenant disponible',
      type: 'info',
      category: 'seo',
      timestamp: new Date(Date.now() - 1200000), // 20 min ago
      read: false,
      actionable: true,
      priority: 'medium'
    },
    {
      id: '5',
      title: 'Erreur d\'intégration',
      message: 'Impossible de synchroniser avec BigBuy - Vérifiez vos identifiants',
      type: 'error',
      category: 'integrations',
      timestamp: new Date(Date.now() - 1800000), // 30 min ago
      read: false,
      actionable: true,
      priority: 'critical'
    }
  ]);

  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    categories: {
      products: true,
      orders: true,
      customers: true,
      inventory: true,
      analytics: true,
      seo: true,
      integrations: true,
      system: true
    }
  });

  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all');

  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'sync') return <Zap className="w-4 h-4" />;
    
    switch (category) {
      case 'products': return <Package className="w-4 h-4" />;
      case 'orders': return <ShoppingCart className="w-4 h-4" />;
      case 'customers': return <Users className="w-4 h-4" />;
      case 'inventory': return <Package className="w-4 h-4" />;
      case 'analytics': return <TrendingUp className="w-4 h-4" />;
      case 'seo': return <Globe className="w-4 h-4" />;
      case 'integrations': return <Zap className="w-4 h-4" />;
      default:
        switch (type) {
          case 'success': return <CheckCircle className="w-4 h-4" />;
          case 'warning': return <AlertTriangle className="w-4 h-4" />;
          case 'error': return <X className="w-4 h-4" />;
          default: return <Info className="w-4 h-4" />;
        }
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'critical') return 'text-red-600';
    
    switch (type) {
      case 'success': case 'sync': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'default',
      critical: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants]} className="text-xs">
        {priority === 'low' && 'Basse'}
        {priority === 'medium' && 'Moyenne'}
        {priority === 'high' && 'Haute'}
        {priority === 'critical' && 'Critique'}
      </Badge>
    );
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    toast({
      title: "Notifications marquées comme lues",
      description: "Toutes les notifications ont été marquées comme lues"
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread': return !notif.read;
      case 'actionable': return notif.actionable;
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `il y a ${diff} min`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return timestamp.toLocaleDateString('fr-FR');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Centre de Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Restez informé des événements importants de votre boutique
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-1" />
              Tout marquer lu
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            {/* Filtres */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Toutes ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Non lues ({unreadCount})
              </Button>
              <Button
                variant={filter === 'actionable' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('actionable')}
              >
                Actionables ({notifications.filter(n => n.actionable).length})
              </Button>
            </div>

            {/* Liste des notifications */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card key={notification.id} className={`transition-colors ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/20'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 ${getNotificationColor(notification.type, notification.priority)}`}>
                              {getNotificationIcon(notification.type, notification.category)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                {getPriorityBadge(notification.priority)}
                                {!notification.read && (
                                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(notification.timestamp)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {notification.actionable && (
                              <Button size="sm" variant="outline" className="text-xs">
                                Action
                              </Button>
                            )}
                            {!notification.read && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paramètres de Notification</CardTitle>
                <CardDescription>
                  Configurez comment et quand vous souhaitez être notifié
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Méthodes de notification */}
                <div className="space-y-4">
                  <h4 className="font-medium">Méthodes de notification</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Notifications par email</div>
                        <div className="text-xs text-muted-foreground">Recevez les notifications importantes par email</div>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Notifications push</div>
                        <div className="text-xs text-muted-foreground">Notifications en temps réel dans l'application</div>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, pushNotifications: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Catégories */}
                <div className="space-y-4">
                  <h4 className="font-medium">Catégories de notifications</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {Object.entries(settings.categories).map(([category, enabled]) => (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {getNotificationIcon('info', category)}
                          <span className="text-sm capitalize">
                            {category === 'seo' ? 'SEO' : category}
                          </span>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({
                              ...prev,
                              categories: { ...prev.categories, [category]: checked }
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}