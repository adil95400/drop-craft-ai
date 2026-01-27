/**
 * CategoriesBrandsPage - Classification produits avec données réelles
 * Hub d'exécution: catégories, marques et suggestions IA
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FolderTree, AlertTriangle, CheckCircle, Sparkles, Folder, Building, Tag } from 'lucide-react'
import { useCategoryClassification, CategoryStats } from '@/hooks/catalog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export default function CategoriesBrandsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('all')
  const { metrics, issues, uncategorized, unbranded, withSuggestions, isLoading } = useCategoryClassification()

  const issueCategories = [
    { id: 'no-category', label: 'Sans catégorie', icon: Folder, count: metrics.missingCategory, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'no-brand', label: 'Sans marque', icon: Building, count: metrics.missingBrand, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'suggestions', label: 'Suggestions IA', icon: Sparkles, count: withSuggestions.length, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]

  const totalIssues = metrics.missingCategory + metrics.missingBrand

  return (
    <ChannablePageWrapper 
      title="Catégories & Marques" 
      subtitle="Classification produits" 
      description="Organisez et classifiez vos produits avec l'aide de l'IA" 
      heroImage="products"
      badge={{ label: `${totalIssues} à corriger`, variant: totalIssues > 0 ? 'destructive' : 'secondary' }}
      actions={
        <Button>
          <Sparkles className="h-4 w-4 mr-2" />Classifier avec IA
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Score de classification */}
        <Card className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Score de classification</h3>
                <p className="text-sm text-muted-foreground">
                  Catégories: {metrics.withCategory}/{metrics.total} • Marques: {metrics.withBrand}/{metrics.total}
                </p>
              </div>
              <span className={cn(
                "text-4xl font-bold",
                metrics.classificationScore >= 80 ? "text-emerald-500" : 
                metrics.classificationScore >= 60 ? "text-amber-500" : "text-red-500"
              )}>
                {metrics.classificationScore}%
              </span>
            </div>
            <Progress value={metrics.classificationScore} className="h-3" />
          </CardContent>
        </Card>

        {/* Catégories de problèmes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Top catégories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Catégories principales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : metrics.topCategories.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune catégorie définie</p>
                <Button variant="outline" className="mt-3" onClick={() => navigate('/products')}>
                  <Sparkles className="h-4 w-4 mr-2" />Classifier les produits
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.topCategories.slice(0, 8).map((cat: CategoryStats) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-2 h-8 rounded-full bg-primary/20" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{cat.name}</p>
                          <span className="text-xs text-muted-foreground ml-2">
                            Ø {cat.avgPrice.toFixed(0)}€
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${cat.percentage}%` }} />
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-4">{cat.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top marques */}
        {metrics.topBrands.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Marques principales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {metrics.topBrands.slice(0, 15).map((brand) => (
                  <Badge key={brand.name} variant="outline" className="text-sm py-1.5 px-3">
                    {brand.name}
                    <span className="ml-2 text-muted-foreground">({brand.count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Produits avec suggestions IA */}
        {withSuggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Suggestions IA disponibles ({withSuggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {withSuggestions.slice(0, 8).map((issue) => (
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
                        <p className="text-xs text-muted-foreground">
                          {issue.issueType === 'no_category' ? 'Sans catégorie' : 'Sans marque'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {issue.suggestion && (
                        <Badge variant="outline" className="bg-purple-500/5 border-purple-500/30 text-purple-700">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {issue.suggestion}
                          {issue.confidence && (
                            <span className="ml-1 text-[10px] opacity-70">
                              ({Math.round(issue.confidence * 100)}%)
                            </span>
                          )}
                        </Badge>
                      )}
                      <Button size="sm" variant="ghost">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
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
