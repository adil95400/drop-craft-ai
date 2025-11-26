import { useState } from "react";
import { Bell, X, Check, ExternalLink, AlertTriangle, Info, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  notification_type: string;
  priority: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
  data?: any;
}

export function SupplierNotifications() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Charger les notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['supplier-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_notifications')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as Notification[];
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30s
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Marquer comme lue
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('supplier_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-notifications'] });
    },
  });

  // Marquer toutes comme lues
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('supplier_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-notifications'] });
      toast({
        title: "Notifications marquées comme lues",
      });
    },
  });

  // Archiver
  const archiveMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('supplier_notifications')
        .update({ is_archived: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-notifications'] });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'stock_alert':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'price_change':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'sync_error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'sync_completed':
      case 'import_completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'ai_recommendations':
        return <TrendingUp className="h-5 w-5 text-purple-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      case 'high':
        return <Badge variant="default" className="bg-orange-500">Élevée</Badge>;
      case 'medium':
        return <Badge variant="secondary">Moyenne</Badge>;
      default:
        return <Badge variant="outline">Faible</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            {unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Aucune nouvelle notification'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Chargement...</p>
              ) : notifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Aucune notification pour le moment
                    </p>
                  </CardContent>
                </Card>
              ) : (
                notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`${!notification.is_read ? 'border-primary' : ''} hover:shadow-md transition-shadow`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-1">
                          {getIcon(notification.notification_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className={`font-semibold text-sm ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            {getPriorityBadge(notification.priority)}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.created_at).toLocaleString('fr-FR')}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {notification.action_url && notification.action_label && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(notification.action_url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  {notification.action_label}
                                </Button>
                              )}
                              
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => archiveMutation.mutate(notification.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}