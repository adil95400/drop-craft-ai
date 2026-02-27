import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function APIKeyManager() {
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate secure API key
      const { data: keyData, error: keyError } = await supabase.rpc('generate_api_key');
      if (keyError) throw keyError;

      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          name,
          key: keyData as string,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setShowNewKey(data.key);
      setNewKeyName('');
      toast({
        title: 'Clé API créée',
        description: 'Copiez-la maintenant, elle ne sera plus affichée',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({ title: 'Clé API supprimée' });
      setKeyToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + '•'.repeat(24) + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Gestion des Clés API
          </CardTitle>
          <CardDescription>
            Créez et gérez vos clés API pour accéder à l'API publique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label>Nom de la clé</Label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Ex: Production API Key"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => createKeyMutation.mutate(newKeyName)}
                disabled={!newKeyName || createKeyMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer une clé
              </Button>
            </div>
          </div>

          {showNewKey && (
            <Card className="bg-success/10 border-success">
              <CardContent className="pt-4">
                <Label className="text-success font-semibold">
                  ⚠️ Nouvelle clé API (copiez-la maintenant!)
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 bg-muted p-3 rounded text-sm">
                    {showNewKey}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(showNewKey, 'new')}
                  >
                    {copied === 'new' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cette clé ne sera plus affichée. Stockez-la en lieu sûr.
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setShowNewKey(null)}
                >
                  J'ai copié la clé
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-6 text-muted-foreground">
                Chargement...
              </div>
            ) : apiKeys && apiKeys.length > 0 ? (
              apiKeys.map((key) => (
                <Card key={key.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{key.name}</h3>
                          <Badge variant={key.is_active ? 'default' : 'secondary'}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {visibleKeys.has(key.id) ? key.key : maskKey(key.key)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleKeyVisibility(key.id)}
                          >
                            {visibleKeys.has(key.id) ? 
                              <EyeOff className="h-3 w-3" /> : 
                              <Eye className="h-3 w-3" />
                            }
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(key.key, key.id)}
                          >
                            {copied === key.id ? 
                              <Check className="h-3 w-3" /> : 
                              <Copy className="h-3 w-3" />
                            }
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Créée le {new Date(key.created_at).toLocaleDateString('fr-FR')}
                          {key.last_used_at && ` • Dernière utilisation: ${new Date(key.last_used_at).toLocaleDateString('fr-FR')}`}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setKeyToDelete(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Aucune clé API. Créez-en une pour commencer.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette clé API?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les applications utilisant cette clé ne pourront plus accéder à l'API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => keyToDelete && deleteKeyMutation.mutate(keyToDelete)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
