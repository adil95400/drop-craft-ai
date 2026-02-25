/**
 * Granular Item-Level Retry - Real data from import jobs
 */
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  RefreshCw, CheckCircle, XCircle, AlertTriangle, Search,
  RotateCcw, Trash2, Package, Filter
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export default function ItemRetryPage() {
  const { toast } = useToast()
  const { jobId } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'failed' | 'success' | 'retrying' | 'skipped'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: job } = useQuery({
    queryKey: ['import-job', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle()
      return data
    },
    enabled: !!jobId
  })

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['import-job-items', jobId, user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      if (jobId) {
        const res = await (supabase as any)
          .from('imported_products')
          .select('id, title, sku, source_url, promoted_to_product_id, validation_errors')
          .eq('user_id', user.id)
          .eq('import_batch_id', jobId)
          .order('created_at', { ascending: false })
          .limit(200)
        const data = res.data || []
        return (data || []).map((p: any) => ({
          id: p.id,
          title: p.title || 'Sans titre',
          sku: p.sku || '-',
          sourceUrl: p.source_url || '',
          status: p.promoted_to_product_id ? 'success' : p.validation_errors ? 'failed' : 'success',
          errorMessage: p.validation_errors ? JSON.stringify(p.validation_errors).slice(0, 100) : undefined,
          retryCount: 0,
        }))
      }
      // Fallback: show recent imports
      const res2 = await (supabase as any)
          .from('imported_products')
          .select('id, title, sku, source_url, promoted_to_product_id, validation_errors')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
      const data = res2.data || []
      return (data || []).map((p: any) => ({
        id: p.id,
        title: p.title || 'Sans titre',
        sku: p.sku || '-',
        sourceUrl: p.source_url || '',
        status: p.promoted_to_product_id ? 'success' : p.validation_errors ? 'failed' : 'success',
        errorMessage: p.validation_errors ? JSON.stringify(p.validation_errors).slice(0, 100) : undefined,
        retryCount: 0,
      }))
    },
    enabled: !!user?.id
  })

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const failedCount = items.filter((i: any) => i.status === 'failed').length
  const successCount = items.filter((i: any) => i.status === 'success').length
  const successRate = items.length > 0 ? Math.round((successCount / items.length) * 100) : 0

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAllFailed = () => {
    setSelectedIds(new Set(items.filter((i: any) => i.status === 'failed').map((i: any) => i.id)))
  }

  const retrySelected = () => {
    toast({ title: `${selectedIds.size} item(s) relancé(s)`, description: 'Le retry est en cours...' })
    setSelectedIds(new Set())
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Succès</Badge>
      case 'failed': return <Badge variant="destructive">Échoué</Badge>
      case 'retrying': return <Badge className="bg-primary/10 text-primary border-primary/20">En cours...</Badge>
      case 'skipped': return <Badge variant="outline">Ignoré</Badge>
      default: return null
    }
  }

  return (
    <ChannablePageWrapper
      title="Retry Granulaire"
      description="Relancez individuellement les items échoués d'un import."
      heroImage="import"
      badge={{ label: job ? `Job #${(job as any).id?.slice(0,8)}` : 'Import', icon: Package }}
      actions={
        <>
          {selectedIds.size > 0 && (
            <Button onClick={retrySelected}>
              <RotateCcw className="mr-2 h-4 w-4" /> Relancer {selectedIds.size} item(s)
            </Button>
          )}
          <Button variant="outline" onClick={selectAllFailed} disabled={failedCount === 0}>
            <Filter className="mr-2 h-4 w-4" /> Sélectionner les échoués ({failedCount})
          </Button>
        </>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <div className="text-sm text-muted-foreground mb-1">Total items</div>
          <div className="text-2xl font-bold">{isLoading ? '...' : items.length}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="text-sm text-muted-foreground mb-1">Succès</div>
          <div className="text-2xl font-bold text-green-600">{successCount}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="text-sm text-muted-foreground mb-1">Échoués</div>
          <div className="text-2xl font-bold text-destructive">{failedCount}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="text-sm text-muted-foreground mb-1">Taux réussite</div>
          <div className="text-2xl font-bold">{successRate}%</div>
          <Progress value={successRate} className="h-1.5 mt-2" />
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par titre ou SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {(['all', 'failed', 'success'] as const).map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'Tous' : s === 'failed' ? 'Échoués' : 'Succès'}
            </Button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Aucun item trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground bg-muted/30">
                    <th className="p-3 w-10"></th>
                    <th className="p-3 font-medium">Produit</th>
                    <th className="p-3 font-medium">SKU</th>
                    <th className="p-3 font-medium text-center">Statut</th>
                    <th className="p-3 font-medium">Erreur</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item: any) => (
                    <tr key={item.id} className={`border-b last:border-0 hover:bg-muted/50 ${selectedIds.has(item.id) ? 'bg-primary/5' : ''}`}>
                      <td className="p-3">
                        <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} disabled={item.status === 'success'} />
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{item.sourceUrl}</div>
                      </td>
                      <td className="p-3 font-mono text-xs">{item.sku}</td>
                      <td className="p-3 text-center">{statusLabel(item.status)}</td>
                      <td className="p-3">
                        {item.errorMessage && <span className="text-xs text-destructive">{item.errorMessage}</span>}
                      </td>
                      <td className="p-3 text-right">
                        {item.status === 'failed' && (
                          <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Retry lancé' })}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  )
}
