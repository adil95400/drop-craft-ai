import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Store, Plus, Globe, TrendingUp, Users, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export default function MultiStoreManager() {
  const queryClient = useQueryClient()
  const [storeName, setStoreName] = useState('')
  const [storeDomain, setStoreDomain] = useState('')

  const { data: stores } = useQuery({
    queryKey: ['user-stores'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return (data || []).map(item => ({
        id: item.id,
        name: item.platform_name || item.platform,
        domain: item.store_url || '',
        status: item.connection_status || 'disconnected',
        created_at: item.created_at
      }))
    }
  })

  const createStoreMutation = useMutation({
    mutationFn: async (storeData: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('integrations')
        .insert({
          platform: 'custom',
          platform_name: storeData.name,
          store_url: storeData.domain,
          user_id: user.id,
          connection_status: 'connected'
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stores'] })
      toast.success('Boutique créée avec succès')
      setStoreName('')
      setStoreDomain('')
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    }
  })

  const handleCreateStore = () => {
    if (!storeName || !storeDomain) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    createStoreMutation.mutate({
      name: storeName,
      domain: storeDomain
    })
  }

  const totalRevenue = 45230
  const totalOrders = 342
  const totalCustomers = 1245

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multi-Store Manager</h1>
          <p className="text-muted-foreground">Gérez toutes vos boutiques depuis un seul tableau de bord</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Boutique
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boutiques Actives</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Toutes en ligne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Toutes boutiques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Uniques</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Base globale</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stores" className="w-full">
        <TabsList>
          <TabsTrigger value="stores">Mes Boutiques</TabsTrigger>
          <TabsTrigger value="create">Créer une Boutique</TabsTrigger>
          <TabsTrigger value="settings">Paramètres Globaux</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          {stores?.map((store) => (
            <Card key={store.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{store.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{store.domain}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant={store.status === 'active' ? 'default' : 'secondary'}>
                        {store.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Créée le {new Date(store.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Gérer
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Produits</p>
                    <p className="text-lg font-semibold">158</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commandes</p>
                    <p className="text-lg font-semibold">89</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenu</p>
                    <p className="text-lg font-semibold">12,450 €</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!stores || stores.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune boutique créée pour le moment
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Créer une Nouvelle Boutique</CardTitle>
              <CardDescription>Ajoutez une boutique supplémentaire à votre réseau</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Nom de la boutique</Label>
                <Input
                  id="store-name"
                  placeholder="Ma Boutique Mode"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-domain">Domaine / URL</Label>
                <Input
                  id="store-domain"
                  placeholder="ma-boutique.com"
                  value={storeDomain}
                  onChange={(e) => setStoreDomain(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Vous pourrez configurer votre domaine personnalisé plus tard
                </p>
              </div>

              <div className="space-y-2">
                <Label>Niche / Catégorie</Label>
                <Input placeholder="Mode, Électronique, Maison..." />
              </div>

              <div className="space-y-2">
                <Label>Devise principale</Label>
                <Input placeholder="EUR" defaultValue="EUR" />
              </div>

              <Button onClick={handleCreateStore} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Créer la boutique
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fonctionnalités Multi-Store</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Gestion centralisée de l'inventaire
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Tableau de bord unifié pour toutes les boutiques
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Synchronisation automatique des produits
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Gestion des commandes multi-boutiques
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Analytics globales et par boutique
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Globaux</CardTitle>
              <CardDescription>Configuration partagée entre toutes vos boutiques</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email de contact principal</Label>
                <Input placeholder="contact@monreseau.com" />
              </div>

              <div className="space-y-2">
                <Label>Politique de retour globale</Label>
                <Input placeholder="30 jours satisfait ou remboursé" />
              </div>

              <div className="space-y-2">
                <Label>Fournisseurs partagés</Label>
                <p className="text-sm text-muted-foreground">
                  Gérez vos fournisseurs une fois pour toutes les boutiques
                </p>
              </div>

              <Button className="w-full">
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
