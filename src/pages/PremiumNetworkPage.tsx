import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Crown, ShoppingBag, Truck, Globe, Star, Zap, Shield, TrendingUp, Loader2, Key, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePremiumSuppliers } from '@/hooks/usePremiumSuppliers'
import { supabase } from '@/integrations/supabase/client'
import SupplierConnectionModal from '@/components/suppliers/SupplierConnectionModal'

interface Supplier {
  id: string
  name: string
  country: string
  description: string
  categories: string[]
  product_count?: number
  avg_delivery_days: number
  rating?: number
  tier?: string
  minimum_order_value?: number
  is_active: boolean
  website_url?: string
  api_endpoint?: string
}

export default function PremiumNetworkPage() {
  const { toast } = useToast()
  const { 
    suppliers, 
    connections,
    connectSupplier,
    isConnecting,
    isLoadingSuppliers 
  } = usePremiumSuppliers()
  
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isImporting, setIsImporting] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [showConnectionModal, setShowConnectionModal] = useState(false)

  // Importer les fournisseurs au chargement
  useEffect(() => {
    const importSuppliers = async () => {
      if (!suppliers || suppliers.length === 0) {
        setIsImporting(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const { data, error } = await supabase.functions.invoke('import-suppliers', {
            body: { provider: 'all', userId: user.id }
          })

          if (error) throw error
          
          toast({
            title: 'Fournisseurs chargés',
            description: `${data.imported} fournisseurs premium importés`
          })
        } catch (error: any) {
          console.error('Import error:', error)
        } finally {
          setIsImporting(false)
        }
      }
    }
    importSuppliers()
  }, [])

  const displaySuppliers = (suppliers || []) as any[]

  const filteredSuppliers = selectedCategory === 'all' 
    ? displaySuppliers 
    : displaySuppliers.filter(s => 
        s.categories?.some(cat => cat.toLowerCase().includes(selectedCategory.toLowerCase()))
      )

  const handleConnectClick = (supplier: any) => {
    const supplierWithAuth = {
      ...supplier,
      auth_method: 'api_key',
      auth_fields: ['api_key']
    }
    setSelectedSupplier(supplierWithAuth)
    setShowConnectionModal(true)
  }

  const handleConnect = async (credentials: Record<string, string>) => {
    if (!selectedSupplier) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Stocker les credentials de manière sécurisée
      const { error } = await supabase
        .from('premium_supplier_connections')
        .upsert({
          user_id: user.id,
          supplier_id: selectedSupplier.id,
          status: 'active',
          connection_config: {
            credentials,
            auth_method: selectedSupplier.auth_method
          }
        })

      if (error) throw error

      await connectSupplier(selectedSupplier.id)
      setShowConnectionModal(false)
      setSelectedSupplier(null)
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const stats = {
    totalSuppliers: displaySuppliers.filter(s => s.is_active).length,
    totalProducts: displaySuppliers.reduce((acc, s) => acc + (s.product_count || 0), 0),
    avgShipping: '3-5 jours',
    exclusive: displaySuppliers.filter(s => s.tier === 'diamond' || s.tier === 'platinum').length
  }

  if (isLoadingSuppliers || isImporting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement des fournisseurs premium...</p>
        </div>
      </div>
    )
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
            {filteredSuppliers.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun fournisseur trouvé</h3>
                <p className="text-muted-foreground">
                  Essayez de sélectionner une autre catégorie
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map((supplier) => {
                  const isConnected = connections?.some(c => c.supplier_id === supplier.id && c.status === 'active')
                  
                  return (
                    <Card key={supplier.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold flex items-center gap-2">
                            {supplier.name}
                            {(supplier.tier === 'diamond' || supplier.tier === 'platinum') && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">{supplier.country}</p>
                        </div>
                        <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                          {supplier.is_active ? 'Actif' : 'Bientôt'}
                        </Badge>
                      </div>

                      <p className="text-sm line-clamp-2">{supplier.description}</p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {((supplier.quality_score || 75) / 20).toFixed(1)}
                        </span>
                        <span>{(supplier.product_count || 0).toLocaleString()} produits</span>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {supplier.categories?.slice(0, 3).map(cat => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="h-3 w-3 text-primary" />
                          <span>Livraison {supplier.avg_delivery_days}-{supplier.avg_delivery_days + 2} jours</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Key className="h-3 w-3 text-primary" />
                          <span>API Disponible</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3 text-primary" />
                          <span>Connexion sécurisée</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Min. commande</p>
                          <p className="font-semibold">{supplier.minimum_order_value || 0}€</p>
                        </div>
                        <Badge variant={supplier.tier === 'diamond' ? 'default' : 'secondary'}>
                          {supplier.tier?.toUpperCase() || 'GOLD'}
                        </Badge>
                      </div>

                      {isConnected ? (
                        <Button className="w-full" variant="outline" disabled>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Connecté
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => handleConnectClick(supplier)}
                          disabled={!supplier.is_active || isConnecting}
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Connexion...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Connecter
                            </>
                          )}
                        </Button>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Connection Modal */}
        {selectedSupplier && (
          <SupplierConnectionModal
            open={showConnectionModal}
            onClose={() => {
              setShowConnectionModal(false)
              setSelectedSupplier(null)
            }}
            supplier={selectedSupplier}
            onConnect={handleConnect}
            isConnecting={isConnecting}
          />
        )}
      </div>
    </>
  )
}
