import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function NotificationsContent() {
  const { toast } = useToast();
  const [autoOrderPlacement, setAutoOrderPlacement] = useState(true);
  const [autoTracking, setAutoTracking] = useState(true);
  const [autoDelivery, setAutoDelivery] = useState(true);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['customer-confirmations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('notifications') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    }
  });

  const handleSaveSettings = async () => {
    toast({
      title: "✅ Paramètres sauvegardés",
      description: "Vos préférences de notification ont été enregistrées"
    });
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Paramètres de Notification</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="order-placement" className="text-base font-medium">
                Confirmation de Commande
              </Label>
              <p className="text-sm text-muted-foreground">
                Envoyer un email au client lors du placement de la commande
              </p>
            </div>
            <Switch
              id="order-placement"
              checked={autoOrderPlacement}
              onCheckedChange={setAutoOrderPlacement}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="tracking-update" className="text-base font-medium">
                Mise à jour du Tracking
              </Label>
              <p className="text-sm text-muted-foreground">
                Notifier le client lorsque le tracking est disponible
              </p>
            </div>
            <Switch
              id="tracking-update"
              checked={autoTracking}
              onCheckedChange={setAutoTracking}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="delivery-confirmation" className="text-base font-medium">
                Confirmation de Livraison
              </Label>
              <p className="text-sm text-muted-foreground">
                Envoyer un email au client lors de la livraison
              </p>
            </div>
            <Switch
              id="delivery-confirmation"
              checked={autoDelivery}
              onCheckedChange={setAutoDelivery}
            />
          </div>
        </div>

        <Button onClick={handleSaveSettings} className="mt-6 w-full">
          Enregistrer les Paramètres
        </Button>
      </Card>

      {/* Notifications History */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Historique des Notifications</h2>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notif: any) => (
              <div key={notif.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{notif.notification_type}</p>
                    <p className="text-sm text-muted-foreground">
                      Commande: {notif.order_id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={notif.sent_successfully ? 'default' : 'destructive'}>
                    {notif.sent_successfully ? 'Envoyé' : 'Échec'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notif.sent_at ? new Date(notif.sent_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucune notification envoyée</p>
          )}
        </div>
      </Card>
    </div>
  );
}
