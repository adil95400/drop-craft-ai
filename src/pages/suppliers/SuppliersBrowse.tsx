import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSupplierActions } from '@/hooks/useSupplierActions'
import { ImportSuppliersDialog } from '@/components/suppliers/ImportSuppliersDialog'
import { SupplierPreviewModal } from '@/components/suppliers/SupplierPreviewModal'
import { QuickConnectSuppliers } from '@/components/suppliers/QuickConnectSuppliers'
import { useNavigate } from 'react-router-dom'
import {
  Store, Search, Filter, Globe, Clock, Star, Zap, Package,
  ExternalLink, Plus, Upload, TrendingUp, Shield, Info
} from 'lucide-react'

interface MarketplaceSupplier {
  id: string
  name: string
  logo_url?: string
  description: string
  sector: string
  country: string
  supplier_type: 'api' | 'xml' | 'csv' | 'manual'
  product_count: number
  rating: number
  tags: string[]
  is_featured: boolean
  integration_complexity: 'easy' | 'medium' | 'hard'
  setup_time_minutes: number
  min_order_value?: number
  commission_rate?: number
  shipping_countries: string[]
}

const MARKETPLACE_SUPPLIERS: MarketplaceSupplier[] = [
  {
    id: '1',
    name: 'AliExpress Dropshipping',
    logo_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop',
    description: 'Plus grand marketplace chinois avec millions de produits à prix compétitifs',
    sector: 'Multimarché',
    country: 'Chine',
    supplier_type: 'api',
    product_count: 50000000,
    rating: 4.2,
    tags: ['Dropshipping', 'Électronique', 'Mode'],
    is_featured: true,
    integration_complexity: 'easy',
    setup_time_minutes: 15,
    min_order_value: 0,
    commission_rate: 5.5,
    shipping_countries: ['FR', 'DE', 'ES', 'IT', 'UK']
  },
  {
    id: '2',
    name: 'Spocket EU',
    logo_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=100&h=100&fit=crop',
    description: 'Fournisseurs européens et américains pour le dropshipping premium',
    sector: 'Multimarché',
    country: 'Pays-Bas',
    supplier_type: 'api',
    product_count: 1000000,
    rating: 4.5,
    tags: ['Dropshipping', 'Premium', 'Livraison Rapide'],
    is_featured: true,
    integration_complexity: 'easy',
    setup_time_minutes: 10,
    min_order_value: 0,
    commission_rate: 0,
    shipping_countries: ['FR', 'DE', 'ES', 'IT', 'UK']
  },
  {
    id: '3',
    name: 'BigBuy',
    logo_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop',
    description: 'Grossiste européen avec entrepôts en Europe',
    sector: 'Multimarché',
    country: 'Espagne',
    supplier_type: 'api',
    product_count: 150000,
    rating: 4.6,
    tags: ['Wholesale', 'Stock Europe', 'Livraison rapide'],
    is_featured: true,
    integration_complexity: 'medium',
    setup_time_minutes: 20,
    min_order_value: 0,
    commission_rate: 0,
    shipping_countries: ['FR', 'DE', 'ES', 'IT', 'UK', 'PT']
  },
  {
    id: '4',
    name: 'CJDropshipping',
    logo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop',
    description: 'Service complet de dropshipping avec fulfillment',
    sector: 'Multimarché',
    country: 'Chine',
    supplier_type: 'api',
    product_count: 500000,
    rating: 4.4,
    tags: ['Dropshipping', 'Fulfillment', 'POD'],
    is_featured: false,
    integration_complexity: 'easy',
    setup_time_minutes: 12,
    min_order_value: 0,
    commission_rate: 0,
    shipping_countries: ['Mondial']
  }
]

const sectors = ['Tous', 'Multimarché', 'Mode & Décoration', 'Électronique', 'Beauté']
const countries = ['Tous', 'Chine', 'USA', 'Europe', 'Pays-Bas', 'Espagne']

