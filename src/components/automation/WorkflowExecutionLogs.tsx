/**
 * Logs d'exécution des workflows
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronRight,
  Search, RefreshCw, Filter, Calendar, Zap, Eye
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ExecutionLog {
  id: string
  workflow_id: string
  workflow_name: string
  status: 'success' | 'error' | 'running' | 'warning'
  started_at: string
  completed_at?: string
  duration_ms?: number
  trigger_type: string
  steps_executed: number
  steps_total: number
  error_message?: string
  input_data?: Record<string, any>
  output_data?: Record<string, any>
  step_logs: StepLog[]
}

interface StepLog {
  step_id: string
  step_name: string
  status: 'success' | 'error' | 'skipped' | 'running'
  started_at: string
  completed_at?: string
  duration_ms?: number
  input?: Record<string, any>
  output?: Record<string, any>
  error?: string
}

// Données de démonstration
const mockExecutionLogs: ExecutionLog[] = [
  {
    id: '1',
    workflow_id: 'wf1',
    workflow_name: 'Récupération panier abandonné',
    status: 'success',
    started_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
    duration_ms: 1250,
    trigger_type: 'order',
    steps_executed: 4,
    steps_total: 4,
    step_logs: [
      { step_id: 's1', step_name: 'Trigger: Panier abandonné', status: 'success', started_at: '', duration_ms: 50 },
      { step_id: 's2', step_name: 'Condition: Valeur > 50€', status: 'success', started_at: '', duration_ms: 30 },
      { step_id: 's3', step_name: 'Délai: 1 heure', status: 'success', started_at: '', duration_ms: 3600000 },
      { step_id: 's4', step_name: 'Action: Envoyer email', status: 'success', started_at: '', duration_ms: 850 }
    ]
  },
  {
    id: '2',
    workflow_id: 'wf2',
    workflow_name: 'Alerte stock critique',
    status: 'success',
    started_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 59).toISOString(),
    duration_ms: 450,
    trigger_type: 'stock',
    steps_executed: 2,
    steps_total: 2,
    step_logs: [
      { step_id: 's1', step_name: 'Trigger: Stock < 10', status: 'success', started_at: '', duration_ms: 40 },
      { step_id: 's2', step_name: 'Action: Notification Slack', status: 'success', started_at: '', duration_ms: 380 }
    ]
  },
  {
    id: '3',
    workflow_id: 'wf3',
    workflow_name: 'Auto-repricing concurrentiel',
    status: 'error',
    started_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 89).toISOString(),
    duration_ms: 2100,
    trigger_type: 'price',
    steps_executed: 2,
    steps_total: 4,
    error_message: 'Impossible de récupérer le prix concurrent: timeout API',
    step_logs: [
      { step_id: 's1', step_name: 'Trigger: Prix concurrent détecté', status: 'success', started_at: '', duration_ms: 80 },
      { step_id: 's2', step_name: 'Action: Récupérer prix concurrent', status: 'error', started_at: '', duration_ms: 2000, error: 'Timeout API' },
      { step_id: 's3', step_name: 'Condition: Écart > 5%', status: 'skipped', started_at: '' },
      { step_id: 's4', step_name: 'Action: Ajuster prix', status: 'skipped', started_at: '' }
    ]
  },
  {
    id: '4',
    workflow_id: 'wf1',
    workflow_name: 'Récupération panier abandonné',
    status: 'running',
    started_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    trigger_type: 'order',
    steps_executed: 2,
    steps_total: 4,
    step_logs: [
      { step_id: 's1', step_name: 'Trigger: Panier abandonné', status: 'success', started_at: '', duration_ms: 45 },
      { step_id: 's2', step_name: 'Condition: Valeur > 50€', status: 'success', started_at: '', duration_ms: 28 },
      { step_id: 's3', step_name: 'Délai: 1 heure', status: 'running', started_at: '' },
      { step_id: 's4', step_name: 'Action: Envoyer email', status: 'skipped', started_at: '' }
    ]
  }
]

export function WorkflowExecutionLogs() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedLogs, setExpandedLogs] = useState<string[]>([])

  // Dans un vrai cas, on chargerait depuis Supabase
  const logs = mockExecutionLogs

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.workflow_name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const toggleExpand = (id: string) => {
    setExpandedLogs(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'skipped': return <Clock className="h-4 w-4 text-muted-foreground" />
      default: return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      success: 'default',
      error: 'destructive',
      running: 'secondary',
      warning: 'outline'
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status === 'success' ? 'Succès' :
         status === 'error' ? 'Erreur' :
         status === 'running' ? 'En cours' :
         status === 'warning' ? 'Avertissement' : status}
      </Badge>
    )
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  return (
    <div className="space-y-6">
      {/* En-tête et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Historique d'exécution</h3>
          <p className="text-sm text-muted-foreground">
            {filteredLogs.length} exécution{filteredLogs.length > 1 ? 's' : ''} trouvée{filteredLogs.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
              <SelectItem value="running">En cours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Liste des exécutions */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {filteredLogs.map(log => (
            <Collapsible
              key={log.id}
              open={expandedLogs.includes(log.id)}
              onOpenChange={() => toggleExpand(log.id)}
            >
              <Card className={`transition-all ${expandedLogs.includes(log.id) ? 'ring-1 ring-primary' : ''}`}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedLogs.includes(log.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {getStatusIcon(log.status)}
                        <div className="text-left">
                          <div className="font-medium">{log.workflow_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.started_at), { addSuffix: true, locale: fr })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm hidden sm:block">
                          <div className="text-muted-foreground">
                            {log.steps_executed}/{log.steps_total} étapes
                          </div>
                          <div className="font-mono text-xs">
                            {formatDuration(log.duration_ms)}
                          </div>
                        </div>
                        {getStatusBadge(log.status)}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    {log.error_message && (
                      <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                        {log.error_message}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {log.step_logs.map((step, index) => (
                        <div
                          key={step.step_id}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            step.status === 'error' ? 'bg-destructive/5' :
                            step.status === 'success' ? 'bg-green-500/5' :
                            step.status === 'running' ? 'bg-blue-500/5' : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background text-xs font-medium">
                            {index + 1}
                          </div>
                          {getStatusIcon(step.status)}
                          <span className="flex-1 text-sm">{step.step_name}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {formatDuration(step.duration_ms)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-2" />
                        Détails
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Relancer
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
