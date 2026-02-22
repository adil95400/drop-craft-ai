/**
 * CategoriesBrandsPage - Classification produits avec données réelles
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FolderTree, AlertTriangle, CheckCircle, Sparkles, Folder, Building, Tag, ArrowRight } from 'lucide-react'
import { useCategoryClassification, CategoryStats } from '@/hooks/catalog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } }

export default function CategoriesBrandsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('all')
  const { metrics, issues, uncategorized, unbranded, withSuggestions, isLoading } = useCategoryClassification()

  const issueCategories = [
    { id: 'no-category', label: 'Sans catégorie', icon: Folder, count: metrics.missingCategory, color: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500' },
    { id: 'no-brand', label: 'Sans marque', icon: Building, count: metrics.missingBrand, color: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500' },
    { id: 'suggestions', label: 'Suggestions IA', icon: Sparkles, count: withSuggestions.length, color: 'text-purple-500', bg: 'bg-purple-500/10', ring: 'ring-purple-500' },
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
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Sparkles className="h-4 w-4" />Classifier avec IA
        </Button>
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Score */}
        <motion.div variants={fadeUp}>
          <Card className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5 border-emerald-500/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Score de classification</h3>
                  <p className="text-sm text-muted-foreground">
                    Catégories: {metrics.withCategory}/{metrics.total} • Marques: {metrics.withBrand}/{metrics.total}
                  </p>
                </div>
                <span className={cn(
                  "text-5xl font-black tracking-tight",
                  metrics.classificationScore >= 80 ? "text-emerald-500" : metrics.classificationScore >= 60 ? "text-amber-500" : "text-red-500"
                )}>
                  {metrics.classificationScore}%
                </span>
              </div>
              <Progress value={metrics.classificationScore} className="h-3" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Catégories de problèmes */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {issueCategories.map((cat) => (
            <Card
              key={cat.id}
              className={cn("cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group", activeTab === cat.id && `ring-2 ${cat.ring} shadow-lg`)}
              onClick={() => setActiveTab(activeTab === cat.id ? 'all' : cat.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", cat.bg)}>
                    <cat.icon className={cn("h-6 w-6", cat.color)} />
                  </div>
                  <div>
                    <p className={cn("text-3xl font-black tabular-nums", cat.color)}>{cat.count}</p>
                    <p className="text-sm text-muted-foreground">{cat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Top catégories */}
        <motion.div variants={fadeUp}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Catégories principales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : metrics.topCategories.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">Aucune catégorie définie</p>
                  <Button variant="outline" className="mt-3 gap-2" onClick={() => navigate('/products')}>
                    <Sparkles className="h-4 w-4" />Classifier les produits
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.topCategories.slice(0, 8).map((cat: CategoryStats, idx: number) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center justify-between group hover:bg-accent/50 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-1.5 h-10 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold truncate">{cat.name}</p>
                            <span className="text-xs text-muted-foreground ml-2">Ø {cat.avgPrice.toFixed(0)}€</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mt-1.5">
                            <motion.div
                              className="bg-primary h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${cat.percentage}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.05 }}
                            />
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-4 tabular-nums font-bold">{cat.count}</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top marques */}
        {metrics.topBrands.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Marques principales
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {metrics.topBrands.slice(0, 15).map((brand, idx) => (
                    <motion.div
                      key={brand.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Badge variant="outline" className="text-sm py-2 px-4 hover:bg-accent cursor-pointer transition-colors">
                        {brand.name}
                        <span className="ml-2 text-muted-foreground font-bold">({brand.count})</span>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Suggestions IA */}
        {withSuggestions.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Suggestions IA disponibles ({withSuggestions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {withSuggestions.slice(0, 8).map((issue, idx) => (
                    <motion.div
                      key={issue.product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/products?id=${issue.product.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden flex-shrink-0 ring-1 ring-border">
                          {issue.product.image_url ? (
                            <img src={issue.product.image_url} alt={issue.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm line-clamp-1">{issue.product.name}</p>
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
                              <span className="ml-1 text-[10px] opacity-70">({Math.round(issue.confidence * 100)}%)</span>
                            )}
                          </Badge>
                        )}
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </ChannablePageWrapper>
  )
}
