/**
 * ChannelHeader - Shopify Admin Style Header
 * Clean, professional design inspired by Shopify's admin dashboard
 */
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, RefreshCw, ExternalLink, CheckCircle2, AlertCircle, 
  Loader2, Wifi, Store, Globe, MoreHorizontal, Settings, Trash2,
  Copy, Download, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChannelHeaderProps {
  channel: {
    platform_name?: string | null
    platform?: string | null
    store_url?: string | null
    connection_status?: string | null
  }
  webhooksConnected?: boolean
  isSyncing?: boolean
  onBack: () => void
  onSync: () => void
}

const platformLogos: Record<string, { bg: string; text: string }> = {
  shopify: { bg: 'bg-[#96bf48]', text: 'text-white' },
  woocommerce: { bg: 'bg-[#9b5c8f]', text: 'text-white' },
  prestashop: { bg: 'bg-[#df0067]', text: 'text-white' },
  amazon: { bg: 'bg-[#ff9900]', text: 'text-white' },
  ebay: { bg: 'bg-[#e53238]', text: 'text-white' },
  etsy: { bg: 'bg-[#f56400]', text: 'text-white' },
  default: { bg: 'bg-primary', text: 'text-primary-foreground' },
}

export function ChannelHeader({ channel, webhooksConnected, isSyncing, onBack, onSync }: ChannelHeaderProps) {
  const { t } = useTranslation('channels')
  const platform = channel.platform?.toLowerCase() || 'default'
  const logo = platformLogos[platform] || platformLogos.default

  const getStatusConfig = () => {
    switch (channel.connection_status) {
      case 'connected':
        return { label: 'Connecté', variant: 'success' as const, icon: CheckCircle2 }
      case 'connecting':
        return { label: 'Connexion...', variant: 'warning' as const, icon: Loader2 }
      case 'error':
        return { label: 'Erreur', variant: 'destructive' as const, icon: AlertCircle }
      default:
        return { label: 'Déconnecté', variant: 'outline' as const, icon: AlertCircle }
    }
  }

  const status = getStatusConfig()
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <button 
          onClick={onBack}
          className="hover:text-foreground transition-colors"
        >
          Boutiques & Canaux
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">
          {channel.platform_name || 'Canal'}
        </span>
      </div>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Platform info */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm",
            logo.bg, logo.text
          )}>
            {platform === 'shopify' ? (
              <Store className="h-6 w-6" />
            ) : (
              channel.platform_name?.charAt(0).toUpperCase() || 'S'
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">
                {channel.platform_name || 'Canal'}
              </h1>
              <Badge
                className={cn(
                  "gap-1 text-xs font-medium px-2.5 py-0.5",
                  channel.connection_status === 'connected' && "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-500/30",
                  channel.connection_status === 'connecting' && "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
                  channel.connection_status === 'error' && "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
                  !channel.connection_status || channel.connection_status === 'disconnected' && "bg-muted text-muted-foreground"
                )}
              >
                <StatusIcon className={cn("h-3 w-3", channel.connection_status === 'connecting' && "animate-spin")} />
                {status.label}
              </Badge>
              {webhooksConnected && (
                <Badge variant="outline" className="gap-1 text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                  </span>
                  Temps réel
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {channel.store_url || 'URL non configurée'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="gap-2 h-9"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
            {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
          </Button>

          {channel.store_url && (
            <Button variant="outline" size="sm" asChild className="gap-2 h-9">
              <a
                href={channel.store_url.startsWith('http') ? channel.store_url : `https://${channel.store_url}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ouvrir la boutique
              </a>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2">
                <Copy className="h-4 w-4" />
                Dupliquer le canal
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Download className="h-4 w-4" />
                Exporter la config
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Settings className="h-4 w-4" />
                Paramètres avancés
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" />
                Déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  )
}
