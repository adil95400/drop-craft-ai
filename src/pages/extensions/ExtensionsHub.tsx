import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Chrome, Download, Zap, Star, CheckCircle, ArrowRight, Store, Terminal, Palette, Shield,
  Globe, Package, TrendingUp, Clock, Users, Play, X, Sparkles, Target, BarChart3,
  RefreshCw, ShoppingCart, Eye, Bell, FileText, Settings, Rocket, Award, ThumbsUp, MessageSquare, Key
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

// Hook pour préférences réduites
const useReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const chromeFeatures = [
  { icon: Zap, text: 'Import 1-clic depuis 15+ plateformes' },
  { icon: TrendingUp, text: 'Surveillance des prix automatique' },
  { icon: Package, text: 'Import avis et images en masse' },
  { icon: Clock, text: 'Auto-Order vers fournisseurs' },
  { icon: Globe, text: 'Détection multi-langue' },
  { icon: Users, text: 'Gestion multi-boutiques' },
]

const supportedPlatforms = [
  { name: 'AliExpress', color: 'bg-orange-500', logo: '🛒' },
  { name: 'Temu', color: 'bg-orange-600', logo: '🎯' },
  { name: 'Amazon', color: 'bg-yellow-500', logo: '📦' },
  { name: 'eBay', color: 'bg-blue-500', logo: '🏷️' },
  { name: 'CJDropshipping', color: 'bg-green-500', logo: '🚀' },
  { name: 'Banggood', color: 'bg-red-500', logo: '🔧' },
  { name: '1688', color: 'bg-orange-400', logo: '🏭' },
  { name: 'Taobao', color: 'bg-orange-300', logo: '🛍️' },
  { name: 'DHgate', color: 'bg-blue-400', logo: '🌐' },
  { name: 'Wish', color: 'bg-cyan-500', logo: '⭐' },
  { name: 'Shein', color: 'bg-pink-500', logo: '👗' },
  { name: 'Walmart', color: 'bg-blue-600', logo: '🏪' },
]

const detailedFeatures = [
  {
    icon: ShoppingCart,
    title: 'Import Produit 1-Clic',
    description: 'Importez n\'importe quel produit directement dans votre boutique avec toutes ses variantes.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: TrendingUp,
    title: 'Surveillance des Prix',
    description: 'Recevez des alertes automatiques lorsque les prix changent chez les fournisseurs.',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: RefreshCw,
    title: 'Sync Stock Automatique',
    description: 'Synchronisation en temps réel des stocks avec vos fournisseurs.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Star,
    title: 'Import Avis Clients',
    description: 'Importez les avis clients avec photos depuis toutes les plateformes.',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Target,
    title: 'Auto-Order Intelligent',
    description: 'Commandez automatiquement auprès des fournisseurs à chaque vente.',
    color: 'from-red-500 to-red-600'
  },
  {
    icon: BarChart3,
    title: 'Analytics Avancés',
    description: 'Suivez les performances de vos produits avec des métriques détaillées.',
    color: 'from-indigo-500 to-indigo-600'
  },
]

const testimonials = [
  {
    name: 'Marie L.',
    role: 'Dropshipper Pro',
    avatar: '👩‍💼',
    rating: 5,
    text: 'Cette extension a révolutionné mon business. J\'importe 50+ produits par jour en quelques clics.',
    stats: '+340% productivité'
  },
  {
    name: 'Thomas B.',
    role: 'E-commerçant',
    avatar: '👨‍💻',
    rating: 5,
    text: 'La surveillance des prix m\'a fait économiser des milliers d\'euros.',
    stats: '15K€ économisés'
  },
  {
    name: 'Sophie M.',
    role: 'Entrepreneuse',
    avatar: '👩‍🚀',
    rating: 5,
    text: 'L\'import d\'avis clients a boosté mes conversions de 40%.',
    stats: '+40% conversions'
  },
]

