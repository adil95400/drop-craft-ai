/**
 * ChannelConnectionInfo - Connection details card
 * Shows store domain, API version, connection date, credentials status
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Globe, Key, Calendar, Cpu, CheckCircle2, AlertCircle, 
  Copy, ExternalLink, Shield, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { toast } from 'sonner'

interface ChannelConnectionInfoProps {
  channel: {
    platform?: string | null
    platform_name?: string | null
    store_url?: string | null
    connection_status?: string | null
    config?: any
    created_at?: string | null
    updated_at?: string | null
    last_sync_at?: string | null
  }
}

export function ChannelConnectionInfo({ channel }: ChannelConnectionInfoProps) {
  const config = (channel.config as any) || {}
  const credentials = config?.credentials || {}
  const shopDomain = credentials.shop_domain || channel.store_url || '—'
  const hasAccessToken = !!credentials.access_token
  const apiVersion = credentials.api_version || '2024-01'
  const scopes = credentials.scopes || config?.scopes || 'read_products, read_orders'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié dans le presse-papiers')
  }

  const infoRows = [
    {
      icon: Globe,
      label: 'Domaine boutique',
      value: shopDomain,
      copyable: true,
      color: 'text-info dark:text-blue-400 bg-info/10',
    },
    {
      icon: Cpu,
      label: 'Version API',
      value: apiVersion,
      copyable: false,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    },
    {
      icon: Key,
      label: 'Jeton d\'accès',
      value: hasAccessToken ? '••••••••' + (credentials.access_token?.slice(-6) || '') : 'Non configuré',
      status: hasAccessToken ? 'ok' : 'error',
      color: 'text-warning dark:text-amber-400 bg-warning/10',
    },
    {
      icon: Shield,
      label: 'Scopes',
      value: typeof scopes === 'string' ? scopes : Array.isArray(scopes) ? scopes.join(', ') : '—',
      copyable: false,
      color: 'text-success dark:text-emerald-400 bg-success/10',
    },
    {
      icon: Calendar,
      label: 'Connecté le',
      value: channel.created_at 
        ? format(new Date(channel.created_at), 'dd MMM yyyy à HH:mm', { locale: getDateFnsLocale() })
        : '—',
      color: 'text-muted-foreground bg-muted',
    },
    {
      icon: Clock,
      label: 'Dernière mise à jour',
      value: channel.updated_at 
        ? format(new Date(channel.updated_at), 'dd MMM yyyy à HH:mm', { locale: getDateFnsLocale() })
        : '—',
      color: 'text-muted-foreground bg-muted',
    },
  ]

  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="h-4 w-4 text-info" />
            <CardTitle className="text-sm font-semibold">Informations de connexion</CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1 text-xs",
              channel.connection_status === 'connected' 
                ? "bg-success/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                : "bg-destructive/10 text-destructive border-destructive/30"
            )}
          >
            {channel.connection_status === 'connected' ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {channel.connection_status === 'connected' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1.5">
        {infoRows.map((row) => {
          const Icon = row.icon
          return (
            <div
              key={row.label}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group"
            >
              <div className={cn("p-1.5 rounded-md shrink-0", row.color)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">{row.label}</p>
                <p className="text-xs font-medium truncate">{row.value}</p>
              </div>
              {row.copyable && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => copyToClipboard(row.value)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              {'status' in row && (
                <div className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  row.status === 'ok' ? "bg-success" : "bg-destructive"
                )} />
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
