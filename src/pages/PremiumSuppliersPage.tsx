import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Star, MapPin, Clock, Shield, Package, Search } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  country: string
  rating: number
  reviews: number
  products: number
  shipping_time: string
  verified: boolean
  specialties: string[]
  avg_price: string
}

export default function PremiumSuppliersPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')

  const premiumSuppliers: Supplier[] = [
    {
      id: '1',
      name: 'Premium Fashion USA',
      country: 'USA',
      rating: 4.9,
      reviews: 2847,
      products: 1250,
      shipping_time: '2-4 jours',
      verified: true,
      specialties: ['Mode', 'Vêtements', 'Accessoires'],
      avg_price: '25-80€'
    },
    {
      id: '2',
      name: 'Euro Tech Suppliers',
      country: 'Allemagne',
      rating: 4.8,
      reviews: 1923,
      products: 890,
      shipping_time: '3-5 jours',
      verified: true,
      specialties: ['Électronique', 'Gadgets', 'Accessoires Tech'],
      avg_price: '30-150€'
    },
    {
      id: '3',
      name: 'UK Home & Living',
      country: 'UK',
      rating: 4.9,
      reviews: 3156,
      products: 2100,
      shipping_time: '2-3 jours',
      verified: true,
      specialties: ['Maison', 'Décoration', 'Cuisine'],
      avg_price: '15-60€'
    },
    {
      id: '4',
      name: 'French Beauty Co.',
      country: 'France',
      rating: 4.7,
      reviews: 1567,
      products: 650,
      shipping_time: '1-2 jours',
      verified: true,
      specialties: ['Beauté', 'Cosmétiques', 'Soins'],
      avg_price: '20-90€'
    },
    {
      id: '5',
      name: 'Nordic Sports Gear',
      country: 'Suède',
      rating: 4.8,
      reviews: 2234,
      products: 1450,
      shipping_time: '3-4 jours',
      verified: true,
      specialties: ['Sport', 'Fitness', 'Outdoor'],
      avg_price: '35-120€'
    },
    {
      id: '6',
      name: 'Italian Luxury Goods',
      country: 'Italie',
      rating: 4.9,
      reviews: 1876,
      products: 780,
      shipping_time: '4-6 jours',
      verified: true,
      specialties: ['Luxe', 'Mode', 'Maroquinerie'],
      avg_price: '80-300€'
    },
  ]

  const countries = ['all', 'USA', 'France', 'Allemagne', 'UK', 'Italie', 'Suède']

  const filteredSuppliers = premiumSuppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCountry = selectedCountry === 'all' || supplier.country === selectedCountry
    return matchesSearch && matchesCountry
  })

  const handleConnect = (supplier: Supplier) => {
    toast({
      title: "Connexion en cours...",
      description: `Connexion avec ${supplier.name}`,
    })
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Shield className="h-10 w-10 text-primary" />
              Fournisseurs Premium
            </h1>
            <p className="text-muted-foreground mt-2">
              Réseau exclusif US/EU - Livraison rapide & qualité garantie
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Livraison rapide</p>
                <p className="text-sm text-muted-foreground">1-6 jours</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Fournisseurs vérifiés</p>
                <p className="text-sm text-muted-foreground">100% contrôlés</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Qualité premium</p>
                <p className="text-sm text-muted-foreground">4.7+ étoiles</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">US/EU uniquement</p>
                <p className="text-sm text-muted-foreground">Local shipping</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou spécialité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {countries.map(country => (
                <Button
                  key={country}
                  variant={selectedCountry === country ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCountry(country)}
                >
                  {country === 'all' ? 'Tous les pays' : country}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <Tabs defaultValue="suppliers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suppliers">Fournisseurs ({filteredSuppliers.length})</TabsTrigger>
            <TabsTrigger value="trending">Tendances</TabsTrigger>
            <TabsTrigger value="connected">Mes Connexions (0)</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Package className="h-20 w-20 text-primary opacity-50" />
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {supplier.name}
                          {supplier.verified && (
                            <Shield className="h-4 w-4 text-primary" />
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {supplier.country}
                        </div>
                      </div>
                      <Badge variant="secondary">{supplier.avg_price}</Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-semibold">{supplier.rating}</span>
                        <span className="text-muted-foreground">({supplier.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {supplier.shipping_time}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {supplier.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-3">
                        {supplier.products.toLocaleString()} produits disponibles
                      </p>
                      <Button 
                        className="w-full" 
                        onClick={() => handleConnect(supplier)}
                      >
                        Connecter ce fournisseur
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Catégories en tendance</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { category: 'Mode durable', growth: '+45%', suppliers: 12 },
                  { category: 'Tech & Gadgets', growth: '+38%', suppliers: 8 },
                  { category: 'Maison écologique', growth: '+52%', suppliers: 15 },
                  { category: 'Sport & Fitness', growth: '+29%', suppliers: 10 },
                  { category: 'Beauté naturelle', growth: '+41%', suppliers: 14 },
                  { category: 'Accessoires luxe', growth: '+33%', suppliers: 6 },
                ].map((trend) => (
                  <Card key={trend.category} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{trend.category}</h4>
                      <Badge className="bg-green-500">{trend.growth}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {trend.suppliers} fournisseurs premium
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Explorer
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="connected" className="space-y-4">
            <Card className="p-12 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune connexion active</h3>
              <p className="text-muted-foreground mb-6">
                Connectez-vous à des fournisseurs premium pour commencer
              </p>
              <Button>
                Parcourir les fournisseurs
              </Button>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fournisseurs premium</p>
                <p className="text-3xl font-bold">{premiumSuppliers.length}</p>
              </div>
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits disponibles</p>
                <p className="text-3xl font-bold">
                  {premiumSuppliers.reduce((acc, s) => acc + s.products, 0).toLocaleString()}
                </p>
              </div>
              <Package className="h-10 w-10 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
                <p className="text-3xl font-bold">4.8</p>
              </div>
              <Star className="h-10 w-10 text-primary fill-primary" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
