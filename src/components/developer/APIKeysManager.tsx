/**
 * APIKeysManager — Gestion des clés API avec création, révocation, scopes
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { motion } from 'framer-motion'
import {
  Key, Plus, Copy, Trash2, Eye, EyeOff, Shield,
  Clock, Activity, CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface APIKeyDisplay {
  id: string
  name: string
  key_prefix: string
  environment: string
  scopes: string[]
  is_active: boolean
  created_at: string
  last_used_at: string | null
  rate_limit: number
}

export function APIKeysManager() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyEnv, setNewKeyEnv] = useState<'test' | 'live'>('test')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, environment, scopes, is_active, created_at, last_used_at, rate_limit')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      return (data || []) as APIKeyDisplay[]
    },
    enabled: !!user?.id,
  })

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !newKeyName.trim()) throw new Error('Nom requis')
      const keyValue = `sk_${newKeyEnv}_${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`
      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        name: newKeyName.trim(),
        key: keyValue,
        key_prefix: keyValue.slice(0, 12) + '...',
        key_hash: keyValue,
        environment: newKeyEnv,
        scopes: ['products:read', 'orders:read'],
        is_active: true,
        rate_limit: 60,
      })
      if (error) throw error
      return keyValue
    },
    onSuccess: (key) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('Clé API créée', { description: 'Copiez-la maintenant, elle ne sera plus visible.' })
      navigator.clipboard.writeText(key)
      setShowCreate(false)
      setNewKeyName('')
    },
    onError: (e: Error) => toast.error('Erreur', { description: e.message }),
  })

  const toggleKeyMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('api_keys').update({ is_active: active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('Clé mise à jour')
    },
  })

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('api_keys').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('Clé supprimée')
    },
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Key className="h-5 w-5 text-primary" />
          Clés API
          <Badge variant="outline" className="ml-auto text-xs">{keys.length} clé(s)</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Create form */}
        {showCreate ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 border rounded-lg space-y-3 bg-muted/30">
            <Input placeholder="Nom de la clé (ex: Production API)" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="h-8 text-sm" />
            <div className="flex gap-2">
              <Button size="sm" variant={newKeyEnv === 'test' ? 'default' : 'outline'} onClick={() => setNewKeyEnv('test')} className="text-xs h-7">Test</Button>
              <Button size="sm" variant={newKeyEnv === 'live' ? 'default' : 'outline'} onClick={() => setNewKeyEnv('live')} className="text-xs h-7">Live</Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createKeyMutation.mutate()} disabled={!newKeyName.trim() || createKeyMutation.isPending} className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Créer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)} className="text-xs">Annuler</Button>
            </div>
          </motion.div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="w-full text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> Nouvelle clé API
          </Button>
        )}

        {/* Keys list */}
        <div className="space-y-2">
          {keys.map((k, i) => (
            <motion.div
              key={k.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className={cn('flex items-center gap-3 p-3 rounded-lg border', k.is_active ? '' : 'opacity-50')}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{k.name}</span>
                  <Badge variant="outline" className={cn('text-[9px]', k.environment === 'live' ? 'border-green-500/30 text-green-600' : 'border-amber-500/30 text-amber-600')}>
                    {k.environment}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] font-mono text-muted-foreground">
                    {revealedKey === k.id ? k.key_prefix : '••••••••••••'}
                  </code>
                  <button onClick={() => setRevealedKey(revealedKey === k.id ? null : k.id)}>
                    {revealedKey === k.id ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3 text-muted-foreground" />}
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(k.key_prefix); toast.success('Préfixe copié') }}>
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {new Date(k.created_at).toLocaleDateString('fr-FR')}</span>
                  <span className="flex items-center gap-0.5"><Activity className="h-2.5 w-2.5" /> {k.rate_limit}/min</span>
                  {k.last_used_at && <span>Dernier usage: {new Date(k.last_used_at).toLocaleDateString('fr-FR')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={k.is_active} onCheckedChange={active => toggleKeyMutation.mutate({ id: k.id, active })} />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteKeyMutation.mutate(k.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
          {keys.length === 0 && !isLoading && (
            <div className="text-center text-sm text-muted-foreground py-8">Aucune clé API. Créez-en une pour commencer.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
