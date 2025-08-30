import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface NotificationSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface NotificationSetting {
  id: string
  title: string
  description: string
  icon: React.ElementType
  category: string
  channels: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

export const NotificationSettingsDialog = ({ isOpen, onClose }: NotificationSettingsDialogProps) => {
  const { toast } = useToast()
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'new_order',
      title: 'Nouvelles commandes',
      description: 'Notification lors de chaque nouvelle commande',
      icon: ShoppingCart,
      category: 'Ventes',
      channels: { email: true, push: true, sms: false }
    },
    {
      id: 'low_stock',
      title: 'Stock faible',
      description: 'Alerte quand un produit atteint le stock minimum',
      icon: Package,
      category: 'Inventaire',
      channels: { email: true, push: true, sms: true }
    },
    {
      id: 'sales_milestone',
      title: 'Objectifs de vente',
      description: 'Notification lors d\'atteinte d\'objectifs',
      icon: TrendingUp,
      category: 'Performance',
      channels: { email: true, push: false, sms: false }
    },
    {
      id: 'new_customer',
      title: 'Nouveaux clients',
      description: 'Notification d\'inscription de nouveaux clients',
      icon: Users,
      category: 'Clients',
      channels: { email: false, push: true, sms: false }
    },
    {
      id: 'system_alerts',
      title: 'Alertes système',
      description: 'Erreurs et problèmes techniques',
      icon: AlertTriangle,
      category: 'Système',
      channels: { email: true, push: true, sms: true }
    }
  ])

  const updateNotificationChannel = (settingId: string, channel: 'email' | 'push' | 'sms', enabled: boolean) => {
    setSettings(prev => prev.map(setting => 
      setting.id === settingId 
        ? { ...setting, channels: { ...setting.channels, [channel]: enabled } }
        : setting
    ))
  }

  const handleSave = async () => {
    try {
      // Here you would save to your backend/database
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences de notification ont été mises à jour",
      })
      
      onClose()
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      })
    }
  }

  const enableAllForCategory = (category: string, enabled: boolean) => {
    setSettings(prev => prev.map(setting => 
      setting.category === category
        ? { ...setting, channels: { email: enabled, push: enabled, sms: enabled } }
        : setting
    ))
  }

  const categories = [...new Set(settings.map(s => s.category))]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Paramètres de Notification
          </DialogTitle>
          <DialogDescription>
            Configurez vos préférences de notification par canal de communication
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-96">
          {/* Channel explanations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Canaux de communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-xs text-muted-foreground">Notifications par email</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">Push</div>
                    <div className="text-xs text-muted-foreground">Notifications web/app</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="font-medium">SMS</div>
                    <div className="text-xs text-muted-foreground">Messages texte urgents</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification settings by category */}
          {categories.map((category) => (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{category}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => enableAllForCategory(category, true)}
                    >
                      Tout activer
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => enableAllForCategory(category, false)}
                    >
                      Tout désactiver
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {settings
                    .filter(setting => setting.category === category)
                    .map((setting) => {
                      const IconComponent = setting.icon
                      return (
                        <div key={setting.id} className="space-y-3 p-4 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <IconComponent className="h-5 w-5 text-primary mt-1" />
                            <div className="flex-1">
                              <div className="font-medium">{setting.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {setting.description}
                              </div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`${setting.id}_email`} className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-600" />
                                Email
                              </Label>
                              <Switch
                                id={`${setting.id}_email`}
                                checked={setting.channels.email}
                                onCheckedChange={(checked) => 
                                  updateNotificationChannel(setting.id, 'email', checked)
                                }
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`${setting.id}_push`} className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-green-600" />
                                Push
                              </Label>
                              <Switch
                                id={`${setting.id}_push`}
                                checked={setting.channels.push}
                                onCheckedChange={(checked) => 
                                  updateNotificationChannel(setting.id, 'push', checked)
                                }
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`${setting.id}_sms`} className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-purple-600" />
                                SMS
                              </Label>
                              <Switch
                                id={`${setting.id}_sms`}
                                checked={setting.channels.sms}
                                onCheckedChange={(checked) => 
                                  updateNotificationChannel(setting.id, 'sms', checked)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Sauvegarder les paramètres
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}