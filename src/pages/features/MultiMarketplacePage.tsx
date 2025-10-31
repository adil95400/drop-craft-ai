import { Helmet } from 'react-helmet-async'
import { PublicLayout } from '@/layouts/PublicLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, ShoppingBag, Zap, RefreshCw, Link2, CheckCircle2, ArrowRight, Shield, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import featureIntegration from '@/assets/feature-integration.jpg'

export default function MultiMarketplacePage() {
  const navigate = useNavigate()

  const platforms = [
    { name: 'Shopify', status: 'Disponible', color: 'bg-green-500' },
    { name: 'WooCommerce', status: 'Disponible', color: 'bg-purple-500' },
    { name: 'PrestaShop', status: 'Disponible', color: 'bg-blue-500' },
    { name: 'Magento', status: 'Disponible', color: 'bg-orange-500' },
    { name: 'Amazon', status: 'Bientôt', color: 'bg-amber-500' },
    { name: 'eBay', status: 'Bientôt', color: 'bg-red-500' }
  ]

  const features = [
    {
      icon: RefreshCw,
      title: 'Synchronisation en temps réel',
      description: 'Stock, prix et commandes synchronisés automatiquement entre toutes vos plateformes en quelques secondes.'
    },
    {
      icon: Zap,
      title: 'Gestion centralisée',
      description: 'Un seul dashboard pour gérer tous vos canaux de vente. Plus besoin de jongler entre plusieurs interfaces.'
    },
    {
      icon: Link2,
      title: 'Connexion facile',
      description: 'Connectez vos boutiques en quelques clics. Configuration simple et rapide sans compétences techniques.'
    },
    {
      icon: Shield,
      title: 'Sécurisé et fiable',
      description: 'Connexions sécurisées avec chiffrement SSL. Vos données sont protégées et sauvegardées automatiquement.'
    },
    {
      icon: Clock,
      title: 'Historique complet',
      description: 'Accédez à l\'historique de toutes les synchronisations et résolvez facilement les problèmes.'
    },
    {
      icon: CheckCircle2,
      title: 'Gestion des conflits',
      description: 'Détection et résolution automatique des conflits de stock ou de prix entre plateformes.'
    }
  ]

  const benefits = [
    {
      stat: '85%',
      label: 'Réduction des erreurs de stock'
    },
    {
      stat: '15h',
      label: 'Économisées par semaine'
    },
    {
      stat: '99.9%',
      label: 'Disponibilité du service'
    },
    {
      stat: '< 30s',
      label: 'Temps de synchronisation'
    }
  ]

  const workflow = [
    {
      step: '1',
      title: 'Connectez vos boutiques',
      description: 'Ajoutez vos boutiques Shopify, WooCommerce, PrestaShop ou autres en quelques clics.'
    },
    {
      step: '2',
      title: 'Configurez les règles',
      description: 'Définissez comment les prix, stocks et commandes doivent être synchronisés.'
    },
    {
      step: '3',
      title: 'Laissez la magie opérer',
      description: 'La synchronisation automatique se lance. Gérez tout depuis un seul endroit.'
    }
  ]

  return (
    <PublicLayout>
      <Helmet>
        <title>Multi-Marketplace | ShopOpti+ - Gérez toutes vos boutiques</title>
        <meta name="description" content="Connectez et gérez Shopify, WooCommerce, PrestaShop et plus depuis une seule plateforme. Synchronisation automatique en temps réel." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-background to-cyan-500/5" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">
                <Globe className="h-4 w-4 mr-2" />
                Multi-Plateforme
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
                Toutes vos boutiques
                <span className="block bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                  en un seul endroit
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Connectez Shopify, WooCommerce, PrestaShop, Magento et plus. Synchronisez automatiquement 
                vos produits, stocks et commandes en temps réel depuis un dashboard unique.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth')}>
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Connecter mes boutiques
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/pricing')}>
                  Voir les tarifs
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img 
                  src={featureIntegration} 
                  alt="Dashboard multi-marketplace avec gestion centralisée" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Grid */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold">Plateformes supportées</h2>
            <p className="text-lg text-muted-foreground">
              Connectez toutes vos boutiques favorites
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {platforms.map((platform, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-3">
                  <div className={`w-12 h-12 ${platform.color} rounded-lg mx-auto`} />
                  <div>
                    <div className="font-semibold">{platform.name}</div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {platform.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {benefit.stat}
                </div>
                <div className="text-sm text-muted-foreground">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Fonctionnalités</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer efficacement plusieurs boutiques
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="border-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 w-fit mb-4">
                      <IconComponent className="h-6 w-6 text-blue-500" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-16">
            <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
              Comment ça marche
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">3 étapes pour démarrer</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {workflow.map((item, index) => (
              <div key={index} className="relative">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < workflow.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 -z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <Card className="border-2 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
            <CardContent className="p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Globe className="h-12 w-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Prêt à centraliser vos boutiques ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Connectez toutes vos plateformes en quelques minutes et commencez à gagner du temps dès aujourd'hui.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth')}>
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Commencer maintenant
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/contact')}>
                  Parler à un expert
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  )
}
