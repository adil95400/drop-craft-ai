import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Key, Plus, Eye, EyeOff, Copy, Trash2, RotateCw, Shield, AlertTriangle, CheckCircle, Settings
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export const APIKeysManager = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map((k: any) => ({
        id: k.id,
        name: k.name,
        key_preview: k.key || k.key_prefix || '***',
        scopes: k.scopes || [],
        is_active: k.is_active ?? true,
        last_used: k.last_used_at,
        expires_at: k.expires_at,
        created_at: k.created_at,
      }))
    },
  })

  const createKeyMutation = useMutation({
    mutationFn: async (keyData: { name: string; scopes: string[] }) => {
      const { data, error } = await supabase.rpc('generate_api_key', {
        key_name: keyData.name,
        key_scopes: keyData.scopes
      })
      if (error) throw error
      return data
    },
    onSuccess: (fullKey) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setIsCreateModalOpen(false)
      toast({
        title: "Clé API créée",
        description: `Votre clé : ${fullKey}. Copiez-la maintenant, elle ne sera plus affichée.`,
      })
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" })
    }
  })

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase.from('api_keys').delete().eq('id', keyId).eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast({ title: "Clé supprimée" })
    }
  })

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const s = new Set(prev)
      s.has(keyId) ? s.delete(keyId) : s.add(keyId)
      return s
    })
  }

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
              <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" />Gestion des Clés API</CardTitle>
              <CardDescription>Gérez vos clés API de manière sécurisée</CardDescription>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Nouvelle Clé</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle clé API</DialogTitle>
                  <DialogDescription>Générez une clé API sécurisée</DialogDescription>
                </DialogHeader>
                <CreateKeyForm onSubmit={(d) => createKeyMutation.mutate(d)} isLoading={createKeyMutation.isPending} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Alert><Shield className="h-4 w-4" /><AlertDescription>
        <strong>Sécurité :</strong> Vos clés sont chiffrées (SHA-256). Elles ne sont affichées qu'à la création.
      </AlertDescription></Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{apiKeys.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Actives</p><p className="text-2xl font-bold text-green-600">{apiKeys.filter(k => k.is_active).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Expirées</p><p className="text-2xl font-bold text-red-600">{apiKeys.filter(k => k.expires_at && new Date(k.expires_at) < new Date()).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Clé</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière utilisation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune clé API</TableCell></TableRow>
              ) : apiKeys.map(key => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-1 rounded font-mono">{key.key_preview}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(key.key_preview)}><Copy className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(key.scopes || []).slice(0, 2).map((s: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                      {(key.scopes?.length || 0) > 2 && <Badge variant="secondary" className="text-xs">+{key.scopes.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {key.is_active ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{key.last_used ? new Date(key.last_used).toLocaleDateString() : <span className="text-muted-foreground">Jamais</span>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => deleteKeyMutation.mutate(key.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
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

const CreateKeyForm = ({ onSubmit, isLoading }: { onSubmit: (d: { name: string; scopes: string[] }) => void; isLoading: boolean }) => {
  const [name, setName] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit({ name, scopes: ['read:products', 'write:products'] }) }} className="space-y-4">
      <div>
        <Label htmlFor="keyName">Nom de la clé</Label>
        <Input id="keyName" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Intégration Shopify" required />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? 'Création...' : 'Générer la clé'}</Button>
    </form>
  )
}
