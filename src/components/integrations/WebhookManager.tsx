import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Webhook, Plus, TestTube, Trash2, AlertCircle, CheckCircle, Clock, Copy, RefreshCw
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export const WebhookManager = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: webhooks = [], isLoading, refetch } = useQuery({
    queryKey: ['webhooks', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map((w: any) => ({
        id: w.id,
        url: w.url || w.endpoint_url || '',
        events: w.events || [],
        is_active: w.is_active ?? true,
        secret: w.secret || '',
        name: w.name || w.url?.split('/').pop() || 'Webhook',
        success_count: w.success_count || 0,
        failure_count: w.failure_count || 0,
        last_triggered_at: w.last_triggered_at,
        created_at: w.created_at,
      }))
    }
  })

  const createMutation = useMutation({
    mutationFn: async (d: { url: string; events: string[] }) => {
      const { error } = await supabase.from('webhook_subscriptions').insert({
        user_id: user!.id,
        url: d.url,
        endpoint_url: d.url,
        events: d.events,
        is_active: true,
        secret: crypto.randomUUID(),
        name: d.url.split('/').pop() || 'Webhook',
      } as any)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      setIsCreateModalOpen(false)
      toast({ title: "Webhook créé" })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_subscriptions').delete().eq('id', id).eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      toast({ title: "Webhook supprimé" })
    }
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('webhook_subscriptions').update({ is_active: active } as any).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] })
  })

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('webhook-delivery', {
        body: { webhook_id: id, test: true }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => toast({ title: "Test envoyé" }),
    onError: (err: any) => toast({ title: "Test échoué", description: err.message, variant: "destructive" })
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copié" })
  }

  if (isLoading) {
    return <Card><CardContent className="p-6"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></CardContent></Card>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Webhook className="w-5 h-5" />Gestion des Webhooks</CardTitle>
              <CardDescription>Recevez des notifications en temps réel</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} size="sm"><RefreshCw className="w-4 h-4 mr-2" />Actualiser</Button>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nouveau Webhook</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un webhook</DialogTitle>
                    <DialogDescription>Configurez une URL de callback</DialogDescription>
                  </DialogHeader>
                  <CreateWebhookForm onSubmit={(d) => createMutation.mutate(d)} isLoading={createMutation.isPending} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{webhooks.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Actifs</p><p className="text-2xl font-bold text-green-600">{webhooks.filter(w => w.is_active).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Succès</p><p className="text-2xl font-bold text-blue-600">{webhooks.reduce((s, w) => s + w.success_count, 0)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Événements</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun webhook</TableCell></TableRow>
              ) : webhooks.map(wh => (
                <TableRow key={wh.id}>
                  <TableCell className="font-medium">{wh.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded max-w-xs truncate">{wh.url}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(wh.url)}><Copy className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {wh.events.slice(0, 2).map((e: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{e}</Badge>)}
                      {wh.events.length > 2 && <Badge variant="outline" className="text-xs">+{wh.events.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {wh.is_active ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Actif</Badge>
                    ) : <Badge variant="outline">Inactif</Badge>}
                  </TableCell>
                  <TableCell>
                    {wh.last_triggered_at ? new Date(wh.last_triggered_at).toLocaleString() : <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Jamais</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => testMutation.mutate(wh.id)} disabled={testMutation.isPending}><TestTube className="w-4 h-4" /></Button>
                      <Switch checked={wh.is_active} onCheckedChange={c => toggleMutation.mutate({ id: wh.id, active: c })} />
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(wh.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

const CreateWebhookForm = ({ onSubmit, isLoading }: { onSubmit: (d: { url: string; events: string[] }) => void; isLoading: boolean }) => {
  const [url, setUrl] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (url.trim()) onSubmit({ url, events: ['order.created', 'product.updated'] }) }} className="space-y-4">
      <div>
        <Label>URL du webhook</Label>
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://votre-domaine.com/webhook" required type="url" />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? 'Création...' : 'Créer'}</Button>
    </form>
  )
}
