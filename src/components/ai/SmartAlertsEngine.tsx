import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Bell, AlertTriangle, TrendingUp, TrendingDown, Package,
  DollarSign, Users, Zap, Settings, Plus, Trash2, Check,
  Clock, Mail, MessageSquare, Smartphone, Brain, Sparkles
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Alert {
  id: string
  type: 'stock' | 'price' | 'trend' | 'competitor' | 'performance' | 'ai'
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: string
  isRead: boolean
  metadata?: {
    productId?: string
    productName?: string
    currentValue?: number
    threshold?: number
    change?: number
  }
}

interface AlertRule {
  id: string
  name: string
  type: 'stock' | 'price' | 'trend' | 'competitor' | 'performance'
  condition: string
  threshold: number
  isActive: boolean
  channels: ('email' | 'sms' | 'push' | 'app')[]
  frequency: 'instant' | 'hourly' | 'daily'
  lastTriggered?: string
  triggerCount: number
}

export function SmartAlertsEngine() {
  const { toast } = useToast()
  
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'stock',
      title: 'Stock critique',
      message: 'Le produit "Coque iPhone 15 Pro" n\'a plus que 5 unités en stock',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      isRead: false,
      metadata: {
        productId: 'prod_001',
        productName: 'Coque iPhone 15 Pro',
        currentValue: 5,
        threshold: 10
      }
    },
    {
      id: '2',
      type: 'price',
      title: 'Opportunité de prix',
      message: 'Les concurrents ont augmenté leurs prix de 15% sur "Écouteurs Bluetooth"',
      severity: 'info',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      metadata: {
        productId: 'prod_002',
        productName: 'Écouteurs Bluetooth',
        change: 15
      }
    },
    {
      id: '3',
      type: 'trend',
      title: 'Tendance détectée',
      message: 'Le produit "Chargeur USB-C" montre une forte augmentation de la demande (+45%)',
      severity: 'info',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isRead: true,
      metadata: {
        productId: 'prod_003',
        productName: 'Chargeur USB-C',
        change: 45
      }
    },
    {
      id: '4',
      type: 'ai',
      title: 'Recommandation IA',
      message: 'L\'IA suggère d\'augmenter le prix de 3 produits pour optimiser les marges',
      severity: 'info',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      isRead: true
    },
    {
      id: '5',
      type: 'performance',
      title: 'Baisse de conversion',
      message: 'Le taux de conversion a chuté de 23% sur les 24 dernières heures',
      severity: 'warning',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      isRead: false,
      metadata: {
        change: -23
      }
    }
  ])

  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: 'rule_1',
      name: 'Alerte stock bas',
      type: 'stock',
      condition: 'stock_quantity',
      threshold: 10,
      isActive: true,
      channels: ['email', 'app'],
      frequency: 'instant',
      triggerCount: 12
    },
    {
      id: 'rule_2',
      name: 'Variation prix concurrents',
      type: 'competitor',
      condition: 'price_change',
      threshold: 10,
      isActive: true,
      channels: ['email', 'push'],
      frequency: 'hourly',
      triggerCount: 5
    },
    {
      id: 'rule_3',
      name: 'Tendance produit',
      type: 'trend',
      condition: 'demand_increase',
      threshold: 20,
      isActive: true,
      channels: ['app'],
      frequency: 'daily',
      triggerCount: 8
    },
    {
      id: 'rule_4',
      name: 'Baisse performance',
      type: 'performance',
      condition: 'conversion_drop',
      threshold: 15,
      isActive: false,
      channels: ['email', 'sms'],
      frequency: 'instant',
      triggerCount: 2
    }
  ])

  const [showNewRule, setShowNewRule] = useState(false)
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'stock' as const,
    threshold: 10,
    channels: ['app'] as ('email' | 'sms' | 'push' | 'app')[],
    frequency: 'instant' as const
  })

  const markAsRead = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ))
  }

  const markAllAsRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, isRead: true })))
    toast({
      title: "Toutes les alertes marquées comme lues"
    })
  }

  const deleteAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId))
  }

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ))
  }

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId))
    toast({
      title: "Règle supprimée"
    })
  }

  const createRule = () => {
    const rule: AlertRule = {
      id: `rule_${Date.now()}`,
      name: newRule.name,
      type: newRule.type,
      condition: `${newRule.type}_condition`,
      threshold: newRule.threshold,
      isActive: true,
      channels: newRule.channels,
      frequency: newRule.frequency,
      triggerCount: 0
    }
    setRules([...rules, rule])
    setShowNewRule(false)
    setNewRule({
      name: '',
      type: 'stock',
      threshold: 10,
      channels: ['app'],
      frequency: 'instant'
    })
    toast({
      title: "Règle créée",
      description: "La nouvelle règle d'alerte a été activée"
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock': return Package
      case 'price': return DollarSign
      case 'trend': return TrendingUp
      case 'competitor': return Users
      case 'performance': return TrendingDown
      case 'ai': return Brain
      default: return Bell
    }
  }

  const unreadCount = alerts.filter(a => !a.isRead).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Alertes Intelligentes
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            Notifications proactives sur stocks, prix et tendances
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {alerts.filter(a => a.severity === 'critical').length}
                </div>
                <div className="text-sm text-muted-foreground">Critiques</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bell className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {alerts.filter(a => a.severity === 'warning').length}
                </div>
                <div className="text-sm text-muted-foreground">Avertissements</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {alerts.filter(a => a.type === 'ai').length}
                </div>
                <div className="text-sm text-muted-foreground">Suggestions IA</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {rules.filter(r => r.isActive).length}
                </div>
                <div className="text-sm text-muted-foreground">Règles actives</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts" className="relative">
            Alertes
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">Règles</TabsTrigger>
          <TabsTrigger value="channels">Canaux</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Alertes récentes</span>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="critical">Critiques</SelectItem>
                    <SelectItem value="warning">Avertissements</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="unread">Non lues</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const TypeIcon = getTypeIcon(alert.type)
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        !alert.isRead ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{alert.title}</span>
                            {!alert.isRead && (
                              <Badge variant="secondary" className="text-xs">Nouveau</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                          
                          {alert.metadata && (
                            <div className="flex flex-wrap gap-2 text-xs">
                              {alert.metadata.productName && (
                                <Badge variant="outline">{alert.metadata.productName}</Badge>
                              )}
                              {alert.metadata.currentValue !== undefined && (
                                <Badge variant="outline">
                                  Actuel: {alert.metadata.currentValue}
                                </Badge>
                              )}
                              {alert.metadata.change !== undefined && (
                                <Badge variant={alert.metadata.change > 0 ? 'default' : 'destructive'}>
                                  {alert.metadata.change > 0 ? '+' : ''}{alert.metadata.change}%
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.timestamp).toLocaleString('fr-FR')}
                          </div>
                        </div>

                        <div className="flex gap-1">
                          {!alert.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(alert.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAlert(alert.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Règles d'alerte</span>
                <Button size="sm" onClick={() => setShowNewRule(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle règle
                </Button>
              </CardTitle>
              <CardDescription>
                Configurez les conditions de déclenchement des alertes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rules.map((rule) => {
                  const TypeIcon = getTypeIcon(rule.type)
                  return (
                    <div
                      key={rule.id}
                      className={`p-4 border rounded-lg ${rule.isActive ? 'bg-background' : 'bg-muted/30 opacity-60'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{rule.name}</span>
                          <Badge variant="outline">{rule.type}</Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Seuil: </span>
                          <span className="font-medium">{rule.threshold}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fréquence: </span>
                          <span className="font-medium capitalize">{rule.frequency}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Canaux: </span>
                          {rule.channels.includes('email') && <Mail className="h-3 w-3" />}
                          {rule.channels.includes('sms') && <MessageSquare className="h-3 w-3" />}
                          {rule.channels.includes('push') && <Smartphone className="h-3 w-3" />}
                          {rule.channels.includes('app') && <Bell className="h-3 w-3" />}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Déclenchements: </span>
                          <span className="font-medium">{rule.triggerCount}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* New Rule Form */}
              {showNewRule && (
                <div className="mt-4 p-4 border border-primary/20 bg-primary/5 rounded-lg space-y-4">
                  <h3 className="font-medium">Nouvelle règle d'alerte</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Nom de la règle</Label>
                      <Input
                        value={newRule.name}
                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                        placeholder="Ex: Alerte stock bas"
                      />
                    </div>
                    
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={newRule.type}
                        onValueChange={(value: any) => setNewRule({ ...newRule, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stock">Stock</SelectItem>
                          <SelectItem value="price">Prix</SelectItem>
                          <SelectItem value="trend">Tendance</SelectItem>
                          <SelectItem value="competitor">Concurrence</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Seuil</Label>
                      <Input
                        type="number"
                        value={newRule.threshold}
                        onChange={(e) => setNewRule({ ...newRule, threshold: Number(e.target.value) })}
                      />
                    </div>

                    <div>
                      <Label>Fréquence</Label>
                      <Select
                        value={newRule.frequency}
                        onValueChange={(value: any) => setNewRule({ ...newRule, frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">Instantané</SelectItem>
                          <SelectItem value="hourly">Horaire</SelectItem>
                          <SelectItem value="daily">Quotidien</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={createRule} disabled={!newRule.name}>
                      Créer la règle
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewRule(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Canaux de notification</CardTitle>
              <CardDescription>
                Configurez comment vous souhaitez recevoir les alertes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">Recevoir les alertes par email</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">SMS</div>
                    <div className="text-sm text-muted-foreground">Alertes critiques par SMS</div>
                  </div>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Notifications Push</div>
                    <div className="text-sm text-muted-foreground">Notifications sur mobile</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">In-App</div>
                    <div className="text-sm text-muted-foreground">Notifications dans l'application</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
