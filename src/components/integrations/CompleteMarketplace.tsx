import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  Search,
  CheckCircle,
  XCircle,
  Settings,
  Zap,
  ShoppingCart,
  BarChart3,
  Mail,
  CreditCard,
  Truck,
  Globe,
  Users,
  ExternalLink,
  RefreshCw,
  Unlink,
  Link,
  AlertTriangle,
  Star
} from "lucide-react"
import { useIntegrations } from "@/hooks/useIntegrations"

// Définir tous les marketplaces et intégrations disponibles
const COMPLETE_MARKETPLACE = [
  // E-commerce Platforms
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'E-commerce',
    description: 'La plateforme e-commerce leader mondiale. Synchronisez produits, commandes et inventaire.',
    logo: 'https://cdn.worldvectorlogo.com/logos/shopify.svg',
    status: 'available',
    popularity: 'Très populaire',
    rating: 4.8,
    users: '2M+',
    features: ['Sync produits', 'Gestion commandes', 'Inventaire temps réel', 'Webhooks', 'Multi-boutiques'],
    pricing: 'Gratuit',
    setupTime: '2 min',
    difficulty: 'Facile',
    tags: ['E-commerce', 'Dropshipping', 'Multi-stores'],
    isConnected: false
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'E-commerce', 
    description: 'Plugin WordPress le plus utilisé au monde. Intégration native avec votre site WordPress.',
    logo: 'https://cdn.worldvectorlogo.com/logos/woocommerce.svg',
    status: 'available',
    popularity: 'Très populaire',
    rating: 4.7,
    users: '5M+',
    features: ['API REST complète', 'Webhooks', 'Plugins compatibles', 'Multi-devises'],
    pricing: 'Gratuit',
    setupTime: '3 min',
    difficulty: 'Facile',
    tags: ['WordPress', 'Open Source', 'Personnalisable'],
    isConnected: false
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    category: 'E-commerce',
    description: 'Solution e-commerce française open source. Parfait pour les boutiques européennes.',
    logo: 'https://cdn.worldvectorlogo.com/logos/prestashop.svg',
    status: 'available', 
    popularity: 'Populaire',
    rating: 4.5,
    users: '300K+',
    features: ['Multi-langues natif', 'Modules européens', 'RGPD compliant', 'B2B/B2C'],
    pricing: 'Gratuit',
    setupTime: '5 min',
    difficulty: 'Moyen',
    tags: ['France', 'Europe', 'Multi-langues'],
    isConnected: false
  },
  {
    id: 'magento',
    name: 'Magento',
    category: 'E-commerce',
    description: 'Plateforme enterprise pour grandes boutiques. Performance et scalabilité maximales.',
    logo: 'https://cdn.worldvectorlogo.com/logos/magento.svg',
    status: 'available',
    popularity: 'Enterprise',
    rating: 4.6,
    users: '250K+',
    features: ['GraphQL API', 'Multi-stores avancé', 'B2B features', 'Performance enterprise'],
    pricing: 'Payant',
    setupTime: '15 min',
    difficulty: 'Avancé',
    tags: ['Enterprise', 'B2B', 'Scalable'],
    isConnected: false
  },

  // Marketplaces
  {
    id: 'amazon',
    name: 'Amazon',
    category: 'Marketplace',
    description: 'Le plus grand marketplace mondial. Vendez sur Amazon avec une gestion centralisée.',
    logo: 'https://cdn.worldvectorlogo.com/logos/amazon-icon-1.svg',
    status: 'available',
    popularity: 'Leader mondial',
    rating: 4.9,
    users: '9M+ vendeurs',
    features: ['Selling Partner API', 'FBA Integration', 'Advertising API', 'Multi-pays'],
    pricing: 'Commission',
    setupTime: '10 min',
    difficulty: 'Moyen', 
    tags: ['Marketplace', 'Global', 'FBA'],
    isConnected: false
  },
  {
    id: 'ebay',
    name: 'eBay',
    category: 'Marketplace',
    description: 'Marketplace historique pour enchères et vente directe. Parfait pour les produits uniques.',
    logo: 'https://cdn.worldvectorlogo.com/logos/ebay-2.svg',
    status: 'available',
    popularity: 'Historique',
    rating: 4.4,
    users: '25M+ vendeurs',
    features: ['Trading API', 'Auction support', 'Fixed price', 'Global shipping'],
    pricing: 'Commission',
    setupTime: '8 min',
    difficulty: 'Moyen',
    tags: ['Enchères', 'Occasion', 'Collector'],
    isConnected: false
  },
  {
    id: 'etsy',
    name: 'Etsy',
    category: 'Marketplace',
    description: 'Marketplace créatif pour produits faits main et vintage. Idéal pour les créateurs.',
    logo: 'https://cdn.worldvectorlogo.com/logos/etsy.svg',
    status: 'available',
    popularity: 'Créatif',
    rating: 4.6,
    users: '5M+ vendeurs',
    features: ['Handmade focus', 'Creative tools', 'Community features', 'SEO optimized'],
    pricing: 'Commission',
    setupTime: '5 min',
    difficulty: 'Facile',
    tags: ['Handmade', 'Creative', 'Vintage'],
    isConnected: false
  },

  // Fournisseurs / Dropshipping
  {
    id: 'aliexpress',
    name: 'AliExpress',
    category: 'Fournisseurs',
    description: 'Plus grand fournisseur dropshipping mondial. API officielle pour import automatique.',
    logo: 'https://cdn.worldvectorlogo.com/logos/aliexpress.svg',
    status: 'available',
    popularity: 'Leader dropshipping',
    rating: 4.3,
    users: '10M+ produits',
    features: ['API officielle', 'Prix temps réel', 'Stock auto', 'Multi-langues'],
    pricing: 'Gratuit',
    setupTime: '3 min',
    difficulty: 'Facile',
    tags: ['Dropshipping', 'Chine', 'Variety'],
    isConnected: false
  },
  {
    id: 'bigbuy',
    name: 'BigBuy',
    category: 'Fournisseurs',
    description: 'Fournisseur dropshipping européen premium. Livraison rapide et support français.',
    logo: 'https://www.bigbuy.eu/assets/logo/favicon.ico',
    status: 'available',
    popularity: 'Premium Europe',
    rating: 4.7,
    users: '500K+ produits',
    features: ['Catalogue EU', 'Livraison 24-48h', 'Support FR', 'Qualité premium'],
    pricing: 'Abonnement',
    setupTime: '5 min',
    difficulty: 'Moyen',
    tags: ['Europe', 'Premium', 'Support FR'],
    isConnected: false
  },
  {
    id: 'spocket',
    name: 'Spocket',
    category: 'Fournisseurs',
    description: 'Fournisseurs EU/US pour dropshipping premium. Produits de qualité et livraison rapide.',
    logo: 'https://spocket.co/favicon.ico',
    status: 'available',
    popularity: 'Premium',
    rating: 4.5,
    users: '100K+ produits',
    features: ['EU/US suppliers', 'Fast shipping', 'Quality products', 'Branded invoicing'],
    pricing: 'Abonnement',
    setupTime: '4 min',
    difficulty: 'Facile',
    tags: ['Premium', 'EU/US', 'Fast shipping'],
    isConnected: false
  },

  // Marketing & Advertising
  {
    id: 'google-ads',
    name: 'Google Ads',
    category: 'Marketing',
    description: 'Publicité Google pour maximiser votre visibilité. Campagnes automatisées par IA.',
    logo: 'https://cdn.worldvectorlogo.com/logos/google-ads-1.svg',
    status: 'available',
    popularity: 'Essentiel',
    rating: 4.8,
    users: '4M+ annonceurs',
    features: ['Campagnes auto', 'Smart bidding', 'Performance Max', 'Conversion tracking'],
    pricing: 'CPC/CPM',
    setupTime: '10 min',
    difficulty: 'Moyen',
    tags: ['PPC', 'Search', 'Display'],
    isConnected: false
  },
  {
    id: 'facebook-ads',
    name: 'Meta Ads',
    category: 'Marketing',
    description: 'Publicités Facebook et Instagram. Ciblage précis et audiences lookalike.',
    logo: 'https://cdn.worldvectorlogo.com/logos/facebook-3.svg',
    status: 'available',
    popularity: 'Social leader',
    rating: 4.7,
    users: '10M+ pages',
    features: ['Facebook + Instagram', 'Pixel tracking', 'Lookalike audiences', 'Creative tools'],
    pricing: 'CPC/CPM',
    setupTime: '8 min',
    difficulty: 'Moyen',
    tags: ['Social', 'Video', 'Retargeting'],
    isConnected: false
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'Marketing',
    description: 'Email marketing leader mondial. Automatisations avancées et segmentation IA.',
    logo: 'https://cdn.worldvectorlogo.com/logos/mailchimp-freddie.svg',
    status: 'available',
    popularity: 'Email leader',
    rating: 4.6,
    users: '12M+ utilisateurs',
    features: ['Email automation', 'Segmentation AI', 'A/B testing', 'Abandoned cart'],
    pricing: 'Freemium',
    setupTime: '5 min',
    difficulty: 'Facile',
    tags: ['Email', 'Automation', 'Segmentation'],
    isConnected: false
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    category: 'Marketing',
    description: 'Plateforme email marketing spécialisée e-commerce. CDP intégré et ROI tracking.',
    logo: 'https://cdn.worldvectorlogo.com/logos/klaviyo.svg',
    status: 'available',
    popularity: 'E-commerce spécialisé',
    rating: 4.8,
    users: '100K+ marques',
    features: ['E-commerce CDP', 'Advanced flows', 'Revenue attribution', 'SMS marketing'],
    pricing: 'Basé sur contacts',
    setupTime: '7 min',
    difficulty: 'Moyen',
    tags: ['E-commerce', 'CDP', 'SMS'],
    isConnected: false
  },

  // Paiement
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Paiement',
    description: 'Processeur de paiement moderne. API puissante et sécurité maximale.',
    logo: 'https://cdn.worldvectorlogo.com/logos/stripe-4.svg',
    status: 'available',
    popularity: 'Fintech leader',
    rating: 4.9,
    users: '4M+ entreprises',
    features: ['Multi-devises', 'Subscriptions', 'Fraud protection', 'Global payouts'],
    pricing: '2.9% + 0.30€',
    setupTime: '3 min',
    difficulty: 'Facile',
    tags: ['Fintech', 'Global', 'API'],
    isConnected: false
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'Paiement',
    description: 'Solution de paiement mondiale trusted. Protection vendeur et acheteur.',
    logo: 'https://cdn.worldvectorlogo.com/logos/paypal-2.svg',
    status: 'available',
    popularity: 'Confiance mondiale',
    rating: 4.5,
    users: '400M+ comptes',
    features: ['Express checkout', 'Pay in 4', 'Seller protection', 'Global coverage'],
    pricing: '3.4% + 0.35€',
    setupTime: '2 min',
    difficulty: 'Facile',
    tags: ['Trusted', 'Global', 'Protection'],
    isConnected: false
  },

  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    category: 'Analytics',
    description: 'Analytics web le plus utilisé. GA4 avec e-commerce tracking avancé.',
    logo: 'https://cdn.worldvectorlogo.com/logos/google-analytics.svg',
    status: 'available',
    popularity: 'Standard web',
    rating: 4.7,
    users: '30M+ sites',
    features: ['GA4', 'E-commerce tracking', 'Custom events', 'Machine learning'],
    pricing: 'Gratuit',
    setupTime: '5 min',
    difficulty: 'Moyen',
    tags: ['Web analytics', 'Free', 'ML'],
    isConnected: false
  },

  // Logistique
  {
    id: 'chronopost',
    name: 'Chronopost',
    category: 'Logistique',
    description: 'Leader français de la livraison express. Suivi temps réel et garanties.',
    logo: 'https://www.chronopost.fr/sites/all/themes/chronopost/favicon.ico',
    status: 'available',
    popularity: 'Leader France',
    rating: 4.3,
    users: 'B2B/B2C',
    features: ['Livraison express', 'Suivi temps réel', 'Points relais', 'International'],
    pricing: 'Par envoi',
    setupTime: '8 min',
    difficulty: 'Moyen',
    tags: ['France', 'Express', 'Tracking'],
    isConnected: false
  }
]

