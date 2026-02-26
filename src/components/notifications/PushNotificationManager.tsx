import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, BellRing, Send, Settings, Smartphone, Monitor, 
  Clock, Users, Target, Plus, Trash2, Edit, Eye,
  CheckCircle2, XCircle, Loader2, Globe, Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  icon?: string;
  type: 'promotional' | 'transactional' | 'reminder' | 'alert';
}

interface ScheduledNotification {
  id: string;
  template_id: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'failed';
  target_audience: string;
}

interface DeviceRegistration {
  id: string;
  platform: 'web' | 'ios' | 'android';
  last_active: string;
  is_active: boolean;
}

const NOTIFICATION_TYPES = [
  { value: 'promotional', label: 'Promotionnel', icon: '🎉', color: 'bg-purple-100 text-purple-700' },
  { value: 'transactional', label: 'Transactionnel', icon: '📦', color: 'bg-blue-100 text-blue-700' },
  { value: 'reminder', label: 'Rappel', icon: '⏰', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'alert', label: 'Alerte', icon: '🔔', color: 'bg-red-100 text-red-700' },
];

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  { id: '1', name: 'Nouvelle commande', title: 'Commande confirmée 🎉', body: 'Votre commande #{{order_id}} a été confirmée !', type: 'transactional' },
  { id: '2', name: 'Expédition', title: 'Colis expédié 📦', body: 'Votre colis est en route ! Suivez-le ici.', type: 'transactional' },
  { id: '3', name: 'Promotion Flash', title: 'Vente Flash -50% ⚡', body: 'Profitez de -50% sur toute la boutique !', type: 'promotional' },
  { id: '4', name: 'Panier abandonné', title: 'Vous avez oublié quelque chose 🛒', body: 'Votre panier vous attend ! Finalisez votre achat.', type: 'reminder' },
  { id: '5', name: 'Stock faible', title: 'Alerte stock 📉', body: 'Le produit "{{product}}" est presque épuisé.', type: 'alert' },
];

