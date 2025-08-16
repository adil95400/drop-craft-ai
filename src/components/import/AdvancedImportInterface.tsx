import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, 
  FileText, 
  Link, 
  Database, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  Share,
  ShoppingCart,
  Facebook,
  Instagram,
  Twitter,
  Filter,
  Search,
  MoreHorizontal,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useImport } from '@/domains/commerce/hooks/useImport'

interface FieldMapping {
  source: string
  target: string
  transform?: string
}

interface ImportedProduct {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  currency: string
  sku?: string
  category?: string
  image_urls?: string[]
  tags?: string[]
  status: 'draft' | 'published' | 'rejected'
  supplier_name?: string
  created_at: string
  ai_optimized?: boolean
}

export const AdvancedImportInterface = () => {
  const [activeTab, setActiveTab] = useState('methods')
  const [importProgress, setImportProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showMapping, setShowMapping] = useState(false)
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const { 
    importFromUrl, 
    importFromSupplier,
    products,
    isImportingUrl,
    isImportingSupplier 
  } = useImport()

  // Mock data for demonstration
  const mockImportedProducts: ImportedProduct[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro Max 256GB',
      description: 'Latest Apple iPhone with advanced camera system',
      price: 1199.99,
      cost_price: 899.00,
      currency: 'EUR',
      sku: 'IPH-15-PM-256',
      category: 'Électronique',
      image_urls: ['https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=400'],
      tags: ['smartphone', 'apple', 'premium'],
      status: 'draft',
      supplier_name: 'TechSupplier',
      created_at: new Date().toISOString(),
      ai_optimized: false
    },
    {
      id: '2',
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Flagship Samsung smartphone with S Pen',
      price: 1099.99,
      cost_price: 799.00,
      currency: 'EUR',
      sku: 'SAM-S24-U',
      category: 'Électronique',
      image_urls: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400'],
      tags: ['smartphone', 'samsung', 'android'],
      status: 'published',
      supplier_name: 'TechSupplier',
      created_at: new Date().toISOString(),
      ai_optimized: true
    },
    {
      id: '3',
      name: 'AirPods Pro 2ème génération',
      description: 'Écouteurs sans fil avec réduction de bruit active',
      price: 279.99,
      cost_price: 199.00,
      currency: 'EUR',
      sku: 'APP-GEN2',
      category: 'Audio',
      image_urls: ['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400'],
      tags: ['audio', 'apple', 'wireless'],
      status: 'draft',
      supplier_name: 'AudioMax',
      created_at: new Date().toISOString(),
      ai_optimized: false
    }
  ]

  const filteredProducts = mockImportedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }, [selectedProducts.length, filteredProducts])

  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }, [])

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Veuillez sélectionner au moins un produit')
      return
    }

    setIsProcessing(true)
    
    try {
      switch (action) {
        case 'publish':
          toast.success(`${selectedProducts.length} produit(s) publié(s)`)
          break
        case 'delete':
          toast.success(`${selectedProducts.length} produit(s) supprimé(s)`)
          break
        case 'optimize':
          toast.success(`${selectedProducts.length} produit(s) optimisé(s) par IA`)
          break
        case 'export-shopify':
          toast.success(`${selectedProducts.length} produit(s) envoyé(s) vers Shopify`)
          break
        case 'export-marketplace':
          toast.success(`${selectedProducts.length} produit(s) envoyé(s) vers les marketplaces`)
          break
        case 'share-social':
          toast.success(`${selectedProducts.length} produit(s) partagé(s) sur les réseaux sociaux`)
          break
      }
      setSelectedProducts([])
    } catch (error) {
      toast.error('Erreur lors de l\'action groupée')
    } finally {
      setIsProcessing(false)
    }
  }, [selectedProducts])

  const handleUrlImport = useCallback(async (url: string) => {
    if (!url.trim()) {
      toast.error('Veuillez saisir une URL valide')
      return
    }

    setIsProcessing(true)
    setImportProgress(0)

    try {
      // Simulation du processus d'import
      for (let i = 0; i <= 100; i += 20) {
        setImportProgress(i)
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      importFromUrl({ url, config: { auto_optimize: true } })
      setShowMapping(true)
    } catch (error) {
      toast.error('Erreur lors de l\'import URL')
    } finally {
      setIsProcessing(false)
    }
  }, [importFromUrl])

  const ImportMethods = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Feeds & Fichiers */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">CSV/Excel</CardTitle>
              <CardDescription>Import depuis fichiers CSV ou Excel</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <Badge variant="outline" className="bg-green-50">Actif</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              Tester
            </Button>
            <Button size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-1" />
              Configurer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Link className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">JSON (URL)</CardTitle>
              <CardDescription>Import depuis URL JSON avec JSONPath</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <Badge variant="outline" className="bg-green-50">Actif</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              Tester
            </Button>
            <Button size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-1" />
              Configurer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Shopify</CardTitle>
              <CardDescription>Import via OAuth Shopify + Bulk Operations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <Badge variant="outline" className="bg-yellow-50">Non configuré</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              Tester
            </Button>
            <Button size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-1" />
              Configurer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Database className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">WooCommerce</CardTitle>
              <CardDescription>Import depuis WooCommerce via API REST</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <Badge variant="outline" className="bg-yellow-50">Non configuré</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              Tester
            </Button>
            <Button size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-1" />
              Configurer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg">PrestaShop</CardTitle>
              <CardDescription>Import via plugin PrestaShop dédié</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <Badge variant="outline" className="bg-yellow-50">Non configuré</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              Tester
            </Button>
            <Button size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-1" />
              Configurer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Database className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-lg">FTP/SFTP/FTPS</CardTitle>
              <CardDescription>Import depuis serveurs FTP/SFTP/FTPS</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <Badge variant="outline" className="bg-green-50">Actif</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              Tester
            </Button>
            <Button size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-1" />
              Configurer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const FieldMappingInterface = () => (
    <Card>
      <CardHeader>
        <CardTitle>Mapping des Champs</CardTitle>
        <CardDescription>
          Configurez la correspondance entre vos champs source et les champs de destination
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 font-medium text-sm">
          <div>Champ Source</div>
          <div>Champ Destination</div>
          <div>Transformation</div>
        </div>
        
        {[
          { source: 'title', target: 'name', transform: 'none' },
          { source: 'price', target: 'price', transform: 'parseFloat' },
          { source: 'description', target: 'description', transform: 'none' },
          { source: 'image', target: 'image_urls', transform: 'array' },
          { source: 'category', target: 'category', transform: 'none' }
        ].map((mapping, index) => (
          <div key={index} className="grid grid-cols-3 gap-4">
            <Input value={mapping.source} readOnly className="bg-gray-50" />
            <Select value={mapping.target}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="price">Prix</SelectItem>
                <SelectItem value="description">Description</SelectItem>
                <SelectItem value="image_urls">Images</SelectItem>
                <SelectItem value="category">Catégorie</SelectItem>
                <SelectItem value="sku">SKU</SelectItem>
                <SelectItem value="tags">Tags</SelectItem>
              </SelectContent>
            </Select>
            <Select value={mapping.transform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                <SelectItem value="parseFloat">Nombre décimal</SelectItem>
                <SelectItem value="parseInt">Nombre entier</SelectItem>
                <SelectItem value="array">Tableau</SelectItem>
                <SelectItem value="lowercase">Minuscules</SelectItem>
                <SelectItem value="uppercase">Majuscules</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
        
        <div className="flex gap-2 pt-4">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button>
            <CheckCircle className="w-4 h-4 mr-2" />
            Valider le mapping
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const ProductsList = () => (
    <div className="space-y-6">
      {/* Filtres et actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des produits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Plus de filtres
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                onCheckedChange={handleSelectAll}
                className="mr-2"
              />
              <span className="text-sm text-muted-foreground mr-4">
                {selectedProducts.length > 0 && `${selectedProducts.length} sélectionné(s)`}
              </span>
              
              {selectedProducts.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Actions groupées
                      <MoreHorizontal className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleBulkAction('publish')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Publier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('optimize')}>
                      <Zap className="w-4 h-4 mr-2" />
                      Optimiser avec IA
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('export-shopify')}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Envoyer vers Shopify
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('export-marketplace')}>
                      <Target className="w-4 h-4 mr-2" />
                      Envoyer vers Marketplace
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('share-social')}>
                      <Share className="w-4 h-4 mr-2" />
                      Partager sur réseaux sociaux
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => handleSelectProduct(product.id)}
                />
                
                {product.image_urls?.[0] && (
                  <img 
                    src={product.image_urls[0]} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="font-semibold">
                          {product.currency} {product.price}
                        </span>
                        {product.cost_price && (
                          <span className="text-sm text-muted-foreground">
                            Coût: {product.currency} {product.cost_price}
                          </span>
                        )}
                        <Badge variant={
                          product.status === 'published' ? 'default' : 
                          product.status === 'draft' ? 'secondary' : 'destructive'
                        }>
                          {product.status === 'published' ? 'Publié' : 
                           product.status === 'draft' ? 'Brouillon' : 'Rejeté'}
                        </Badge>
                        {product.ai_optimized && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-600">
                            <Zap className="w-3 h-3 mr-1" />
                            IA Optimisé
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Exporter
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Envoyer vers Shopify
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Facebook className="w-4 h-4 mr-2" />
                            Partager sur Facebook
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{mockImportedProducts.length}</div>
                <p className="text-sm text-muted-foreground">Total Importé</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {mockImportedProducts.filter(p => p.status === 'published').length}
                </div>
                <p className="text-sm text-muted-foreground">Publié</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {mockImportedProducts.filter(p => p.status === 'draft').length}
                </div>
                <p className="text-sm text-muted-foreground">En Attente</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {mockImportedProducts.filter(p => p.ai_optimized).length}
                </div>
                <p className="text-sm text-muted-foreground">IA Optimisé</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface principale */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="methods" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Méthodes d'Import
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Mapping & Optimisation
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Produits Importés
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="methods">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Méthodes d'Import Avancées</CardTitle>
                <CardDescription>
                  Choisissez parmi nos nombreuses méthodes d'import et plateformes supportées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImportMethods />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import Rapide par URL</CardTitle>
                <CardDescription>
                  Importez rapidement des produits depuis une URL avec analyse IA automatique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quick-url">URL du produit ou catalogue</Label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      id="quick-url"
                      placeholder="https://exemple.com/produit-ou-catalogue"
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => handleUrlImport('https://example.com')}
                      disabled={isProcessing}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Importer
                    </Button>
                  </div>
                </div>
                
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={importProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      Analyse et import en cours... {importProgress}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mapping">
          <div className="space-y-6">
            <FieldMappingInterface />
            
            <Card>
              <CardHeader>
                <CardTitle>Optimisation IA</CardTitle>
                <CardDescription>
                  Configurez les paramètres d'optimisation automatique par intelligence artificielle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-title" />
                      <Label htmlFor="auto-title">Optimisation automatique des titres</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-description" />
                      <Label htmlFor="auto-description">Amélioration des descriptions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-keywords" />
                      <Label htmlFor="auto-keywords">Génération de mots-clés SEO</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-pricing" />
                      <Label htmlFor="auto-pricing">Suggestions de prix optimaux</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-categories" />
                      <Label htmlFor="auto-categories">Catégorisation automatique</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-tags" />
                      <Label htmlFor="auto-tags">Génération de tags pertinents</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <ProductsList />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Imports</CardTitle>
              <CardDescription>
                Consultez l'historique complet de vos imports avec statistiques détaillées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: '2024-01-15', source: 'AliExpress', products: 150, status: 'completed' },
                  { date: '2024-01-14', source: 'CSV Import', products: 75, status: 'completed' },
                  { date: '2024-01-13', source: 'Shopify Sync', products: 200, status: 'failed' },
                  { date: '2024-01-12', source: 'URL Import', products: 25, status: 'completed' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">{item.date}</div>
                      <div className="font-medium">{item.source}</div>
                      <div className="text-sm">{item.products} produits</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status === 'completed' ? 'default' : 'destructive'}>
                        {item.status === 'completed' ? 'Terminé' : 'Échec'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}