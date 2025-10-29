import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Key, Copy, Trash2, Plus, Shield, Globe, Activity, Check, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface APIKey {
  id: string;
  name: string;
  key: string;
  is_active: boolean;
  rate_limit: number;
  rate_limit_window: string;
  scopes: string[];
  environment: string;
  allowed_ips: string[];
  last_used_at: string | null;
  last_used_ip: string | null;
  created_at: string;
}

const AVAILABLE_SCOPES = [
  { value: 'read:products', label: 'Lire les produits' },
  { value: 'write:products', label: 'Écrire les produits' },
  { value: 'read:orders', label: 'Lire les commandes' },
  { value: 'write:orders', label: 'Écrire les commandes' },
  { value: 'read:customers', label: 'Lire les clients' },
  { value: 'write:customers', label: 'Écrire les clients' },
  { value: 'read:analytics', label: 'Lire les analytics' },
  { value: 'webhooks:manage', label: 'Gérer les webhooks' }
];

export function AdvancedAPIKeyManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState({
    name: '',
    environment: 'production',
    scopes: ['read:products', 'write:products'] as string[],
    rate_limit: 1000,
    allowed_ips: [] as string[]
  });
  
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['advanced-api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as APIKey[];
    }
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      const { data: keyData, error: keyError } = await supabase.rpc('generate_api_key');
      if (keyError) throw keyError;

      const { error } = await supabase.from('api_keys').insert({
        key: keyData,
        is_active: true,
        user_id: (await supabase.auth.getUser()).data.user!.id
      } as any);

      if (error) throw error;
      return keyData;
    },
    onSuccess: (keyData) => {
      queryClient.invalidateQueries({ queryKey: ['advanced-api-keys'] });
      toast.success('Clé API créée avec succès');
      setCopiedKey(keyData);
      setIsCreateOpen(false);
      setNewKey({
        name: '',
        environment: 'production',
        scopes: ['read:products', 'write:products'],
        rate_limit: 1000,
        allowed_ips: []
      });
    },
    onError: () => {
      toast.error('Erreur lors de la création de la clé');
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-api-keys'] });
      toast.success('Clé API supprimée');
    }
  });

  const toggleKeyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-api-keys'] });
      toast.success('Statut mis à jour');
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Clé copiée !');
  };

  const toggleScope = (scope: string) => {
    setNewKey(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope]
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Gestion des Clés API
              </CardTitle>
              <CardDescription>
                Créez et gérez vos clés API avec contrôle d'accès avancé
              </CardDescription>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Clé
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle clé API</DialogTitle>
                  <DialogDescription>
                    Configurez les permissions et les limites pour votre clé API
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Nom de la clé</Label>
                    <Input
                      placeholder="Ex: Production API"
                      value={newKey.name}
                      onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Environnement</Label>
                      <Select value={newKey.environment} onValueChange={(v) => setNewKey({ ...newKey, environment: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="development">Développement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Limite de requêtes/heure</Label>
                      <Input
                        type="number"
                        value={newKey.rate_limit}
                        onChange={(e) => setNewKey({ ...newKey, rate_limit: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Permissions (Scopes)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {AVAILABLE_SCOPES.map((scope) => (
                        <div key={scope.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={scope.value}
                            checked={newKey.scopes.includes(scope.value)}
                            onCheckedChange={() => toggleScope(scope.value)}
                          />
                          <Label htmlFor={scope.value} className="cursor-pointer text-sm">
                            {scope.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={() => createKeyMutation.mutate()} disabled={!newKey.name || createKeyMutation.isPending}>
                    {createKeyMutation.isPending ? 'Création...' : 'Créer la clé'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {copiedKey && (
            <Card className="mb-4 bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 mb-2">Clé créée avec succès !</p>
                    <p className="text-sm text-green-800 mb-3">
                      Copiez cette clé maintenant, elle ne sera plus affichée.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-white rounded border text-sm">
                        {copiedKey}
                      </code>
                      <Button size="sm" onClick={() => copyToClipboard(copiedKey)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <p>Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Environnement</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Dernière utilisation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys?.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {key.key.substring(0, 10)}...{key.key.substring(key.key.length - 4)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{key.environment}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes?.slice(0, 2).map((scope) => (
                          <Badge key={scope} variant="secondary" className="text-xs">
                            {scope.split(':')[1]}
                          </Badge>
                        ))}
                        {key.scopes?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{key.scopes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{key.rate_limit}/h</span>
                    </TableCell>
                    <TableCell>
                      {key.last_used_at ? (
                        <div>
                          <p className="text-sm">
                            {new Date(key.last_used_at).toLocaleDateString('fr-FR')}
                          </p>
                          {key.last_used_ip && (
                            <p className="text-xs text-muted-foreground">{key.last_used_ip}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Jamais</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyMutation.mutate({ id: key.id, isActive: key.is_active })}
                      >
                        {key.is_active ? (
                          <Badge className="bg-green-500">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteKeyMutation.mutate(key.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
