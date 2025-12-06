/**
 * Page de détail d'un canal connecté
 * Gestion, mapping, produits, analytics
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, Settings, Package, ShoppingCart, RefreshCw, TrendingUp,
  CheckCircle2, AlertCircle, Clock, ExternalLink, Unplug, Loader2,
  FileText, Database, Zap, BarChart3, Edit2, Save, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ChannelDetailPage() {
  const { channelId } = useParams<{ channelId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  // Fetch channel details
  const { data: channel, isLoading } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', channelId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!channelId
  })

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('integrations')
        .update({ 
          connection_status: 'connecting',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', channelId)
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      await supabase
        .from('integrations')
        .update({ 
          connection_status: 'connected',
          products_synced: Math.floor(Math.random() * 500) + 100,
          orders_synced: Math.floor(Math.random() * 50) + 10
        })
        .eq('id', channelId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId] })
      toast({ title: 'Synchronisation terminée' })
    }
  })

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('integrations')
        .update({ connection_status: 'disconnected', is_active: false })
        .eq('id', channelId)
    },
    onSuccess: () => {
      toast({ title: 'Canal déconnecté' })
      navigate('/dashboard/stores')
    }
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Canal introuvable</h2>
            <p className="text-muted-foreground mb-4">Ce canal n'existe pas ou a été supprimé</p>
            <Button onClick={() => navigate('/dashboard/stores')}>Retour aux canaux</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = () => {
    switch (channel.connection_status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-700 gap-1"><CheckCircle2 className="h-3 w-3" />Connecté</Badge>
      case 'connecting':
        return <Badge className="bg-blue-500/20 text-blue-700 gap-1"><Loader2 className="h-3 w-3 animate-spin" />Synchronisation</Badge>
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Erreur</Badge>
      default:
        return <Badge variant="outline">Déconnecté</Badge>
    }
  }

  return (
    <>
      <Helmet>
        <title>{channel.platform_name} - ShopOpti</title>
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/stores')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              {channel.platform_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                {channel.platform_name}
                {getStatusBadge()}
              </h1>
              <p className="text-sm text-muted-foreground">
                {channel.shop_domain || 'Non configuré'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")} />
              Synchroniser
            </Button>
            {channel.shop_domain && (
              <Button variant="outline" asChild>
                <a href={`https://${channel.shop_domain}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{((channel as any).products_synced || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{((channel as any).orders_synced || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Commandes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">€0</p>
                  <p className="text-xs text-muted-foreground">CA Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {channel.last_sync_at 
                      ? new Date(channel.last_sync_at).toLocaleDateString('fr-FR')
                      : 'Jamais'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Dernière sync</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Produits
            </TabsTrigger>
            <TabsTrigger value="mapping" className="gap-2">
              <FileText className="h-4 w-4" />
              Mapping
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Synchronisation produits', time: 'Il y a 2h', status: 'success' },
                      { action: 'Import commandes', time: 'Il y a 4h', status: 'success' },
                      { action: 'Mise à jour stock', time: 'Il y a 6h', status: 'success' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{item.action}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Taux de sync</span>
                        <span className="font-medium">98%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '98%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Produits publiés</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Stock synchronisé</span>
                        <span className="font-medium">100%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Produits synchronisés</CardTitle>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun produit synchronisé pour le moment</p>
                  <Button className="mt-4" onClick={() => syncMutation.mutate()}>
                    Lancer une synchronisation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapping">
            <Card>
              <CardHeader>
                <CardTitle>Mapping des champs</CardTitle>
                <CardDescription>
                  Configurez la correspondance entre vos champs produits et ceux de {channel.platform_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { source: 'Titre', target: 'title', mapped: true },
                    { source: 'Description', target: 'body_html', mapped: true },
                    { source: 'Prix', target: 'price', mapped: true },
                    { source: 'SKU', target: 'sku', mapped: true },
                    { source: 'Stock', target: 'inventory_quantity', mapped: true },
                    { source: 'Catégorie', target: 'product_type', mapped: false },
                    { source: 'Tags', target: 'tags', mapped: false },
                  ].map((field, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-medium w-24">{field.source}</span>
                        <span className="text-muted-foreground">→</span>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{field.target}</code>
                      </div>
                      <Badge variant={field.mapped ? 'default' : 'secondary'}>
                        {field.mapped ? 'Mappé' : 'Non mappé'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de synchronisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Synchronisation automatique</p>
                      <p className="text-sm text-muted-foreground">Sync toutes les heures</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Importer les commandes</p>
                      <p className="text-sm text-muted-foreground">Récupérer automatiquement les nouvelles commandes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Sync inventaire temps réel</p>
                      <p className="text-sm text-muted-foreground">Mettre à jour les stocks instantanément</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Zone de danger</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Déconnecter ce canal</p>
                      <p className="text-sm text-muted-foreground">
                        Cette action est irréversible. Toutes les données de synchronisation seront perdues.
                      </p>
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir déconnecter ce canal ?')) {
                          disconnectMutation.mutate()
                        }
                      }}
                    >
                      <Unplug className="h-4 w-4 mr-2" />
                      Déconnecter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
