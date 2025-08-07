import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/layouts/AppLayout";
import { Bell, Check, Info, AlertTriangle, Package } from "lucide-react";

const Notifications = () => {
  const notifications = [
    {
      id: 1,
      type: "order",
      title: "Nouvelle commande #1234",
      message: "Une nouvelle commande de 89€ a été reçue",
      time: "Il y a 5 min",
      read: false,
      icon: Package,
      color: "text-green-600"
    },
    {
      id: 2,
      type: "warning",
      title: "Stock faible",
      message: "3 produits ont un stock inférieur à 5 unités",
      time: "Il y a 1h",
      read: false,
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      id: 3,
      type: "info",
      title: "Synchronisation terminée",
      message: "Import de 24 nouveaux produits depuis Shopify",
      time: "Il y a 2h",
      read: true,
      icon: Info,
      color: "text-blue-600"
    }
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Restez informé de l'activité de votre boutique
            </p>
          </div>
          <Button variant="outline">
            <Check className="h-4 w-4 mr-2" />
            Marquer tout lu
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications récentes
            </CardTitle>
            <CardDescription>
              Toutes vos notifications importantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all hover:shadow-card ${
                  notification.read ? 'bg-muted/30' : 'bg-card border-primary/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${notification.color}`}>
                    <notification.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm">{notification.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                        {!notification.read && (
                          <Badge variant="default" className="h-2 w-2 p-0 bg-primary" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Notifications;