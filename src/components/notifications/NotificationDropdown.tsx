import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Package, AlertCircle, TrendingUp, Users } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "order",
    title: "Nouvelle commande #12543",
    message: "Commande de 149.99€ de Marie Dubois",
    time: "Il y a 5 min",
    unread: true,
    icon: Package,
  },
  {
    id: 2,
    type: "alert",
    title: "Stock faible",
    message: "iPhone 15 Pro - Seulement 3 unités restantes",
    time: "Il y a 1h",
    unread: true,
    icon: AlertCircle,
  },
  {
    id: 3,
    type: "performance",
    title: "Pic de ventes",
    message: "Ventes du jour: +24% par rapport à hier",
    time: "Il y a 2h",
    unread: true,
    icon: TrendingUp,
  },
  {
    id: 4,
    type: "user",
    title: "Nouvel utilisateur",
    message: "Jean Martin s'est inscrit",
    time: "Il y a 3h",
    unread: false,
    icon: Users,
  },
];

export function NotificationDropdown() {
  const [notificationList, setNotificationList] = useState(notifications);
  const unreadCount = notificationList.filter(n => n.unread).length;

  const markAsRead = (id: number) => {
    setNotificationList(prev => 
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );
  };

  const markAllAsRead = () => {
    setNotificationList(prev => 
      prev.map(n => ({ ...n, unread: false }))
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={markAllAsRead}
            >
              Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[300px]">
          {notificationList.map((notification) => {
            const IconComponent = notification.icon;
            return (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  notification.unread ? 'bg-muted/50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className={`p-2 rounded-full ${
                  notification.type === 'order' ? 'bg-green-100 text-green-600' :
                  notification.type === 'alert' ? 'bg-red-100 text-red-600' :
                  notification.type === 'performance' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.time}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="text-center cursor-pointer">
          <Button variant="ghost" size="sm" className="w-full">
            Voir toutes les notifications
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}