export function PushNotificationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const locale = useDateFnsLocale();
  const [templates, setTemplates] = useState<NotificationTemplate[]>(DEFAULT_TEMPLATES);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  
  const [settings, setSettings] = useState({
    enabled: true,
    sound: true,
    vibration: true,
    promotionalEnabled: true,
    transactionalEnabled: true,
    reminderEnabled: true,
    alertEnabled: true,
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    title: '',
    body: '',
    type: 'transactional' as const,
  });

  const [testNotification, setTestNotification] = useState({
    title: '',
    body: '',
  });

  // Check if push notifications are supported
  const isPushSupported = 'Notification' in window && 'serviceWorker' in navigator;
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isPushSupported) {
      setPermissionStatus(Notification.permission);
    }
    loadDevices();
  }, []);

  const loadDevices = async () => {
    if (!user) return;
    
    // Mock devices for demo
    setDevices([
      { id: '1', platform: 'web', last_active: new Date().toISOString(), is_active: true },
      { id: '2', platform: 'android', last_active: new Date(Date.now() - 86400000).toISOString(), is_active: true },
    ]);
  };

  const requestPermission = async () => {
    if (!isPushSupported) {
      toast({
        title: "Non supporté",
        description: "Les notifications push ne sont pas supportées sur ce navigateur.",
        variant: "destructive"
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications activées",
          description: "Vous recevrez désormais les notifications push."
        });
        
        // Register service worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          console.log('Service Worker ready:', registration);
        }
      } else {
        toast({
          title: "Permission refusée",
          description: "Vous ne recevrez pas les notifications push.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const sendTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      toast({
        title: "Permission requise",
        description: "Activez d'abord les notifications.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Show notification directly for testing
      const notification = new Notification(testNotification.title || 'Test Notification', {
        body: testNotification.body || 'Ceci est une notification de test !',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      toast({
        title: "Notification envoyée",
        description: "Vérifiez vos notifications système."
      });
      
      setIsTestOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = () => {
    if (!newTemplate.name || !newTemplate.title || !newTemplate.body) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive"
      });
      return;
    }

    const template: NotificationTemplate = {
      id: crypto.randomUUID(),
      ...newTemplate,
    };

    setTemplates([...templates, template]);
    setNewTemplate({ name: '', title: '', body: '', type: 'transactional' });
    setIsCreateOpen(false);
    
    toast({
      title: "Template créé",
      description: `Le template "${template.name}" a été créé.`
    });
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast({
      title: "Template supprimé"
    });
  };

  const getTypeConfig = (type: string) => {
    return NOTIFICATION_TYPES.find(t => t.value === type) || NOTIFICATION_TYPES[0];
  };

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications Push</h2>
          <p className="text-muted-foreground">Gérez vos notifications mobiles et web</p>
        </div>
        <div className="flex items-center gap-3">
          {permissionStatus === 'granted' ? (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Activées
            </Badge>
          ) : permissionStatus === 'denied' ? (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Bloquées
            </Badge>
          ) : (
            <Button onClick={requestPermission} variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Activer les notifications
            </Button>
          )}
          
          <Dialog open={isTestOpen} onOpenChange={setIsTestOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Tester
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Envoyer une notification test</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    value={testNotification.title}
                    onChange={(e) => setTestNotification({ ...testNotification, title: e.target.value })}
                    placeholder="Test de notification"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={testNotification.body}
                    onChange={(e) => setTestNotification({ ...testNotification, body: e.target.value })}
                    placeholder="Ceci est une notification de test..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTestOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={sendTestNotification} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Envoyer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">
            <BellRing className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Smartphone className="h-4 w-4 mr-2" />
            Appareils
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {templates.length} templates configurés
            </p>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nom du template</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Ex: Confirmation commande"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={newTemplate.type} 
                      onValueChange={(v: any) => setNewTemplate({ ...newTemplate, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTIFICATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Titre de la notification</Label>
                    <Input
                      value={newTemplate.title}
                      onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                      placeholder="Votre commande est prête !"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={newTemplate.body}
                      onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                      placeholder="Cliquez pour voir les détails..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {"{{order_id}}"}, {"{{product}}"}, {"{{customer}}"}, {"{{amount}}"}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={createTemplate}>
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const typeConfig = getTypeConfig(template.type);
              return (
                <Card key={template.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={typeConfig.color}>
                        {typeConfig.icon} {typeConfig.label}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <h4 className="font-semibold mb-1">{template.name}</h4>
                    <div className="bg-muted/50 rounded-lg p-3 mt-3">
                      <p className="text-sm font-medium">{template.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{template.body}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appareils enregistrés</CardTitle>
              <CardDescription>
                Gérez les appareils qui recevront vos notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devices.length > 0 ? (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div 
                      key={device.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {device.platform === 'web' ? (
                          <Monitor className="h-8 w-8 text-muted-foreground" />
                        ) : device.platform === 'ios' ? (
                          <Smartphone className="h-8 w-8 text-muted-foreground" />
                        ) : (
                          <Smartphone className="h-8 w-8 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium capitalize">{device.platform}</p>
                          <p className="text-sm text-muted-foreground">
                            Dernière activité: {format(new Date(device.last_active), "dd MMM yyyy 'à' HH:mm", { locale })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {device.is_active ? (
                          <Badge className="bg-green-100 text-green-700">Actif</Badge>
                        ) : (
                          <Badge variant="outline">Inactif</Badge>
                        )}
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun appareil enregistré</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Configurez le comportement des notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications push</p>
                  <p className="text-sm text-muted-foreground">Activer/désactiver toutes les notifications</p>
                </div>
                <Switch 
                  checked={settings.enabled} 
                  onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Son</p>
                  <p className="text-sm text-muted-foreground">Jouer un son à la réception</p>
                </div>
                <Switch 
                  checked={settings.sound} 
                  onCheckedChange={(v) => setSettings({ ...settings, sound: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Vibration</p>
                  <p className="text-sm text-muted-foreground">Vibrer à la réception (mobile)</p>
                </div>
                <Switch 
                  checked={settings.vibration} 
                  onCheckedChange={(v) => setSettings({ ...settings, vibration: v })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Types de notifications</CardTitle>
              <CardDescription>
                Choisissez les types de notifications à recevoir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NOTIFICATION_TYPES.map((type) => (
                <div key={type.value} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{type.icon}</span>
                    <p className="font-medium">{type.label}</p>
                  </div>
                  <Switch 
                    checked={settings[`${type.value}Enabled` as keyof typeof settings] as boolean}
                    onCheckedChange={(v) => setSettings({ 
                      ...settings, 
                      [`${type.value}Enabled`]: v 
                    })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
