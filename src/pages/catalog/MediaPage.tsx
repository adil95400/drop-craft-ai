/**
 * MediaPage - Correction des médias avec données réelles
 * Hub d'exécution: images et vidéos du catalogue
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Image, ImageOff, VideoOff, Sparkles, CheckCircle, Upload, Wand2, AlertTriangle } from 'lucide-react'
import { useMediaAudit, MediaIssue } from '@/hooks/catalog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export default function MediaPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('all')
  const { stats, issues, productsWithoutImage, isLoading, products } = useMediaAudit()

  // Filtrer les problèmes selon l'onglet
  const filteredIssues = useMemo(() => {
    if (activeTab === 'all') return issues.slice(0, 20)
    return issues.filter(i => i.issueType === activeTab).slice(0, 20)
  }, [issues, activeTab])

  const issueCategories = [
    { id: 'missing_image', label: 'Images manquantes', icon: ImageOff, count: stats.withoutImages, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'non_compliant', label: 'Non conformes', icon: AlertTriangle, count: stats.nonCompliant, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'missing_video', label: 'Vidéos manquantes', icon: VideoOff, count: stats.total - stats.withVideos, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'optimize', label: 'À optimiser', icon: Sparkles, count: stats.total - stats.withMultipleImages, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]

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
      description="Gérez les images et vidéos de votre catalogue" 
      heroImage="products"
      badge={{ label: `${stats.withoutImages} à corriger`, variant: stats.withoutImages > 0 ? 'destructive' : 'secondary' }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Upload</Button>
          <Button><Wand2 className="h-4 w-4 mr-2" />Optimiser IA</Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Score médias */}
        <Card className="bg-gradient-to-r from-primary/5 to-violet-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Score médias</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.withImages}/{stats.total} produits avec image
                </p>
              </div>
              <span className={cn(
                "text-4xl font-bold",
                stats.score >= 80 ? "text-emerald-500" : stats.score >= 60 ? "text-amber-500" : "text-red-500"
              )}>
                {stats.score}%
              </span>
            </div>
            <Progress value={stats.score} className="h-3" />
            <div className="flex justify-between mt-3 text-sm text-muted-foreground">
              <span>{stats.withMultipleImages} avec galerie</span>
              <span>{stats.withVideos} avec vidéo</span>
            </div>
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

        {/* Grille des produits sans image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="h-5 w-5" />
              Produits à corriger ({filteredIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Tous les médias sont en ordre !</h3>
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
                        <img src={issue.product.image_url} alt={issue.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Badge variant={badge.variant} className="absolute top-2 right-2 text-[10px]">
                        {issue.issueType === 'missing_image' ? 'Manquant' : 
                         issue.issueType === 'non_compliant' ? 'Non conforme' :
                         issue.issueType === 'missing_video' ? 'Sans vidéo' : 'À optimiser'}
                      </Badge>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs line-clamp-2">{issue.product.name}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  )
}
