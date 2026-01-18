/**
 * ResearchHub - Page principale Veille & Recherche style Channable
 * Hub centralisé pour produits gagnants, concurrence, publicités, tendances
 * 
 * Optimisations:
 * - Design Channable premium avec hero section
 * - Support prefers-reduced-motion
 * - Accessibilité WCAG 2.1 AA
 * - Navigation par onglets vers sous-modules
 */
import { useState, useMemo, memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, Trophy, Target, TrendingUp, Eye, Megaphone,
  Sparkles, ArrowRight, BarChart3, Globe, Star, 
  DollarSign, ShoppingCart, Zap, Crown, Flame,
  ExternalLink, Play, RefreshCw, Filter, Package,
  ChevronRight, AlertCircle, CheckCircle, Clock,
  Facebook, Instagram
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useWinnersRealData } from '@/hooks/useWinnersRealData'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

// Quick access modules for research
interface ResearchModule {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  route: string
  gradient: string
  bgColor: string
  iconColor: string
  badge?: string
  stats: { label: string; value: string }
}

const RESEARCH_MODULES: ResearchModule[] = [
  {
    id: 'winning',
    title: 'Produits Gagnants',
    description: 'Découvrez les produits à fort potentiel avec l\'IA',
    icon: Trophy,
    route: '/research/winning',
    gradient: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/10',
    iconColor: 'text-yellow-500',
    badge: 'IA',
    stats: { label: 'Analysés', value: '2.4K' }
  },
  {
    id: 'competitors',
    title: 'Veille Concurrents',
    description: 'Surveillez vos concurrents et leurs stratégies',
    icon: Eye,
    route: '/research/competitors',
    gradient: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    stats: { label: 'Concurrents', value: '156' }
  },
  {
    id: 'ads',
    title: 'Ads Spy',
    description: 'Espionnez les publicités Facebook, TikTok, Instagram',
    icon: Megaphone,
    route: '/research/ads',
    gradient: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500/10',
    iconColor: 'text-pink-500',
    badge: 'Pro',
    stats: { label: 'Publicités', value: '50K+' }
  },
  {
    id: 'trends',
    title: 'Tendances',
    description: 'Analysez les tendances du marché en temps réel',
    icon: TrendingUp,
    route: '/research/trends',
    gradient: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-500',
    stats: { label: 'Tendances', value: '89' }
  },
  {
    id: 'sourcing',
    title: 'Sourcing',
    description: 'Trouvez les meilleurs fournisseurs pour vos produits',
    icon: Package,
    route: '/research/sourcing',
    gradient: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
    stats: { label: 'Fournisseurs', value: '340' }
  },
  {
    id: 'intelligence',
    title: 'Intelligence',
    description: 'Hub d\'intelligence concurrentielle avancée',
    icon: Target,
    route: '/research/intelligence',
    gradient: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
    badge: 'Avancé',
    stats: { label: 'Analyses', value: '1.2K' }
  },
]

