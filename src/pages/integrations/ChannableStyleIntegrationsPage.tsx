/**
 * Page d'Intégrations style Channable
 * Design moderne avec hero section, hexagones, filtres par catégories et grille d'intégrations
 */

import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  ArrowRight, 
  ChevronDown, 
  CheckCircle2, 
  Sparkles,
  Globe,
  TrendingUp,
  ShoppingBag,
  Megaphone,
  BarChart3,
  Link2,
  Database,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface Integration {
  id: string
  name: string
  logo: string
  category: 'marketplaces' | 'search_ppc' | 'social' | 'comparison' | 'affiliates' | 'data_import' | 'other'
  popular?: boolean
  connected?: boolean
  description?: string
}

// Catégories d'intégrations style Channable
const categories = [
  { id: 'all', label: 'Tous', icon: Globe },
  { id: 'marketplaces', label: 'Marketplaces', icon: ShoppingBag },
  { id: 'search_ppc', label: 'Search/PPC', icon: TrendingUp },
  { id: 'social', label: 'Réseaux sociaux', icon: Megaphone },
  { id: 'comparison', label: 'Comparateurs', icon: BarChart3 },
  { id: 'affiliates', label: 'Affiliés', icon: Link2 },
  { id: 'data_import', label: 'Import données', icon: Database },
  { id: 'other', label: 'Autres', icon: Zap },
]

