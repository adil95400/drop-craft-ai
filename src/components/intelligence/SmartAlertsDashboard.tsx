/**
 * P2-4: Dashboard des alertes intelligentes unifiées
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell, BellOff, AlertTriangle, CheckCircle2, X,
  DollarSign, Package, Truck, TrendingUp, Zap, Bug, Settings
} from 'lucide-react';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

const categoryIcons: Record<string, typeof Bell> = {
  price: DollarSign,
  stock: Package,
  supplier: Truck,
  performance: TrendingUp,
  opportunity: Zap,
  anomaly: Bug,
  system: Settings,
};

const severityColors: Record<string, string> = {
  critical: 'border-destructive bg-destructive/5',
  high: 'border-orange-500 bg-orange-500/5',
  medium: 'border-amber-500 bg-amber-500/5',
  low: 'border-muted',
  info: 'border-border',
};

const severityBadge: Record<string, string> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
  info: 'outline',
};

export function SmartAlertsDashboard() {
  const [showResolved, setShowResolved] = useState(false);
  const { alerts, stats, isLoading, markRead, resolveAlert, dismissAlert } = useSmartAlerts({ resolved: showResolved });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Non lues', value: stats.unread, icon: Bell, color: 'text-primary' },
          { title: 'Critiques', value: stats.critical, icon: AlertTriangle, color: 'text-destructive' },
          { title: 'Stock', value: stats.byCategory.stock, icon: Package, color: 'text-amber-500' },
          { title: 'Opportunités', value: stats.byCategory.opportunity, icon: Zap, color: 'text-primary' },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.title}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" className="gap-1" onClick={() => setShowResolved(false)}>
            <Bell className="h-4 w-4" /> Actives ({stats.total - stats.unread + stats.unread})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-1" onClick={() => setShowResolved(true)}>
            <CheckCircle2 className="h-4 w-4" /> Résolues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {isLoading ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Chargement...</CardContent></Card>
          ) : alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Aucune alerte active</h3>
                <p className="text-muted-foreground">Tout fonctionne normalement</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert, idx) => {
              const CategoryIcon = categoryIcons[alert.alert_category] || Bell;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <Card className={`border-l-4 ${severityColors[alert.severity]} ${!alert.is_read ? 'ring-1 ring-primary/20' : ''}`}>
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3" onClick={() => !alert.is_read && markRead(alert.id)}>
                          <CategoryIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-sm font-medium ${!alert.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {alert.title}
                              </h4>
                              <Badge variant={severityBadge[alert.severity] as any} className="text-xs">
                                {alert.severity}
                              </Badge>
                              <Badge variant="outline" className="text-xs">P{alert.priority_score}</Badge>
                            </div>
                            {alert.message && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{alert.alert_category}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: fr })}</span>
                              {alert.source && <><span>•</span><span>{alert.source}</span></>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => resolveAlert(alert.id)}>
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => dismissAlert(alert.id)}>
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-3 mt-4">
          {alerts.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Aucune alerte résolue</CardContent></Card>
          ) : (
            alerts.map((alert) => {
              const CategoryIcon = categoryIcons[alert.alert_category] || Bell;
              return (
                <Card key={alert.id} className="opacity-60">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm line-through">{alert.title}</span>
                      <Badge variant="outline" className="text-xs">Résolu</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
