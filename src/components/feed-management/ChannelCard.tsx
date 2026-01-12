import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { 
  Settings, RefreshCw, ExternalLink, AlertTriangle, 
  CheckCircle, Clock, TrendingUp, Package, Pause, Play
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChannelData {
  id: string
  name: string
  platform: string
  logo?: string
  status: 'active' | 'paused' | 'error' | 'syncing'
  products: {
    total: number
    approved: number
    pending: number
    rejected: number
  }
  lastSync?: string
  nextSync?: string
  qualityScore: number
  rules: number
  feedUrl?: string
}

interface ChannelCardProps {
  channel: ChannelData
  onEdit?: (id: string) => void
  onSync?: (id: string) => void
  onToggle?: (id: string, enabled: boolean) => void
  viewMode?: 'grid' | 'list'
}

export function ChannelCard({ channel, onEdit, onSync, onToggle, viewMode = 'grid' }: ChannelCardProps) {
  const getStatusBadge = () => {
    switch (channel.status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Actif</Badge>
      case 'paused':
        return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Pause</Badge>
      case 'syncing':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Sync</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Erreur</Badge>
      default:
        return null
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQualityBg = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const approvalRate = channel.products.total > 0 
    ? Math.round((channel.products.approved / channel.products.total) * 100) 
    : 0

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-all hover:border-primary/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Logo & Name */}
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {channel.logo ? (
                  <img src={channel.logo} alt={channel.name} className="w-8 h-8 object-contain" />
                ) : (
                  <Package className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-medium">{channel.name}</h3>
                <p className="text-sm text-muted-foreground">{channel.platform}</p>
              </div>
            </div>

            {/* Status */}
            <div className="min-w-[100px]">{getStatusBadge()}</div>

            {/* Products */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600 font-medium">{channel.products.approved}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-yellow-600">{channel.products.pending}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-red-600">{channel.products.rejected}</span>
                <span className="text-muted-foreground">({channel.products.total} total)</span>
              </div>
              <Progress value={approvalRate} className="h-1.5 mt-1" />
            </div>

            {/* Quality Score */}
            <div className="min-w-[80px] text-center">
              <span className={cn("text-lg font-bold", getQualityColor(channel.qualityScore))}>
                {channel.qualityScore}%
              </span>
              <p className="text-xs text-muted-foreground">Qualité</p>
            </div>

            {/* Rules */}
            <div className="min-w-[60px] text-center">
              <span className="font-medium">{channel.rules}</span>
              <p className="text-xs text-muted-foreground">Règles</p>
            </div>

            {/* Last Sync */}
            <div className="min-w-[120px] text-right text-sm text-muted-foreground">
              {channel.lastSync && (
                <div className="flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" />
                  {new Date(channel.lastSync).toLocaleString('fr-FR', { 
                    hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' 
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Switch 
                checked={channel.status === 'active' || channel.status === 'syncing'}
                onCheckedChange={(checked) => onToggle?.(channel.id, checked)}
              />
              <Button variant="ghost" size="icon" onClick={() => onSync?.(channel.id)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit?.(channel.id)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-all hover:border-primary/50 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {channel.logo ? (
                <img src={channel.logo} alt={channel.name} className="w-10 h-10 object-contain" />
              ) : (
                <Package className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">{channel.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{channel.platform}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quality Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Score qualité</span>
          <div className="flex items-center gap-2">
            <Progress value={channel.qualityScore} className={cn("w-20 h-2", getQualityBg(channel.qualityScore))} />
            <span className={cn("font-bold", getQualityColor(channel.qualityScore))}>
              {channel.qualityScore}%
            </span>
          </div>
        </div>

        {/* Products Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="p-2 rounded-lg bg-green-500/10">
            <p className="font-bold text-green-700">{channel.products.approved}</p>
            <p className="text-xs text-muted-foreground">Approuvés</p>
          </div>
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <p className="font-bold text-yellow-700">{channel.products.pending}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10">
            <p className="font-bold text-red-700">{channel.products.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejetés</p>
          </div>
        </div>

        {/* Rules & Sync Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>{channel.rules} règles actives</span>
          </div>
          {channel.lastSync && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{new Date(channel.lastSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit?.(channel.id)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurer
          </Button>
          <Button variant="outline" size="sm" onClick={() => onSync?.(channel.id)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {channel.feedUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a href={channel.feedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
