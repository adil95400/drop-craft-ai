/**
 * WebhooksConfig — Webhooks persistés en base (webhook_subscriptions)
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { motion } from 'framer-motion'
import {
  Webhook, Plus, Trash2, CheckCircle2, XCircle,
  Clock, Send
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

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

export function WebhooksConfig() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhook-subscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !newUrl.trim() || !newName.trim() || selectedEvents.length === 0) {
        throw new Error('Nom, URL et au moins un événement requis')
      }
      const secret = 'whsec_' + crypto.randomUUID().replace(/-/g, '').slice(0, 24)
      const { error } = await supabase.from('webhook_subscriptions').insert({
        user_id: user.id,
        name: newName.trim(),
        url: newUrl.trim(),
        events: selectedEvents,
        secret,
        is_active: true,
      })
      if (error) throw error
      return secret
    },
    onSuccess: (secret) => {
      queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions'] })
      toast.success('Webhook créé', { description: `Secret: ${secret}`, duration: 10000 })
      setShowCreate(false)
      setNewUrl('')
      setNewName('')
      setSelectedEvents([])
    },
    onError: (e: Error) => toast.error('Erreur', { description: e.message }),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('webhook_subscriptions').update({ is_active: active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions'] })
      toast.success('Webhook mis à jour')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_subscriptions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions'] })
      toast.success('Webhook supprimé')
    },
  })

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke('webhook-delivery', {
        body: { webhook_id: id, event_type: 'test.ping', payload: { message: 'Test ping from ShopOpti+', timestamp: new Date().toISOString() } }
      })
      if (error) throw error
    },
    onSuccess: () => toast.success('Test envoyé'),
    onError: () => toast.error('Échec du test'),
  })

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    )
  }

  const categories = [...new Set(AVAILABLE_EVENTS.map(e => e.category))]

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Webhook className="h-5 w-5 text-primary" />
          Webhooks
          <Badge variant="outline" className="ml-auto text-xs">{webhooks.filter(w => w.is_active).length} actif(s)</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showCreate ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 border rounded-lg space-y-3 bg-muted/30">
            <Input placeholder="Nom (ex: Mon ERP)" value={newName} onChange={e => setNewName(e.target.value)} className="h-8 text-sm" />
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
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Créer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)} className="text-xs">Annuler</Button>
            </div>
          </motion.div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="w-full text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> Nouveau webhook
          </Button>
        )}

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
                <span className="text-sm font-medium truncate">{wh.name}</span>
                <Badge variant={wh.is_active ? 'default' : 'secondary'} className="text-[9px]">
                  {wh.is_active ? 'Actif' : 'Inactif'}
                </Badge>
                <div className="ml-auto flex items-center gap-1.5">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => testMutation.mutate(wh.id)} title="Envoyer un test">
                    <Send className="h-3 w-3" />
                  </Button>
                  <Switch checked={wh.is_active ?? true} onCheckedChange={active => toggleMutation.mutate({ id: wh.id, active })} />
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteMutation.mutate(wh.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <code className="text-[10px] font-mono text-muted-foreground block truncate">{wh.url}</code>
              <div className="flex flex-wrap gap-1">
                {(wh.events || []).map((e: string) => (
                  <Badge key={e} variant="outline" className="text-[9px]">{e}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {wh.last_triggered_at && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" /> {new Date(wh.last_triggered_at).toLocaleString('fr-FR')}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
          {webhooks.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">Aucun webhook configuré.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