export default function SuppliersBrowse() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSector, setSelectedSector] = useState('Tous')
  const [selectedCountry, setSelectedCountry] = useState('Tous')
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [previewSupplier, setPreviewSupplier] = useState<any>(null)
  const [showQuickConnect, setShowQuickConnect] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>()
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>()
  const { connectSupplier, isConnecting } = useSupplierActions()
  const navigate = useNavigate()

  const handleConnect = async (supplier: MarketplaceSupplier) => {
    const result = await connectSupplier(supplier.id, undefined, {
      connectorId: supplier.id,
      name: supplier.name,
      type: supplier.supplier_type
    })
    if (result.success) {
      navigate('/products/suppliers')
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(MARKETPLACE_SUPPLIERS, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `suppliers-marketplace-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const filteredSuppliers = MARKETPLACE_SUPPLIERS.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSector = selectedSector === 'Tous' || supplier.sector === selectedSector
    const matchesCountry = selectedCountry === 'Tous' || supplier.country === selectedCountry
    const matchesFeatured = !showOnlyFeatured || supplier.is_featured
    
    return matchesSearch && matchesSector && matchesCountry && matchesFeatured
  })

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'Facile'
      case 'medium': return 'Moyen'
      case 'hard': return 'Difficile'
      default: return complexity
    }
  }

  return (
    <>
      <Helmet>
        <title>Marketplace Fournisseurs - ShopOpti</title>
        <meta name="description" content="Découvrez et connectez les meilleurs fournisseurs pour votre dropshipping" />
      </Helmet>

      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Store className="h-10 w-10 text-primary" />
              Marketplace Fournisseurs
            </h1>
            <p className="text-muted-foreground mt-2">
              Connectez-vous aux meilleurs fournisseurs en 1 clic
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-5 w-5 mr-2" />
              Importer
            </Button>
            <Button onClick={() => navigate('/products/suppliers/create')}>
              <Plus className="h-5 w-5 mr-2" />
              Personnalisé
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fournisseurs</p>
                  <p className="text-3xl font-bold">{MARKETPLACE_SUPPLIERS.length}+</p>
                </div>
                <Store className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Produits</p>
                  <p className="text-3xl font-bold">50M+</p>
                </div>
                <Package className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pays</p>
                  <p className="text-3xl font-bold">25+</p>
                </div>
                <Globe className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Intégrations</p>
                  <p className="text-3xl font-bold">API</p>
                </div>
                <Zap className="h-10 w-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres de recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Secteur" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <Button 
                variant={showOnlyFeatured ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
              >
                <Star className="h-4 w-4 mr-2" />
                Populaires
              </Button>
              <span className="text-sm text-muted-foreground">
                {filteredSuppliers.length} fournisseur(s)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map(supplier => (
            <Card key={supplier.id} className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
                      {supplier.logo_url ? (
                        <img 
                          src={supplier.logo_url} 
                          alt={supplier.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="h-7 w-7 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {supplier.sector}
                      </Badge>
                    </div>
                  </div>
                  {supplier.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" fill="currentColor" />
                      Populaire
                    </Badge>
                  )}
                </div>
                
                <Badge 
                  className={getComplexityColor(supplier.integration_complexity)}
                  variant="secondary"
                >
                  {getComplexityText(supplier.integration_complexity)}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {supplier.description}
                </p>
                
                <div className="flex flex-wrap gap-1.5">
                  {supplier.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">{supplier.product_count.toLocaleString()} produits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">{supplier.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">{supplier.setup_time_minutes}min setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                    <span className="text-xs font-medium">{supplier.rating}/5</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPreviewSupplier(supplier)}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Détails
                  </Button>
                  <Button 
                    className="flex-1 gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSupplierId(supplier.id)
                      setSelectedSupplierName(supplier.name)
                      setShowQuickConnect(true)
                    }}
                    disabled={isConnecting}
                  >
                    <Zap className="h-4 w-4" />
                    {isConnecting ? 'Connexion...' : 'Connecter'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <ImportSuppliersDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
        <SupplierPreviewModal 
          open={!!previewSupplier} 
          onOpenChange={(open) => !open && setPreviewSupplier(null)}
          supplier={previewSupplier}
          onConnect={async () => {
            if (previewSupplier) {
              await handleConnect(previewSupplier)
              setPreviewSupplier(null)
            }
          }}
          isConnecting={isConnecting}
        />
        <QuickConnectSuppliers
          open={showQuickConnect}
          onOpenChange={setShowQuickConnect}
          supplierId={selectedSupplierId}
          supplierName={selectedSupplierName}
        />
      </div>
    </>
  )
}
