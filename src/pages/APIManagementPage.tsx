import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

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
  const successfulRequests = analytics?.reduce((sum, a) => sum + (a.successful_requests || 0), 0) || 0
  const failedRequests = analytics?.reduce((sum, a) => sum + (a.failed_requests || 0), 0) || 0

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
      title: 'Copied',
      description: 'API key copied to clipboard',
    })
  }

  const maskKey = (key: string) => {
    return `${key.slice(0, 8)}${'•'.repeat(20)}${key.slice(-4)}`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Key className="w-8 h-8 text-primary" />
            API Management
          </h1>
          <p className="text-muted-foreground">Manage API keys and monitor usage</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Keys</p>
              <p className="text-2xl font-bold">
                {apiKeys?.filter((k) => k.is_active).length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Activity className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">
                {totalRequests > 0
                  ? ((successfulRequests / totalRequests) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <Activity className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed Requests</p>
              <p className="text-2xl font-bold">{failedRequests.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">API Keys</h2>
        {apiKeys?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No API keys created yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
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
                        {visibleKeys.has(apiKey.id)
                          ? apiKey.key
                          : maskKey(apiKey.key)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{apiKey.environment || 'production'}</Badge>
                  </TableCell>
                  <TableCell>
                    {apiKey.last_used_at
                      ? formatDistanceToNow(new Date(apiKey.last_used_at), {
                          addSuffix: true,
                        })
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={apiKey.is_active ? 'default' : 'secondary'}
                    >
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
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent API Activity</h2>
        {apiLogs?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No API activity yet
          </div>
        ) : (
          <div className="space-y-2">
            {apiLogs?.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      log.status_code >= 200 && log.status_code < 300
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {log.status_code}
                  </Badge>
                  <span className="font-mono text-sm">{log.method}</span>
                  <span className="text-sm text-muted-foreground">
                    {log.endpoint}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {log.response_time_ms && (
                    <span className="text-xs text-muted-foreground">
                      {log.response_time_ms}ms
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at!), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
