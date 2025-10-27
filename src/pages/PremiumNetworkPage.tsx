import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Crown, ShoppingBag, Truck, Globe, Star, Zap, Shield, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Supplier {
  id: string
  name: string
  logo: string
  description: string
  category: string
  products: number
  avgShipping: string
  locations: string[]
  rating: number
  exclusive: boolean
  minOrder: string
  features: string[]
  status: 'active' | 'coming_soon'
}

const premiumSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'AliExpress Premium',
    logo: '🏆',
    description: 'Fournisseurs vérifiés avec expédition EU rapide',
    category: 'Généraliste',
    products: 50000,
    avgShipping: '5-7 jours',
    locations: ['EU', 'UK', 'US'],
    rating: 4.8,
    exclusive: true,
    minOrder: '0€',
    features: ['Expédition EU', 'Support 24/7', 'Garantie qualité', 'Marges exclusives'],
    status: 'active'
  },
  {
    id: '2',
    name: 'CJ Dropshipping',
    logo: '🚀',
    description: 'Fulfillment professionnel avec entrepôts EU/US',
    category: 'Fulfillment',
    products: 100000,
    avgShipping: '3-5 jours',
    locations: ['EU', 'US', 'CN'],
    rating: 4.9,
    exclusive: true,
    minOrder: '0€',
    features: ['Fulfillment auto', 'POD gratuit', 'Branding personnalisé', 'API directe'],
    status: 'active'
  },
  {
    id: '3',
    name: 'Spocket EU',
    logo: '⚡',
    description: 'Fournisseurs EU/US uniquement - Livraison ultra-rapide',
    category: 'Local',
    products: 5000,
    avgShipping: '2-3 jours',
    locations: ['EU', 'US'],
    rating: 4.7,
    exclusive: false,
    minOrder: '50€',
    features: ['Livraison express', 'Fournisseurs locaux', 'Produits premium', 'Marges élevées'],
    status: 'active'
  },
  {
    id: '4',
    name: 'Printful POD',
    logo: '🎨',
    description: 'Print-on-demand premium pour produits personnalisés',
    category: 'POD',
    products: 300,
    avgShipping: '4-6 jours',
    locations: ['EU', 'US', 'UK'],
    rating: 4.9,
    exclusive: false,
    minOrder: '0€',
    features: ['Design studio', 'Mockups auto', 'Branding complet', 'Intégration native'],
    status: 'active'
  },
  {
    id: '5',
    name: 'Faire Wholesale',
    logo: '💎',
    description: 'Marques artisanales et produits uniques haut de gamme',
    category: 'Premium',
    products: 15000,
    avgShipping: '5-7 jours',
    locations: ['US', 'EU'],
    rating: 4.8,
    exclusive: true,
    minOrder: '200€',
    features: ['Produits uniques', 'Marques exclusives', 'Net 60 terms', 'Marges 50%+'],
    status: 'coming_soon'
  },
  {
    id: '6',
    name: 'BigBuy B2B',
    logo: '🏭',
    description: 'Grossiste B2B européen avec stock permanent',
    category: 'Grossiste',
    products: 80000,
    avgShipping: '2-4 jours',
    locations: ['EU'],
    rating: 4.6,
    exclusive: false,
    minOrder: '0€',
    features: ['Stock EU', 'Livraison rapide', 'Dropshipping', 'API avancée'],
    status: 'active'
  },
  {
    id: '7',
    name: 'Modalyst Luxury',
    logo: '👑',
    description: 'Marques de luxe et designers - Produits premium',
    category: 'Luxe',
    products: 2000,
    avgShipping: '5-10 jours',
    locations: ['US', 'EU'],
    rating: 4.9,
    exclusive: true,
    minOrder: '100€',
    features: ['Marques luxe', 'Authentification', 'Packaging premium', 'Marges 60%+'],
    status: 'coming_soon'
  },
  {
    id: '8',
    name: 'Banggood Pro',
    logo: '🔥',
    description: 'Tech & gadgets innovants avec expédition EU',
    category: 'Tech',
    products: 30000,
    avgShipping: '7-10 jours',
    locations: ['CN', 'EU'],
    rating: 4.5,
    exclusive: false,
    minOrder: '0€',
    features: ['Nouveautés tech', 'Prix compétitifs', 'Stock EU', 'Support technique'],
    status: 'active'
  },
  {
    id: '9',
    name: 'Temu Business',
    logo: '🎯',
    description: 'Prix ultra-compétitifs avec programme revendeur',
    category: 'Discount',
    products: 100000,
    avgShipping: '10-15 jours',
    locations: ['CN'],
    rating: 4.3,
    exclusive: true,
    minOrder: '0€',
    features: ['Prix mini', 'Cashback', 'Programme B2B', 'Deals exclusifs'],
    status: 'coming_soon'
  },
  {
    id: '10',
    name: 'Oberlo Premium',
    logo: '🌟',
    description: 'Catalogue curé de produits gagnants validés',
    category: 'Curé',
    products: 10000,
    avgShipping: '7-12 jours',
    locations: ['CN', 'US'],
    rating: 4.7,
    exclusive: false,
    minOrder: '0€',
    features: ['Produits validés', 'Import 1-click', 'Analytics', 'Formation incluse'],
    status: 'active'
  }
]

