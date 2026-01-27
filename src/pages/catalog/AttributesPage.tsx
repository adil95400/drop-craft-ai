/**
 * AttributesPage - Enrichissement des attributs avec données réelles
 * Hub d'exécution: attributs critiques marketplace
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tag, AlertTriangle, CheckCircle, Sparkles, ShoppingBag, FileWarning, Wand2 } from 'lucide-react'
import { useAttributeAnalysis, MarketplaceRequirement } from '@/hooks/catalog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function AttributesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('all')
  const { stats, marketplaceAnalysis, productIssues, enrichableProducts, isLoading } = useAttributeAnalysis()

  const issueCategories = [
    { id: 'missing', label: 'Manquants', icon: FileWarning, count: stats.missingCategory + stats.missingBrand, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'sku', label: 'Sans SKU', icon: Tag, count: stats.missingSKU, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'gtin', label: 'Sans GTIN', icon: ShoppingBag, count: stats.missingGTIN, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'enrichment', label: 'Enrichissement IA', icon: Sparkles, count: enrichableProducts.length, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]

  return (
    <ChannablePageWrapper 
      title="Attributs" 
      subtitle="Enrichissement catalogue" 
      description="Normalisez et enrichissez les attributs pour les marketplaces" 
      heroImage="products" 
      badge={{ label: 'PRO', variant: 'default' }}
      actions={
        <Button>
          <Wand2 className="h-4 w-4 mr-2" />Enrichir avec IA
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Score de complétude */}
        <Card className="bg-gradient-to-r from-violet-500/5 to-purple-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Complétude des attributs</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.complete}/{stats.total} produits complets
                </p>
              </div>
              <span className={cn(
                "text-4xl font-bold",
                stats.completenessScore >= 80 ? "text-emerald-500" : 
                stats.completenessScore >= 60 ? "text-amber-500" : "text-red-500"
              )}>
                {stats.completenessScore}%
              </span>
            </div>
            <Progress value={stats.completenessScore} className="h-3" />
          </CardContent>
        </Card>

        {/* Catégories de problèmes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {issueCategories.map((cat) => (
            <Card 
              key={cat.id} 
              className={cn("cursor-pointer transition-all hover:shadow-md", activeTab === cat.id && "ring-2 ring-primary")} 
              onClick={() => setActiveTab(activeTab === cat.id ? 'all' : cat.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", cat.bg)}>
                    <cat.icon className={cn("h-5 w-5", cat.color)} />
                  </div>
                  <div>
                    <p className={cn("text-2xl font-bold", cat.color)}>{cat.count}</p>
                    <p className="text-xs text-muted-foreground truncate">{cat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tableau des attributs critiques par marketplace */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Attributs critiques par marketplace
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marketplace</TableHead>
                    <TableHead>Attributs requis</TableHead>
                    <TableHead className="text-right">Incomplets</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketplaceAnalysis.map((mp: MarketplaceRequirement) => (
                    <TableRow key={mp.marketplace}>
                      <TableCell className="font-medium">{mp.marketplace}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {mp.requiredAttributes.map((attr) => (
                            <Badge key={attr} variant="outline" className="text-xs capitalize">
                              {attr}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={mp.missingCount > stats.total * 0.3 ? 'destructive' : 'secondary'}>
                          {mp.missingCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => navigate('/products')}>
                          <Sparkles className="h-3 w-3 mr-1" />Enrichir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Produits à enrichir */}
        {productIssues.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Produits avec attributs manquants ({Math.min(productIssues.length, 10)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {productIssues.slice(0, 10).map((issue) => (
                  <div 
                    key={issue.product.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/products?id=${issue.product.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {issue.product.image_url ? (
                          <img src={issue.product.image_url} alt={issue.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{issue.product.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          {issue.missingAttributes.slice(0, 3).map((attr) => (
                            <Badge key={attr} variant="outline" className="text-[10px]">{attr}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={issue.criticality === 'high' ? 'destructive' : issue.criticality === 'medium' ? 'secondary' : 'outline'}
                    >
                      {issue.criticality === 'high' ? '⚠️' : issue.criticality === 'medium' ? '⏳' : '💡'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ChannablePageWrapper>
  )
}
