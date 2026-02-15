/**
 * WebhooksConfig — Configuration webhooks avec events, URLs, retry et logs
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { motion } from 'framer-motion'
import {
  Webhook, Plus, Trash2, CheckCircle2, XCircle,
  RefreshCw, Clock, ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const AVAILABLE_EVENTS = [
  { id: 'product.created', label: 'Produit créé', category: 'Products' },
  { id: 'product.updated', label: 'Produit modifié', category: 'Products' },
  { id: 'product.deleted', label: 'Produit supprimé', category: 'Products' },
  { id: 'order.created', label: 'Commande créée', category: 'Orders' },
  { id: 'order.updated', label: 'Commande modifiée', category: 'Orders' },
  { id: 'order.fulfilled', label: 'Commande expédiée', category: 'Orders' },
  { id: 'stock.low', label: 'Stock faible', category: 'Stock' },
  { id: 'stock.out', label: 'Rupture de stock', category: 'Stock' },
  { id: 'import.completed', label: 'Import terminé', category: 'Imports' },
  { id: 'import.failed', label: 'Import échoué', category: 'Imports' },
]

interface WebhookEntry {
  id: string
  url: string
  events: string[]
  isActive: boolean
  secret: string
  createdAt: string
  lastTriggered?: string
  successRate: number
  totalDeliveries: number
}

export function WebhooksConfig() {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([
    {
      id: '1',
      url: 'https://api.example.com/webhooks/shopopti',
      events: ['product.created', 'order.created'],
      isActive: true,
      secret: 'whsec_' + crypto.randomUUID().slice(0, 16),
      createdAt: new Date().toISOString(),
      lastTriggered: new Date(Date.now() - 3600000).toISOString(),
      successRate: 98.5,
      totalDeliveries: 142,
    },
  ])
  const [showCreate, setShowCreate] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const handleCreate = () => {
    if (!newUrl.trim() || selectedEvents.length === 0) {
      toast.error('URL et au moins un event requis')
      return
    }
    const newWebhook: WebhookEntry = {
      id: crypto.randomUUID(),
      url: newUrl.trim(),
      events: selectedEvents,
      isActive: true,
      secret: 'whsec_' + crypto.randomUUID().slice(0, 16),
      createdAt: new Date().toISOString(),
      successRate: 100,
      totalDeliveries: 0,
    }
    setWebhooks(prev => [newWebhook, ...prev])
    setShowCreate(false)
    setNewUrl('')
    setSelectedEvents([])
    toast.success('Webhook créé', { description: `Secret: ${newWebhook.secret}` })
  }

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    )
  }

  const deleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id))
    toast.success('Webhook supprimé')
  }

  const categories = [...new Set(AVAILABLE_EVENTS.map(e => e.category))]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Webhook className="h-5 w-5 text-primary" />
          Webhooks
          <Badge variant="outline" className="ml-auto text-xs">{webhooks.length} actif(s)</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Create form */}
        {showCreate ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 border rounded-lg space-y-3 bg-muted/30">
            <Input placeholder="https://votre-api.com/webhook" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="h-8 text-sm font-mono" />
            <div className="space-y-2">
              <h5 className="text-xs font-semibold">Événements</h5>
              {categories.map(cat => (
                <div key={cat}>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{cat}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {AVAILABLE_EVENTS.filter(e => e.category === cat).map(event => (
                      <label key={event.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Checkbox checked={selectedEvents.includes(event.id)} onCheckedChange={() => toggleEvent(event.id)} className="h-3.5 w-3.5" />
                        {event.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" /> Créer</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)} className="text-xs">Annuler</Button>
            </div>
          </motion.div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="w-full text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> Nouveau webhook
          </Button>
        )}

        {/* Webhooks list */}
        <div className="space-y-2">
          {webhooks.map((wh, i) => (
            <motion.div
              key={wh.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="p-3 rounded-lg border space-y-2"
            >
              <div className="flex items-center gap-2">
                <Badge variant={wh.isActive ? 'default' : 'secondary'} className="text-[9px]">
                  {wh.isActive ? 'Actif' : 'Inactif'}
                </Badge>
                <code className="text-xs font-mono flex-1 truncate">{wh.url}</code>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteWebhook(wh.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {wh.events.map(e => (
                  <Badge key={e} variant="outline" className="text-[9px]">{e}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  {wh.successRate >= 95 ? <CheckCircle2 className="h-2.5 w-2.5 text-green-500" /> : <XCircle className="h-2.5 w-2.5 text-red-500" />}
                  {wh.successRate}% succès
                </span>
                <span>{wh.totalDeliveries} deliveries</span>
                {wh.lastTriggered && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {new Date(wh.lastTriggered).toLocaleString('fr-FR')}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
