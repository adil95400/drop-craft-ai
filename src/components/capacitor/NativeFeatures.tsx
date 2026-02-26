import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Vibrate, Bell, BellRing, Smartphone, Wifi, WifiOff, Battery, Info } from 'lucide-react';
import { toast } from 'sonner';

interface NativeCapability {
  name: string;
  available: boolean;
  icon: React.ReactNode;
  description: string;
}

export function NativeFeatures() {
  const [isNative, setIsNative] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [localNotifEnabled, setLocalNotifEnabled] = useState(true);

  useEffect(() => {
    // Detect Capacitor environment
    setIsNative(!!(window as any).Capacitor?.isNativePlatform?.());
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerHaptic = async () => {
    try {
      if (isNative) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
        toast.success('Haptic feedback déclenché');
      } else if (navigator.vibrate) {
        navigator.vibrate(100);
        toast.success('Vibration déclenchée (Web API)');
      } else {
        toast.info('Haptics non disponible sur ce dispositif');
      }
    } catch {
      toast.error('Erreur haptic');
    }
  };

  const sendLocalNotification = async () => {
    try {
      if (isNative) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [{
              title: 'ShopOpti+',
              body: '🎉 Nouvelle commande reçue ! Consultez votre dashboard.',
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 3000) },
            }],
          });
          toast.success('Notification locale programmée dans 3s');
        }
      } else if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('ShopOpti+', {
            body: '🎉 Nouvelle commande reçue !',
            icon: '/logos/shopopti-icon-192.png',
          });
          toast.success('Notification envoyée');
        }
      }
    } catch {
      toast.error('Erreur notification');
    }
  };

  const registerPush = async () => {
    try {
      if (isNative) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') {
          await PushNotifications.register();
          PushNotifications.addListener('registration', token => {
            console.log('Push token:', token.value);
            toast.success(`Push enregistré: ${token.value.substring(0, 20)}...`);
          });
          setPushEnabled(true);
        }
      } else {
        toast.info('Push natif uniquement disponible dans l\'app mobile');
      }
    } catch {
      toast.error('Erreur push notifications');
    }
  };

  const capabilities: NativeCapability[] = [
    { name: 'Haptics', available: isNative || !!navigator.vibrate, icon: <Vibrate className="h-5 w-5" />, description: 'Retour haptique pour les interactions' },
    { name: 'Push Notifications', available: isNative, icon: <BellRing className="h-5 w-5" />, description: 'Notifications push natives (APNs/FCM)' },
    { name: 'Local Notifications', available: true, icon: <Bell className="h-5 w-5" />, description: 'Alertes locales programmées' },
    { name: 'Offline Mode', available: true, icon: isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />, description: 'Cache et sync hors ligne' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            Fonctionnalités Natives
          </h2>
          <p className="text-muted-foreground">Exploitez les capacités de l'appareil via Capacitor</p>
        </div>
        <Badge variant={isNative ? 'default' : 'secondary'}>
          {isNative ? '📱 App Native' : '🌐 Web'}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {capabilities.map(cap => (
          <Card key={cap.name}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">{cap.icon}</div>
                <div>
                  <p className="font-medium">{cap.name}</p>
                  <p className="text-sm text-muted-foreground">{cap.description}</p>
                </div>
              </div>
              <Badge variant={cap.available ? 'default' : 'outline'}>
                {cap.available ? '✓ Disponible' : '✗ Non dispo'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions de test</CardTitle>
          <CardDescription>Testez les fonctionnalités natives directement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={hapticEnabled} onCheckedChange={setHapticEnabled} />
              <Label>Haptic feedback activé</Label>
            </div>
            <Button size="sm" onClick={triggerHaptic} disabled={!hapticEnabled}>
              <Vibrate className="mr-2 h-4 w-4" />
              Tester Haptic
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={localNotifEnabled} onCheckedChange={setLocalNotifEnabled} />
              <Label>Notifications locales</Label>
            </div>
            <Button size="sm" onClick={sendLocalNotification} disabled={!localNotifEnabled}>
              <Bell className="mr-2 h-4 w-4" />
              Envoyer Notif
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
              <Label>Push Notifications</Label>
            </div>
            <Button size="sm" onClick={registerPush} variant={pushEnabled ? 'default' : 'outline'}>
              <BellRing className="mr-2 h-4 w-4" />
              {pushEnabled ? 'Actif' : 'Activer Push'}
            </Button>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-sm">
            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {isNative
                ? 'Toutes les fonctionnalités natives sont accessibles.'
                : 'Certaines fonctionnalités nécessitent l\'app mobile Capacitor.'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
