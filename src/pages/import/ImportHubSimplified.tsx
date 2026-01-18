import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Layers, History, Settings, ArrowRight, Sparkles, 
  Package, CheckCircle, Clock, TrendingUp
} from 'lucide-react'
import { useImportJobs } from '@/hooks/useImportJobs'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection'

const importPages = [
  {
    id: 'advanced',
    title: 'Import Avancé',
    description: 'Importez des produits depuis URL, CSV, Excel, API ou flux XML avec notre moteur haute performance.',
    icon: Layers,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-500/20 hover:border-purple-500/50',
    link: '/import/advanced',
    badge: 'Principal',
    badgeColor: 'bg-purple-500',
    features: ['Import URL & CSV', 'Queue intelligente', 'Mapping automatique']
  },
  {
    id: 'history',
    title: 'Historique',
    description: 'Consultez l\'historique complet de vos imports avec détails et statistiques.',
    icon: History,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-500/20 hover:border-blue-500/50',
    link: '/import/history',
    features: ['Suivi détaillé', 'Filtres avancés', 'Export données']
  },
  {
    id: 'config',
    title: 'Configuration',
    description: 'Personnalisez les paramètres d\'import, règles de mapping et options avancées.',
    icon: Settings,
    color: 'from-slate-500 to-slate-600',
    bgColor: 'bg-slate-500/10',
    iconColor: 'text-slate-500',
    borderColor: 'border-slate-500/20 hover:border-slate-500/50',
    link: '/import/config',
    features: ['Règles de mapping', 'Paramètres défaut', 'Automatisations']
  }
]

export default function ImportHubSimplified() {
  const navigate = useNavigate()
  const { stats, isLoading } = useImportJobs()

  const heroStats = [
    { label: 'Total imports', value: stats.total.toString(), icon: Package },
    { label: 'En cours', value: stats.processing.toString(), icon: Clock },
    { label: 'Terminés', value: stats.completed.toString(), icon: CheckCircle }
  ]

  return (
    <ChannablePageLayout>
      <ChannableHeroSection
        badge={{ label: "Import Pro", icon: Sparkles }}
        title="Centre d'Import"
        description="Importez vos produits depuis n'importe quelle source avec notre système d'import intelligent."
        stats={heroStats}
        primaryAction={{
          label: 'Import Avancé',
          onClick: () => navigate('/import/advanced')
        }}
        secondaryAction={{
          label: 'Historique',
          onClick: () => navigate('/import/history')
        }}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.processing}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Terminés</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalProcessed}</p>
              <p className="text-xs text-muted-foreground">Produits</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {importPages.map((page, index) => (
          <motion.div
            key={page.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`group cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${page.borderColor} h-full`}
              onClick={() => navigate(page.link)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${page.bgColor}`}>
                    <page.icon className={`w-6 h-6 ${page.iconColor}`} />
                  </div>
                  {page.badge && (
                    <Badge className={page.badgeColor}>{page.badge}</Badge>
                  )}
                </div>
                <CardTitle className="text-xl mt-4 group-hover:text-primary transition-colors">
                  {page.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {page.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {page.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 group-hover:bg-primary/10"
                >
                  Accéder
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Import Shopify déplacé</h3>
              <p className="text-sm text-muted-foreground mb-3">
                L'import et la synchronisation Shopify sont maintenant disponibles dans le module Boutiques & Canaux pour une meilleure organisation.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/stores-channels/shopify')}
              >
                Aller vers Shopify
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </ChannablePageLayout>
  )
}
