/**
 * Page API & Tokens - Version Premium
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useApiKeys } from '@/hooks/useApiKeys';
import { 
  Key, Plus, Copy, Eye, EyeOff, Trash2, RefreshCw, Shield, Clock, 
  AlertCircle, CheckCircle2, Code, Book, Webhook, Database, PlayCircle,
  ExternalLink, Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { toast } from 'sonner';

export default function ExtensionAPIPage() {
  const locale = useDateFnsLocale();
  const { apiKeys, loading, generateApiKey, deleteApiKey, toggleApiKey, refetch } = useApiKeys();
  const [activeTab, setActiveTab] = useState('keys');
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['read']);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Veuillez entrer un nom pour la clé');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateApiKey(newKeyName, newKeyScopes);
      if (result?.fullKey) {
        setGeneratedKey(result.fullKey);
      }
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Clé copiée dans le presse-papier');
  };

  const handleCloseNewKeyDialog = () => {
    setShowNewKeyDialog(false);
    setNewKeyName('');
    setNewKeyScopes(['read']);
    setGeneratedKey(null);
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

  const apiEndpoints = [
    { method: 'GET', path: '/api/v1/products', description: 'Liste des produits', auth: 'read' },
    { method: 'POST', path: '/api/v1/products', description: 'Créer un produit', auth: 'write' },
    { method: 'PUT', path: '/api/v1/products/:id', description: 'Modifier un produit', auth: 'write' },
    { method: 'DELETE', path: '/api/v1/products/:id', description: 'Supprimer un produit', auth: 'write' },
    { method: 'GET', path: '/api/v1/orders', description: 'Liste des commandes', auth: 'read' },
    { method: 'POST', path: '/api/v1/webhooks', description: 'Configurer webhook', auth: 'admin' },
  ];

  const stats = {
    totalKeys: apiKeys.length,
    activeKeys: apiKeys.filter(k => k.is_active).length,
    recentlyUsed: apiKeys.filter(k => k.last_used_at && new Date(k.last_used_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
  };

  return (
    <ChannablePageWrapper
      title="API & Tokens"
      description="Gérez vos clés API et intégrez ShopOpti à vos applications"
      heroImage="extensions"
      badge={{ label: "API", icon: Key }}
      actions={
        <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle clé API
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Générer une nouvelle clé API</DialogTitle>
              <DialogDescription>
                {generatedKey 
                  ? "Copiez cette clé maintenant. Elle ne sera plus visible après."
                  : "Créez une clé API pour accéder à l'API ShopOpti."
                }
              </DialogDescription>
            </DialogHeader>
            
            {generatedKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">Clé générée avec succès</span>
                  </div>
                  <code className="block p-3 bg-white dark:bg-gray-900 rounded border text-sm font-mono break-all">
                    {generatedKey}
                  </code>
                </div>
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    Cette clé ne sera plus visible après fermeture de cette fenêtre
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleCopyKey(generatedKey)} className="flex-1 gap-2">
                    <Copy className="h-4 w-4" />
                    Copier la clé
                  </Button>
                  <Button variant="outline" onClick={handleCloseNewKeyDialog}>
                    Fermer
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="keyName">Nom de la clé</Label>
                    <Input
                      id="keyName"
                      placeholder="Ex: Production API, Integration Shopify..."
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['read', 'write', 'admin'].map(scope => (
                        <Button
                          key={scope}
                          size="sm"
                          variant={newKeyScopes.includes(scope) ? 'default' : 'outline'}
                          onClick={() => {
                            setNewKeyScopes(prev => 
                              prev.includes(scope) 
                                ? prev.filter(s => s !== scope)
                                : [...prev, scope]
                            );
                          }}
                        >
                          {scope === 'read' && 'Lecture'}
                          {scope === 'write' && 'Écriture'}
                          {scope === 'admin' && 'Admin'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseNewKeyDialog}>Annuler</Button>
                  <Button onClick={handleGenerateKey} disabled={isGenerating}>
                    {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                    Générer
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clés API</p>
                <div className="text-3xl font-bold">{stats.totalKeys}</div>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Key className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="pt-6">
            <p className="text-sm text-green-700">Clés Actives</p>
            <div className="text-3xl font-bold text-green-700">{stats.activeKeys}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Utilisées (7j)</p>
            <div className="text-3xl font-bold">{stats.recentlyUsed}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="keys">Mes Clés API</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          {loading ? (
            <Card className="animate-pulse"><CardContent className="h-32" /></Card>
          ) : apiKeys.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucune clé API</h3>
                <p className="text-muted-foreground mb-4">Créez votre première clé pour commencer à utiliser l'API</p>
                <Button onClick={() => setShowNewKeyDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer une clé API
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key, idx) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={cn(!key.is_active && 'opacity-60')}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'p-2 rounded-lg',
                            key.is_active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
                          )}>
                            <Key className={cn('h-5 w-5', key.is_active ? 'text-green-600' : 'text-gray-400')} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{key.name}</h4>
                              {key.is_active ? (
                                <Badge variant="outline" className="text-green-600 border-green-200">Actif</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">Inactif</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                                {key.key_prefix || key.key.substring(0, 12)}...
                              </code>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Créée {format(new Date(key.created_at), 'dd MMM yyyy', { locale })}
                              </span>
                              {key.last_used_at && (
                                <span>Dernière utilisation: {format(new Date(key.last_used_at), 'dd MMM', { locale })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {key.scopes?.map(scope => (
                              <Badge key={scope} variant="secondary" className="text-xs">{scope}</Badge>
                            ))}
                          </div>
                          <Switch 
                            checked={key.is_active} 
                            onCheckedChange={(checked) => toggleApiKey(key.id, checked)}
                          />
                          <Button size="icon" variant="ghost" onClick={() => deleteApiKey(key.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Endpoints API
              </CardTitle>
              <CardDescription>Documentation des endpoints disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiEndpoints.map((endpoint, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant={endpoint.method === 'GET' ? 'secondary' : endpoint.method === 'DELETE' ? 'destructive' : 'default'}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                      <Badge variant="outline">{endpoint.auth}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exemple d'utilisation</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
{`curl -X GET "https://api.shopopti.io/v1/products" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardContent className="py-12 text-center">
              <Webhook className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Configuration des Webhooks</h3>
              <p className="text-muted-foreground mb-4">
                Recevez des notifications en temps réel pour les événements de votre compte
              </p>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un webhook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
