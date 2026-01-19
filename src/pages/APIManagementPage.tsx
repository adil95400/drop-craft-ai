import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { supabase } from '@/integrations/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Activity, Code } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

export default function APIManagementPage() {
  const { toast } = useToast()
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const { data: apiKeys, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: apiLogs } = useQuery({
    queryKey: ['api-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data
    },
  })

  const { data: analytics } = useQuery({
    queryKey: ['api-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_analytics')
        .select('*')
        .order('date', { ascending: false })
        .limit(7)
      if (error) throw error
      return data
    },
  })

  const totalRequests = analytics?.reduce((sum, a) => sum + (a.total_requests || 0), 0) || 0
  const failedRequests = analytics?.reduce((sum, a) => sum + (a.failed_requests || 0), 0) || 0
  const successfulRequests = totalRequests - failedRequests

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copié',
      description: 'Clé API copiée dans le presse-papiers',
    })
  }

  const maskKey = (key: string) => {
    return `${key.slice(0, 8)}${'•'.repeat(20)}${key.slice(-4)}`
  }

  return (
    <>
      <Helmet>
        <title>Gestion API - Clés & Accès</title>
        <meta name="description" content="Gérez vos clés API et surveillez l'utilisation de l'API ShopOpti" />
      </Helmet>

      <ChannablePageWrapper
        title="Gestion API"
        subtitle="Clés & Accès"
        description="Gérez vos clés API, surveillez l'utilisation et consultez les logs d'activité"
        heroImage="schema"
        badge={{ label: 'Développeur', icon: Code }}
        actions={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Créer une clé API
          </Button>
        }
      >
        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                <Key className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Clés actives</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {apiKeys?.filter((k) => k.is_active).length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10">
                <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Requêtes</p>
                <p className="text-lg sm:text-2xl font-bold">{totalRequests.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg bg-green-500/10">
                <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Succès</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {totalRequests > 0
                    ? ((successfulRequests / totalRequests) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg bg-red-500/10">
                <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Échecs</p>
                <p className="text-lg sm:text-2xl font-bold">{failedRequests.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* API Keys Card */}
        <Card className="p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Clés API</h2>
          {apiKeys?.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              Aucune clé API créée
            </div>
          ) : (
            <div className="space-y-3 sm:hidden">
              {/* Mobile card view */}
              {apiKeys?.map((apiKey) => (
                <div key={apiKey.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{apiKey.name}</span>
                    <Badge variant={apiKey.is_active ? 'default' : 'secondary'} className="text-xs">
                      {apiKey.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <code className="text-xs flex-1 truncate">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(apiKey.id)}>
                      {visibleKeys.has(apiKey.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">{apiKey.environment || 'production'}</Badge>
                    <span>{apiKey.last_used_at ? formatDistanceToNow(new Date(apiKey.last_used_at), { addSuffix: true }) : 'Jamais'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Desktop table view */}
          <div className="hidden sm:block">
            {apiKeys && apiKeys.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Clé</TableHead>
                    <TableHead>Environnement</TableHead>
                    <TableHead>Dernière utilisation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys?.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">{apiKey.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm">
                            {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                          </code>
                          <Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(apiKey.id)}>
                            {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{apiKey.environment || 'production'}</Badge>
                      </TableCell>
                      <TableCell>
                        {apiKey.last_used_at ? formatDistanceToNow(new Date(apiKey.last_used_at), { addSuffix: true }) : 'Jamais'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                          {apiKey.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Recent Activity Card */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Activité récente</h2>
          {apiLogs?.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              Aucune activité API
            </div>
          ) : (
            <div className="space-y-2">
              {apiLogs?.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50 gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                    <Badge
                      variant={log.status_code >= 200 && log.status_code < 300 ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {log.status_code}
                    </Badge>
                    <span className="font-mono text-xs sm:text-sm">{log.method}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                      {log.endpoint}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                    {log.response_time_ms && <span>{log.response_time_ms}ms</span>}
                    <span>{formatDistanceToNow(new Date(log.created_at!), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </ChannablePageWrapper>
    </>
  )
}
