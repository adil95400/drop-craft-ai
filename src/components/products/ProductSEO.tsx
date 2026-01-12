import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProductsUnified } from '@/hooks/unified'
import { useSEOOptimization } from '@/hooks/useSEOOptimization'
import { SEOOptimizationDialog } from '@/components/modals/SEOOptimizationDialog'
import { Search, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, BarChart3, RefreshCw } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

type Product = {
  id: string
  name: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  description?: string
  image_url?: string
}

const calculateSEOScore = (product: Product): number => {
  let score = 0
  
  // Title (30 points)
  if (product.seo_title) {
    score += 30
    if (product.seo_title.length >= 30 && product.seo_title.length <= 60) score += 10
  }
  
  // Description (30 points)
  if (product.seo_description) {
    score += 30
    if (product.seo_description.length >= 120 && product.seo_description.length <= 160) score += 10
  }
  
  // Keywords (20 points)
  if (product.seo_keywords && product.seo_keywords.length > 0) {
    score += 20
  }
  
  // Product description (10 points)
  if (product.description && product.description.length > 50) {
    score += 10
  }
  
  return Math.min(score, 100)
}

const getSEOStatus = (score: number) => {
  if (score >= 80) return { label: 'Excellent', color: 'bg-green-500', variant: 'default' as const }
  if (score >= 60) return { label: 'Bon', color: 'bg-blue-500', variant: 'secondary' as const }
  if (score >= 40) return { label: 'Moyen', color: 'bg-yellow-500', variant: 'outline' as const }
  return { label: 'Faible', color: 'bg-red-500', variant: 'destructive' as const }
}

export function ProductSEO() {
  const { products, isLoading } = useProductsUnified()
  const { startOptimization, isOptimizing } = useSEOOptimization()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [seoDialogOpen, setSeoDialogOpen] = useState(false)

  // Calculate stats
  const productsWithScores = products.map(p => ({
    ...p,
    seoScore: calculateSEOScore(p)
  }))

  const filteredProducts = productsWithScores.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const avgScore = productsWithScores.length > 0
    ? productsWithScores.reduce((sum, p) => sum + p.seoScore, 0) / productsWithScores.length
    : 0

  const excellentCount = productsWithScores.filter(p => p.seoScore >= 80).length
  const needsWorkCount = productsWithScores.filter(p => p.seoScore < 60).length

  const handleOptimize = (product: Product) => {
    setSelectedProduct(product)
    setSeoDialogOpen(true)
  }

  const handleAutoOptimize = (product: Product) => {
    const recommendations = []
    
    if (!product.seo_title || product.seo_title.length < 30) {
      recommendations.push(`Titre optimisé: ${product.name} - Achat en Ligne | Livraison Rapide`)
    }
    
    if (!product.seo_description || product.seo_description.length < 120) {
      recommendations.push(`Meta description optimisée: Découvrez ${product.name}. ${product.description?.slice(0, 100) || 'Produit de qualité premium'}. Livraison gratuite. Commandez maintenant !`)
    }
    
    if (!product.seo_keywords || product.seo_keywords.length === 0) {
      recommendations.push(`Mots-clés suggérés: ${product.name.toLowerCase()}, acheter ${product.name.toLowerCase()}, ${product.name.toLowerCase()} pas cher`)
    }

    startOptimization({
      checkType: `product_${product.id}`,
      recommendations
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Score SEO Moyen</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgScore.toFixed(0)}/100</div>
              <Progress value={avgScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Excellents</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{excellentCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Score ≥ 80/100
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">À Améliorer</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{needsWorkCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Score &lt; 60/100
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Optimisation SEO des Produits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-primary/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Produit</TableHead>
                    <TableHead>Score SEO</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Titre SEO</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Mots-clés</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucun produit trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const status = getSEOStatus(product.seoScore)
                      return (
                        <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-10 h-10 rounded-lg object-cover shadow-md ring-2 ring-primary/10"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">
                                    {product.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <span className="max-w-[200px] truncate">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-full max-w-[100px]">
                                <Progress value={product.seoScore} className="h-2" />
                              </div>
                              <span className="text-sm font-semibold">{product.seoScore}/100</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {product.seo_title ? (
                              <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                                {product.seo_title}
                              </span>
                            ) : (
                              <span className="text-sm text-destructive">Non défini</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.seo_description ? (
                              <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                                {product.seo_description}
                              </span>
                            ) : (
                              <span className="text-sm text-destructive">Non définie</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.seo_keywords && product.seo_keywords.length > 0 ? (
                              <Badge variant="secondary">{product.seo_keywords.length} mots-clés</Badge>
                            ) : (
                              <span className="text-sm text-destructive">Aucun</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOptimize(product)}
                                className="hover:bg-primary/10 transition-colors"
                              >
                                Modifier
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleAutoOptimize(product)}
                                disabled={isOptimizing}
                                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all"
                              >
                                <Sparkles className="h-4 w-4 mr-1" />
                                Auto
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <SEOOptimizationDialog
        open={seoDialogOpen}
        onOpenChange={setSeoDialogOpen}
        productId={selectedProduct?.id}
        productName={selectedProduct?.name}
      />
    </>
  )
}