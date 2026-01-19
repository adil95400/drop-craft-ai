import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, Package, TrendingUp, Star, Clock, ShoppingCart,
  ArrowRight, Sparkles, CheckCircle, Zap, Info, Lightbulb
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { AliExpressImporter } from '@/components/aliexpress'

const useReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const features = [
  {
    icon: TrendingUp,
    title: 'Calcul des marges',
    description: 'Calculez automatiquement vos marges bénéficiaires',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Package,
    title: 'ePacket Filter',
    description: 'Filtrez les produits avec livraison ePacket rapide',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Star,
    title: 'Import des avis',
    description: 'Importez les avis clients avec photos',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: Sparkles,
    title: 'Optimisation IA',
    description: 'Titres et descriptions optimisés automatiquement',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
]

const tips = [
  {
    icon: Lightbulb,
    title: 'Conseil Pro',
    description: 'Utilisez les filtres ePacket pour des livraisons en 10-15 jours',
  },
  {
    icon: TrendingUp,
    title: 'Marges recommandées',
    description: 'Appliquez une marge de x2 à x3 pour une rentabilité optimale',
  },
  {
    icon: Star,
    title: 'Avis importants',
    description: 'Importez uniquement les avis 4★ et 5★ avec photos',
  },
]

export default function AliExpressImportPage() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const [importStats] = useState({
    imported: 127,
    avgTime: '12s',
    successRate: '98%',
  })

  return (
    <ChannablePageWrapper
      title="Import AliExpress Direct"
      subtitle="Fournisseur Dropshipping"
      description="Importez des produits depuis AliExpress avec calcul automatique des marges et filtres intelligents"
      heroImage="suppliers"
      badge={{ label: 'AliExpress', icon: Globe }}
      actions={
        <Button onClick={() => navigate('/import/autods')} className="gap-2">
          <Zap className="h-4 w-4" />
          Import Rapide
        </Button>
      }
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Importer */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Importer un produit</CardTitle>
                    <CardDescription>Collez l'URL du produit AliExpress</CardDescription>
                  </div>
                </div>
                <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                  <Globe className="w-3 h-3 mr-1" />
                  AliExpress
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <AliExpressImporter />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Features */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Fonctionnalités
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn("p-2 rounded-lg", feature.bgColor)}>
                    <feature.icon className={cn("w-4 h-4", feature.color)} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Conseils
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <tip.icon className="w-4 h-4 text-blue-500" />
                    <h4 className="font-medium text-sm text-blue-600 dark:text-blue-400">
                      {tip.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">{tip.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Import en masse?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Utilisez l'Import Rapide pour importer plusieurs produits simultanément
              </p>
              <Button 
                onClick={() => navigate('/import/autods')}
                className="w-full bg-gradient-to-r from-primary to-purple-600"
              >
                <Zap className="w-4 h-4 mr-2" />
                Import Rapide
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ChannablePageWrapper>
  )
}
