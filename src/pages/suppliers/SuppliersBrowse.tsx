import { useState, useMemo } from 'react'
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
import { useMarketplaceSuppliers } from '@/hooks/useMarketplaceSuppliers'
import { useNavigate } from 'react-router-dom'
import {
  Store, Search, Filter, Globe, Clock, Star, Zap, Package,
  ExternalLink, Plus, Upload, TrendingUp, Shield, Info, Loader2
} from 'lucide-react'

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
  const { data: marketplaceData, isLoading } = useMarketplaceSuppliers()
  const navigate = useNavigate()

  const suppliers = marketplaceData?.suppliers || []
  const stats = marketplaceData?.stats || {
    total_suppliers: 0,
    connected_suppliers: 0,
    total_products: 0,
    featured_suppliers: 0
  }

  const handleConnect = async (supplier: any) => {
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
    const dataStr = JSON.stringify(suppliers, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `suppliers-marketplace-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSector = selectedSector === 'Tous' || supplier.sector === selectedSector
      const matchesCountry = selectedCountry === 'Tous' || supplier.country === selectedCountry
      const matchesFeatured = !showOnlyFeatured || supplier.is_featured
      
      return matchesSearch && matchesSector && matchesCountry && matchesFeatured
    })
  }, [suppliers, searchTerm, selectedSector, selectedCountry, showOnlyFeatured])

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
                  <p className="text-3xl font-bold">{isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.total_suppliers}</p>
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
                  <p className="text-3xl font-bold">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.total_products.toLocaleString()}
                  </p>
                </div>
                <Package className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Connectés</p>
                  <p className="text-3xl font-bold">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.connected_suppliers}
                  </p>
                </div>
                <Globe className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Populaires</p>
                  <p className="text-3xl font-bold">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.featured_suppliers}
                  </p>
                </div>
                <Star className="h-10 w-10 text-orange-600 fill-orange-600" />
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
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <Card className="p-20">
            <div className="text-center">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun fournisseur trouvé</h3>
              <p className="text-muted-foreground">Essayez d'ajuster vos filtres de recherche</p>
            </div>
          </Card>
        ) : (
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
        )}

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
