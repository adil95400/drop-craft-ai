/**
 * ChannelHeader - En-tête premium pour page de détail canal
 */
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Loader2, Wifi, Store, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

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
  shopify: 'from-[#96bf48] to-[#5e8e3e]',
  woocommerce: 'from-[#9b5c8f] to-[#6e3f68]',
  prestashop: 'from-[#df0067] to-[#a10049]',
  amazon: 'from-[#ff9900] to-[#c77a00]',
  ebay: 'from-[#e53238] to-[#b1262c]',
  etsy: 'from-[#f56400] to-[#c75100]',
  default: 'from-primary to-primary/60'
}

const platformIcons: Record<string, React.ReactNode> = {
  shopify: <Store className="h-6 w-6" />,
  default: <Globe className="h-6 w-6" />
}

export function ChannelHeader({ channel, webhooksConnected, isSyncing, onBack, onSync }: ChannelHeaderProps) {
  const { t } = useTranslation('channels')
  const platform = channel.platform?.toLowerCase() || 'default'
  const gradient = platformColors[platform] || platformColors.default
  
  const getStatusBadge = () => {
    switch (channel.connection_status) {
      case 'connected':
        return (
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 gap-1.5 px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t('header.connected')}
          </Badge>
        )
      case 'connecting':
        return (
          <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1.5 px-3 py-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('header.connecting')}
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1.5 px-3 py-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {t('header.error')}
          </Badge>
        )
      default:
        return <Badge variant="outline" className="px-3 py-1">{t('header.disconnected')}</Badge>
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/50 shadow-lg"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className={cn("absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br blur-3xl", gradient)} />
        <div className={cn("absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-gradient-to-br blur-2xl", gradient)} />
      </div>
      
      <div className="relative p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Back + Platform Info */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="h-10 w-10 rounded-xl hover:bg-background/80 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg bg-gradient-to-br shrink-0",
              gradient
            )}>
              {channel.platform_name?.charAt(0).toUpperCase() || 'S'}
            </div>
            
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight truncate">
                  {channel.platform_name || t('header.channel')}
                </h1>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                {channel.store_url || t('header.urlNotConfigured')}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {webhooksConnected && (
              <Badge variant="outline" className="gap-1.5 text-green-600 border-green-500/30 bg-green-500/10 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {t('header.realtime')}
              </Badge>
            )}
            
            <Button 
              variant="outline" 
              onClick={onSync}
              disabled={isSyncing}
              className="gap-2 h-10 px-4 rounded-xl border-border/50 hover:bg-background/80"
            >
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              {t('header.sync')}
            </Button>
            
            {channel.store_url && (
              <Button 
                variant="outline" 
                asChild
                className="gap-2 h-10 px-4 rounded-xl border-border/50 hover:bg-background/80"
              >
                <a 
                  href={channel.store_url.startsWith('http') ? channel.store_url : `https://${channel.store_url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('header.open')}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
