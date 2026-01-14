import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Chrome, 
  Download, 
  Zap, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Store, 
  Terminal, 
  Palette, 
  Shield,
  Globe,
  Package,
  TrendingUp,
  Clock,
  Users,
  Play,
  Quote,
  X,
  Sparkles,
  Target,
  BarChart3,
  RefreshCw,
  ShoppingCart,
  Eye,
  Bell,
  FileText,
  Settings,
  Rocket,
  Award,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';

export default function ExtensionsHub() {
  const navigate = useNavigate();

  const chromeFeatures = [
    { icon: <Zap className="h-4 w-4" />, text: 'Import 1-clic depuis 15+ plateformes' },
    { icon: <TrendingUp className="h-4 w-4" />, text: 'Surveillance des prix automatique' },
    { icon: <Package className="h-4 w-4" />, text: 'Import avis et images en masse' },
    { icon: <Clock className="h-4 w-4" />, text: 'Auto-Order vers fournisseurs' },
    { icon: <Globe className="h-4 w-4" />, text: 'Détection multi-langue' },
    { icon: <Users className="h-4 w-4" />, text: 'Gestion multi-boutiques' },
  ];

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
  ];

  const detailedFeatures = [
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: 'Import Produit 1-Clic',
      description: 'Importez n\'importe quel produit directement dans votre boutique avec toutes ses variantes, images et descriptions.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Surveillance des Prix',
      description: 'Recevez des alertes automatiques lorsque les prix de vos produits changent chez les fournisseurs.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <RefreshCw className="h-6 w-6" />,
      title: 'Sync Stock Automatique',
      description: 'Synchronisation en temps réel des stocks avec vos fournisseurs pour éviter les ruptures.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: 'Import Avis Clients',
      description: 'Importez les avis clients avec photos depuis AliExpress, Amazon et autres plateformes.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Auto-Order Intelligent',
      description: 'Commandez automatiquement auprès des fournisseurs quand vous recevez une commande.',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Analytics Avancés',
      description: 'Suivez les performances de vos produits importés avec des métriques détaillées.',
      color: 'from-indigo-500 to-indigo-600'
    },
  ];

  const testimonials = [
    {
      name: 'Marie L.',
      role: 'Dropshipper Pro',
      avatar: '👩‍💼',
      rating: 5,
      text: 'Cette extension a révolutionné mon business. J\'importe 50+ produits par jour en quelques clics. Indispensable!',
      stats: '+340% productivité'
    },
    {
      name: 'Thomas B.',
      role: 'E-commerçant',
      avatar: '👨‍💻',
      rating: 5,
      text: 'La surveillance des prix m\'a fait économiser des milliers d\'euros. Je suis alerté instantanément des variations.',
      stats: '15K€ économisés'
    },
    {
      name: 'Sophie M.',
      role: 'Entrepreneuse',
      avatar: '👩‍🚀',
      rating: 5,
      text: 'L\'import d\'avis clients a boosté mes conversions de 40%. Mes fiches produits sont maintenant complètes.',
      stats: '+40% conversions'
    },
  ];

  const comparisonFeatures = [
    { feature: 'Import 1-clic', shopopti: true, autods: true, spocket: false },
    { feature: 'Surveillance prix temps réel', shopopti: true, autods: true, spocket: false },
    { feature: 'Auto-Order automatique', shopopti: true, autods: true, spocket: false },
    { feature: 'Import avis avec photos', shopopti: true, autods: false, spocket: false },
    { feature: '15+ plateformes supportées', shopopti: true, autods: true, spocket: false },
    { feature: 'Multi-boutiques illimité', shopopti: true, autods: false, spocket: false },
    { feature: 'IA optimisation fiches', shopopti: true, autods: false, spocket: false },
    { feature: 'API publique', shopopti: true, autods: false, spocket: false },
    { feature: 'Support français 24/7', shopopti: true, autods: false, spocket: false },
    { feature: 'Prix', shopopti: 'Gratuit', autods: '19.90€/mois', spocket: '24€/mois' },
  ];

  const extensions = [
    {
      id: 'marketplace',
      title: 'Marketplace',
      description: 'Découvrez et installez des extensions pour votre boutique',
      icon: Store,
      route: '/extensions/marketplace',
      badge: 'Nouveau'
    },
    {
      id: 'cli',
      title: 'Outils CLI',
      description: 'Gérez vos extensions en ligne de commande',
      icon: Terminal,
      route: '/extensions/cli',
      badge: 'Pro'
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
    }
  ];

  const faqs = [
    {
      question: 'Comment installer l\'extension Chrome?',
      answer: 'Téléchargez le fichier ZIP, décompressez-le, puis chargez-le dans Chrome via chrome://extensions en mode développeur.'
    },
    {
      question: 'L\'extension est-elle gratuite?',
      answer: 'Oui! L\'extension de base est entièrement gratuite. Des fonctionnalités premium sont disponibles avec nos plans Pro et Ultra Pro.'
    },
    {
      question: 'Quelles plateformes sont supportées?',
      answer: 'AliExpress, Temu, Amazon, eBay, CJDropshipping, Banggood, 1688, Taobao, DHgate, Wish, Shein, Walmart et plus encore.'
    },
    {
      question: 'L\'import fonctionne-t-il avec Shopify?',
      answer: 'Oui! L\'extension est compatible avec Shopify, WooCommerce, PrestaShop, Wix et toutes les grandes plateformes e-commerce.'
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Chrome Extension - Style AutoDS Premium */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-1">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative rounded-2xl p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge & Title */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-3 py-1">
                    <Star className="h-3 w-3 mr-1 fill-white" />
                    #1 Extension Dropshipping
                  </Badge>
                  <Badge variant="outline" className="border-green-500/50 text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    50,000+ utilisateurs
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-lg shadow-primary/25">
                    <Chrome className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                      ShopOpti+
                    </h1>
                    <p className="text-xl text-slate-400">Chrome Extension</p>
                  </div>
                </div>
              </div>

              <p className="text-xl text-slate-300 leading-relaxed">
                L'extension Chrome <span className="text-primary font-semibold">la plus puissante</span> du marché. 
                Importez des produits en 1-clic, surveillez les prix, automatisez vos commandes 
                fournisseurs - tout depuis votre navigateur.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                {chromeFeatures.map((feature, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                      {feature.icon}
                    </div>
                    <span className="text-sm text-slate-300">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-8 py-4 border-y border-white/10">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">50K+</div>
                  <div className="text-sm text-slate-400">Utilisateurs actifs</div>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-3xl font-bold text-white">
                    4.9
                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="text-sm text-slate-400">Note moyenne</div>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">15+</div>
                  <div className="text-sm text-slate-400">Plateformes</div>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">2M+</div>
                  <div className="text-sm text-slate-400">Produits importés</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-xl shadow-primary/25 h-14 px-8 text-lg"
                  onClick={() => navigate('/extensions/cli')}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Télécharger Gratuitement
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10 h-14 px-8 text-lg"
                  onClick={() => window.open('https://www.youtube.com/watch?v=demo', '_blank')}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Voir la Démo
                </Button>
              </div>
            </div>

            {/* Right Content - Extension Preview */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Browser Mockup */}
                <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-2xl p-1 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-slate-600 rounded-t-xl px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 bg-slate-500 rounded-lg px-4 py-1.5 text-sm text-slate-300 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      aliexpress.com/item/smartphone-pro-max
                    </div>
                    <div className="p-1.5 bg-primary rounded-lg">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-b-xl">
                    {/* Product Card Mockup */}
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-28 h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                          <Package className="h-12 w-12 text-slate-400" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="h-5 bg-slate-200 rounded w-full" />
                          <div className="h-4 bg-slate-100 rounded w-3/4" />
                          <div className="flex items-center gap-2">
                            <div className="h-6 bg-red-100 text-red-600 rounded px-2 text-sm font-bold flex items-center">
                              $12.99
                            </div>
                            <div className="h-6 bg-slate-100 rounded px-2 text-sm text-slate-400 line-through flex items-center">
                              $29.99
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-sm text-slate-500 ml-1">(2,847)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Extension Popup */}
                <div className="absolute -right-4 top-20 w-64 bg-white rounded-2xl shadow-2xl border-2 border-primary p-4 animate-float">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-xl">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">ShopOpti+</span>
                      <p className="text-xs text-slate-500">Extension active</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                      <CheckCircle className="h-4 w-4" />
                      <span>Produit détecté!</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <div className="font-bold text-slate-900">$12.99</div>
                        <div className="text-slate-500">Prix fournisseur</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <div className="font-bold text-green-600">+65%</div>
                        <div className="text-slate-500">Marge suggérée</div>
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-gradient-to-r from-primary to-blue-600">
                      <Rocket className="h-4 w-4 mr-2" />
                      Importer en 1-clic
                    </Button>
                  </div>
                </div>

                {/* Notification Badge */}
                <div className="absolute -left-4 bottom-20 bg-white rounded-xl shadow-lg p-3 animate-float delay-500">
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="h-5 w-5 text-yellow-500" />
                    <span className="text-slate-700">Prix baissé de <span className="font-bold text-green-600">-15%</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Platforms */}
          <div className="mt-10 pt-8 border-t border-white/10">
            <p className="text-sm text-slate-400 mb-4">Plateformes e-commerce supportées:</p>
            <div className="flex flex-wrap gap-3">
              {supportedPlatforms.map((platform, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <span>{platform.logo}</span>
                  <span className="text-sm text-white">{platform.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-8">
        <div className="text-center">
          <Badge className="mb-4">Fonctionnalités</Badge>
          <h2 className="text-3xl font-bold">Tout ce dont vous avez besoin</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Des outils puissants pour automatiser votre business dropshipping et gagner du temps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {detailedFeatures.map((feature, index) => (
            <Card 
              key={index} 
              className="group relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/50 hover:shadow-xl transition-all duration-300"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color}`} />
              <CardHeader>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} w-fit text-white mb-2`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="space-y-8">
        <div className="text-center">
          <Badge variant="outline" className="mb-4">Comparatif</Badge>
          <h2 className="text-3xl font-bold">Pourquoi choisir ShopOpti+?</h2>
          <p className="text-muted-foreground mt-2">
            Comparez avec les autres solutions du marché
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-4 font-semibold">Fonctionnalité</th>
                  <th className="text-center p-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-2 bg-primary rounded-lg">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-bold text-primary">ShopOpti+</span>
                    </div>
                  </th>
                  <th className="text-center p-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-2 bg-slate-200 rounded-lg">
                        <Package className="h-5 w-5 text-slate-600" />
                      </div>
                      <span className="font-medium text-slate-600">AutoDS</span>
                    </div>
                  </th>
                  <th className="text-center p-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-2 bg-slate-200 rounded-lg">
                        <Store className="h-5 w-5 text-slate-600" />
                      </div>
                      <span className="font-medium text-slate-600">Spocket</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((item, index) => (
                  <tr key={index} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{item.feature}</td>
                    <td className="text-center p-4">
                      {typeof item.shopopti === 'boolean' ? (
                        item.shopopti ? (
                          <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-6 w-6 text-red-400 mx-auto" />
                        )
                      ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{item.shopopti}</Badge>
                      )}
                    </td>
                    <td className="text-center p-4">
                      {typeof item.autods === 'boolean' ? (
                        item.autods ? (
                          <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-6 w-6 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-600">{item.autods}</span>
                      )}
                    </td>
                    <td className="text-center p-4">
                      {typeof item.spocket === 'boolean' ? (
                        item.spocket ? (
                          <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-6 w-6 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-600">{item.spocket}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Testimonials */}
      <div className="space-y-8">
        <div className="text-center">
          <Badge variant="outline" className="mb-4">Témoignages</Badge>
          <h2 className="text-3xl font-bold">Ce que disent nos utilisateurs</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full" />
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                    <CardDescription>{testimonial.role}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <Quote className="h-8 w-8 text-primary/20 mb-2" />
                <p className="text-muted-foreground mb-4">{testimonial.text}</p>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {testimonial.stats}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-8">
        <div className="text-center">
          <Badge variant="outline" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl font-bold">Questions fréquentes</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  {faq.question}
                </CardTitle>
                <CardDescription className="text-base pl-8">{faq.answer}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <Card className="bg-gradient-to-r from-primary to-blue-600 border-0 text-white">
        <CardContent className="py-12">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <Sparkles className="h-12 w-12 mx-auto opacity-80" />
            <h2 className="text-3xl font-bold">Prêt à booster votre business?</h2>
            <p className="text-white/80 text-lg">
              Rejoignez plus de 50,000 dropshippers qui utilisent ShopOpti+ pour automatiser leur business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 h-14 px-8 text-lg"
                onClick={() => navigate('/extensions/cli')}
              >
                <Download className="h-5 w-5 mr-2" />
                Télécharger Maintenant
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 h-14 px-8 text-lg"
                onClick={() => navigate('/integrations/extensions/chrome-config')}
              >
                Configurer l'Extension
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Title */}
      <div>
        <h2 className="text-2xl font-bold">Autres Extensions</h2>
        <p className="text-muted-foreground mt-1">
          Étendez les fonctionnalités de votre plateforme
        </p>
      </div>

      {/* Other Extensions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {extensions.map((extension) => {
          const Icon = extension.icon;
          return (
            <Card 
              key={extension.id} 
              className="group cursor-pointer hover:shadow-lg transition-all hover:border-primary/20"
              onClick={() => navigate(extension.route)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge 
                    variant="secondary"
                    className={
                      extension.badge === 'Ultra Pro' 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs' 
                        : extension.badge === 'Pro' 
                        ? 'bg-blue-500 text-white text-xs' 
                        : 'text-xs'
                    }
                  >
                    {extension.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {extension.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {extension.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                  Accéder
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Animation Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </div>
  );
}