const extensions = [
  {
    id: 'chrome',
    title: 'Extension Chrome',
    description: 'Accédez à l\'extension Chrome',
    icon: Chrome,
    route: '/extensions/chrome',
    badge: 'Gratuit'
  },
  {
    id: 'tutorials',
    title: 'Tutoriels',
    description: 'Apprenez à utiliser l\'extension',
    icon: Play,
    route: '/extensions/tutorials',
    badge: 'Guide'
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'Guide complet et référence',
    icon: FileText,
    route: '/extensions/documentation',
    badge: 'Docs'
  },
  {
    id: 'faq',
    title: 'FAQ',
    description: 'Questions fréquemment posées',
    icon: MessageSquare,
    route: '/extensions/faq',
    badge: 'Support'
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Découvrez et installez des extensions',
    icon: Store,
    route: '/extensions/marketplace',
    badge: 'Nouveau'
  },
  {
    id: 'cli',
    title: 'CLI Tools',
    description: 'Gérez vos extensions en ligne de commande',
    icon: Terminal,
    route: '/extensions/cli',
    badge: 'Pro'
  },
  {
    id: 'developer',
    title: 'Developpeur',
    description: 'Outils et ressources pour développeurs',
    icon: Settings,
    route: '/extensions/developer',
    badge: 'Dev'
  },
  {
    id: 'white-label',
    title: 'White-Label',
    description: 'Personnalisez l\'interface à vos couleurs',
    icon: Palette,
    route: '/extensions/white-label',
    badge: 'Ultra Pro'
  },
  {
    id: 'sso',
    title: 'Enterprise SSO',
    description: 'Authentification unique pour votre équipe',
    icon: Shield,
    route: '/extensions/sso',
    badge: 'Ultra Pro'
  },
  {
    id: 'api',
    title: 'API & Tokens',
    description: 'Gérez vos clés API et tokens d\'accès',
    icon: Key,
    route: '/extensions/api',
    badge: 'API'
  }
]

export default function ExtensionsHub() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

  const containerVariants = reducedMotion ? {} : {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemVariants = reducedMotion ? {} : {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <ChannablePageWrapper
      title="ShopOpti+ Chrome Extension"
      subtitle="#1 Extension Dropshipping"
      description="L'extension Chrome la plus puissante pour le dropshipping. Importez, surveillez, automatisez - tout depuis votre navigateur."
      heroImage="extensions"
      badge={{ label: '#1 Extension Dropshipping', icon: Chrome }}
      actions={
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => navigate('/extensions/chrome')}
            className="bg-gradient-to-r from-primary to-purple-600"
          >
            <Chrome className="w-4 h-4 mr-2" />
            Extension Chrome
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/extensions/tutorials')}
          >
            <Play className="w-4 h-4 mr-2" />
            Voir les Tutoriels
          </Button>
        </div>
      }
    >
      {/* Features Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chromeFeatures.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur border border-border/50 hover:bg-primary/5 transition-colors"
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium">{feature.text}</span>
          </motion.div>
        ))}
      </div>

      {/* Supported Platforms */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Plateformes supportées
          </CardTitle>
          <CardDescription>
            Importez depuis toutes les grandes marketplaces mondiales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {supportedPlatforms.map((platform, idx) => (
              <Badge 
                key={idx}
                variant="secondary"
                className={cn(
                  "text-sm py-2 px-4 gap-2",
                  platform.color, "text-white"
                )}
              >
                <span>{platform.logo}</span>
                {platform.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Features */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Fonctionnalités détaillées</h2>
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {detailedFeatures.map((feature, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur hover:shadow-lg transition-all group">
                <CardContent className="p-6">
                  <div className={cn(
                    "p-3 rounded-xl bg-gradient-to-br w-fit mb-4 text-white shadow-lg group-hover:scale-110 transition-transform",
                    feature.color
                  )}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Testimonials */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Ce que disent nos utilisateurs</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-3">"{testimonial.text}"</p>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  {testimonial.stats}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Other Extensions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Autres extensions & outils</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {extensions.map((ext) => (
            <Card 
              key={ext.id}
              className="cursor-pointer border-border/50 bg-card/50 backdrop-blur hover:shadow-lg hover:border-primary/30 transition-all group"
              onClick={() => navigate(ext.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(ext.route)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <ext.icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {ext.badge}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {ext.title}
                </h3>
                <p className="text-sm text-muted-foreground">{ext.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Prêt à booster votre dropshipping?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Téléchargez gratuitement l'extension Chrome ShopOpti+ et commencez à importer des produits en quelques secondes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/extensions/chrome')}
              className="bg-gradient-to-r from-primary to-purple-600"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Extension Chrome
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/extensions/documentation')}
            >
              <FileText className="w-5 h-5 mr-2" />
              Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  )
}
