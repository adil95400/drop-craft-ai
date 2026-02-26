import React, { useState } from 'react'
import { 
  RefreshCw, Clock, CheckCircle, XCircle, Loader2, 
  Play, X, RotateCcw, Package, Truck, AlertTriangle,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useAutoOrderQueue } from '@/hooks/useAutoOrderQueue'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

const supplierIcons: Record<string, string> = {
  cj: '🚚',
  aliexpress: '🌏',
  bigbuy: '📦',
  bts: '🏭',
  generic: '📋'
}

const supplierNames: Record<string, string> = {
  cj: 'CJ Dropshipping',
  aliexpress: 'AliExpress',
  bigbuy: 'BigBuy',
  bts: 'BTS Wholesaler',
  generic: 'Fournisseur manuel'
}

const statusConfig: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
  processing: { label: 'En cours', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  completed: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: 'Échoué', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <XCircle className="h-3 w-3" /> },
  retry: { label: 'Retry planifié', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: <RotateCcw className="h-3 w-3" /> },
  cancelled: { label: 'Annulé', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: <X className="h-3 w-3" /> }
}

export function AutoOrderQueueDashboard() {
  const { user } = useAuth()
  const { 
    queueItems, 
    stats, 
    isLoading, 
    refetch,
    cancelOrder,
    retryOrder,
    isCancelling,
    isRetrying
  } = useAutoOrderQueue(user?.id)

  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const totalInQueue = stats.pending + stats.processing + stats.retry
  const successRate = stats.completed > 0 
    ? Math.round((stats.completed / (stats.completed + stats.failed)) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              <div>
                <p className="text-2xl font-bold">{stats.processing}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Terminées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-xs text-muted-foreground">Échouées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.retry}</p>
                <p className="text-xs text-muted-foreground">Retry</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {totalInQueue > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">File d'attente active</span>
              <span className="text-sm text-muted-foreground">{totalInQueue} commande(s)</span>
            </div>
            <Progress 
              value={(stats.processing / Math.max(totalInQueue, 1)) * 100} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Taux de réussite: {successRate}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Queue Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              File d'Auto-Order
            </CardTitle>
            <CardDescription>
              Commandes en cours de traitement automatique
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : queueItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune commande dans la file</p>
              <p className="text-sm">Les nouvelles commandes apparaîtront ici</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Tentatives</TableHead>
                  <TableHead>Créée</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueItems.map((item) => {
                  const status = statusConfig[item.status] || statusConfig.pending
                  const isExpanded = expandedRows.includes(item.id)

                  return (
                    <React.Fragment key={item.id}>
                      <TableRow className={item.status === 'failed' ? 'bg-red-50 dark:bg-red-950/10' : ''}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleRow(item.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {item.order_id.slice(0, 8)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{supplierIcons[item.supplier_type]}</span>
                            <span className="text-sm">{supplierNames[item.supplier_type]}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={item.retry_count >= item.max_retries ? 'text-red-500' : ''}>
                            {item.retry_count}/{item.max_retries}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            {(item.status === 'pending' || item.status === 'retry') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => cancelOrder({ queueId: item.id, userId: user?.id! })}
                                disabled={isCancelling}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            {item.status === 'failed' && item.retry_count < item.max_retries && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => retryOrder({ queueId: item.id, userId: user?.id! })}
                                disabled={isRetrying}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="p-4 space-y-3">
                              {item.error_message && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-red-700 dark:text-red-400">Erreur</p>
                                    <p className="text-sm text-red-600 dark:text-red-300">{item.error_message}</p>
                                  </div>
                                </div>
                              )}
                              {item.next_retry_at && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Prochaine tentative: </span>
                                  <span className="font-medium">
                                    {formatDistanceToNow(new Date(item.next_retry_at), { addSuffix: true, locale: getDateFnsLocale() })}
                                  </span>
                                </div>
                              )}
                              {item.result && (
                                <div className="text-sm">
                                  <p className="font-medium mb-1">Résultat:</p>
                                  <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                                    {JSON.stringify(item.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                              <div className="text-sm">
                                <p className="font-medium mb-1">Payload:</p>
                                <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                                  {JSON.stringify(item.payload, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