export const CompleteMarketplace = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [marketplaces, setMarketplaces] = useState(COMPLETE_MARKETPLACE)
  const [selectedMarketplace, setSelectedMarketplace] = useState<any>(null)
  const { toast } = useToast()
  const { integrations, updateIntegration, deleteIntegration } = useIntegrations()

  // Filtrer les marketplaces
  const filteredMarketplaces = marketplaces.filter(marketplace => {
    const matchesSearch = marketplace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         marketplace.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         marketplace.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || marketplace.category.toLowerCase() === selectedCategory.toLowerCase()
    
    return matchesSearch && matchesCategory
  })

  // Obtenir les catégories uniques
  const categories = ['all', ...Array.from(new Set(COMPLETE_MARKETPLACE.map(m => m.category)))]

  // Mettre à jour le statut de connexion basé sur les vraies intégrations
  useEffect(() => {
    setMarketplaces(prev => prev.map(marketplace => ({
      ...marketplace,
      isConnected: integrations.some(integration => 
        integration.platform_name.toLowerCase() === marketplace.name.toLowerCase() &&
        integration.connection_status === 'connected'
      )
    })))
  }, [integrations])

  const handleConnect = async (marketplace: any) => {
    try {
      // Simuler la connexion (dans la vraie app, cela ouvrirait un modal de configuration)
      setMarketplaces(prev => prev.map(m => 
        m.id === marketplace.id ? { ...m, isConnected: true } : m
      ))
      
      toast({
        title: "Connexion réussie",
        description: `${marketplace.name} a été connecté avec succès.`
      })
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de connecter cette intégration.",
        variant: "destructive"
      })
    }
  }

  const handleDisconnect = async (marketplace: any) => {
    try {
      // Trouver l'intégration correspondante
      const integration = integrations.find(i => 
        i.platform_name.toLowerCase() === marketplace.name.toLowerCase()
      )

      if (integration) {
        await deleteIntegration(integration.id)
      }

      // Mettre à jour l'état local
      setMarketplaces(prev => prev.map(m => 
        m.id === marketplace.id ? { ...m, isConnected: false } : m
      ))

      toast({
        title: "Déconnexion réussie", 
        description: `${marketplace.name} a été déconnecté.`
      })
    } catch (error) {
      toast({
        title: "Erreur de déconnexion",
        description: "Impossible de déconnecter cette intégration.",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (marketplace: any) => {
    if (marketplace.isConnected) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connecté
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Disponible
      </Badge>
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'e-commerce': return <ShoppingCart className="w-4 h-4" />
      case 'marketplace': return <Globe className="w-4 h-4" />
      case 'fournisseurs': return <Truck className="w-4 h-4" />
      case 'marketing': return <BarChart3 className="w-4 h-4" />
      case 'paiement': return <CreditCard className="w-4 h-4" />
      case 'analytics': return <BarChart3 className="w-4 h-4" />
      case 'logistique': return <Truck className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  const MarketplaceCard = ({ marketplace }: { marketplace: any }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
              {getCategoryIcon(marketplace.category)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-sm font-semibold truncate">
                  {marketplace.name}
                </CardTitle>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {marketplace.rating}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs mb-2">
                {marketplace.category}
              </Badge>
            </div>
          </div>
          {getStatusBadge(marketplace)}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {marketplace.description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Popularité</span>
            <span className="font-medium">{marketplace.popularity}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Utilisateurs</span>
            <span className="font-medium">{marketplace.users}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Setup</span>
            <span className="font-medium">{marketplace.setupTime}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Difficulté</span>
            <Badge 
              variant={marketplace.difficulty === 'Facile' ? 'default' : 
                      marketplace.difficulty === 'Moyen' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {marketplace.difficulty}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">Fonctionnalités</div>
          <div className="flex flex-wrap gap-1">
            {marketplace.features.slice(0, 3).map((feature: string) => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {marketplace.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{marketplace.features.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setSelectedMarketplace(marketplace)}
              >
                <Settings className="w-3 h-3 mr-1" />
                Détails
              </Button>
            </DialogTrigger>
          </Dialog>
          
          {marketplace.isConnected ? (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => handleDisconnect(marketplace)}
              className="flex-1"
            >
              <Unlink className="w-3 h-3 mr-1" />
              Déconnecter
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={() => handleConnect(marketplace)}
              className="flex-1"
            >
              <Link className="w-3 h-3 mr-1" />
              Connecter
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const connectedCount = marketplaces.filter(m => m.isConnected).length
  const totalCount = marketplaces.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Marketplace Complet</h3>
          <p className="text-sm text-muted-foreground">
            {connectedCount} / {totalCount} intégrations connectées - Tous les outils pour votre business
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600">
            {connectedCount} Connectées
          </Badge>
          <Badge variant="outline">
            {totalCount - connectedCount} Disponibles
          </Badge>
        </div>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher une intégration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-foreground"
        >
          <option value="all">Toutes les catégories</option>
          {categories.filter(cat => cat !== 'all').map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <Badge variant="secondary" className="flex items-center justify-center">
          {filteredMarketplaces.length} résultat{filteredMarketplaces.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Grille des marketplaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMarketplaces.map(marketplace => (
          <MarketplaceCard key={marketplace.id} marketplace={marketplace} />
        ))}
      </div>

      {/* Modal de détails */}
      {selectedMarketplace && (
        <Dialog open={!!selectedMarketplace} onOpenChange={() => setSelectedMarketplace(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  {getCategoryIcon(selectedMarketplace.category)}
                </div>
                {selectedMarketplace.name}
                {getStatusBadge(selectedMarketplace)}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <p className="text-muted-foreground">{selectedMarketplace.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Informations</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Catégorie:</span>
                      <span>{selectedMarketplace.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Popularité:</span>
                      <span>{selectedMarketplace.popularity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilisateurs:</span>
                      <span>{selectedMarketplace.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Setup:</span>
                      <span>{selectedMarketplace.setupTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Difficulté:</span>
                      <Badge variant={selectedMarketplace.difficulty === 'Facile' ? 'default' : 
                                    selectedMarketplace.difficulty === 'Moyen' ? 'secondary' : 'destructive'}>
                        {selectedMarketplace.difficulty}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Tarif:</span>
                      <span>{selectedMarketplace.pricing}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Fonctionnalités</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedMarketplace.features.map((feature: string) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  
                  <h4 className="font-medium mt-4">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedMarketplace.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                {selectedMarketplace.isConnected ? (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        handleDisconnect(selectedMarketplace)
                        setSelectedMarketplace(null)
                      }}
                      className="flex-1"
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Déconnecter
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurer
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => {
                      handleConnect(selectedMarketplace)
                      setSelectedMarketplace(null)
                    }}
                    className="flex-1"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Connecter maintenant
                  </Button>
                )}
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {filteredMarketplaces.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucune intégration trouvée pour cette recherche</p>
          <p className="text-sm">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  )
}