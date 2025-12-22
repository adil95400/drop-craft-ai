import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Sparkles,
  Package,
  ArrowRight
} from 'lucide-react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useProductAudit, useProductAudits } from '@/hooks/useProductAudit'

export default function AuditProductsList() {
  const navigate = useNavigate()
  const { user } = useUnifiedAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'products' | 'imported_products' | 'supplier_products'>('products')
  const { auditProduct, isAuditing } = useProductAudit()

  // Fetch products from the products table
  const { data: products, isLoading } = useQuery({
    queryKey: ['products-for-audit', activeTab, user?.id],
    queryFn: async () => {
      if (activeTab === 'products') {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, price, category, image_url')
          .eq('user_id', user?.id)
          .limit(50)
        if (error) throw error
        return data || []
      } else if (activeTab === 'imported_products') {
        const { data, error } = await supabase
          .from('imported_products')
          .select('id, product_id, price, category, source_platform')
          .eq('user_id', user?.id)
          .limit(50)
        if (error) throw error
        return (data || []).map(p => ({
          id: p.id,
          name: `Product ${p.product_id?.slice(0, 8) || p.id.slice(0, 8)}`,
          description: `Imported from ${p.source_platform || 'unknown'}`,
          price: p.price,
          category: p.category,
          image_url: null
        }))
      } else {
        const { data, error } = await (supabase.from('supplier_products') as any)
          .select('id, title, description, supplier_price, image_url')
          .eq('user_id', user?.id)
          .limit(50)
        if (error) throw error
        return (data || []).map((p: any) => ({
          id: p.id,
          name: p.title || 'Supplier Product',
          description: p.description,
          price: p.supplier_price,
          category: null,
          image_url: p.image_url
        }))
      }
    },
    enabled: !!user?.id,
  })

  // Fetch existing audits using the hook
  const { data: existingAudits } = useProductAudits(user?.id || '', 100)

  // Create a map for quick lookup
  const auditsMap = new Map()
  existingAudits?.forEach(audit => {
    const key = `${audit.product_source}-${audit.product_id}`
    if (!auditsMap.has(key)) {
      auditsMap.set(key, audit)
    }
  })

  const handleAuditProduct = async (productId: string, productSource: typeof activeTab) => {
    if (!user?.id) return

    await auditProduct.mutateAsync({
      productId,
      productSource,
      auditType: 'full',
      userId: user.id
    })
  }

  const filteredProducts = products?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getAuditStatus = (productId: string) => {
    const key = `${activeTab}-${productId}`
    return auditsMap.get(key)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Auditer des Produits
          </h1>
          <p className="text-muted-foreground mt-1">
            Sélectionnez des produits à analyser avec l'IA
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/audit')}>
          Retour au dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sélection des Produits</CardTitle>
          <CardDescription>
            Choisissez la source de vos produits et lancez l'audit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Mes Produits</TabsTrigger>
              <TabsTrigger value="imported_products">Importés</TabsTrigger>
              <TabsTrigger value="supplier_products">Fournisseurs</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Chargement des produits...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Essayez une autre recherche' : 'Commencez par ajouter des produits'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((product) => {
                    const audit = getAuditStatus(product.id)
                    const hasAudit = !!audit
                    const score = audit?.overall_score || 0

                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name || 'Product'}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{product.name || 'Sans nom'}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span>{product.price ? `${product.price}€` : 'Prix non défini'}</span>
                              {product.category && (
                                <>
                                  <span>•</span>
                                  <span>{product.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {hasAudit ? (
                            <>
                              <Badge className={getScoreColor(score)}>
                                Score: {score.toFixed(0)}/100
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/audit/${audit.id}`)}
                              >
                                Voir l'audit
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAuditProduct(product.id, activeTab)}
                              disabled={isAuditing}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              {isAuditing ? 'Audit en cours...' : 'Auditer'}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