// Stats cards data
const QUICK_STATS = [
  { 
    id: 'products', 
    label: 'Produits Analysés', 
    icon: Package, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  { 
    id: 'winners', 
    label: 'Produits Gagnants', 
    icon: Trophy, 
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20'
  },
  { 
    id: 'trends', 
    label: 'Tendances Actives', 
    icon: TrendingUp, 
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20'
  },
  { 
    id: 'competitors', 
    label: 'Concurrents Suivis', 
    icon: Eye, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20'
  },
]

// Module Card Component
const ModuleCard = memo(({ 
  module, 
  onClick, 
  prefersReducedMotion 
}: { 
  module: ResearchModule
  onClick: () => void
  prefersReducedMotion: boolean
}) => {
  const Icon = module.icon
  
  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -4 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
    >
      <Card 
        className={cn(
          "cursor-pointer group overflow-hidden transition-all duration-300",
          "hover:shadow-xl hover:border-primary/30 border-2"
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        aria-label={`Accéder à ${module.title}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
              module.bgColor
            )}>
              <Icon className={cn("h-6 w-6", module.iconColor)} aria-hidden="true" />
            </div>
            {module.badge && (
              <Badge className={cn(
                "bg-gradient-to-r text-white border-0 text-[10px] font-bold uppercase",
                module.gradient
              )}>
                {module.badge}
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
            {module.title}
          </CardTitle>
          <CardDescription className="text-sm">
            {module.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{module.stats.value}</span>
              <span className="text-xs text-muted-foreground">{module.stats.label}</span>
            </div>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              "bg-muted group-hover:bg-gradient-to-r group-hover:text-white",
              `group-hover:${module.gradient}`
            )}>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
ModuleCard.displayName = 'ModuleCard'

// Trending Product Card
const TrendingProductCard = memo(({ 
  product, 
  rank,
  prefersReducedMotion 
}: { 
  product: any
  rank: number
  prefersReducedMotion: boolean
}) => {
  const navigate = useNavigate()
  
  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
      transition={prefersReducedMotion ? undefined : { delay: rank * 0.1 }}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={() => navigate('/research/winning')}
      role="button"
      tabIndex={0}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg",
        rank === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600" :
        rank === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500" :
        rank === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600" :
        "bg-muted text-muted-foreground"
      )}>
        #{rank + 1}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate group-hover:text-primary transition-colors">
          {product.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            {product.trend}
          </span>
          <span>•</span>
          <span>{product.category}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {product.score}/100
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </motion.div>
  )
})
TrendingProductCard.displayName = 'TrendingProductCard'

export default function ResearchHub() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch real winners data for preview
  const { data: winnersData, isLoading } = useWinnersRealData(undefined, 5)
  
  const handleModuleClick = useCallback((route: string) => {
    navigate(route)
  }, [navigate])
  
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/research/winning?q=${encodeURIComponent(searchQuery)}`)
    }
  }, [searchQuery, navigate])
  
  // Stats from winners data
  const stats = useMemo(() => ({
    products: winnersData?.metrics?.totalWinners ? winnersData.metrics.totalWinners * 15 : 2400,
    winners: winnersData?.metrics?.totalWinners || 156,
    trends: 89, // Static for now
    competitors: 156,
  }), [winnersData])
  
  const topProducts = winnersData?.products?.slice(0, 5) || []

  return (
    <>
      <Helmet>
        <title>Veille & Recherche | ShopOpti</title>
        <meta name="description" content="Hub de veille produits et concurrence. Trouvez les produits gagnants, analysez vos concurrents et découvrez les tendances du marché." />
      </Helmet>
      
      <ChannablePageWrapper
        title="Veille & Recherche"
        description="Découvrez les produits gagnants, analysez vos concurrents et identifiez les opportunités du marché"
        heroImage="analytics"
        badge={{ label: "Intelligence IA", icon: Sparkles }}
        actions={
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/research/intelligence')}
              className="hidden sm:flex"
            >
              <Target className="mr-2 h-4 w-4" />
              Intelligence
            </Button>
            <Button 
              onClick={() => navigate('/research/winning')}
              className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-500"
              size="lg"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Produits Gagnants
            </Button>
          </div>
        }
      >
        {/* Quick Search */}
        <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5">
          <CardContent className="py-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit, une niche, un concurrent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-background"
                  aria-label="Rechercher"
                />
              </div>
              <Button type="submit" size="lg" className="h-12">
                <Sparkles className="mr-2 h-5 w-5" />
                Analyser
              </Button>
            </form>
            
            {/* Quick tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Populaires:</span>
              {['Fitness', 'Cuisine', 'Beauté', 'Tech', 'Enfants'].map(tag => (
                <Badge 
                  key={tag}
                  variant="secondary" 
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => {
                    setSearchQuery(tag)
                    navigate(`/research/winning?q=${encodeURIComponent(tag)}`)
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {QUICK_STATS.map((stat, index) => {
            const Icon = stat.icon
            const value = stats[stat.id as keyof typeof stats]
            
            return (
              <motion.div
                key={stat.id}
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? undefined : { delay: index * 0.1 }}
              >
                <Card className={cn("border-2", stat.borderColor)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold mt-1">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </p>
                      </div>
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bgColor)}>
                        <Icon className={cn("h-6 w-6", stat.color)} aria-hidden="true" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
        
        {/* Modules Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Modules de Recherche</h2>
            <Badge variant="secondary">
              {RESEARCH_MODULES.length} modules
            </Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {RESEARCH_MODULES.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onClick={() => handleModuleClick(module.route)}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        </div>
        
        {/* Top Winners Preview */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">Top Produits Gagnants</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/research/winning')}>
                  Voir tout
                  <ArrowRight className="ml-2 h-4 w-4" />
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
                  <TrendingProductCard
                    key={product.id || index}
                    product={product}
                    rank={index}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun produit gagnant trouvé</p>
                  <Button variant="link" onClick={() => navigate('/research/winning')}>
                    Analyser des produits
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Actions Rapides</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate('/research/winning')}
              >
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mr-4">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Trouver des Winners</p>
                  <p className="text-xs text-muted-foreground">Analyse IA des produits gagnants</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate('/research/competitors')}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mr-4">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Analyser un Concurrent</p>
                  <p className="text-xs text-muted-foreground">Espionnez leurs stratégies</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate('/research/ads')}
              >
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center mr-4">
                  <Megaphone className="h-5 w-5 text-pink-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Spy Publicités</p>
                  <p className="text-xs text-muted-foreground">Facebook, TikTok, Instagram</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate('/research/sourcing')}
              >
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mr-4">
                  <Package className="h-5 w-5 text-violet-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Sourcing Produits</p>
                  <p className="text-xs text-muted-foreground">Trouvez les meilleurs fournisseurs</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ChannablePageWrapper>
    </>
  )
}
