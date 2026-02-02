/**
 * DashboardEmptyState - État vide du dashboard avec CTAs clairs
 * 
 * Affiché quand l'utilisateur n'a pas encore:
 * - De produits
 * - De boutiques connectées
 * - De données à afficher
 */

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, Store, Package, Plus, ArrowRight, 
  Sparkles, Zap, TrendingUp, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface QuickActionProps {
  icon: React.ElementType
  title: string
  description: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  badge?: string
}

function QuickAction({ icon: Icon, title, description, onClick, variant = 'secondary', badge }: QuickActionProps) {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left group w-full",
        variant === 'primary' 
          ? "bg-gradient-to-br from-primary/10 to-violet-500/10 border-primary/30 hover:border-primary/50" 
          : "bg-muted/30 border-border/50 hover:border-border hover:bg-muted/50"
      )}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -2 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
    >
      {badge && (
        <Badge 
          className="absolute -top-2 -right-2 text-[10px] bg-amber-500/90 text-white border-0"
        >
          {badge}
        </Badge>
      )}
      
      <div className={cn(
        "p-2.5 rounded-lg mb-3 transition-colors",
        variant === 'primary' 
          ? "bg-primary/20 group-hover:bg-primary/30" 
          : "bg-muted group-hover:bg-muted/80"
      )}>
        <Icon className={cn(
          "h-5 w-5",
          variant === 'primary' ? "text-primary" : "text-muted-foreground"
        )} />
      </div>
      
      <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
        {title}
        <ArrowRight className={cn(
          "h-3 w-3 transition-all",
          "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
        )} />
      </h4>
      
      <p className="text-xs text-muted-foreground">
        {description}
      </p>
    </motion.button>
  )
}

export function DashboardEmptyState() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()

  const motionProps = prefersReducedMotion 
    ? {} 
    : { 
        initial: { opacity: 0, y: 20 }, 
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 }
      }

  return (
    <motion.div {...motionProps} className="space-y-6">
      {/* Hero section */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-violet-500/5">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        
        <CardContent className="relative py-12 text-center">
          <motion.div
            className="mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary to-violet-600 w-fit shadow-lg shadow-primary/20"
            animate={prefersReducedMotion ? {} : { 
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-2">
            Prêt à booster votre e-commerce ?
          </h2>
          
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Importez vos premiers produits ou connectez votre boutique pour commencer 
            à utiliser toutes les fonctionnalités IA de ShopOpti.
          </p>

          {/* Main CTAs */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 shadow-lg shadow-primary/20"
              onClick={() => navigate('/import')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer des produits
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/stores-channels')}
            >
              <Store className="h-4 w-4 mr-2" />
              Connecter une boutique
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Démarrage rapide
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            icon={Upload}
            title="Import URL"
            description="Collez un lien produit"
            onClick={() => navigate('/import?mode=url')}
            variant="primary"
            badge="Rapide"
          />
          
          <QuickAction
            icon={FileText}
            title="Import Fichier"
            description="CSV, Excel, JSON"
            onClick={() => navigate('/import?mode=file')}
          />
          
          <QuickAction
            icon={Store}
            title="Fournisseurs"
            description="BigBuy, CDiscount..."
            onClick={() => navigate('/suppliers')}
          />
          
          <QuickAction
            icon={Plus}
            title="Créer manuellement"
            description="Ajouter un produit"
            onClick={() => navigate('/products?action=create')}
          />
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <Zap className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <h4 className="font-medium mb-1">Optimisation IA</h4>
            <p className="text-xs text-muted-foreground">
              Descriptions, titres et SEO générés automatiquement
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
            <h4 className="font-medium mb-1">Analytics Temps Réel</h4>
            <p className="text-xs text-muted-foreground">
              Suivez vos performances et marges en direct
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <Package className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h4 className="font-medium mb-1">Multi-Boutiques</h4>
            <p className="text-xs text-muted-foreground">
              Gérez tous vos canaux depuis un seul endroit
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

export default DashboardEmptyState
