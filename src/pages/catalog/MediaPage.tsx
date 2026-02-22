/**
 * MediaPage - Correction des médias avec données réelles et actions IA
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Image, ImageOff, VideoOff, Sparkles, CheckCircle, Upload, Wand2, AlertTriangle, Euro, Loader2, ArrowRight, TrendingUp } from 'lucide-react'
import { useMediaAudit, MediaIssue } from '@/hooks/catalog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MediaAIPanel } from '@/components/catalog/MediaAIPanel'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } }

export default function MediaPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('critical')
  const [viewMode, setViewMode] = useState<'issues' | 'ai'>('ai')
  const { stats, issues, productsWithoutImage, isLoading, bulkEnrichImages, isEnriching, enrichProgress } = useMediaAudit()

  const filteredIssues = useMemo(() => {
    if (activeTab === 'all') return issues.slice(0, 30)
    if (activeTab === 'critical') return issues.filter(i => i.severity === 'critical').slice(0, 30)
    return issues.filter(i => i.issueType === activeTab).slice(0, 30)
  }, [issues, activeTab])

  const issueCategories = [
    { id: 'critical', label: 'Critiques', icon: AlertTriangle, count: issues.filter(i => i.severity === 'critical').length, color: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500' },
    { id: 'non_compliant', label: 'Non conformes', icon: ImageOff, count: stats.nonCompliant, color: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500' },
    { id: 'missing_video', label: 'Sans vidéo', icon: VideoOff, count: stats.total - stats.withVideos, color: 'text-blue-500', bg: 'bg-blue-500/10', ring: 'ring-blue-500' },
    { id: 'optimize', label: 'À optimiser', icon: Sparkles, count: stats.total - stats.withMultipleImages, color: 'text-purple-500', bg: 'bg-purple-500/10', ring: 'ring-purple-500' },
  ]

  const handleBulkEnrich = async () => {
    const productIds = productsWithoutImage.slice(0, 20).map(p => p.id)
    await bulkEnrichImages(productIds)
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return { label: '⚠️ Critique', variant: 'destructive' as const }
      case 'warning': return { label: '⏳ À corriger', variant: 'secondary' as const }
      default: return { label: '💡 Suggestion', variant: 'outline' as const }
    }
  }

  return (
    <ChannablePageWrapper
      title="Médias"
      subtitle="Correction et optimisation"
      description="Enrichissez automatiquement les images et vidéos de votre catalogue"
      heroImage="products"
      badge={{ label: `${stats.withoutImages} sans image`, variant: stats.withoutImages > 0 ? 'destructive' : 'secondary' }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/products')} className="gap-2">
            <Upload className="h-4 w-4" />Upload manuel
          </Button>
          <Button onClick={handleBulkEnrich} disabled={isEnriching || productsWithoutImage.length === 0} className="gap-2 shadow-lg shadow-primary/20">
            {isEnriching ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{enrichProgress.current}/{enrichProgress.total}</>
            ) : (
              <><Wand2 className="h-4 w-4" />Enrichir {Math.min(productsWithoutImage.length, 20)} produits</>
            )}
          </Button>
        </div>
      }
    >
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'issues' | 'ai')} className="mb-6">
        <TabsList className="bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="ai" className="gap-2 data-[state=active]:shadow-md"><Sparkles className="h-4 w-4" />Intelligence IA</TabsTrigger>
          <TabsTrigger value="issues" className="gap-2 data-[state=active]:shadow-md"><AlertTriangle className="h-4 w-4" />Problèmes ({issues.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === 'ai' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MediaAIPanel /></motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          {/* Score médias */}
          <motion.div variants={fadeUp}>
            <Card className="bg-gradient-to-r from-primary/5 via-violet-500/5 to-primary/5 border-primary/20 overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-400/5 to-transparent" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Score qualité médias</h3>
                    <p className="text-sm text-muted-foreground">{stats.withImages}/{stats.total} produits avec image principale</p>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-5xl font-black tracking-tight", stats.score >= 80 ? "text-emerald-500" : stats.score >= 60 ? "text-amber-500" : "text-red-500")}>
                      {stats.score}%
                    </span>
                    {stats.score < 80 && <p className="text-xs text-muted-foreground mt-1">Objectif: 80%</p>}
                  </div>
                </div>
                <Progress value={stats.score} className="h-3" />
                <div className="flex justify-between mt-3 text-sm text-muted-foreground">
                  <span>{stats.withMultipleImages} avec galerie complète</span>
                  <span>{stats.withVideos} avec vidéo</span>
                </div>

                {stats.estimatedImpactWithImages > 0 && (
                  <div className="mt-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-600">+{stats.estimatedImpactWithImages.toLocaleString()}€ potentiel</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Les produits avec images convertissent 30% mieux</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Catégories */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {issueCategories.map((cat) => (
              <Card
                key={cat.id}
                className={cn("cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group", activeTab === cat.id && `ring-2 ${cat.ring} shadow-lg`)}
                onClick={() => setActiveTab(cat.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-2xl transition-transform group-hover:scale-110", cat.bg)}>
                      <cat.icon className={cn("h-5 w-5", cat.color)} />
                    </div>
                    <div>
                      <p className={cn("text-2xl font-black tabular-nums", cat.color)}>{cat.count}</p>
                      <p className="text-xs text-muted-foreground truncate">{cat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Progression */}
          {isEnriching && (
            <motion.div variants={fadeUp}>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold">Enrichissement IA en cours...</p>
                      <Progress value={(enrichProgress.current / enrichProgress.total) * 100} className="h-2 mt-2" />
                    </div>
                    <Badge variant="secondary">{enrichProgress.current}/{enrichProgress.total}</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Grille */}
          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Image className="h-5 w-5" />Produits à corriger</CardTitle>
                  <Badge variant="secondary">{filteredIssues.length} produits</Badge>
                </div>
                <CardDescription>Cliquez sur un produit pour le corriger ou utilisez l'enrichissement IA</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                  </div>
                ) : filteredIssues.length === 0 ? (
                  <div className="text-center py-16">
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                      <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-lg font-semibold">Tous les médias sont en ordre !</h3>
                    <p className="text-muted-foreground">Votre catalogue est optimisé</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredIssues.map((issue: MediaIssue, idx) => {
                      const badge = getSeverityBadge(issue.severity)
                      return (
                        <motion.div
                          key={issue.product.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className="group relative aspect-square rounded-xl border bg-muted overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary hover:shadow-lg transition-all"
                          onClick={() => navigate(`/products?id=${issue.product.id}`)}
                        >
                          {issue.product.image_url ? (
                            <img src={issue.product.image_url} alt={issue.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                              <ImageOff className="h-8 w-8 text-muted-foreground mb-2" />
                              <span className="text-xs text-muted-foreground">Sans image</span>
                            </div>
                          )}
                          <Badge variant={badge.variant} className="absolute top-2 right-2 text-[10px] shadow-sm">
                            {issue.issueType === 'missing_image' ? '📷' : issue.issueType === 'non_compliant' ? '⚠️' : issue.issueType === 'missing_video' ? '🎬' : '✨'}
                          </Badge>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <p className="text-white text-xs font-semibold line-clamp-2">{issue.product.name}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-white/70 text-[10px]">{issue.suggestedAction}</span>
                              <ArrowRight className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
                {filteredIssues.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <Button variant="outline" onClick={() => navigate('/products')} className="gap-2">Voir tous les produits ({stats.total})</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </ChannablePageWrapper>
  )
}
