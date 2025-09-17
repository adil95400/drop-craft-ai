import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQuotaManager } from '@/hooks/useQuotaManager'
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Star,
  TrendingUp,
  DollarSign,
  BarChart3,
  Globe,
  Image as ImageIcon,
  Save,
  X,
  Upload,
  Bot,
  Sparkles
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  cost_price: number
  category: string
  brand: string 
  sku: string
  image_url: string
  image_urls: string[]
  availability_status: string
  stock_quantity: number
  rating: number
  reviews_count: number
  is_bestseller: boolean
  is_trending: boolean
  profit_margin: number
  created_at: string
  updated_at: string
}

const CatalogPage = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const { canPerformAction, incrementQuota } = useQuotaManager()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null)

  const categories = [
    'all', 'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 
    'Beauty', 'Automotive', 'Toys', 'Health'
  ]

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_secure_catalog_products', {
        category_filter: selectedCategory === 'all' ? null : selectedCategory,
        search_term: searchTerm || null,
        limit_count: 100
      })

      if (error) throw error
      
      // Map and ensure all required fields are present
      const mappedProducts = (data || []).map((product: any) => ({
        ...product,
        stock_quantity: (product as any).stock_quantity || 0,
        created_at: (product as any).created_at || new Date().toISOString(),
        updated_at: (product as any).updated_at || new Date().toISOString(),
        profit_margin: product.profit_margin || 0,
        cost_price: product.cost_price || product.price * 0.7,
        image_urls: product.image_urls || (product.image_url ? [product.image_url] : [])
      }))
      
      // Sort products based on sortBy parameter
      const sortedProducts = mappedProducts.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return b.name.localeCompare(a.name)
          case 'price':
            return (b.price || 0) - (a.price || 0)
          case 'profit_margin':
            return (b.profit_margin || 0) - (a.profit_margin || 0)
          case 'rating':
            return (b.rating || 0) - (a.rating || 0)
          case 'created_at':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
      })
      
      setProducts(sortedProducts)
    } catch (error: any) {
      console.error('Error fetching products:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleEditProduct = async (productData: Partial<Product>) => {
    if (!user || !editingProduct?.id) return

    try {
      // Note: Updates to catalog products should be handled through admin interface
      // For now, this functionality is disabled for security reasons
      toast({
        title: "Fonctionnalité désactivée",
        description: "La modification des produits du catalogue nécessite des privilèges administrateur",
        variant: "destructive"
      })
      return

      /* Original functionality disabled - catalog_products should not be directly modified
      const { error } = await supabase
        .from('catalog_products')
        .update({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          cost_price: productData.cost_price,
          category: productData.category,
          brand: productData.brand,
          image_url: productData.image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      toast({
        title: "Produit mis à jour",
        description: "Les modifications ont été enregistrées avec succès"
      })
      */
      
      setIsEditDialogOpen(false)
      setEditingProduct(null)
      fetchProducts()
    } catch (error: any) {
      console.error('Error updating product:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit",
        variant: "destructive"
      })
    }
  }

  const handleCreateProduct = async () => {
    if (!user) return

    const canCreate = await canPerformAction('products')
    if (!canCreate) {
      toast({
        title: "Limite atteinte",
        description: "Vous avez atteint la limite de produits de votre plan",
        variant: "destructive"
      })
      return
    }

    // Set default new product
    setEditingProduct({
      name: 'Nouveau produit',
      description: '',
      price: 0,
      cost_price: 0,
      category: 'Electronics',
      brand: '',
      image_url: '',
      availability_status: 'in_stock',
      stock_quantity: 0
    })
    setIsEditDialogOpen(true)
  }

  const generateAIContent = async (productId: string) => {
    if (!user) return

    const canGenerate = await canPerformAction('ai_generations')
    if (!canGenerate) {
      toast({
        title: "Limite IA atteinte",
        description: "Vous avez atteint la limite de générations IA de votre plan",
        variant: "destructive"
      })
      return
    }

    try {
      // Simulate AI content generation
      toast({
        title: "Génération IA en cours...",
        description: "L'IA génère du contenu optimisé pour votre produit"
      })

      await incrementQuota('ai_generations')

      // Simulate API call delay
      setTimeout(() => {
        toast({
          title: "Contenu généré !",
          description: "Le contenu SEO et la description ont été optimisés par l'IA"
        })
      }, 2000)

    } catch (error: any) {
      console.error('Error generating AI content:', error)
      toast({
        title: "Erreur IA",
        description: "Impossible de générer le contenu IA",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user, sortBy])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Catalogue Produits
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre catalogue de produits avec des outils avancés d'édition et d'optimisation IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? 'Vue Liste' : 'Vue Grille'}
          </Button>
          <Button onClick={handleCreateProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Produit
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, description, marque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'Toutes catégories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date création</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="price">Prix</SelectItem>
                <SelectItem value="profit_margin">Marge</SelectItem>
                <SelectItem value="rating">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Produits</p>
                <p className="text-2xl font-bold">{filteredProducts.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bestsellers</p>
                <p className="text-2xl font-bold">{filteredProducts.filter(p => p.is_bestseller).length}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trending</p>
                <p className="text-2xl font-bold">{filteredProducts.filter(p => p.is_trending).length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marge Moy.</p>
                <p className="text-2xl font-bold">
                  {filteredProducts.length > 0 
                    ? Math.round(filteredProducts.reduce((acc, p) => acc + (p.profit_margin || 0), 0) / filteredProducts.length)
                    : 0
                  }%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid/List */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : "space-y-4"
      }>
        {filteredProducts.map((product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow">
            <div className="relative">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-product.jpg'
                  }}
                />
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {product.is_bestseller && (
                  <Badge className="bg-yellow-500">Bestseller</Badge>
                )}
                {product.is_trending && (
                  <Badge className="bg-green-500">Trending</Badge>
                )}
              </div>
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingProduct(product)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => generateAIContent(product.id)}
                  >
                    <Bot className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold line-clamp-2 text-sm">{product.name}</h3>
                  <Badge variant="outline" className="ml-2">
                    {product.category}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-primary">
                      ${product.price?.toFixed(2)}
                    </p>
                    {product.cost_price && (
                      <p className="text-xs text-muted-foreground">
                        Coût: ${product.cost_price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    {product.profit_margin && (
                      <Badge variant={product.profit_margin > 30 ? 'default' : 'secondary'}>
                        {product.profit_margin.toFixed(1)}% marge
                      </Badge>
                    )}
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{product.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Stock: {product.stock_quantity || 0}
                  </span>
                  <Badge 
                    variant={product.availability_status === 'in_stock' ? 'default' : 'secondary'}
                  >
                    {product.availability_status === 'in_stock' ? 'En stock' : 'Rupture'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Aucun produit ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore de produits dans votre catalogue.'
              }
            </p>
            <Button onClick={handleCreateProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Créer votre premier produit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct?.id ? 'Modifier le produit' : 'Nouveau produit'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du produit. L'IA peut vous aider à optimiser le contenu.
            </DialogDescription>
          </DialogHeader>

          {editingProduct && (
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informations</TabsTrigger>
                <TabsTrigger value="pricing">Prix & Marge</TabsTrigger>
                <TabsTrigger value="seo">SEO & Images</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du produit *</Label>
                    <Input
                      id="name"
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                      placeholder="iPhone 15 Pro Max"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marque</Label>
                    <Input
                      id="brand"
                      value={editingProduct.brand || ''}
                      onChange={(e) => setEditingProduct(prev => ({
                        ...prev,
                        brand: e.target.value
                      }))}
                      placeholder="Apple"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Description détaillée du produit..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select
                      value={editingProduct.category || ''}
                      onValueChange={(value) => setEditingProduct(prev => ({
                        ...prev,
                        category: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(cat => cat !== 'all').map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={editingProduct.stock_quantity || 0}
                      onChange={(e) => setEditingProduct(prev => ({
                        ...prev,
                        stock_quantity: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost_price">Prix de revient</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={editingProduct.cost_price || 0}
                      onChange={(e) => setEditingProduct(prev => ({
                        ...prev,
                        cost_price: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Prix de vente *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct(prev => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                {editingProduct.cost_price && editingProduct.price && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span>Marge bénéficiaire:</span>
                      <Badge variant="outline">
                        {(((editingProduct.price - editingProduct.cost_price) / editingProduct.cost_price) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span>Bénéfice par unité:</span>
                      <span className="font-medium">
                        ${(editingProduct.price - editingProduct.cost_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image_url">URL de l'image principale</Label>
                  <Input
                    id="image_url"
                    value={editingProduct.image_url || ''}
                    onChange={(e) => setEditingProduct(prev => ({
                      ...prev,
                      image_url: e.target.value
                    }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => generateAIContent(editingProduct.id || 'new')}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Optimiser avec l'IA
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Simulate image upload
                      toast({
                        title: "Upload simulé",
                        description: "Fonctionnalité d'upload d'images à venir"
                      })
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                </div>
              </TabsContent>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
                <Button onClick={() => handleEditProduct(editingProduct)}>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder
                </Button>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CatalogPage