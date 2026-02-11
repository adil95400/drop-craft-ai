/**
 * Granular Item-Level Retry - Per-item retry in import job detail view
 * Replaces job-level-only retry with individual item control
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  RefreshCw, CheckCircle, XCircle, AlertTriangle, Search,
  RotateCcw, Trash2, Eye, ChevronDown, Clock, Package,
  ArrowUpDown, Filter
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface JobItem {
  id: string
  title: string
  sku: string
  sourceUrl: string
  status: 'success' | 'failed' | 'retrying' | 'skipped'
  errorMessage?: string
  retryCount: number
  lastAttempt: string
  selected: boolean
}

const mockItems: JobItem[] = [
  { id: '1', title: 'Wireless Earbuds Pro X', sku: 'WEP-X001', sourceUrl: 'https://ali.com/item/1', status: 'success', retryCount: 0, lastAttempt: '14:32', selected: false },
  { id: '2', title: 'Smart Watch Ultra Edition', sku: 'SWU-002', sourceUrl: 'https://ali.com/item/2', status: 'failed', errorMessage: 'Timeout: extraction failed after 30s', retryCount: 2, lastAttempt: '14:33', selected: false },
  { id: '3', title: 'USB-C Hub 7-in-1 Pro', sku: 'UCH-003', sourceUrl: 'https://ali.com/item/3', status: 'failed', errorMessage: 'Product page unavailable (404)', retryCount: 1, lastAttempt: '14:33', selected: false },
  { id: '4', title: 'Bluetooth Speaker V3', sku: 'BTS-004', sourceUrl: 'https://ali.com/item/4', status: 'success', retryCount: 0, lastAttempt: '14:34', selected: false },
  { id: '5', title: 'Phone Case Premium Leather', sku: 'PCP-005', sourceUrl: 'https://ali.com/item/5', status: 'failed', errorMessage: 'Price extraction failed: element not found', retryCount: 3, lastAttempt: '14:35', selected: false },
  { id: '6', title: 'Laptop Stand Adjustable', sku: 'LSA-006', sourceUrl: 'https://ali.com/item/6', status: 'skipped', errorMessage: 'Duplicate SKU detected', retryCount: 0, lastAttempt: '14:35', selected: false },
  { id: '7', title: 'Wireless Mouse Ergonomic', sku: 'WME-007', sourceUrl: 'https://ali.com/item/7', status: 'retrying', retryCount: 1, lastAttempt: '14:36', selected: false },
  { id: '8', title: 'HDMI Cable 4K 2m', sku: 'HC4-008', sourceUrl: 'https://ali.com/item/8', status: 'success', retryCount: 1, lastAttempt: '14:36', selected: false },
]

export default function ItemRetryPage() {
  const { toast } = useToast()
  const [items, setItems] = useState(mockItems)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'failed' | 'success' | 'retrying' | 'skipped'>('all')

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const selectedItems = items.filter(i => i.selected)
  const failedCount = items.filter(i => i.status === 'failed').length
  const successCount = items.filter(i => i.status === 'success').length
  const retryingCount = items.filter(i => i.status === 'retrying').length

  const toggleSelect = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i))
  }

  const selectAllFailed = () => {
    setItems(prev => prev.map(i => i.status === 'failed' ? { ...i, selected: true } : i))
  }

  const retrySelected = () => {
    const retryIds = selectedItems.map(i => i.id)
    setItems(prev => prev.map(i => retryIds.includes(i.id) ? { ...i, status: 'retrying', selected: false, retryCount: i.retryCount + 1 } : i))
    toast({ title: `${retryIds.length} item(s) relancé(s)`, description: 'Le retry granulaire est en cours...' })
    setTimeout(() => {
      setItems(prev => prev.map(i => retryIds.includes(i.id) ? { ...i, status: Math.random() > 0.3 ? 'success' : 'failed' } : i))
    }, 2000)
  }

  const retryOne = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'retrying', retryCount: i.retryCount + 1 } : i))
    toast({ title: 'Retry lancé' })
    setTimeout(() => {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: Math.random() > 0.3 ? 'success' : 'failed' } : i))
    }, 2000)
  }

  const skipItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'skipped' } : i))
    toast({ title: 'Item ignoré' })
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />
      case 'retrying': return <RefreshCw className="h-4 w-4 text-primary animate-spin" />
      case 'skipped': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return null
    }
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

  const successRate = items.length > 0 ? Math.round((successCount / items.length) * 100) : 0

  return (
    <ChannablePageWrapper
      title="Retry Granulaire"
      description="Relancez individuellement les items échoués d'un import sans rejouer le job entier."
      heroImage="import"
      badge={{ label: 'Job #IMP-2847', icon: Package }}
      actions={
        <>
          {selectedItems.length > 0 && (
            <Button onClick={retrySelected}>
              <RotateCcw className="mr-2 h-4 w-4" /> Relancer {selectedItems.length} item(s)
            </Button>
          )}
          <Button variant="outline" onClick={selectAllFailed} disabled={failedCount === 0}>
            <Filter className="mr-2 h-4 w-4" /> Sélectionner les échoués ({failedCount})
          </Button>
        </>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <div className="text-sm text-muted-foreground mb-1">Total items</div>
          <div className="text-2xl font-bold">{items.length}</div>
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
          <div className="text-sm text-muted-foreground mb-1">En retry</div>
          <div className="text-2xl font-bold text-primary">{retryingCount}</div>
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
          {(['all', 'failed', 'success', 'retrying', 'skipped'] as const).map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'Tous' : s === 'failed' ? 'Échoués' : s === 'success' ? 'Succès' : s === 'retrying' ? 'En cours' : 'Ignorés'}
            </Button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground bg-muted/30">
                  <th className="p-3 w-10"></th>
                  <th className="p-3 font-medium">Produit</th>
                  <th className="p-3 font-medium">SKU</th>
                  <th className="p-3 font-medium text-center">Statut</th>
                  <th className="p-3 font-medium">Erreur</th>
                  <th className="p-3 font-medium text-center">Retries</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id} className={`border-b last:border-0 hover:bg-muted/50 ${item.selected ? 'bg-primary/5' : ''}`}>
                    <td className="p-3">
                      <Checkbox checked={item.selected} onCheckedChange={() => toggleSelect(item.id)} disabled={item.status === 'success'} />
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{item.sourceUrl}</div>
                    </td>
                    <td className="p-3 font-mono text-xs">{item.sku}</td>
                    <td className="p-3 text-center">{statusLabel(item.status)}</td>
                    <td className="p-3">
                      {item.errorMessage && (
                        <span className="text-xs text-destructive">{item.errorMessage}</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className="text-xs">{item.retryCount}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        {item.status === 'failed' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => retryOne(item.id)}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => skipItem(item.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {item.status === 'retrying' && (
                          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  )
}
