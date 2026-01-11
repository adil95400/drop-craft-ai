import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Laptop,
  RefreshCw,
  Check,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff,
  Trash2,
  Shield,
  Settings,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet' | 'laptop';
  platform: string;
  lastSync: Date;
  isOnline: boolean;
  isCurrent: boolean;
  browser: string;
  location: string;
}

interface SyncItem {
  id: string;
  name: string;
  type: 'products' | 'orders' | 'settings' | 'analytics';
  status: 'synced' | 'syncing' | 'pending' | 'error';
  lastUpdated: Date;
  size: string;
}

const mockDevices: Device[] = [
  {
    id: '1',
    name: 'MacBook Pro',
    type: 'laptop',
    platform: 'macOS',
    lastSync: new Date(),
    isOnline: true,
    isCurrent: true,
    browser: 'Chrome 120',
    location: 'Paris, France'
  },
  {
    id: '2',
    name: 'iPhone 15',
    type: 'mobile',
    platform: 'iOS 17',
    lastSync: new Date(Date.now() - 1000 * 60 * 5),
    isOnline: true,
    isCurrent: false,
    browser: 'Safari',
    location: 'Paris, France'
  },
  {
    id: '3',
    name: 'iPad Pro',
    type: 'tablet',
    platform: 'iPadOS 17',
    lastSync: new Date(Date.now() - 1000 * 60 * 30),
    isOnline: false,
    isCurrent: false,
    browser: 'Safari',
    location: 'Lyon, France'
  },
  {
    id: '4',
    name: 'Windows Desktop',
    type: 'desktop',
    platform: 'Windows 11',
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isOnline: false,
    isCurrent: false,
    browser: 'Edge',
    location: 'Paris, France'
  }
];

const mockSyncItems: SyncItem[] = [
  { id: '1', name: 'Catalogue produits', type: 'products', status: 'synced', lastUpdated: new Date(), size: '2.4 MB' },
  { id: '2', name: 'Commandes', type: 'orders', status: 'syncing', lastUpdated: new Date(), size: '856 KB' },
  { id: '3', name: 'Paramètres utilisateur', type: 'settings', status: 'synced', lastUpdated: new Date(), size: '12 KB' },
  { id: '4', name: 'Données analytics', type: 'analytics', status: 'pending', lastUpdated: new Date(Date.now() - 1000 * 60 * 10), size: '1.2 MB' }
];

const getDeviceIcon = (type: Device['type']) => {
  switch (type) {
    case 'mobile': return <Smartphone className="h-5 w-5" />;
    case 'desktop': return <Monitor className="h-5 w-5" />;
    case 'tablet': return <Tablet className="h-5 w-5" />;
    case 'laptop': return <Laptop className="h-5 w-5" />;
    default: return <Monitor className="h-5 w-5" />;
  }
};

const getStatusIcon = (status: SyncItem['status']) => {
  switch (status) {
    case 'synced': return <Check className="h-4 w-4 text-green-500" />;
    case 'syncing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
};

export function MultiDeviceSync() {
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [syncItems, setSyncItems] = useState<SyncItem[]>(mockSyncItems);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(5);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const { toast } = useToast();

  const syncAll = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setSyncProgress(i);
    }
    
    setSyncItems(items => items.map(item => ({
      ...item,
      status: 'synced' as const,
      lastUpdated: new Date()
    })));
    
    setDevices(d => d.map(device => ({
      ...device,
      lastSync: new Date()
    })));
    
    setIsSyncing(false);
    toast({
      title: "✅ Synchronisation terminée",
      description: "Tous vos appareils sont à jour"
    });
  };

  const removeDevice = (deviceId: string) => {
    setDevices(d => d.filter(device => device.id !== deviceId));
    toast({
      title: "Appareil supprimé",
      description: "L'appareil a été déconnecté de votre compte"
    });
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    return `Il y a ${Math.floor(seconds / 86400)} j`;
  };

  const onlineDevices = devices.filter(d => d.isOnline).length;
  const totalSyncSize = syncItems.reduce((acc, item) => {
    const size = parseFloat(item.size);
    return acc + (item.size.includes('MB') ? size * 1024 : size);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appareils connectés</p>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En ligne</p>
                <p className="text-2xl font-bold text-green-500">{onlineDevices}</p>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <Wifi className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Données sync</p>
                <p className="text-2xl font-bold">{(totalSyncSize / 1024).toFixed(1)} MB</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dernière sync</p>
                <p className="text-2xl font-bold">{formatTimeAgo(devices[0].lastSync)}</p>
              </div>
              <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Progress */}
      {isSyncing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Synchronisation en cours...</span>
                <span className="text-sm text-muted-foreground">{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Appareils</TabsTrigger>
          <TabsTrigger value="data">Données</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Vos appareils</h3>
            <Button onClick={syncAll} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Synchroniser tout
            </Button>
          </div>

          <div className="grid gap-4">
            {devices.map((device) => (
              <Card key={device.id} className={device.isCurrent ? 'border-primary' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        device.isOnline ? 'bg-green-500/10' : 'bg-muted'
                      }`}>
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{device.name}</span>
                          {device.isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Cet appareil
                            </Badge>
                          )}
                          {device.isOnline ? (
                            <Badge variant="outline" className="text-xs text-green-500 border-green-500/50">
                              <Wifi className="h-3 w-3 mr-1" />
                              En ligne
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              <WifiOff className="h-3 w-3 mr-1" />
                              Hors ligne
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {device.platform} • {device.browser} • {device.location}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Dernière sync: {formatTimeAgo(device.lastSync)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!device.isCurrent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDevice(device.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <h3 className="text-lg font-semibold">Données synchronisées</h3>
          
          <div className="grid gap-4">
            {syncItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(item.status)}
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <div className="text-sm text-muted-foreground">
                          {item.size} • Mis à jour {formatTimeAgo(item.lastUpdated)}
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      item.status === 'synced' ? 'default' :
                      item.status === 'syncing' ? 'secondary' :
                      item.status === 'pending' ? 'outline' : 'destructive'
                    }>
                      {item.status === 'synced' ? 'Synchronisé' :
                       item.status === 'syncing' ? 'En cours...' :
                       item.status === 'pending' ? 'En attente' : 'Erreur'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h3 className="text-lg font-semibold">Paramètres de synchronisation</h3>
          
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Synchronisation automatique</div>
                  <div className="text-sm text-muted-foreground">
                    Synchroniser automatiquement les données entre appareils
                  </div>
                </div>
                <Switch checked={autoSync} onCheckedChange={setAutoSync} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Sync en arrière-plan</div>
                  <div className="text-sm text-muted-foreground">
                    Continuer la sync même quand l'app n'est pas active
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Notifications de sync</div>
                  <div className="text-sm text-muted-foreground">
                    Recevoir des alertes en cas de problème de sync
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Mode économie de données</div>
                  <div className="text-sm text-muted-foreground">
                    Réduire la fréquence de sync sur réseau mobile
                  </div>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Gérer les sessions actives
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Déconnecter tous les appareils
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
