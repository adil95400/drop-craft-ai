import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Save, Key, Globe, Settings } from 'lucide-react'
import { Store } from '@/hooks/useStores'

interface StoreSettingsProps {
  store: Store
  onUpdate: () => void
}

export function StoreSettings({ store, onUpdate }: StoreSettingsProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [credentials, setCredentials] = useState({
    shop_domain: store.credentials?.shop_domain || '',
    access_token: store.credentials?.access_token || ''
  })
  const [settings, setSettings] = useState({
    auto_sync: store.settings?.auto_sync ?? true,
    sync_frequency: store.settings?.sync_frequency || 'hourly' as 'hourly' | 'daily' | 'weekly',
    sync_products: store.settings?.sync_products ?? true,
    sync_orders: store.settings?.sync_orders ?? true,
    sync_customers: store.settings?.sync_customers ?? true,
    price_sync: store.settings?.price_sync ?? true,
    stock_alerts: store.settings?.stock_alerts ?? true,
    webhook_enabled: store.settings?.webhook_enabled ?? false,
    notification_email: store.settings?.notification_email ?? true
  })

  const handleSaveCredentials = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('store_integrations')
        .update({
          credentials,
          store_url: credentials.shop_domain ? `https://${credentials.shop_domain}` : '',
          store_name: credentials.shop_domain || 'Boutique Shopify',
          connection_status: credentials.access_token ? 'connected' : 'disconnected'
        })
        .eq('id', store.id)

      if (error) throw error

      toast({
        title: "Credentials sauvegardés",
        description: "Les paramètres de connexion ont été mis à jour avec succès."
      })
      onUpdate()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la sauvegarde",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const { error } = await (supabase
        .from('store_integrations') as any)
        .update({
          settings: settings as any,
          sync_frequency: settings.sync_frequency
        })
        .eq('id', store.id)

      if (error) throw error

      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de synchronisation ont été mis à jour avec succès."
      })
      onUpdate()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la sauvegarde",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuration Shopify */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configuration Shopify
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shop_domain">Domaine de la boutique</Label>
              <Input
                id="shop_domain"
                placeholder="monshop.myshopify.com"
                value={credentials.shop_domain}
                onChange={(e) => setCredentials({...credentials, shop_domain: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">
                Votre domaine Shopify (sans https://)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_token">Token d'accès privé</Label>
              <Input
                id="access_token"
                type="password"
                placeholder="••••••••••••••••"
                value={credentials.access_token}
                onChange={(e) => setCredentials({...credentials, access_token: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">
                Votre token d'accès Shopify Admin API
              </p>
            </div>
          </div>
          <Button onClick={handleSaveCredentials} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder les credentials'}
          </Button>
        </CardContent>
      </Card>

      {/* Paramètres de synchronisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Paramètres de synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Synchronisation automatique */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Synchronisation automatique</Label>
              <p className="text-sm text-muted-foreground">
                Activer la synchronisation automatique périodique
              </p>
            </div>
            <Switch
              checked={settings.auto_sync}
              onCheckedChange={(checked) => setSettings({...settings, auto_sync: checked})}
            />
          </div>

          {/* Fréquence de synchronisation */}
          <div className="space-y-2">
            <Label>Fréquence de synchronisation</Label>
            <Select 
              value={settings.sync_frequency} 
              onValueChange={(value: 'hourly' | 'daily' | 'weekly') => setSettings({...settings, sync_frequency: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Chaque heure</SelectItem>
                <SelectItem value="daily">Quotidienne</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Options de synchronisation */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Éléments à synchroniser</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Synchroniser les produits</Label>
                <p className="text-sm text-muted-foreground">Importer et mettre à jour les produits</p>
              </div>
              <Switch
                checked={settings.sync_products}
                onCheckedChange={(checked) => setSettings({...settings, sync_products: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Synchroniser les commandes</Label>
                <p className="text-sm text-muted-foreground">Importer les nouvelles commandes</p>
              </div>
              <Switch
                checked={settings.sync_orders}
                onCheckedChange={(checked) => setSettings({...settings, sync_orders: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Synchroniser les clients</Label>
                <p className="text-sm text-muted-foreground">Importer les informations clients</p>
              </div>
              <Switch
                checked={settings.sync_customers}
                onCheckedChange={(checked) => setSettings({...settings, sync_customers: checked})}
              />
            </div>
          </div>

          <Separator />

          {/* Options avancées */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Options avancées</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Synchronisation des prix</Label>
                <p className="text-sm text-muted-foreground">Mettre à jour les prix automatiquement</p>
              </div>
              <Switch
                checked={settings.price_sync}
                onCheckedChange={(checked) => setSettings({...settings, price_sync: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Alertes de stock</Label>
                <p className="text-sm text-muted-foreground">Recevoir des alertes de stock faible</p>
              </div>
              <Switch
                checked={settings.stock_alerts}
                onCheckedChange={(checked) => setSettings({...settings, stock_alerts: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notifications par email</Label>
                <p className="text-sm text-muted-foreground">Recevoir des notifications par email</p>
              </div>
              <Switch
                checked={settings.notification_email}
                onCheckedChange={(checked) => setSettings({...settings, notification_email: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Webhooks</Label>
                <p className="text-sm text-muted-foreground">Activer les webhooks Shopify (avancé)</p>
              </div>
              <Switch
                checked={settings.webhook_enabled}
                onCheckedChange={(checked) => setSettings({...settings, webhook_enabled: checked})}
              />
            </div>
          </div>

          <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}