// Liste des intégrations disponibles
const integrations: Integration[] = [
  // Marketplaces populaires
  { id: 'amazon', name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', category: 'marketplaces', popular: true },
  { id: 'ebay', name: 'eBay', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg', category: 'marketplaces', popular: true },
  { id: 'cdiscount', name: 'Cdiscount', logo: 'https://www.cdiscount.com/favicon.ico', category: 'marketplaces', popular: true },
  { id: 'fnac', name: 'Fnac', logo: 'https://www.fnac.com/favicon.ico', category: 'marketplaces' },
  { id: 'rakuten', name: 'Rakuten', logo: 'https://www.rakuten.fr/favicon.ico', category: 'marketplaces' },
  { id: 'aliexpress', name: 'AliExpress', logo: 'https://ae01.alicdn.com/kf/S704f9f6bbe564b66a65dde13e15e10b5t.png', category: 'marketplaces' },
  { id: 'etsy', name: 'Etsy', logo: 'https://www.etsy.com/favicon.ico', category: 'marketplaces' },
  { id: 'zalando', name: 'Zalando', logo: 'https://www.zalando.fr/favicon.ico', category: 'marketplaces' },
  { id: 'manomano', name: 'ManoMano', logo: 'https://www.manomano.fr/favicon.ico', category: 'marketplaces' },
  { id: 'backmarket', name: 'Back Market', logo: 'https://www.backmarket.fr/favicon.ico', category: 'marketplaces' },
  
  // Search/PPC
  { id: 'google_ads', name: 'Google Ads', logo: 'https://www.gstatic.com/images/branding/product/2x/google_ads_512dp.png', category: 'search_ppc', popular: true },
  { id: 'google_shopping', name: 'Google Shopping', logo: 'https://www.gstatic.com/shopping/shopping_product_v1_512.png', category: 'search_ppc', popular: true },
  { id: 'microsoft_ads', name: 'Microsoft Ads', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', category: 'search_ppc' },
  { id: 'amazon_ads', name: 'Amazon Ads', logo: 'https://advertising.amazon.com/favicon.ico', category: 'search_ppc' },
  { id: 'criteo', name: 'Criteo', logo: 'https://www.criteo.com/favicon.ico', category: 'search_ppc' },
  
  // Social
  { id: 'facebook', name: 'Facebook', logo: 'https://www.facebook.com/images/fb_icon_325x325.png', category: 'social', popular: true },
  { id: 'instagram', name: 'Instagram', logo: 'https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png', category: 'social', popular: true },
  { id: 'meta_catalog', name: 'Meta Catalog', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg', category: 'social' },
  { id: 'tiktok', name: 'TikTok Shop', logo: 'https://www.tiktok.com/favicon.ico', category: 'social', popular: true },
  { id: 'pinterest', name: 'Pinterest', logo: 'https://www.pinterest.com/favicon.ico', category: 'social' },
  { id: 'snapchat', name: 'Snapchat', logo: 'https://www.snapchat.com/favicon.ico', category: 'social' },
  
  // Comparateurs
  { id: 'google_merchant', name: 'Google Merchant', logo: 'https://www.gstatic.com/shopping/shopping_product_v1_512.png', category: 'comparison', popular: true },
  { id: 'idealo', name: 'Idealo', logo: 'https://www.idealo.fr/favicon.ico', category: 'comparison' },
  { id: 'kelkoo', name: 'Kelkoo', logo: 'https://www.kelkoo.fr/favicon.ico', category: 'comparison' },
  { id: 'leguide', name: 'LeGuide', logo: 'https://www.leguide.com/favicon.ico', category: 'comparison' },
  { id: 'twenga', name: 'Twenga', logo: 'https://www.twenga.fr/favicon.ico', category: 'comparison' },
  
  // Affiliés
  { id: 'awin', name: 'Awin', logo: 'https://www.awin.com/favicon.ico', category: 'affiliates' },
  { id: 'tradedoubler', name: 'Tradedoubler', logo: 'https://www.tradedoubler.com/favicon.ico', category: 'affiliates' },
  { id: 'rakuten_advertising', name: 'Rakuten Advertising', logo: 'https://www.rakutenadvertising.com/favicon.ico', category: 'affiliates' },
  { id: 'effinity', name: 'Effinity', logo: 'https://www.effinity.fr/favicon.ico', category: 'affiliates' },
  
  // Import données
  { id: 'shopify', name: 'Shopify', logo: 'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-shopping-bag-full-color-66166b2e55d67988b56b4bd28b63c271e2b9713358cb723070a92bde17ad7571.svg', category: 'data_import', popular: true },
  { id: 'woocommerce', name: 'WooCommerce', logo: 'https://woocommerce.com/wp-content/themes/flavor/flavor/images/woocommerce-icon.svg', category: 'data_import', popular: true },
  { id: 'prestashop', name: 'PrestaShop', logo: 'https://www.prestashop.com/favicon.ico', category: 'data_import' },
  { id: 'magento', name: 'Magento', logo: 'https://magento.com/favicon.ico', category: 'data_import' },
  { id: 'bigcommerce', name: 'BigCommerce', logo: 'https://www.bigcommerce.com/favicon.ico', category: 'data_import' },
  { id: 'lightspeed', name: 'Lightspeed', logo: 'https://www.lightspeedhq.com/favicon.ico', category: 'data_import' },
  { id: 'akeneo', name: 'Akeneo', logo: 'https://www.akeneo.com/favicon.ico', category: 'data_import' },
  
  // Autres
  { id: 'csv_import', name: 'Import CSV', logo: '', category: 'other' },
  { id: 'api_custom', name: 'API Personnalisée', logo: '', category: 'other' },
  { id: 'ftp_sftp', name: 'FTP/SFTP', logo: '', category: 'other' },
  { id: 'webhook', name: 'Webhooks', logo: '', category: 'other' },
]

// Composant Hexagones animés pour le hero
function HeroHexagons() {
  const hexColors = [
    'from-pink-500 to-rose-500',
    'from-orange-400 to-amber-500',
    'from-yellow-400 to-yellow-500',
    'from-emerald-400 to-green-500',
    'from-cyan-400 to-blue-500',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-violet-600',
    'from-fuchsia-500 to-pink-500',
  ]

  return (
    <div className="absolute right-0 top-0 w-1/2 h-full overflow-hidden pointer-events-none hidden lg:block">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 400" fill="none">
        {/* Lignes de connexion */}
        <motion.path
          d="M100 200 L200 150 L300 180 L400 120"
          stroke="url(#lineGradient1)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        <motion.path
          d="M150 280 L250 250 L350 300 L420 250"
          stroke="url(#lineGradient2)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.8 }}
        />
        <motion.path
          d="M200 150 L250 250"
          stroke="url(#lineGradient3)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 1 }}
        />
        
        <defs>
          <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="lineGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>

      {/* Hexagones */}
      {[
        { x: 350, y: 80, size: 60, delay: 0, color: hexColors[6] },
        { x: 420, y: 140, size: 50, delay: 0.1, color: hexColors[0] },
        { x: 380, y: 200, size: 55, delay: 0.2, color: hexColors[1] },
        { x: 450, y: 220, size: 45, delay: 0.3, color: hexColors[5] },
        { x: 300, y: 160, size: 40, delay: 0.4, color: hexColors[2] },
        { x: 480, y: 300, size: 50, delay: 0.5, color: hexColors[4] },
        { x: 400, y: 320, size: 55, delay: 0.6, color: hexColors[3] },
        { x: 320, y: 280, size: 35, delay: 0.7, color: hexColors[7] },
      ].map((hex, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute rounded-xl bg-gradient-to-br shadow-lg",
            hex.color
          )}
          style={{
            left: hex.x - hex.size / 2,
            top: hex.y - hex.size / 2,
            width: hex.size,
            height: hex.size,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: hex.delay,
          }}
        />
      ))}

      {/* Points sur les lignes */}
      {[
        { x: 100, y: 200 },
        { x: 200, y: 150 },
        { x: 300, y: 180 },
        { x: 250, y: 250 },
        { x: 150, y: 280 },
        { x: 350, y: 300 },
      ].map((point, i) => (
        <motion.div
          key={`point-${i}`}
          className="absolute w-3 h-3 rounded-full bg-primary shadow-md"
          style={{ left: point.x - 6, top: point.y - 6 }}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  )
}

// Composant Carte d'intégration
function IntegrationCard({ integration }: { integration: Integration }) {
  const [imageError, setImageError] = useState(false)
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className="group relative bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 p-6 cursor-pointer"
    >
      {/* Badge connecté */}
      {integration.connected && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connecté
          </Badge>
        </div>
      )}

      {/* Badge populaire */}
      {integration.popular && !integration.connected && (
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Populaire
          </Badge>
        </div>
      )}

      {/* Logo */}
      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4 overflow-hidden group-hover:scale-105 transition-transform">
        {integration.logo && !imageError ? (
          <img
            src={integration.logo}
            alt={integration.name}
            className="w-12 h-12 object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-2xl font-bold text-muted-foreground">
            {integration.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Nom */}
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
        {integration.name}
      </h3>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  )
}

// Page principale
export default function ChannableStyleIntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'popular' | 'name'>('popular')

  // Filtrage et tri des intégrations
  const filteredIntegrations = useMemo(() => {
    let result = integrations.filter(integration => {
      const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = activeCategory === 'all' || integration.category === activeCategory
      return matchesSearch && matchesCategory
    })

    // Tri
    if (sortBy === 'popular') {
      result = result.sort((a, b) => {
        if (a.popular && !b.popular) return -1
        if (!a.popular && b.popular) return 1
        return a.name.localeCompare(b.name)
      })
    } else {
      result = result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [searchTerm, activeCategory, sortBy])

  const stats = {
    total: integrations.length,
    marketplaces: integrations.filter(i => i.category === 'marketplaces').length,
    social: integrations.filter(i => i.category === 'social').length,
    connected: integrations.filter(i => i.connected).length,
  }

  return (
    <>
      <Helmet>
        <title>Intégrations eCommerce | ShopOpti</title>
        <meta name="description" content="Connectez tous vos canaux de vente en une seule plateforme. Plus de 100 intégrations disponibles." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section style Channable */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-16 lg:py-24">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              {/* Tag */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Intégrations</span>
              </motion.div>

              {/* Titre */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight"
              >
                Développez votre{' '}
                <span className="text-primary">eCommerce</span>{' '}
                multicanal
              </motion.h1>

              {/* Sous-titre */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-muted-foreground mb-8"
              >
                Configurez tous vos canaux de vente depuis une seule plateforme.
                Plus de {stats.total} intégrations disponibles.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button size="lg" className="gap-2">
                  Essai gratuit
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Hexagones animés */}
          <HeroHexagons />
        </section>

        {/* Section recherche et filtres */}
        <section className="container mx-auto px-4 py-8">
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher une intégration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-border"
              />
            </div>

            {/* Filtres de pays/industries (style Channable) */}
            <div className="flex gap-2">
              <Button variant="outline" className="h-12 gap-2">
                Pays
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="h-12 gap-2">
                Industries
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="h-12 gap-2"
                onClick={() => setSortBy(sortBy === 'popular' ? 'name' : 'popular')}
              >
                {sortBy === 'popular' ? 'Plus populaires' : 'Alphabétique'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs de catégories */}
          <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-border">
            {categories.map((category) => {
              const Icon = category.icon
              const isActive = activeCategory === category.id
              const count = category.id === 'all' 
                ? integrations.length 
                : integrations.filter(i => i.category === category.id).length
              
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs h-5",
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : ""
                    )}
                  >
                    {count}
                  </Badge>
                </button>
              )
            })}
          </div>

          {/* Titre de section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {activeCategory === 'all' 
                ? 'Toutes les intégrations eCommerce' 
                : categories.find(c => c.id === activeCategory)?.label}
            </h2>
            <p className="text-muted-foreground mt-1">
              Parcourez toutes les intégrations que nous proposons
            </p>
          </div>

          {/* Grille d'intégrations */}
          <motion.div 
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Message si aucun résultat */}
          {filteredIntegrations.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucune intégration trouvée
              </h3>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier votre recherche ou vos filtres
              </p>
              <Button variant="outline" onClick={() => {
                setSearchTerm('')
                setActiveCategory('all')
              }}>
                Réinitialiser les filtres
              </Button>
            </motion.div>
          )}

          {/* Section CTA bas de page */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 p-8 lg:p-12 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20"
          >
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                Vous ne trouvez pas votre intégration ?
              </h2>
              <p className="text-muted-foreground mb-6">
                Contactez-nous pour discuter de vos besoins spécifiques. 
                Nous ajoutons régulièrement de nouvelles intégrations.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg">
                  Demander une intégration
                </Button>
                <Button size="lg" variant="outline">
                  Documentation API
                </Button>
              </div>
            </div>
          </motion.section>
        </section>
      </div>
    </>
  )
}
