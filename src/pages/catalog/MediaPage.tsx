/**
 * MediaPage - Correction des médias avec données réelles et actions IA
 * Hub d'exécution: images et vidéos du catalogue
 * Phase 2: Intégration panneau Intelligence IA
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function MediaPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('critical')
  const [viewMode, setViewMode] = useState<'issues' | 'ai'>('ai')
  const { 
    stats, 
    issues, 
    productsWithoutImage, 
    isLoading, 
    bulkEnrichImages,
    isEnriching,
    enrichProgress
  } = useMediaAudit()

  // Filtrer les problèmes selon l'onglet
  const filteredIssues = useMemo(() => {
    if (activeTab === 'all') return issues.slice(0, 30)
    if (activeTab === 'critical') return issues.filter(i => i.severity === 'critical').slice(0, 30)
    return issues.filter(i => i.issueType === activeTab).slice(0, 30)
  }, [issues, activeTab])

  const issueCategories = [
    { id: 'critical', label: 'Critiques', icon: AlertTriangle, count: issues.filter(i => i.severity === 'critical').length, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'non_compliant', label: 'Non conformes', icon: ImageOff, count: stats.nonCompliant, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'missing_video', label: 'Sans vidéo', icon: VideoOff, count: stats.total - stats.withVideos, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'optimize', label: 'À optimiser', icon: Sparkles, count: stats.total - stats.withMultipleImages, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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
          <Button variant="outline" onClick={() => navigate('/products')}>
            <Upload className="h-4 w-4 mr-2" />Upload manuel
          </Button>
          <Button 
            onClick={handleBulkEnrich} 
            disabled={isEnriching || productsWithoutImage.length === 0}
          >
            {isEnriching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {enrichProgress.current}/{enrichProgress.total}
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Enrichir {Math.min(productsWithoutImage.length, 20)} produits
              </>
            )}
          </Button>
        </div>
      }
    >
      {/* Mode selector */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'issues' | 'ai')} className="mb-6">
        <TabsList>
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Intelligence IA
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Problèmes ({issues.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === 'ai' ? (
        <MediaAIPanel />
      ) : (
      <div className="space-y-6">
        {/* Score médias avec impact business */}
        <Card className="bg-gradient-to-r from-primary/5 to-violet-500/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Score qualité médias</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.withImages}/{stats.total} produits avec image principale
                </p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-4xl font-bold",
                  stats.score >= 80 ? "text-emerald-500" : stats.score >= 60 ? "text-amber-500" : "text-red-500"
                )}>
                  {stats.score}%
                </span>
                {stats.score < 80 && (
                  <p className="text-xs text-muted-foreground mt-1">Objectif: 80%</p>
                )}
              </div>
            </div>
            <Progress value={stats.score} className="h-3" />
            
            <div className="flex justify-between mt-3 text-sm text-muted-foreground">
              <span>{stats.withMultipleImages} avec galerie complète</span>
              <span>{stats.withVideos} avec vidéo</span>
            </div>

            {/* Impact estimé */}
            {stats.estimatedImpactWithImages > 0 && (
              <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600">
                    +{stats.estimatedImpactWithImages.toLocaleString()}€ potentiel
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Les produits avec images convertissent 30% mieux
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catégories de problèmes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {issueCategories.map((cat) => (
            <Card 
              key={cat.id} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]", 
                activeTab === cat.id && "ring-2 ring-primary"
              )} 
              onClick={() => setActiveTab(cat.id)}
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

        {/* Progression enrichissement */}
        {isEnriching && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Enrichissement IA en cours...</p>
                  <Progress 
                    value={(enrichProgress.current / enrichProgress.total) * 100} 
                    className="h-2 mt-2" 
                  />
                </div>
                <Badge variant="secondary">
                  {enrichProgress.current}/{enrichProgress.total}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grille des produits à corriger */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="h-5 w-5" />
                Produits à corriger
              </CardTitle>
              <Badge variant="secondary">{filteredIssues.length} produits</Badge>
            </div>
            <CardDescription>
              Cliquez sur un produit pour le corriger ou utilisez l'enrichissement IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Tous les médias sont en ordre !</h3>
                <p className="text-muted-foreground">Votre catalogue est optimisé</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredIssues.map((issue: MediaIssue) => {
                  const badge = getSeverityBadge(issue.severity)
                  return (
                    <div 
                      key={issue.product.id} 
                      className="group relative aspect-square rounded-xl border bg-muted overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => navigate(`/products?id=${issue.product.id}`)}
                    >
                      {issue.product.image_url ? (
                        <img 
                          src={issue.product.image_url} 
                          alt={issue.product.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <ImageOff className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground">Sans image</span>
                        </div>
                      )}
                      
                      {/* Badge de type */}
                      <Badge variant={badge.variant} className="absolute top-2 right-2 text-[10px]">
                        {issue.issueType === 'missing_image' ? '📷' : 
                         issue.issueType === 'non_compliant' ? '⚠️' :
                         issue.issueType === 'missing_video' ? '🎬' : '✨'}
                      </Badge>
                      
                      {/* Overlay au hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-white text-xs font-medium line-clamp-2">{issue.product.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-white/70 text-[10px]">{issue.suggestedAction}</span>
                          <ArrowRight className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {filteredIssues.length > 0 && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={() => navigate('/products')}>
                  Voir tous les produits ({stats.total})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </ChannablePageWrapper>
  )
}
