import { Helmet } from 'react-helmet-async'
import { PublicLayout } from '@/layouts/PublicLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Eye, Target, Zap, Brain, CheckCircle2, ArrowRight, PieChart, Activity, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import featureAnalytics from '@/assets/feature-analytics.jpg'

export default function AnalyticsPage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: BarChart3,
      title: 'Tableaux de bord en temps réel',
      description: 'Visualisez vos KPIs essentiels en un coup d\'œil avec des graphiques interactifs mis à jour en temps réel.'
    },
    {
      icon: Brain,
      title: 'Insights IA',
      description: 'L\'intelligence artificielle analyse vos données et vous fournit des recommandations actionnables automatiquement.'
    },
    {
      icon: TrendingUp,
      title: 'Prévisions de ventes',
      description: 'Anticipez vos ventes futures grâce aux modèles prédictifs basés sur vos historiques et tendances du marché.'
    },
    {
      icon: Target,
      title: 'Analyse de performance',
      description: 'Identifiez vos meilleurs produits, canaux et campagnes marketing pour optimiser votre stratégie.'
    },
    {
      icon: PieChart,
      title: 'Segmentation clients',
      description: 'Comprenez vos clients avec des analyses RFM, cohortes et segments comportementaux avancés.'
    },
    {
      icon: Activity,
      title: 'Suivi en temps réel',
      description: 'Monitez vos ventes, visiteurs et conversions en direct avec alertes instantanées sur les anomalies.'
    }
  ]

  const metrics = [
    {
      icon: DollarSign,
      title: 'Revenus',
      items: ['Chiffre d\'affaires', 'Marge brute', 'Panier moyen', 'LTV client']
    },
    {
      icon: TrendingUp,
      title: 'Conversions',
      items: ['Taux de conversion', 'Abandon panier', 'Taux de rebond', 'Funnel de vente']
    },
    {
      icon: Eye,
      title: 'Trafic',
      items: ['Visiteurs uniques', 'Sources de trafic', 'Pages vues', 'Temps sur site']
    },
    {
      icon: Target,
      title: 'Produits',
      items: ['Bestsellers', 'Rotation stock', 'Marge par produit', 'Cross-sell']
    }
  ]

  const benefits = [
    {
      stat: '3x',
      label: 'Meilleure prise de décision'
    },
    {
      stat: '+52%',
      label: 'ROI marketing amélioré'
    },
    {
      stat: '< 1s',
      label: 'Temps de chargement'
    },
    {
      stat: '100+',
      label: 'Métriques suivies'
    }
  ]

  const useCases = [
    {
      title: 'Optimiser les campagnes',
      description: 'Identifiez les campagnes marketing les plus rentables et réallouez votre budget intelligemment.',
      result: '+73% de ROI publicitaire'
    },
    {
      title: 'Réduire les abandons',
      description: 'Analysez le parcours client et identifiez les points de friction pour améliorer les conversions.',
      result: '-38% d\'abandon panier'
    },
    {
      title: 'Gérer le stock',
      description: 'Anticipez les ruptures de stock et optimisez vos achats grâce aux prévisions de demande.',
      result: '-45% de stock dormant'
    }
  ]

  return (
    <PublicLayout>
      <Helmet>
        <title>Analytics Avancés | ShopOpti+ - Business Intelligence pour E-commerce</title>
        <meta name="description" content="Tableaux de bord en temps réel, insights IA et prévisions de ventes. Prenez des décisions data-driven pour développer votre e-commerce." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-background to-emerald-500/5" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                <BarChart3 className="h-4 w-4 mr-2" />
                Business Intelligence
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
                Des insights pour
                <span className="block bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 bg-clip-text text-transparent">
                  mieux décider
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Transformez vos données en décisions. Analytics en temps réel, prévisions IA et 
                recommandations personnalisées pour développer votre e-commerce intelligemment.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth')}>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Voir la démo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/pricing')}>
                  Découvrir les plans
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img 
                  src={featureAnalytics} 
                  alt="Dashboard analytics avec graphiques et métriques en temps réel" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  {benefit.stat}
                </div>
                <div className="text-sm text-muted-foreground">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Fonctionnalités Analytics</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des outils puissants pour analyser et optimiser vos performances
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="border-2 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 w-fit mb-4">
                      <IconComponent className="h-6 w-6 text-green-500" />
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

      {/* Metrics Categories */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-16">
            <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
              Métriques
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Plus de 100 métriques suivies</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Toutes les données dont vous avez besoin pour piloter votre business
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((category, index) => {
              const IconComponent = category.icon
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-16">
            <Badge className="px-4 py-2 bg-success/10 text-success border-success/20">
              Cas d'usage
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Analytics en action</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                  <CardDescription className="text-base">{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="font-semibold text-success">{useCase.result}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <Card className="border-2 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardContent className="p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <BarChart3 className="h-12 w-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Prêt à exploiter vos données ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Accédez à des analytics professionnels dès maintenant et prenez de meilleures décisions pour votre business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth')}>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Essayer gratuitement
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/contact')}>
                  Demander une démo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  )
}
