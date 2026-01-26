/**
 * Configuration Step - Channable Premium Design
 * Sync settings with visual toggle cards
 */

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Settings, RefreshCw, Package, ShoppingCart, Tag, Clock, Boxes } from 'lucide-react'
import { SettingToggle } from './SettingToggle'

interface SyncSettings {
  auto_sync: boolean
  sync_products: boolean
  sync_orders: boolean
  sync_inventory: boolean
}

interface ConfigurationStepProps {
  settings: SyncSettings
  setSettings: (fn: (prev: SyncSettings) => SyncSettings) => void
}

export function ConfigurationStep({ settings, setSettings }: ConfigurationStepProps) {
  const updateSetting = (key: keyof SyncSettings) => (checked: boolean) => {
    setSettings(prev => ({ ...prev, [key]: checked }))
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <Card className="backdrop-blur-xl bg-card/80 border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Paramètres de synchronisation</h3>
              <p className="text-sm text-muted-foreground">
                Configurez comment vos données seront synchronisées
              </p>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
          >
            <SettingToggle
              label="Synchronisation automatique"
              description="Synchroniser automatiquement toutes les 15 minutes"
              checked={settings.auto_sync}
              onCheckedChange={updateSetting('auto_sync')}
              icon={RefreshCw}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SettingToggle
              label="Synchroniser les produits"
              description="Importer et exporter les produits automatiquement"
              checked={settings.sync_products}
              onCheckedChange={updateSetting('sync_products')}
              icon={Package}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <SettingToggle
              label="Synchroniser les commandes"
              description="Recevoir les nouvelles commandes en temps réel"
              checked={settings.sync_orders}
              onCheckedChange={updateSetting('sync_orders')}
              icon={ShoppingCart}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SettingToggle
              label="Synchroniser l'inventaire"
              description="Mettre à jour les stocks en temps réel"
              checked={settings.sync_inventory}
              onCheckedChange={updateSetting('sync_inventory')}
              icon={Boxes}
            />
          </motion.div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400"
      >
        <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Synchronisation intelligente</p>
          <p className="opacity-80 mt-0.5">
            Les données seront synchronisées de manière incrémentale pour optimiser les performances.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
