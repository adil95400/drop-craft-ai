/**
 * Smart Alerts Panel - Alertes intelligentes et proactives
 * Système de notification avancé pour le Dashboard
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  Zap,
  Settings,
  Filter,
  Volume2,
  VolumeX,
  ChevronRight,
  ArrowRight,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface SmartAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'stock' | 'orders' | 'revenue' | 'customers' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actionLabel?: string;
  data?: any;
}

const mockAlerts: SmartAlert[] = [
  {
    id: '1',
    type: 'critical',
    category: 'stock',
    title: 'Rupture de stock imminente',
    message: 'iPhone 15 Case - Stock critique (12 unités). Rupture prévue dans 3 jours.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    actionable: true,
    actionLabel: 'Commander maintenant'
  },
  {
    id: '2',
    type: 'warning',
    category: 'revenue',
    title: 'Marge en baisse',
    message: 'La marge sur "USB-C Cable 2m" est passée sous 15% suite au changement de prix fournisseur.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    actionable: true,
    actionLabel: 'Ajuster le prix'
  },
  {
    id: '3',
    type: 'info',
    category: 'orders',
    title: 'Pic de commandes détecté',
    message: '+45% de commandes par rapport à la moyenne. Vérifiez la capacité de traitement.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true,
    actionable: false
  },
  {
    id: '4',
    type: 'success',
    category: 'customers',
    title: 'Objectif atteint',
    message: 'Félicitations! Vous avez atteint votre objectif mensuel de nouveaux clients (+100).',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true,
    actionable: false
  },
  {
    id: '5',
    type: 'warning',
    category: 'customers',
    title: 'Clients VIP inactifs',
    message: '8 clients VIP n\'ont pas commandé depuis 45 jours. Risque de churn détecté.',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    read: false,
    actionable: true,
    actionLabel: 'Voir les clients'
  },
  {
    id: '6',
    type: 'critical',
    category: 'system',
    title: 'Échec de synchronisation',
    message: 'La synchronisation avec CJDropshipping a échoué. Dernière sync: il y a 6h.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: false,
    actionable: true,
    actionLabel: 'Relancer la sync'
  }
];

export function SmartAlertsPanel() {
  const [alerts, setAlerts] = useState<SmartAlert[]>(mockAlerts);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const filteredAlerts = useMemo(() => {
    switch (filter) {
      case 'unread': return alerts.filter(a => !a.read);
      case 'critical': return alerts.filter(a => a.type === 'critical');
      default: return alerts;
    }
  }, [alerts, filter]);

  const unreadCount = alerts.filter(a => !a.read).length;
  const criticalCount = alerts.filter(a => a.type === 'critical' && !a.read).length;

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    toast.success('Toutes les alertes marquées comme lues');
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleAction = (alert: SmartAlert) => {
    markAsRead(alert.id);
    toast.success(`Action: ${alert.actionLabel}`);
  };

  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'warning': return Clock;
      case 'success': return CheckCircle2;
      case 'info': return Bell;
    }
  };

  const getAlertColor = (type: SmartAlert['type']) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800';
      case 'success': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800';
    }
  };

  const getCategoryIcon = (category: SmartAlert['category']) => {
    switch (category) {
      case 'stock': return Package;
      case 'orders': return Zap;
      case 'revenue': return DollarSign;
      case 'customers': return Users;
      case 'system': return Settings;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-500/10 relative">
                <Bell className="h-5 w-5 text-red-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span>Alertes Intelligentes</span>
            </CardTitle>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalCount} critique{criticalCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {unreadCount} alerte{unreadCount !== 1 ? 's' : ''} non lue{unreadCount !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Tabs */}
        <div className="flex items-center justify-between">
          <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs h-7 px-3">
                Toutes ({alerts.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs h-7 px-3">
                Non lues ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="critical" className="text-xs h-7 px-3">
                Critiques
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllAsRead}>
              <Eye className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        {/* Alerts List */}
        <ScrollArea className="h-[400px]">
          <AnimatePresence mode="popLayout">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune alerte à afficher</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert, index) => {
                  const Icon = getAlertIcon(alert.type);
                  const CategoryIcon = getCategoryIcon(alert.category);
                  const colorClass = getAlertColor(alert.type);

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        colorClass,
                        !alert.read && "ring-1 ring-offset-1 ring-current"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{alert.title}</h4>
                            {!alert.read && (
                              <span className="w-2 h-2 rounded-full bg-current" />
                            )}
                          </div>
                          <p className="text-sm opacity-90 mb-2">{alert.message}</p>
                          
                          <div className="flex items-center gap-3 text-xs opacity-70">
                            <span className="flex items-center gap-1">
                              <CategoryIcon className="h-3 w-3" />
                              {alert.category}
                            </span>
                            <span>
                              {formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: fr })}
                            </span>
                          </div>

                          {alert.actionable && (
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="secondary"
                                className="h-7 text-xs"
                                onClick={() => handleAction(alert)}
                              >
                                {alert.actionLabel}
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => markAsRead(alert.id)}
                              >
                                Ignorer
                              </Button>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-50 hover:opacity-100"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t pt-4 space-y-3"
            >
              <h4 className="text-sm font-medium">Paramètres des alertes</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound" className="text-sm">Notifications sonores</Label>
                  <Switch
                    id="sound"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="critical" className="text-sm">Alertes critiques uniquement</Label>
                  <Switch id="critical" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push" className="text-sm">Notifications push</Label>
                  <Switch id="push" defaultChecked />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
