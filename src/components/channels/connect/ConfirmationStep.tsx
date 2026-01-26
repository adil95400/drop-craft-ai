/**
 * Confirmation Step - Channable Premium Design
 * Summary before finalizing connection
 */

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlatformLogo } from '@/components/ui/platform-logo'
import { Check, X, Shield, Sparkles, Store, RefreshCw, Package, ShoppingCart, Boxes } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlatformConfig } from './PlatformCard'

interface SyncSettings {
  auto_sync: boolean
  sync_products: boolean
  sync_orders: boolean
  sync_inventory: boolean
}

interface ConfirmationStepProps {
  platform: PlatformConfig
  settings: SyncSettings
  testDetails: { shopInfo?: any; error?: string } | null
}

const SETTING_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  auto_sync: RefreshCw,
  sync_products: Package,
  sync_orders: ShoppingCart,
  sync_inventory: Boxes,
}

const SETTING_LABELS: Record<string, string> = {
  auto_sync: 'Sync automatique',
  sync_products: 'Produits',
  sync_orders: 'Commandes',
  sync_inventory: 'Inventaire',
}

export function ConfirmationStep({ platform, settings, testDetails }: ConfirmationStepProps) {
  const enabledCount = Object.values(settings).filter(Boolean).length

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Confirmation Card */}
      <Card className="backdrop-blur-xl bg-card/80 border-border/50 overflow-hidden">
        {/* Platform Header with success gradient */}
        <div className="relative p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyek0zNiAyMnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          
          <div className="relative flex items-center gap-4">
            <motion.div 
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center p-3 ring-2 ring-primary/20">
                <PlatformLogo platform={platform.id} size="xl" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-lg"
              >
                <Check className="h-3 w-3" />
              </motion.div>
            </motion.div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{platform.name}</h3>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Prêt
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Vérifiez les détails avant de finaliser
              </p>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6 space-y-5">
          {/* Detected Shop Info */}
          {testDetails?.shopInfo && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-xl bg-muted/50 border flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Store className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Boutique détectée</p>
                <p className="font-semibold truncate">{testDetails.shopInfo.name}</p>
                {testDetails.shopInfo.domain && (
                  <p className="text-xs text-muted-foreground truncate">{testDetails.shopInfo.domain}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Settings Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">Configuration</h4>
              <Badge variant="secondary" className="text-xs">
                {enabledCount}/4 activés
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(settings).map(([key, value], index) => {
                const Icon = SETTING_ICONS[key] || RefreshCw
                const label = SETTING_LABELS[key] || key
                
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                      value 
                        ? "bg-emerald-500/5 border-emerald-500/20" 
                        : "bg-muted/30 border-transparent"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-md",
                      value ? "bg-emerald-500/20 text-emerald-600" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium flex-1">{label}</span>
                    {value ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400"
      >
        <Shield className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          Vos identifiants sont <strong>chiffrés</strong> et stockés de manière sécurisée. 
          Nous ne partageons jamais vos données.
        </p>
      </motion.div>
    </motion.div>
  )
}
