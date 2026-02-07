import { Helmet } from 'react-helmet-async'
import { PublicLayout } from '@/layouts/PublicLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Brain, Wand2, TrendingUp, Target, Zap, CheckCircle2, ArrowRight, BarChart3, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import featureAI from '@/assets/feature-ai.jpg'

export default function AIOptimizationPage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: Brain,
      title: 'Optimisation de prix dynamique',
      description: 'L\'IA analyse le marché en temps réel et ajuste vos prix pour maximiser vos profits tout en restant compétitif.'
    },
    {
      icon: Wand2,
      title: 'Génération de descriptions',
      description: 'Créez automatiquement des descriptions produits optimisées SEO, engageantes et uniques pour chaque article.'
    },
    {
      icon: Target,
      title: 'Recommandations de produits',
      description: 'L\'IA identifie les produits gagnants basés sur les tendances du marché et les données de ventes.'
    },
    {
      icon: TrendingUp,
      title: 'Prédictions de ventes',
      description: 'Anticipez les tendances et optimisez votre stock grâce aux prévisions de ventes powered by machine learning.'
    },
    {
      icon: Zap,
      title: 'A/B Testing automatique',
      description: 'Testez automatiquement différentes variantes de titres, images et prix pour trouver la combinaison gagnante.'
    },
    {
      icon: BarChart3,
      title: 'Analytics prédictifs',
      description: 'Obtenez des insights actionnables sur vos performances et des recommandations personnalisées pour améliorer vos résultats.'
    }
  ]

  const benefits = [
    {
      stat: '+45%',
      label: 'Augmentation moyenne du taux de conversion'
    },
    {
      stat: '+32%',
      label: 'Amélioration des marges bénéficiaires'
    },
    {
      stat: '20h',
      label: 'Économisées par semaine sur les tâches manuelles'
    },
    {
      stat: '99.9%',
      label: 'Précision des prédictions de tendances'
    }
  ]

  const useCases = [
    {
      title: 'E-commerce Mode',
      challenge: 'Difficile de maintenir des prix compétitifs tout en restant rentable',
      solution: 'L\'IA ajuste les prix en fonction de la concurrence et de la demande en temps réel',
      result: '+38% de marge brute en 3 mois'
    },
    {
      title: 'Dropshipping Tech',
      challenge: 'Rédaction de descriptions uniques pour 5000+ produits',
      solution: 'Génération automatique de descriptions SEO-optimisées en quelques secondes',
      result: '95% de réduction du temps de création de contenu'
    },
    {
      title: 'Multi-boutiques',
      challenge: 'Identifier les produits à succès parmi 50 000 références',
      solution: 'L\'IA analyse les tendances et recommande les meilleurs produits à mettre en avant',
      result: '+127% de revenus sur les produits recommandés'
    }
  ]

  return (
    <PublicLayout>
      <Helmet>
        <title>IA d'Optimisation | ShopOpti+ - Intelligence Artificielle pour E-commerce</title>
        <meta name="description" content="Optimisez automatiquement vos prix, descriptions et stratégies avec notre IA avancée. Augmentez vos conversions et vos marges grâce à l'intelligence artificielle." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-background to-pink-500/5" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">
                <Sparkles className="h-4 w-4 mr-2" />
                Intelligence Artificielle Avancée
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
                Optimisez votre e-commerce
                <span className="block bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                  avec l'IA
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Laissez l'intelligence artificielle analyser, optimiser et automatiser votre business. 
                Augmentez vos conversions de 45% et réduisez votre charge de travail de 20h par semaine.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="px-8 py-6 text-lg" onClick={() => {
                  try { localStorage.setItem('pending_trial', 'true'); } catch {}
                  navigate('/auth?trial=true');
                }}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Essayer gratuitement
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
                  src={featureAI} 
                  alt="Interface d'optimisation IA avec analytics et recommandations" 
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
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
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
            <h2 className="text-3xl md:text-4xl font-bold">Fonctionnalités IA</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une suite complète d'outils intelligents pour optimiser chaque aspect de votre e-commerce
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="border-2 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 w-fit mb-4">
                      <IconComponent className="h-6 w-6 text-purple-500" />
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

      {/* Use Cases */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-16">
            <Badge className="px-4 py-2 bg-success/10 text-success border-success/20">
              Cas d'usage
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Des résultats concrets</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez comment nos clients utilisent l'IA pour transformer leur business
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-1">Défi</div>
                    <p className="text-sm">{useCase.challenge}</p>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-1">Solution</div>
                    <p className="text-sm">{useCase.solution}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="font-semibold text-success">{useCase.result}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <Card className="border-2 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <CardContent className="p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Prêt à optimiser avec l'IA ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Commencez gratuitement dès aujourd'hui et découvrez la puissance de l'intelligence artificielle pour votre e-commerce.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="px-8 py-6 text-lg" onClick={() => {
                  try { localStorage.setItem('pending_trial', 'true'); } catch {}
                  navigate('/auth?trial=true');
                }}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Démarrer gratuitement
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
