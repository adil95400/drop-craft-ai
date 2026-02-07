/**
 * ResearchHub - Hub Veille & Recherche
 * Migré sur socle PageLayout + PageBanner + StatCard
 */
import { useState, useMemo, memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageLayout, StatCard, PageBanner } from '@/components/shared'
import {
  Search, Trophy, Target, TrendingUp, Eye, Megaphone,
  Sparkles, ArrowRight, Package, ChevronRight, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWinnersRealData } from '@/hooks/useWinnersRealData'

interface ResearchModule {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  route: string
  bgColor: string
  iconColor: string
  badge?: string
  stats: { label: string; value: string }
}

const RESEARCH_MODULES: ResearchModule[] = [
  { id: 'winning', title: 'Produits Gagnants', description: 'Découvrez les produits à fort potentiel avec l\'IA', icon: Trophy, route: '/research/winning', bgColor: 'bg-warning/10', iconColor: 'text-warning', badge: 'IA', stats: { label: 'Analysés', value: '2.4K' } },
  { id: 'competitors', title: 'Veille Concurrents', description: 'Surveillez vos concurrents et leurs stratégies', icon: Eye, route: '/research/competitors', bgColor: 'bg-info/10', iconColor: 'text-info', stats: { label: 'Concurrents', value: '156' } },
  { id: 'ads', title: 'Ads Spy', description: 'Espionnez les publicités Facebook, TikTok, Instagram', icon: Megaphone, route: '/research/ads', bgColor: 'bg-destructive/10', iconColor: 'text-destructive', badge: 'Pro', stats: { label: 'Publicités', value: '50K+' } },
  { id: 'trends', title: 'Tendances', description: 'Analysez les tendances du marché en temps réel', icon: TrendingUp, route: '/research/trends', bgColor: 'bg-success/10', iconColor: 'text-success', stats: { label: 'Tendances', value: '89' } },
  { id: 'sourcing', title: 'Sourcing', description: 'Trouvez les meilleurs fournisseurs pour vos produits', icon: Package, route: '/research/sourcing', bgColor: 'bg-primary/10', iconColor: 'text-primary', stats: { label: 'Fournisseurs', value: '340' } },
  { id: 'intelligence', title: 'Intelligence', description: 'Hub d\'intelligence concurrentielle avancée', icon: Target, route: '/research/intelligence', bgColor: 'bg-primary/10', iconColor: 'text-primary', badge: 'Avancé', stats: { label: 'Analyses', value: '1.2K' } },
]

const ModuleCard = memo(({ module, onClick }: { module: ResearchModule; onClick: () => void }) => {
  const Icon = module.icon
  return (
    <Card
      className="cursor-pointer group hover:shadow-md hover:border-primary/30 transition-all"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Accéder à ${module.title}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", module.bgColor)}>
            <Icon className={cn("h-5 w-5", module.iconColor)} />
          </div>
          {module.badge && <Badge variant="secondary" className="text-[10px]">{module.badge}</Badge>}
        </div>
        <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors">{module.title}</CardTitle>
        <CardDescription className="text-sm">{module.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{module.stats.value}</span>
            <span className="text-xs text-muted-foreground">{module.stats.label}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  )
})
ModuleCard.displayName = 'ModuleCard'

export default function ResearchHub() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const { data: winnersData, isLoading } = useWinnersRealData(undefined, 5)

  const handleModuleClick = useCallback((route: string) => navigate(route), [navigate])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/research/winning?q=${encodeURIComponent(searchQuery)}`)
  }, [searchQuery, navigate])

  const stats = useMemo(() => ({
    products: winnersData?.metrics?.totalWinners ? winnersData.metrics.totalWinners * 15 : 2400,
    winners: winnersData?.metrics?.totalWinners || 156,
    trends: 89,
    competitors: 156,
  }), [winnersData])

  const topProducts = winnersData?.products?.slice(0, 5) || []

  return (
    <>
      <Helmet>
        <title>Veille & Recherche | ShopOpti</title>
        <meta name="description" content="Hub de veille produits et concurrence. Trouvez les produits gagnants et analysez vos concurrents." />
      </Helmet>

      <PageLayout
        title="Veille & Recherche"
        subtitle="Produits gagnants, concurrence, tendances"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/research/intelligence')}>
              <Target className="mr-2 h-4 w-4" />Intelligence
            </Button>
            <Button size="sm" onClick={() => navigate('/research/winning')}>
              <Trophy className="mr-2 h-4 w-4" />Produits Gagnants
            </Button>
          </div>
        }
      >
        <PageBanner
          icon={Sparkles}
          title="Intelligence IA"
          description="Découvrez les produits gagnants, analysez vos concurrents et identifiez les opportunités"
          theme="purple"
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Produits Analysés" value={stats.products.toLocaleString()} icon={Package} color="info" />
          <StatCard label="Produits Gagnants" value={stats.winners} icon={Trophy} color="warning" />
          <StatCard label="Tendances Actives" value={stats.trends} icon={TrendingUp} color="success" />
          <StatCard label="Concurrents Suivis" value={stats.competitors} icon={Eye} color="primary" />
        </div>

        {/* Quick Search */}
        <Card>
          <CardContent className="py-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit, une niche, un concurrent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Rechercher"
                />
              </div>
              <Button type="submit" size="sm">
                <Sparkles className="mr-2 h-4 w-4" />Analyser
              </Button>
            </form>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-sm text-muted-foreground">Populaires:</span>
              {['Fitness', 'Cuisine', 'Beauté', 'Tech', 'Enfants'].map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => { setSearchQuery(tag); navigate(`/research/winning?q=${encodeURIComponent(tag)}`) }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modules Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {RESEARCH_MODULES.map((module) => (
            <ModuleCard key={module.id} module={module} onClick={() => handleModuleClick(module.route)} />
          ))}
        </div>

        {/* Top Winners Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warning" />
                <CardTitle className="text-lg">Top Produits Gagnants</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/research/winning')}>
                Voir tout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : topProducts.length > 0 ? (
              topProducts.map((product: any, index: number) => (
                <div
                  key={product.id || index}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/research/winning')}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs",
                    index === 0 ? "bg-warning" : index === 1 ? "bg-muted-foreground" : index === 2 ? "bg-warning/70" : "bg-muted text-muted-foreground"
                  )}>
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span>{product.trend}</span>
                      <span>•</span>
                      <span>{product.category}</span>
                    </div>
                  </div>
                  <Badge variant="secondary">{product.score}/100</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucun produit gagnant trouvé</p>
                <Button variant="link" onClick={() => navigate('/research/winning')}>Analyser des produits</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PageLayout>
    </>
  )
}
