import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Vibrate, Bell, BellRing, Smartphone, Wifi, WifiOff, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface NativeCapability {
  name: string;
  available: boolean;
  icon: React.ReactNode;
  description: string;
}

export function NativeFeatures() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [localNotifEnabled, setLocalNotifEnabled] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
      toast.success('Vibration déclenchée (Web API)');
    } else {
      toast.info('Haptics non disponible sur ce dispositif');
    }
  };

  const sendLocalNotification = async () => {
    try {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('ShopOpti+', {
            body: '🎉 Nouvelle commande reçue !',
            icon: '/logos/shopopti-icon-192.png',
          });
          toast.success('Notification envoyée');
        }
      } else {
        toast.info('Notifications non supportées sur ce navigateur');
      }
    } catch {
      toast.error('Erreur notification');
    }
  };

  const capabilities: NativeCapability[] = [
    { name: 'Haptics', available: !!navigator.vibrate, icon: <Vibrate className="h-5 w-5" />, description: 'Retour haptique pour les interactions' },
    { name: 'Push Notifications', available: false, icon: <BellRing className="h-5 w-5" />, description: 'Notifications push natives (APNs/FCM)' },
    { name: 'Local Notifications', available: 'Notification' in window, icon: <Bell className="h-5 w-5" />, description: 'Alertes locales programmées' },
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
          <p className="text-muted-foreground">Exploitez les capacités de l'appareil</p>
        </div>
        <Badge variant="secondary">🌐 Web</Badge>
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
          <CardDescription>Testez les fonctionnalités directement</CardDescription>
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

          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-sm">
            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              Les fonctionnalités natives Capacitor ne sont pas disponibles en mode web.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