export default function PremiumNetworkPage() {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredSuppliers = selectedCategory === 'all' 
    ? premiumSuppliers 
    : premiumSuppliers.filter(s => s.category.toLowerCase().includes(selectedCategory.toLowerCase()))

  const handleConnect = (supplier: Supplier) => {
    if (supplier.status === 'coming_soon') {
      toast({
        title: '🔔 Bientôt disponible',
        description: `${supplier.name} sera disponible prochainement. Vous serez notifié!`
      })
    } else {
      toast({
        title: '✅ Connexion en cours',
        description: `Configuration de ${supplier.name}...`,
      })
    }
  }

  const stats = {
    totalSuppliers: premiumSuppliers.filter(s => s.status === 'active').length,
    totalProducts: premiumSuppliers.reduce((acc, s) => acc + s.products, 0),
    avgShipping: '5-7 jours',
    exclusive: premiumSuppliers.filter(s => s.exclusive).length
  }

  return (
    <>
      <Helmet>
        <title>Réseau Fournisseurs Premium - Deals Exclusifs</title>
        <meta name="description" content="10+ fournisseurs premium avec marges exclusives et livraison rapide EU/US" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="h-8 w-8 text-primary" />
              Réseau Fournisseurs Premium
            </h1>
            <p className="text-muted-foreground mt-2">
              {stats.totalSuppliers} fournisseurs • {stats.totalProducts.toLocaleString()} produits • Livraison moyenne {stats.avgShipping}
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Shield className="h-4 w-4 mr-2" />
            Avantage Compétitif Direct
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSuppliers}</p>
                <p className="text-sm text-muted-foreground">Fournisseurs Actifs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Produits Disponibles</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.avgShipping}</p>
                <p className="text-sm text-muted-foreground">Livraison Moyenne</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.exclusive}</p>
                <p className="text-sm text-muted-foreground">Deals Exclusifs</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
            <TabsTrigger value="local">Local EU/US</TabsTrigger>
            <TabsTrigger value="pod">POD</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
            <TabsTrigger value="tech">Tech</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{supplier.logo}</div>
                      <div>
                        <h3 className="font-bold flex items-center gap-2">
                          {supplier.name}
                          {supplier.exclusive && <Crown className="h-4 w-4 text-yellow-500" />}
                        </h3>
                        <p className="text-sm text-muted-foreground">{supplier.category}</p>
                      </div>
                    </div>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status === 'active' ? 'Actif' : 'Bientôt'}
                    </Badge>
                  </div>

                  <p className="text-sm">{supplier.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {supplier.rating}
                    </span>
                    <span>{supplier.products.toLocaleString()} produits</span>
                  </div>

                  <div className="flex gap-2">
                    {supplier.locations.map(loc => (
                      <Badge key={loc} variant="outline" className="text-xs">
                        {loc}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {supplier.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Zap className="h-3 w-3 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Livraison</p>
                      <p className="font-semibold">{supplier.avgShipping}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Min. commande</p>
                      <p className="font-semibold">{supplier.minOrder}</p>
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => handleConnect(supplier)}
                    disabled={supplier.status === 'coming_soon'}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {supplier.status === 'active' ? 'Connecter' : 'Bientôt disponible'}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
