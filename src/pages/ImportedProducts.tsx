import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Search,
  Filter,
  Package,
  TrendingUp,
  AlertTriangle,
  Sparkles
} from 'lucide-react'

interface ImportedProduct {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  currency: string
  sku?: string
  category?: string
  supplier_name?: string
  image_urls?: string[]
  status: 'pending' | 'approved' | 'rejected' | 'published'
  review_status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  ai_score?: number
  import_quality_score?: number
  data_completeness_score?: number
  created_at: string
  import_id?: string
}

export default function ImportedProducts() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  // Fetch imported products
  const { data: importedProducts = [], isLoading, error } = useQuery({
    queryKey: ['imported-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ImportedProduct[]
    }
  })

  // Approve product mutation
  const approveProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('imported_products')
        .update({ 
          status: 'approved',
          review_status: 'approved'
        })
        .eq('id', productId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: "Produit approuvé",
        description: "Le produit a été approuvé avec succès."
      })
    }
  })

  // Reject product mutation
  const rejectProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('imported_products')
        .update({ 
          status: 'rejected',
          review_status: 'rejected'
        })
        .eq('id', productId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: "Produit rejeté",
        description: "Le produit a été rejeté."
      })
    }
  })

  // Publish to catalog mutation
  const publishToCatalog = useMutation({
    mutationFn: async (productId: string) => {
      const product = importedProducts.find(p => p.id === productId)
      if (!product) throw new Error('Product not found')

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Insert into products table
      const { error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: product.name,
          description: product.description,
          price: product.price,
          cost_price: product.cost_price,
          sku: product.sku,
          category: product.category,
          image_url: product.image_urls?.[0],
          status: 'active'
        })

      if (error) throw error

      // Update imported product status
      const { error: updateError } = await supabase
        .from('imported_products')
        .update({ status: 'published' })
        .eq('id', productId)

      if (updateError) throw updateError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: "Produit publié",
        description: "Le produit a été ajouté à votre catalogue."
      })
    }
  })

  // Filter products
  const filteredProducts = importedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Statistics
  const stats = {
    total: importedProducts.length,
    pending: importedProducts.filter(p => p.status === 'pending').length,
    approved: importedProducts.filter(p => p.status === 'approved').length,
    published: importedProducts.filter(p => p.status === 'published').length,
    rejected: importedProducts.filter(p => p.status === 'rejected').length
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: AlertTriangle, color: 'text-yellow-600' },
      approved: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      published: { variant: 'default' as const, icon: TrendingUp, color: 'text-blue-600' },
      rejected: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' }
    }
    
    const config = variants[status as keyof typeof variants] || variants.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    )
  }

  const getQualityScore = (product: ImportedProduct) => {
    const score = product.import_quality_score || product.ai_score || 0
    const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
    return <span className={`font-semibold ${color}`}>{score}%</span>
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Produits Importés
          </h1>
          <p className="text-muted-foreground">
            Gérez et approuvez vos produits importés avant publication
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approuvés</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Publiés</p>
                <p className="text-2xl font-bold text-blue-600">{stats.published}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejetés</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, description ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvés</SelectItem>
            <SelectItem value="published">Publiés</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit importé</h3>
            <p className="text-muted-foreground">
              Commencez par importer des produits pour les voir apparaître ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </CardTitle>
                    {product.sku && (
                      <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
                    )}
                  </div>
                  {getStatusBadge(product.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Image */}
                {product.image_urls?.[0] && (
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={product.image_urls[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg'
                      }}
                    />
                  </div>
                )}

                {/* Product Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-primary">
                      {product.price}€
                    </span>
                    {product.cost_price && (
                      <span className="text-sm text-muted-foreground">
                        Coût: {product.cost_price}€
                      </span>
                    )}
                  </div>
                  
                  {product.category && (
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  )}

                  {product.supplier_name && (
                    <p className="text-sm text-muted-foreground">
                      Fournisseur: {product.supplier_name}
                    </p>
                  )}

                  {/* Quality Scores */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>Qualité: {getQualityScore(product)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {product.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => approveProduct.mutate(product.id)}
                        disabled={approveProduct.isPending}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectProduct.mutate(product.id)}
                        disabled={rejectProduct.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  {product.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => publishToCatalog.mutate(product.id)}
                      disabled={publishToCatalog.isPending}
                      className="flex-1"
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Publier
                    </Button>
                  )}

                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}