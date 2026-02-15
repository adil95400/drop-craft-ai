import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, Plus, ShoppingCart, Zap, Target } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export default function UpsellManager() {
  const [triggerType, setTriggerType] = useState('cart')
  const [discountPercent, setDiscountPercent] = useState('10')

  const { data: products } = useQuery({
    queryKey: ['products-upsell'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
        .limit(50)
      
      if (error) throw error
      return data || []
    }
  })

  const handleCreateRule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Non authentifié')
        return
      }
      
      // Créer la règle dans la base de données
      const { error } = await supabase.from('automation_workflows').insert({
        user_id: user.id,
        name: `Règle upsell - ${triggerType}`,
        trigger_type: triggerType,
        action_type: 'upsell',
        trigger_config: { discount_percent: parseFloat(discountPercent) },
        action_config: { trigger: triggerType },
        is_active: true
      } as any)
      
      if (error) throw error
      toast.success('Règle d\'upsell créée avec succès')
    } catch (error) {
      console.error('Erreur création règle:', error)
      toast.error('Erreur lors de la création de la règle')
    }
  }

  const upsellStrategies = [
    {
      title: 'Upsell au panier',
      description: 'Proposez des produits complémentaires lorsque le client ajoute au panier',
      trigger: 'add_to_cart',
      icon: ShoppingCart,
      color: 'text-blue-500'
    },
    {
      title: 'Bundle automatique',
      description: 'Créez des bundles avec réduction pour augmenter le panier moyen',
      trigger: 'bundle',
      icon: Plus,
      color: 'text-green-500'
    },
    {
      title: 'Offre post-achat',
      description: 'Proposez une offre exclusive juste après la commande',
      trigger: 'post_purchase',
      icon: Zap,
      color: 'text-orange-500'
    }
  ]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upsell & Cross-sell</h1>
        <p className="text-muted-foreground">Maximisez votre revenu par commande avec des offres intelligentes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127.50 €</div>
            <p className="text-xs text-muted-foreground">+18% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Acceptation</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32.4%</div>
            <p className="text-xs text-muted-foreground">Des offres upsell</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Additionnel</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,250 €</div>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {upsellStrategies.map((strategy) => {
          const Icon = strategy.icon
          return (
            <Card key={strategy.trigger}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${strategy.color}`} />
                  <CardTitle className="text-lg">{strategy.title}</CardTitle>
                </div>
                <CardDescription>{strategy.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Statut</span>
                    <Switch defaultChecked />
                  </div>
                  <Button variant="outline" className="w-full">
                    Configurer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Créer une Règle d'Upsell</CardTitle>
          <CardDescription>Configurez une nouvelle offre d'upsell ou cross-sell intelligente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type de déclencheur</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cart">Ajout au panier</SelectItem>
                  <SelectItem value="checkout">Page de paiement</SelectItem>
                  <SelectItem value="post_purchase">Après achat</SelectItem>
                  <SelectItem value="product_view">Vue produit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Produit principal</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products?.slice(0, 10).map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.product_id || product.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Produit upsell</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products?.slice(0, 10).map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.product_id || product.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Réduction (%)</Label>
              <Input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message d'offre</Label>
            <Input placeholder="Complétez votre commande avec cet article à -10% !" />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="show-badge" />
            <Label htmlFor="show-badge">Afficher un badge "Offre spéciale"</Label>
          </div>

          <Button onClick={handleCreateRule} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Créer la règle d'upsell
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Règles Actives</CardTitle>
          <CardDescription>Gérez vos règles d'upsell et cross-sell existantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Bundle Accessoires</h4>
                <p className="text-sm text-muted-foreground">Panier moyen augmenté de 23%</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">Actif</Badge>
                <Button size="sm" variant="outline">Modifier</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Produits Similaires</h4>
                <p className="text-sm text-muted-foreground">Taux d'acceptation: 28%</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">Actif</Badge>
                <Button size="sm" variant="outline">Modifier</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Offre Post-Achat</h4>
                <p className="text-sm text-muted-foreground">142 conversions ce mois</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">Actif</Badge>
                <Button size="sm" variant="outline">Modifier</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
