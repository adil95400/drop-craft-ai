import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, Clock, Settings } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface AutoSyncManagerProps {
  connectionId: string
  platform: string
  currentSettings?: {
    enabled: boolean
    frequency: string
    syncTypes: string[]
  }
}

export function AutoSyncManager({ 
  connectionId, 
  platform,
  currentSettings 
}: AutoSyncManagerProps) {
  const [enabled, setEnabled] = useState(currentSettings?.enabled || false)
  const [frequency, setFrequency] = useState(currentSettings?.frequency || 'hourly')
  const [syncProducts, setSyncProducts] = useState(currentSettings?.syncTypes?.includes('products') ?? true)
  const [syncOrders, setSyncOrders] = useState(currentSettings?.syncTypes?.includes('orders') ?? true)
  const [syncInventory, setSyncInventory] = useState(currentSettings?.syncTypes?.includes('inventory') ?? true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Load current settings from store_integrations
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from('store_integrations')
        .select('sync_frequency, sync_settings, is_active')
        .eq('id', connectionId)
        .single()

      if (data) {
        setEnabled(data.is_active || false)
        setFrequency(data.sync_frequency || 'hourly')
        const settings = data.sync_settings as any
        if (settings) {
          setSyncProducts(settings.import_products ?? true)
          setSyncOrders(settings.track_orders ?? true)
          setSyncInventory(settings.sync_inventory ?? true)
        }
      }
    }
    loadSettings()
  }, [connectionId])

  const handleSave = async () => {
    setSaving(true)

    try {
      const syncSettings = {
        import_products: syncProducts,
        track_orders: syncOrders,
        sync_inventory: syncInventory,
        auto_sync: enabled
      }

      const { error } = await supabase
        .from('store_integrations')
        .update({
          is_active: enabled,
          sync_frequency: frequency,
          sync_settings: syncSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)

      if (error) throw error

      toast({
        title: 'Paramètres sauvegardés',
        description: 'La synchronisation automatique a été configurée',
      })
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <RefreshCw className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Synchronisation automatique</h3>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="auto-sync">Activer la synchronisation auto</Label>
          </div>
          <Switch
            id="auto-sync"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Fréquence de synchronisation
              </Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15min">Toutes les 15 minutes</SelectItem>
                  <SelectItem value="hourly">Toutes les heures</SelectItem>
                  <SelectItem value="daily">Quotidienne</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Types de données à synchroniser</Label>
              
              <div className="flex items-center gap-3">
                <Switch
                  id="sync-products"
                  checked={syncProducts}
                  onCheckedChange={setSyncProducts}
                />
                <Label htmlFor="sync-products">Produits</Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="sync-inventory"
                  checked={syncInventory}
                  onCheckedChange={setSyncInventory}
                />
                <Label htmlFor="sync-inventory">Stock & Prix</Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="sync-orders"
                  checked={syncOrders}
                  onCheckedChange={setSyncOrders}
                />
                <Label htmlFor="sync-orders">Commandes</Label>
              </div>
            </div>
          </>
        )}

        <Button 
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </Button>
      </div>
    </Card>
  )
}
