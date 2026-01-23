/**
 * Feature highlights for Chrome Extension
 */
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { 
  Zap, TrendingUp, Package, Clock, Globe, Users, ShoppingCart, 
  RefreshCw, Star, Target, BarChart3, Sparkles, Image, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

const quickFeatures = [
  { icon: Zap, text: 'Import 1-clic depuis 15+ plateformes' },
  { icon: TrendingUp, text: 'Surveillance automatique des prix' },
  { icon: Package, text: 'Import avis et images en masse' },
  { icon: Clock, text: 'Auto-Order vers fournisseurs' },
  { icon: Globe, text: 'Détection multi-langue' },
  { icon: Users, text: 'Gestion multi-boutiques' },
]

const detailedFeatures = [
  {
    icon: ShoppingCart,
    title: 'Import Produit 1-Clic',
    description: 'Importez n\'importe quel produit directement dans votre boutique avec toutes ses variantes, images et descriptions.',
    gradient: 'from-blue-500 to-blue-600',
    highlight: '15+ plateformes'
  },
  {
    icon: TrendingUp,
    title: 'Surveillance des Prix',
    description: 'Recevez des alertes automatiques lorsque les prix changent chez les fournisseurs pour optimiser vos marges.',
    gradient: 'from-green-500 to-emerald-600',
    highlight: 'Temps réel'
  },
  {
    icon: RefreshCw,
    title: 'Sync Stock Automatique',
    description: 'Synchronisation en temps réel des stocks avec vos fournisseurs pour éviter les ruptures.',
    gradient: 'from-purple-500 to-purple-600',
    highlight: '24/7'
  },
  {
    icon: Star,
    title: 'Import Avis Clients',
    description: 'Importez les avis clients avec photos depuis toutes les plateformes pour booster vos conversions.',
    gradient: 'from-yellow-500 to-orange-500',
    highlight: '+40% conversions'
  },
  {
    icon: Target,
    title: 'Auto-Order Intelligent',
    description: 'Commandez automatiquement auprès des fournisseurs à chaque vente pour un fulfillment sans effort.',
    gradient: 'from-red-500 to-rose-600',
    highlight: 'Automatisé'
  },
  {
    icon: BarChart3,
    title: 'Analytics Avancés',
    description: 'Suivez les performances de vos produits avec des métriques détaillées et insights IA.',
    gradient: 'from-indigo-500 to-indigo-600',
    highlight: 'IA intégrée'
  },
]

interface ExtensionFeaturesProps {
  variant?: 'compact' | 'detailed'
  className?: string
}

export function ExtensionFeatures({ variant = 'detailed', className }: ExtensionFeaturesProps) {
  if (variant === 'compact') {
    return (
      <div className={cn("grid sm:grid-cols-2 lg:grid-cols-3 gap-3", className)}>
        {quickFeatures.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all"
          >
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium">{feature.text}</span>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("grid sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {detailedFeatures.map((feature, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur hover:shadow-xl hover:border-primary/30 transition-all group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "p-3 rounded-xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform",
                  feature.gradient
                )}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {feature.highlight}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
