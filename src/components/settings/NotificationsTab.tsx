import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Bell, Mail, Smartphone, ShoppingCart, Sparkles, Megaphone } from "lucide-react";

interface NotificationsState {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  newFeatures: boolean;
  orderUpdates: boolean;
}

interface NotificationsTabProps {
  notifications: NotificationsState;
  setNotifications: (notifications: NotificationsState) => void;
  onSave: () => void;
}

const channelConfig = [
  { key: 'email' as const, icon: Mail, label: 'Email', description: 'Notifications par email', recommended: true },
  { key: 'push' as const, icon: Bell, label: 'Push', description: 'Notifications navigateur' },
  { key: 'sms' as const, icon: Smartphone, label: 'SMS', description: 'Notifications par SMS', premium: true },
];

const typeConfig = [
  { key: 'orderUpdates' as const, icon: ShoppingCart, label: 'Mises à jour commandes', description: 'Statut des colis et livraisons', recommended: true },
  { key: 'newFeatures' as const, icon: Sparkles, label: 'Nouvelles fonctionnalités', description: 'Annonces produit et mises à jour' },
  { key: 'marketing' as const, icon: Megaphone, label: 'Marketing', description: 'Conseils et recommandations' },
];

export function NotificationsTab({ notifications, setNotifications, onSave }: NotificationsTabProps) {
  const toggleNotification = (key: keyof NotificationsState) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          Préférences de Notification
        </CardTitle>
        <CardDescription>Choisissez comment et quand vous souhaitez être notifié</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Channels */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Canaux de notification</h4>
            <Badge variant="outline" className="text-xs">3 options</Badge>
          </div>
          
          <div className="grid gap-3">
            {channelConfig.map(({ key, icon: Icon, label, description, recommended, premium }) => (
              <div 
                key={key}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  notifications[key] ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    notifications[key] ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${notifications[key] ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {label}
                      {recommended && <Badge variant="secondary" className="text-xs">Recommandé</Badge>}
                      {premium && <Badge variant="outline" className="text-xs">Premium</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                  </div>
                </div>
                <Switch 
                  checked={notifications[key]} 
                  onCheckedChange={() => toggleNotification(key)} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Types */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Types de notifications</h4>
          </div>
          
          <div className="grid gap-3">
            {typeConfig.map(({ key, icon: Icon, label, description, recommended }) => (
              <div 
                key={key}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  notifications[key] ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    notifications[key] ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${notifications[key] ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {label}
                      {recommended && <Badge variant="secondary" className="text-xs">Important</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                  </div>
                </div>
                <Switch 
                  checked={notifications[key]} 
                  onCheckedChange={() => toggleNotification(key)} 
                />
              </div>
            ))}
          </div>
        </div>

        <Button onClick={onSave} className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder les Préférences
        </Button>
      </CardContent>
    </Card>
  );
}
