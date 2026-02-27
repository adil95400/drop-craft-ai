/**
 * ChannelHeader - Channable-style header
 * Clean breadcrumb, status indicators, action bar
 */
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, RefreshCw, ExternalLink, CheckCircle2, AlertCircle, 
  Loader2, Store, MoreHorizontal, Settings, Trash2,
  Copy, Download, ChevronRight, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
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

const platformColors: Record<string, string> = {
  shopify: 'bg-[#96bf48]',
  woocommerce: 'bg-[#9b5c8f]',
  prestashop: 'bg-[#df0067]',
  amazon: 'bg-[#ff9900]',
  ebay: 'bg-[#e53238]',
  etsy: 'bg-[#f56400]',
  default: 'bg-primary',
}

export function ChannelHeader({ channel, webhooksConnected, isSyncing, onBack, onSync }: ChannelHeaderProps) {
  const platform = channel.platform?.toLowerCase() || 'default'
  const bgColor = platformColors[platform] || platformColors.default

  const statusMap: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    connected: {
      label: 'Connecté',
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2
    },
    connecting: {
      label: 'Connexion...',
      className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
      icon: Loader2
    },
    error: {
      label: 'Erreur',
      className: 'bg-destructive/10 text-destructive border-destructive/30',
      icon: AlertCircle
    },
    disconnected: {
      label: 'Déconnecté',
      className: 'bg-muted text-muted-foreground border-border',
      icon: AlertCircle
    }
  }

  const status = statusMap[channel.connection_status || 'disconnected'] || statusMap.disconnected
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
        <button 
          onClick={onBack}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Boutiques & Canaux
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate">
          {channel.platform_name || 'Canal'}
        </span>
      </nav>

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left: Platform identity */}
        <div className="flex items-start gap-3.5">
          <div className={cn(
            "w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0",
            bgColor
          )}>
            <Store className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                {channel.platform_name || 'Canal'}
              </h1>
              <Badge variant="outline" className={cn("gap-1 text-xs font-medium", status.className)}>
                <StatusIcon className={cn("h-3 w-3", channel.connection_status === 'connecting' && "animate-spin")} />
                {status.label}
              </Badge>
              {webhooksConnected && (
                <Badge variant="outline" className="gap-1 text-xs text-primary border-primary/30">
                  <Zap className="h-3 w-3" />
                  Live
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {channel.store_url || 'URL non configurée'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="gap-2 h-8 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
            {isSyncing ? 'Sync...' : 'Synchroniser'}
          </Button>

          {channel.store_url && (
            <Button variant="outline" size="sm" asChild className="gap-2 h-8 text-xs">
              <a
                href={channel.store_url.startsWith('http') ? channel.store_url : `https://${channel.store_url}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Boutique
              </a>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2 text-sm">
                <Copy className="h-3.5 w-3.5" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-sm">
                <Download className="h-3.5 w-3.5" />
                Exporter config
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-sm">
                <Settings className="h-3.5 w-3.5" />
                Paramètres avancés
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-sm text-destructive focus:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  )
}
