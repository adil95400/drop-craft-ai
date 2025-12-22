import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { 
  Search, Sparkles, FileText, TrendingUp, AlertTriangle, 
  CheckCircle, Loader2, Wand2, RefreshCw, BarChart3, Globe
} from 'lucide-react'

interface ProductSEO {
  id: string
  name: string
  category: string | null
  description: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[] | null
  ai_score: number | null
}

export default function SEOManager() {
  const queryClient = useQueryClient()
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [bulkProgress, setBulkProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch products with SEO data
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['seo-products', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, description, category, seo_title, seo_description')
        .order('created_at', { ascending: false })
        .limit(100)

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }

      const { data, error } = await query
      if (error) throw error
      // Map to ProductSEO type with seo_keywords as empty array
      return (data || []).map((p: any) => ({
        ...p,
        seo_keywords: [] as string[],
        ai_score: null
      })) as ProductSEO[]
    }
  })

  // Calculate SEO score from available data
  const calculateSEOScore = (product: ProductSEO): number => {
    let score = 0
    if (product.seo_title && product.seo_title.length > 10) score += 25
    if (product.seo_description && product.seo_description.length > 50) score += 25
    if (product.seo_keywords && product.seo_keywords.length > 0) score += 25
    if (product.description && product.description.length > 100) score += 25
    return score
  }

  // Calculate SEO stats
  const seoStats = {
    totalProducts: products.length,
    optimized: products.filter(p => calculateSEOScore(p) >= 70).length,
    needsWork: products.filter(p => calculateSEOScore(p) >= 40 && calculateSEOScore(p) < 70).length,
    critical: products.filter(p => calculateSEOScore(p) < 40).length,
    avgScore: products.length > 0 
      ? Math.round(products.reduce((sum, p) => sum + calculateSEOScore(p), 0) / products.length)
      : 0
  }

  // Generate SEO for single product
  const generateSEOMutation = useMutation({
    mutationFn: async (productId: string) => {
      const product = products.find(p => p.id === productId)
      if (!product) throw new Error('Product not found')

      const { data, error } = await supabase.functions.invoke('ai-product-optimizer', {
        body: {
          action: 'generate_seo',
          product: {
            name: product.name,
            description: product.description,
            category: product.category
          }
        }
      })

      if (error) throw error

      // Update product with SEO data
      const { error: updateError } = await supabase
        .from('products')
        .update({
          seo_title: data.meta_title || product.name,
          seo_description: data.meta_description || product.description?.substring(0, 160),
          seo_keywords: data.keywords || [],
          last_optimized_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (updateError) throw updateError

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-products'] })
      toast.success('SEO généré avec succès')
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`)
    }
  })

  // Bulk generate SEO
  const bulkGenerateSEO = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Sélectionnez des produits')
      return
    }

    setIsProcessing(true)
    setBulkProgress(0)

    let completed = 0
    for (const productId of selectedProducts) {
      try {
        await generateSEOMutation.mutateAsync(productId)
        completed++
        setBulkProgress(Math.round((completed / selectedProducts.length) * 100))
      } catch (error) {
        console.error(`Error processing ${productId}:`, error)
      }
    }

    setIsProcessing(false)
    setSelectedProducts([])
    toast.success(`${completed}/${selectedProducts.length} produits optimisés`)
  }

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  // Select all products
  const selectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  // Get score badge variant
  const getScoreBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-500/20 text-green-400">Bon ({score}%)</Badge>
    if (score >= 40) return <Badge className="bg-yellow-500/20 text-yellow-400">Moyen ({score}%)</Badge>
    return <Badge className="bg-red-500/20 text-red-400">Critique ({score}%)</Badge>
  }

  return (
    <>
      <Helmet>
        <title>SEO Manager - ShopOpti</title>
        <meta name="description" content="Optimisez le SEO de vos produits avec l'IA" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SEO Manager</h1>
            <p className="text-muted-foreground">Optimisez le référencement de vos produits avec l'IA</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['seo-products'] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button 
              onClick={bulkGenerateSEO}
              disabled={selectedProducts.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Optimiser ({selectedProducts.length})
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{seoStats.totalProducts}</p>
                  <p className="text-sm text-muted-foreground">Total Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-500">{seoStats.optimized}</p>
                  <p className="text-sm text-muted-foreground">Optimisés (≥70%)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{seoStats.needsWork}</p>
                  <p className="text-sm text-muted-foreground">À améliorer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-500">{seoStats.critical}</p>
                  <p className="text-sm text-muted-foreground">Critiques (&lt;40%)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{seoStats.avgScore}%</p>
                  <p className="text-sm text-muted-foreground">Score Moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Progress */}
        {isProcessing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Optimisation en cours...</span>
                  <span>{bulkProgress}%</span>
                </div>
                <Progress value={bulkProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Produits</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onCheckedChange={selectAllProducts}
                      />
                    </TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Meta Title</TableHead>
                    <TableHead>Keywords</TableHead>
                    <TableHead>Score SEO</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium truncate max-w-[200px]">
                          {product.name || 'Produit sans nom'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {product.category || 'Non catégorisé'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[200px] text-sm">
                          {product.seo_title || (
                            <span className="text-muted-foreground italic">Non défini</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(product.seo_keywords || []).slice(0, 3).map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                          {(product.seo_keywords || []).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(product.seo_keywords || []).length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getScoreBadge(calculateSEOScore(product))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => generateSEOMutation.mutate(product.id)}
                          disabled={generateSEOMutation.isPending}
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {products.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun produit trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
