import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Bell,
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react';
import { mobileService } from '@/services/mobile/MobileService';
import { useToast } from '@/hooks/use-toast';

export function MobileOptimizedDashboard() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState('web');
  const { toast } = useToast();

  useEffect(() => {
    // Initialize mobile service
    const initMobile = async () => {
      setIsNative(mobileService.isNative());
      setPlatform(mobileService.getPlatform());
      
      if (mobileService.isNative()) {
        await mobileService.initializePushNotifications();
        mobileService.trackMobileEvent('dashboard_loaded', {
          section: 'mobile_dashboard'
        });
      }
    };

    initMobile();

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTestNotification = async () => {
    await mobileService.notifyNewOrder('ORD-2024-001', 150);
    toast({
      title: 'Test de notification',
      description: 'Notification envoyée avec succès!'
    });
  };

  const handleTestHaptic = async () => {
    await mobileService.triggerHapticFeedback();
    toast({
      title: 'Retour haptique',
      description: 'Vibration déclenchée!'
    });
  };

  const mockStats = [
    {
      title: 'Produits',
      value: '1,284',
      change: '+12%',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Commandes',
      value: '156',
      change: '+8%',
      icon: ShoppingCart,
      color: 'bg-green-500'
    },
    {
      title: 'Clients',
      value: '2,847',
      change: '+15%',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'Revenus',
      value: '€45,230',
      change: '+23%',
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Mobile Status Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </Badge>
          
          {isNative && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              {platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Mobile'}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleTestNotification}
            className="flex items-center gap-1"
          >
            <Bell className="h-4 w-4" />
            Test Notif
          </Button>
          
          {isNative && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleTestHaptic}
            >
              📳 Haptic
            </Button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard Mobile</h1>
        <p className="text-muted-foreground">
          Optimisé pour {isNative ? 'mobile natif' : 'navigateur mobile'}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {mockStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                    <IconComponent className={`h-4 w-4 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile-Optimized Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={() => mobileService.trackMobileEvent('quick_action', { action: 'scan_product' })}
            >
              <Package className="h-5 w-5" />
              <span className="text-xs">Scanner Produit</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={() => mobileService.trackMobileEvent('quick_action', { action: 'new_order' })}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs">Nouvelle Commande</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={() => mobileService.trackMobileEvent('quick_action', { action: 'check_stock' })}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Vérifier Stock</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={() => mobileService.trackMobileEvent('quick_action', { action: 'customer_support' })}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Support Client</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activité Récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { type: 'order', message: 'Nouvelle commande #ORD-001', time: '2 min' },
              { type: 'stock', message: 'Stock faible: iPhone 15', time: '5 min' },
              { type: 'payment', message: 'Paiement reçu: €250', time: '12 min' },
              { type: 'supplier', message: 'Livraison prévue demain', time: '1h' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.time}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Native Features Info */}
      {isNative && (
        <Card className="mt-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              <p className="font-medium text-green-800 dark:text-green-200">
                Fonctionnalités Natives Activées
              </p>
            </div>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>✓ Notifications push</li>
              <li>✓ Retour haptique</li>
              <li>✓ Mode hors-ligne</li>
              <li>✓ Géolocalisation</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}