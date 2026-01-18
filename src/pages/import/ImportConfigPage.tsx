import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  FileSpreadsheet, Link as LinkIcon, Database, Code, Settings, Globe,
  Upload, Zap, History, Calendar, CheckCircle, ArrowRight, Sparkles,
  Clock, TrendingUp, Shield, ChevronRight, Package, RefreshCw
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection'

// Hook pour préférences réduites
const useReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const importMethods = [
  {
    id: 'csv',
    title: 'Import CSV',
    description: 'Importez vos produits depuis un fichier CSV ou Excel',
    icon: FileSpreadsheet,
    route: '/import/quick',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-500',
    badge: 'Populaire',
    badgeColor: 'bg-green-500',
    features: ['Glisser-déposer', 'Mapping auto', 'Validation'],
  },
  {
    id: 'url',
    title: 'Import par URL',
    description: 'Importez depuis AliExpress, Amazon, Temu...',
    icon: LinkIcon,
    route: '/import/url',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    badge: 'Nouveau',
    badgeColor: 'bg-blue-500',
    features: ['Auto-détection', 'Multi-plateforme', 'Images HD'],
  },
  {
    id: 'advanced',
    title: 'Import Avancé',
    description: 'Configuration avancée et API REST/GraphQL',
    icon: Code,
    route: '/import/advanced',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    badge: 'Pro',
    badgeColor: 'bg-purple-500',
    features: ['API complète', 'Webhooks', 'Batch import'],
  },
  {
    id: 'shopify',
    title: 'Import Shopify',
    description: 'Synchronisez depuis votre boutique Shopify',
    icon: Database,
    route: '/import/shopify',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    badge: 'Sync',
    badgeColor: 'bg-emerald-500',
    features: ['Bidirectionnel', 'Variantes', 'Auto-sync'],
  },
  {
    id: 'scheduled',
    title: 'Imports Programmés',
    description: 'Automatisez vos imports récurrents',
    icon: Calendar,
    route: '/import/scheduled',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-500/10',
    iconColor: 'text-pink-500',
    badge: 'Auto',
    badgeColor: 'bg-pink-500',
    features: ['CRON', 'Récurrence', 'Alertes'],
  },
  {
    id: 'aliexpress',
    title: 'AliExpress Direct',
    description: 'Import optimisé pour AliExpress',
    icon: Globe,
    route: '/import/aliexpress',
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
    features: ['Marges auto', 'ePacket', 'Avis clients'],
  },
]

const configOptions = [
  {
    id: 'auto_optimize',
    label: 'Optimisation automatique',
    description: 'IA optimise les titres et descriptions',
    enabled: true,
    icon: Sparkles,
  },
  {
    id: 'auto_translate',
    label: 'Traduction automatique',
    description: 'Traduit automatiquement en français',
    enabled: true,
    icon: Globe,
  },
  {
    id: 'price_rules',
    label: 'Règles de prix',
    description: 'Appliquer les marges configurées',
    enabled: true,
    icon: TrendingUp,
  },
  {
    id: 'duplicate_check',
    label: 'Détection doublons',
    description: 'Éviter les produits en double',
    enabled: true,
    icon: Shield,
  },
]

export default function ImportConfigPage() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const [configs, setConfigs] = useState(
    configOptions.reduce((acc, opt) => ({ ...acc, [opt.id]: opt.enabled }), {} as Record<string, boolean>)
  )

  const toggleConfig = (id: string) => {
    setConfigs(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const containerVariants = reducedMotion ? {} : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants = reducedMotion ? {} : {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <ChannablePageLayout
      title="Configurations d'Import"
      metaTitle="Configurations d'Import"
      metaDescription="Configurez vos sources d'import et automatisez vos flux de produits"
      maxWidth="2xl"
      padding="md"
      backTo="/import"
      backLabel="Retour à l'Import"
    >
      {/* Hero Section */}
      <ChannableHeroSection
        badge={{ icon: Settings, label: 'Configuration' }}
        title="Configurez vos imports"
        subtitle="Personnalisez vos sources et automatisez vos flux de produits avec des règles intelligentes"
        variant="compact"
        showHexagons={!reducedMotion}
        stats={[
          { label: 'Sources', value: '6', icon: Package },
          { label: 'Auto-sync', value: 'Actif', icon: RefreshCw },
          { label: 'Optimisé', value: 'IA', icon: Sparkles },
        ]}
        primaryAction={{
          label: 'Import rapide',
          onClick: () => navigate('/import/autods'),
        }}
        secondaryAction={{
          label: 'Historique',
          onClick: () => navigate('/import/history'),
        }}
      />

      {/* Configuration Options */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configuration globale
          </CardTitle>
          <CardDescription>
            Paramètres appliqués à tous les imports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {configOptions.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all",
                  configs[option.id] 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-muted/30 border-border/50"
                )}
                role="switch"
                aria-checked={configs[option.id]}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleConfig(option.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    configs[option.id] ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <option.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <Label htmlFor={option.id} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <Switch
                  id={option.id}
                  checked={configs[option.id]}
                  onCheckedChange={() => toggleConfig(option.id)}
                  aria-label={option.label}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Import Methods Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Méthodes d'import</h2>
          <Badge variant="outline" className="text-muted-foreground">
            {importMethods.length} disponibles
          </Badge>
        </div>
        
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {importMethods.map((method) => (
            <motion.div key={method.id} variants={itemVariants}>
              <Card 
                className={cn(
                  "group cursor-pointer border-border/50 bg-card/50 backdrop-blur",
                  "hover:shadow-lg hover:border-primary/30 transition-all duration-300",
                  "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                )}
                onClick={() => navigate(method.route)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(method.route)}
                aria-label={`${method.title}: ${method.description}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "p-3 rounded-xl bg-gradient-to-br",
                      method.color,
                      "text-white shadow-lg"
                    )}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    {method.badge && (
                      <Badge className={cn("text-white text-xs", method.badgeColor)}>
                        {method.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {method.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {method.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {method.features.map((feature, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="text-xs bg-muted/50"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
                    <span>Configurer</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/import/history')}
          className="flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          Voir l'historique
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/import/scheduled')}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Imports programmés
        </Button>
        <Button
          onClick={() => navigate('/import/autods')}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600"
        >
          <Zap className="w-4 h-4" />
          Import rapide
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </ChannablePageLayout>
  )
}
