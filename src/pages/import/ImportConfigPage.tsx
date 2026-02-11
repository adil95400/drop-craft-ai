import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { 
  FileSpreadsheet, Link as LinkIcon, Database, Code, Settings, Globe,
  Upload, Zap, History, Calendar, ArrowRight, Sparkles,
  TrendingUp, Shield, ChevronRight, Package, RefreshCw, Loader2,
  RotateCcw
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useImportConfig } from '@/hooks/useImportConfig'
import { useReducedMotion } from '@/hooks/useReducedMotion'

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
    id: 'auto_optimize' as const,
    label: 'Optimisation automatique',
    description: 'IA optimise les titres et descriptions',
    icon: Sparkles,
  },
  {
    id: 'auto_translate' as const,
    label: 'Traduction automatique',
    description: 'Traduit automatiquement en français',
    icon: Globe,
  },
  {
    id: 'price_rules' as const,
    label: 'Règles de prix',
    description: 'Appliquer les marges configurées',
    icon: TrendingUp,
  },
  {
    id: 'duplicate_check' as const,
    label: 'Détection doublons',
    description: 'Éviter les produits en double',
    icon: Shield,
  },
  {
    id: 'auto_publish' as const,
    label: 'Publication automatique',
    description: 'Publier immédiatement après import',
    icon: Upload,
  },
  {
    id: 'round_prices' as const,
    label: 'Arrondir les prix',
    description: 'Arrondir aux .99 ou .00',
    icon: TrendingUp,
  },
]

export default function ImportConfigPage() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  
  // Use real persistence hook
  const { 
    config, 
    isLoading, 
    toggleOption, 
    updateOption,
    resetToDefaults, 
    isSaving 
  } = useImportConfig()

  const containerVariants = prefersReducedMotion ? {} : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants = prefersReducedMotion ? {} : {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ChannablePageWrapper
      title="Configurations d'Import"
      description="Personnalisez vos sources et automatisez vos flux de produits avec des règles intelligentes."
      heroImage="settings"
      badge={{ icon: Settings, label: 'Configuration' }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/import/history')}>
            <History className="w-4 h-4 mr-2" />
            Historique
          </Button>
          <Button onClick={() => navigate('/import/autods')}>
            <Zap className="w-4 h-4 mr-2" />
            Import rapide
          </Button>
        </div>
      }
    >

      {/* Configuration Options */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Configuration globale
              </CardTitle>
              <CardDescription>
                Paramètres appliqués à tous les imports (sauvegarde automatique)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sauvegarde...
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle Options */}
          <div className="grid sm:grid-cols-2 gap-4">
            {configOptions.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all",
                  config[option.id] 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-muted/30 border-border/50"
                )}
                role="switch"
                aria-checked={!!config[option.id]}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleOption(option.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    config[option.id] ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
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
                  checked={!!config[option.id]}
                  onCheckedChange={() => toggleOption(option.id)}
                  aria-label={option.label}
                  disabled={isSaving}
                />
              </div>
            ))}
          </div>

          {/* Margin Slider */}
          <div className="p-4 rounded-xl border bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="font-medium">Marge par défaut</Label>
                <p className="text-xs text-muted-foreground">Appliquée automatiquement aux nouveaux produits</p>
              </div>
              <Badge variant="secondary" className="text-lg font-bold">{config.default_margin}%</Badge>
            </div>
            <Slider
              value={[config.default_margin]}
              onValueChange={([value]) => updateOption('default_margin', value)}
              min={0}
              max={100}
              step={5}
              disabled={isSaving}
            />
          </div>

          {/* Currency Selection */}
          <div className="p-4 rounded-xl border bg-muted/30">
            <Label className="font-medium mb-2 block">Devise par défaut</Label>
            <div className="flex gap-2">
              {['EUR', 'USD', 'GBP', 'CAD'].map((currency) => (
                <Button
                  key={currency}
                  variant={config.currency === currency ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateOption('currency', currency)}
                  disabled={isSaving}
                >
                  {currency}
                </Button>
              ))}
            </div>
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
    </ChannablePageWrapper>
  )
}
