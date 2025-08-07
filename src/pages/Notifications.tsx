import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/layouts/AppLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  Bell, 
  Search, 
  Settings,
  Trash2,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  MessageSquare,
  Smartphone
} from "lucide-react";

const Notifications = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll 
  } = useNotifications();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notif.read) ||
                         (filter === 'read' && notif.read);
    return matchesSearch && matchesFilter;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Centre de notifications et alertes
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Tout marquer lu
            </Button>
            <Button variant="outline" onClick={clearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Tout effacer
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border bg-card shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
                <Bell className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-card shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Non lues</p>
                  <p className="text-2xl font-bold text-orange-500">{unreadCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lues</p>
                  <p className="text-2xl font-bold text-green-500">{notifications.length - unreadCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            {/* Filters */}
            <Card className="border-border bg-card shadow-card">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant={filter === 'all' ? 'default' : 'outline'} 
                      onClick={() => setFilter('all')}
                      size="sm"
                    >
                      Toutes
                    </Button>
                    <Button 
                      variant={filter === 'unread' ? 'default' : 'outline'} 
                      onClick={() => setFilter('unread')}
                      size="sm"
                    >
                      Non lues
                    </Button>
                    <Button 
                      variant={filter === 'read' ? 'default' : 'outline'} 
                      onClick={() => setFilter('read')}
                      size="sm"
                    >
                      Lues
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`border-border shadow-card hover:shadow-glow transition-all duration-300 cursor-pointer ${
                    !notification.read ? 'bg-primary/5 border-primary/20' : 'bg-card'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{notification.title}</h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(notification.timestamp).toLocaleString()}
                            </div>
                            <Badge variant={
                              notification.type === 'success' ? 'default' :
                              notification.type === 'warning' ? 'secondary' :
                              notification.type === 'error' ? 'destructive' : 'outline'
                            }>
                              {notification.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {notification.action && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.action?.onClick();
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredNotifications.length === 0 && (
                <Card className="border-border bg-card shadow-card">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Aucune notification</h3>
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Aucun résultat pour votre recherche' : 'Vous êtes à jour !'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres de Notifications
                </CardTitle>
                <CardDescription>
                  Configurez vos préférences de notification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Notifications Push</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Nouvelles commandes</Label>
                          <p className="text-sm text-muted-foreground">Recevoir une notification pour chaque nouvelle commande</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Stock faible</Label>
                          <p className="text-sm text-muted-foreground">Alerte quand un produit atteint le seuil critique</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Synchronisations</Label>
                          <p className="text-sm text-muted-foreground">Confirmation des syncs avec les marketplaces</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Notifications Email</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Résumé quotidien</Label>
                          <p className="text-sm text-muted-foreground">Rapport journalier des performances</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Alertes critiques</Label>
                          <p className="text-sm text-muted-foreground">Problèmes nécessitant une attention immédiate</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Notifications SMS</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Urgences uniquement</Label>
                          <p className="text-sm text-muted-foreground">SMS pour les situations critiques</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Notifications;