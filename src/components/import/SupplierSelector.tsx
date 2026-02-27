import { useState } from 'react'
import { ArrowRight, CheckCircle, Download, Globe, Key, Zap, Star, Crown, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { SUPPLIERS, SUPPLIER_CATEGORIES, getSuppliersByCategory, getPopularSuppliers, type Supplier } from '@/data/suppliers'

interface SupplierImportDialogProps {
  supplier: Supplier
  isOpen: boolean
  onClose: () => void
}

const SupplierImportDialog = ({ supplier, isOpen, onClose }: SupplierImportDialogProps) => {
  const { toast } = useToast()
  const [importData, setImportData] = useState({
    apiKey: '',
    storeUrl: '',
    categories: [] as string[],
    importLimit: '100'
  })

  const handleImport = () => {
    if (supplier.requiresAuth && !importData.apiKey && !importData.storeUrl) {
      toast({
        title: "Configuration requise",
        description: `Veuillez configurer l'accès à ${supplier.displayName}`,
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Import démarré",
      description: `Import en cours depuis ${supplier.displayName}...`
    })
    
    // Simulate import process — actual count will come from backend response
    setTimeout(() => {
      toast({
        title: "Import terminé",
        description: `Produits importés depuis ${supplier.displayName}`
      })
      onClose()
    }, 2000)
  }

  const needsApiKey = supplier.requiresAuth && supplier.authType === 'api_key'
  const needsOAuth = supplier.requiresAuth && supplier.authType === 'oauth'
  const needsCredentials = supplier.requiresAuth && supplier.authType === 'credentials'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="text-2xl">{supplier.icon}</div>
            <div>
              <DialogTitle>Import depuis {supplier.displayName}</DialogTitle>
              <DialogDescription>{supplier.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Authentication Section */}
          {supplier.requiresAuth && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Configuration d'accès
              </h4>
              
              {needsApiKey && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Clé API</label>
                  <Input
                    placeholder="Entrez votre clé API..."
                    value={importData.apiKey}
                    onChange={(e) => setImportData(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtenez votre clé API dans les paramètres de {supplier.displayName}
                  </p>
                </div>
              )}

              {needsCredentials && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL du magasin</label>
                  <Input
                    placeholder="https://monmagasin.example.com"
                    value={importData.storeUrl}
                    onChange={(e) => setImportData(prev => ({ ...prev, storeUrl: e.target.value }))}
                  />
                </div>
              )}

              {needsOAuth && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    L'authentification OAuth sera requise pour connecter votre compte {supplier.displayName}.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Globe className="h-3 w-3 mr-1" />
                    Connecter {supplier.displayName}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Import Settings */}
          <div className="space-y-3">
            <h4 className="font-medium">Paramètres d'import</h4>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Limite d'import</label>
              <Select value={importData.importLimit} onValueChange={(value) => 
                setImportData(prev => ({ ...prev, importLimit: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 produits</SelectItem>
                  <SelectItem value="100">100 produits</SelectItem>
                  <SelectItem value="500">500 produits</SelectItem>
                  <SelectItem value="1000">1000 produits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Fonctionnalités disponibles</h4>
            <div className="flex flex-wrap gap-1">
              {supplier.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleImport} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Démarrer l'Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const SupplierSelector = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSuppliers = SUPPLIERS.filter(supplier => {
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory
    const matchesSearch = supplier.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch && supplier.status === 'active'
  })

  const popularSuppliers = getPopularSuppliers().filter(s => s.status === 'active')

  const getStatusBadge = (supplier: Supplier) => {
    if (supplier.isNew) return <Badge className="bg-green-100 text-green-800">Nouveau</Badge>
    if (supplier.isPopular) return <Badge className="bg-blue-100 text-blue-800">Populaire</Badge>
    if (supplier.status === 'beta') return <Badge className="bg-orange-100 text-orange-800">Beta</Badge>
    return null
  }

  return (
    <div className="space-y-6">
      {/* Popular Suppliers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Fournisseurs Populaires</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {popularSuppliers.slice(0, 4).map((supplier) => (
            <Card key={supplier.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">{supplier.icon}</div>
                  {getStatusBadge(supplier)}
                </div>
                <h4 className="font-medium mb-1">{supplier.displayName}</h4>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {supplier.description}
                </p>
                <Button 
                  size="sm" 
                  className="w-full" 
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Importer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tous les Fournisseurs</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {Object.values(SUPPLIER_CATEGORIES).map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Suppliers by Category */}
      <Tabs value={selectedCategory === 'all' ? 'all' : selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value={SUPPLIER_CATEGORIES.MAJOR_PLATFORMS}>Grandes Plateformes</TabsTrigger>
          <TabsTrigger value={SUPPLIER_CATEGORIES.FRENCH_RETAIL}>Commerce FR</TabsTrigger>
          <TabsTrigger value={SUPPLIER_CATEGORIES.EUROPEAN_RETAIL}>Commerce EU</TabsTrigger>
          <TabsTrigger value={SUPPLIER_CATEGORIES.ADVERTISING}>Publicité</TabsTrigger>
          <TabsTrigger value={SUPPLIER_CATEGORIES.PRICE_COMPARISON}>Comparateurs</TabsTrigger>
          <TabsTrigger value={SUPPLIER_CATEGORIES.SPECIALIZED}>Spécialisés</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="cursor-pointer hover:shadow-lg transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl">{supplier.icon}</div>
                    <div className="flex items-center gap-1">
                      {supplier.requiresAuth && <Key className="h-3 w-3 text-muted-foreground" />}
                      {getStatusBadge(supplier)}
                    </div>
                  </div>
                  <CardTitle className="text-base">{supplier.displayName}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {supplier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {supplier.supportedFormats.slice(0, 2).map((format, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                      {supplier.supportedFormats.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{supplier.supportedFormats.length - 2}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {supplier.regions.join(', ')}
                    </div>

                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={() => setSelectedSupplier(supplier)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Configurer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {Object.values(SUPPLIER_CATEGORIES).map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getSuppliersByCategory(category).filter(s => s.status === 'active').map((supplier) => (
                <Card key={supplier.id} className="cursor-pointer hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl">{supplier.icon}</div>
                      <div className="flex items-center gap-1">
                        {supplier.requiresAuth && <Key className="h-3 w-3 text-muted-foreground" />}
                        {getStatusBadge(supplier)}
                      </div>
                    </div>
                    <CardTitle className="text-base">{supplier.displayName}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {supplier.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {supplier.features.slice(0, 2).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {supplier.features.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{supplier.features.length - 2}
                          </Badge>
                        )}
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full" 
                        onClick={() => setSelectedSupplier(supplier)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Configurer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Aucun fournisseur trouvé avec ces critères.
          </p>
        </div>
      )}

      {/* Import Dialog */}
      {selectedSupplier && (
        <SupplierImportDialog
          supplier={selectedSupplier}
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      )}
    </div>
  )
}