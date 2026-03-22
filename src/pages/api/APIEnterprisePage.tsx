import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, Shield, Zap, BarChart3, BookOpen, Copy, Eye, EyeOff, 
  Plus, Trash2, Code, Globe, CheckCircle2, AlertTriangle 
} from 'lucide-react';

const RATE_LIMIT_TIERS = [
  { plan: 'free', label: 'Free', rpm: 60, daily: 1000, monthly: 10000, color: 'text-muted-foreground' },
  { plan: 'pro', label: 'Pro', rpm: 300, daily: 10000, monthly: 100000, color: 'text-info' },
  { plan: 'ultra_pro', label: 'Ultra Pro', rpm: 1000, daily: 50000, monthly: 500000, color: 'text-purple-500' },
  { plan: 'enterprise', label: 'Enterprise', rpm: 5000, daily: -1, monthly: -1, color: 'text-warning' },
];

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/products', desc: 'Lister les produits', scopes: ['products:read'] },
  { method: 'POST', path: '/api/v1/products', desc: 'Créer un produit', scopes: ['products:write'] },
  { method: 'PATCH', path: '/api/v1/products/:id', desc: 'Mettre à jour un produit', scopes: ['products:write'] },
  { method: 'DELETE', path: '/api/v1/products/:id', desc: 'Supprimer un produit', scopes: ['products:write'] },
  { method: 'GET', path: '/api/v1/orders', desc: 'Lister les commandes', scopes: ['orders:read'] },
  { method: 'POST', path: '/api/v1/orders', desc: 'Créer une commande', scopes: ['orders:write'] },
  { method: 'PATCH', path: '/api/v1/orders/:id', desc: 'Mettre à jour une commande', scopes: ['orders:write'] },
  { method: 'GET', path: '/api/v1/customers', desc: 'Lister les clients', scopes: ['customers:read'] },
  { method: 'GET', path: '/api/v1/analytics/kpis', desc: 'KPIs en temps réel', scopes: ['analytics:read'] },
  { method: 'GET', path: '/api/v1/analytics/activity', desc: 'Flux d\'activité', scopes: ['analytics:read'] },
  { method: 'POST', path: '/api/v1/webhooks', desc: 'Créer un webhook', scopes: ['webhooks:write'] },
  { method: 'GET', path: '/api/v1/inventory', desc: 'État du stock', scopes: ['products:read'] },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  POST: 'bg-info/10 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PATCH: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-destructive/10 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function APIEnterprisePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['products:read']);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const currentPlan = profile?.subscription_plan || 'free';
  const currentTier = RATE_LIMIT_TIERS.find(t => t.plan === currentPlan) || RATE_LIMIT_TIERS[0];

  // Fetch API keys from DB
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch API logs
  const { data: apiLogs = [] } = useQuery({
    queryKey: ['api-logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Create API key via RPC
  const createKey = useMutation({
    mutationFn: async ({ name, scopes }: { name: string; scopes: string[] }) => {
      const { data, error } = await supabase.rpc('generate_api_key', {
        key_name: name,
        key_scopes: scopes,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (fullKey) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setShowCreateDialog(false);
      setNewKeyName('');
      toast({
        title: '🔑 Clé API créée',
        description: `Copiez-la maintenant, elle ne sera plus visible : ${fullKey.substring(0, 20)}...`,
      });
      navigator.clipboard.writeText(fullKey);
    },
    onError: (e: Error) => {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    },
  });

  // Revoke key
  const revokeKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({ title: '🗑️ Clé révoquée' });
    },
  });

  const activeKeys = apiKeys.filter((k: any) => k.is_active);

  const allScopes = ['products:read', 'products:write', 'orders:read', 'orders:write', 'customers:read', 'customers:write', 'analytics:read', 'webhooks:write'];

  return (
    <>
      <Helmet>
        <title>API Enterprise - Console Développeur</title>
        <meta name="description" content="Gérez vos clés API, rate limits et intégrations Enterprise" />
      </Helmet>
      <ChannablePageWrapper
        title={tPages('apiEnterprise.title')}
        description="Console développeur avec clés API, rate limits augmentés et documentation complète"
        heroImage="schema"
        badge={{ label: 'Enterprise', icon: Shield }}
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Key className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Clés actives</p>
                <p className="text-xl font-bold">{activeKeys.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Rate limit</p>
                <p className="text-xl font-bold">{currentTier.rpm}/min</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-info" />
              <div>
                <p className="text-sm text-muted-foreground">Requêtes ce mois</p>
                <p className="text-xl font-bold">{apiLogs.length > 0 ? apiLogs.length + '+' : '0'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Globe className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className={`text-xl font-bold capitalize ${currentTier.color}`}>{currentTier.label}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="keys">Clés API</TabsTrigger>
            <TabsTrigger value="limits">Rate Limits</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Gestion des clés API</h2>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Nouvelle clé</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une clé API</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nom</Label>
                      <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Production API" />
                    </div>
                    <div>
                      <Label>Scopes</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {allScopes.map(scope => (
                          <label key={scope} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedScopes.includes(scope)}
                              onChange={e => {
                                setSelectedScopes(prev =>
                                  e.target.checked ? [...prev, scope] : prev.filter(s => s !== scope)
                                );
                              }}
                              className="rounded"
                            />
                            <code>{scope}</code>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      disabled={!newKeyName || selectedScopes.length === 0 || createKey.isPending}
                      onClick={() => createKey.mutate({ name: newKeyName, scopes: selectedScopes })}
                    >
                      {createKey.isPending ? 'Création...' : 'Créer la clé'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : apiKeys.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Key className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Aucune clé API. Créez-en une pour commencer.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key: any) => (
                  <Card key={key.id} className={!key.is_active ? 'opacity-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{key.name}</span>
                        </div>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Active' : 'Révoquée'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          value={visibleKeys.has(key.id) ? key.key : '••••••••••••••••'}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button size="icon" variant="ghost" onClick={() => {
                          setVisibleKeys(prev => {
                            const next = new Set(prev);
                            next.has(key.id) ? next.delete(key.id) : next.add(key.id);
                            return next;
                          });
                        }}>
                          {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => {
                          navigator.clipboard.writeText(key.key);
                          toast({ title: 'Copié !' });
                        }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {(key.scopes || []).map((s: string) => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                        {key.is_active && (
                          <Button size="sm" variant="destructive" onClick={() => revokeKey.mutate(key.id)}>
                            <Trash2 className="h-3 w-3 mr-1" />Révoquer
                          </Button>
                        )}
                      </div>
                      {key.last_used_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Dernière utilisation : {new Date(key.last_used_at).toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rate Limits Tab */}
          <TabsContent value="limits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Rate Limits par Plan
                </CardTitle>
                <CardDescription>Limites de requêtes selon votre abonnement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {RATE_LIMIT_TIERS.map(tier => {
                    const isCurrent = tier.plan === currentPlan;
                    return (
                      <div
                        key={tier.plan}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          isCurrent ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-lg ${tier.color}`}>{tier.label}</span>
                            {isCurrent && <Badge>Votre plan</Badge>}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Par minute</p>
                            <p className="font-semibold">{tier.rpm} req/min</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Par jour</p>
                            <p className="font-semibold">{tier.daily === -1 ? 'Illimité' : tier.daily.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Par mois</p>
                            <p className="font-semibold">{tier.monthly === -1 ? 'Illimité' : tier.monthly.toLocaleString()}</p>
                          </div>
                        </div>
                        {isCurrent && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Utilisation estimée</span>
                              <span>{apiLogs.length} / {tier.monthly === -1 ? '∞' : tier.monthly.toLocaleString()}</span>
                            </div>
                            <Progress value={tier.monthly === -1 ? 5 : Math.min((apiLogs.length / tier.monthly) * 100, 100)} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Endpoints API REST
                </CardTitle>
                <CardDescription>{API_ENDPOINTS.length} endpoints disponibles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {API_ENDPOINTS.map((ep, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge className={METHOD_COLORS[ep.method] || ''}>{ep.method}</Badge>
                      <code className="text-sm font-mono">{ep.path}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground hidden md:inline">{ep.desc}</span>
                      {ep.scopes.map(s => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <p className="text-muted-foreground"># Exemple d'appel authentifié</p>
                  <p className="mt-1">curl -X GET \</p>
                  <p className="pl-4">-H "Authorization: Bearer YOUR_API_KEY" \</p>
                  <p className="pl-4">-H "Content-Type: application/json" \</p>
                  <p className="pl-4">https://api.shopopti.io/v1/products?limit=20</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Logs API récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {apiLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun log API récent</p>
                ) : (
                  <div className="space-y-2">
                    {apiLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-16">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                          <Badge className={METHOD_COLORS[log.method || 'GET'] || ''}>
                            {log.method || 'GET'}
                          </Badge>
                          <code className="text-xs">{log.endpoint}</code>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.status_code && (
                            <Badge variant={log.status_code < 400 ? 'default' : 'destructive'}>
                              {log.status_code}
                            </Badge>
                          )}
                          {log.duration_ms && (
                            <span className="text-xs text-muted-foreground">{log.duration_ms}ms</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
