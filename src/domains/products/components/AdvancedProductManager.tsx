/**
 * Advanced Product Manager - Real data from products table
 */
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { 
  Package, Search, TrendingUp, Eye, Edit, Trash2,
  Upload, Download, Brain, DollarSign, BarChart3, Target,
  Zap, AlertTriangle, CheckCircle, Globe
} from 'lucide-react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'

export const AdvancedProductManager: React.FC = () => {
  const { user } = useUnifiedAuth()
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTab, setSelectedTab] = useState('products')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['advanced-products', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await (supabase.from('products') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name || p.title || '',
        description: p.description || '',
        price: Number(p.price) || 0,
        cost_price: Number(p.cost_price) || 0,
        profit_margin: p.profit_margin || (p.price && p.cost_price ? Math.round(((p.price - p.cost_price) / p.price) * 100) : 0),
        sku: p.sku || '',
        category: p.category || 'Non catégorisé',
        status: p.status || 'draft',
        stock_quantity: p.stock_quantity || 0,
        image_url: p.main_image_url || p.image_url,
        seo: { title: p.seo_title, description: p.seo_description, score: p.seo_score || 0 },
        performance: { views: 0, sales: 0, conversion_rate: 0, revenue: 0 },
        created_at: p.created_at,
        updated_at: p.updated_at,
      }))
    },
    enabled: !!user?.id,
  })

  const categories = [...new Set(products.map((p: any) => p.category))]
  
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalRevenue = products.reduce((sum: number, p: any) => sum + p.performance.revenue, 0)
  const avgSeoScore = products.length > 0 ? Math.round(products.reduce((s: number, p: any) => s + (p.seo.score || 0), 0) / products.length) : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': case 'inactive': return 'bg-red-500'
      case 'draft': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return <div className="space-y-6 animate-pulse"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-muted rounded" />)}</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center"><Package className="h-8 w-8 mr-3 text-primary" />Gestion Avancée des Produits</h1>
          <p className="text-muted-foreground">Optimisation IA, SEO avancé et analytics détaillés</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Produits totaux</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{products.length}</div><p className="text-xs text-muted-foreground">{products.filter((p: any) => p.status === 'active').length} actifs</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Valeur stock</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{products.reduce((s: number, p: any) => s + p.price * p.stock_quantity, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Marge moyenne</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{products.length > 0 ? Math.round(products.reduce((s: number, p: any) => s + p.profit_margin, 0) / products.length) : 0}%</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Score SEO moyen</CardTitle><Globe className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{avgSeoScore}/100</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Rechercher par nom ou SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product: any) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <Package className="h-6 w-6 text-muted-foreground" />}
                  </div>
                </div>
                <Badge className={`${getStatusColor(product.status)} text-white`}>{product.status}</Badge>
              </div>
              <div>
                <CardTitle className="text-base">{product.name}</CardTitle>
                <CardDescription className="text-sm mt-1">SKU: {product.sku} • {product.category}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><div className="text-muted-foreground">Prix</div><div className="font-bold">{product.price}€</div></div>
                <div><div className="text-muted-foreground">Stock</div><div className="font-bold">{product.stock_quantity}</div></div>
                <div><div className="text-muted-foreground">Marge</div><div className="font-bold">{product.profit_margin}%</div></div>
              </div>
              {product.seo.score > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Score SEO</span><span className="font-medium">{product.seo.score}/100</span></div>
                  <Progress value={product.seo.score} className="h-1.5" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filteredProducts.length === 0 && (
          <Card className="col-span-full"><CardContent className="flex items-center justify-center h-64">
            <div className="text-center"><Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3></div>
          </CardContent></Card>
        )}
      </div>
    </div>
  )
}