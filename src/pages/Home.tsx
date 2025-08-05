import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { 
  ArrowRight, 
  Zap, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Shield, 
  Globe,
  Star,
  Check,
  Play,
  Download,
  Chrome,
  Smartphone,
  BarChart3,
  Package,
  Import,
  Sparkles,
  Timer,
  DollarSign,
  CheckCircle
} from "lucide-react"
import heroImage from "@/assets/hero-dashboard.jpg"

const Home = () => {
  const [email, setEmail] = useState("")

  const trustedCompanies = [
    { name: "Shopify", logo: "https://logos-world.net/wp-content/uploads/2020/11/Shopify-Logo.png" },
    { name: "Amazon", logo: "https://logos-world.net/wp-content/uploads/2020/04/Amazon-Logo.png" },
    { name: "AliExpress", logo: "https://logos-world.net/wp-content/uploads/2020/05/AliExpress-Logo.png" },
    { name: "eBay", logo: "https://logos-world.net/wp-content/uploads/2020/11/eBay-Logo.png" },
    { name: "WooCommerce", logo: "https://logos-world.net/wp-content/uploads/2020/11/WooCommerce-Logo.png" },
    { name: "BigCommerce", logo: "https://logos-world.net/wp-content/uploads/2021/02/BigCommerce-Logo.png" }
  ]

  const features = [
    {
      icon: <Import className="w-6 h-6" />,
      title: "Import Automatique",
      description: "Importez des milliers de produits en un clic depuis AliExpress, Amazon, et plus",
      highlight: "IA intégrée"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Optimisation SEO",
      description: "Descriptions et titres optimisés automatiquement pour Google",
      highlight: "Boost SEO"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics Avancés",
      description: "Suivez vos ventes, marges et performances en temps réel",
      highlight: "Temps réel"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Gestion Stock",
      description: "Synchronisation automatique du stock avec vos fournisseurs",
      highlight: "Auto-sync"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Calcul de Prix",
      description: "Marges optimisées automatiquement selon votre stratégie",
      highlight: "Smart pricing"
    },
    {
      icon: <Chrome className="w-6 h-6" />,
      title: "Extension Chrome",
      description: "Importez directement depuis votre navigateur en 1 clic",
      highlight: "1 clic"
    }
  ]

  const testimonials = [
    {
      name: "Marie Dubois",
      role: "CEO, StyleBoutique",
      content: "J'ai multiplié mon CA par 5 en 6 mois grâce à l'import automatique. Un game-changer !",
      rating: 5,
      revenue: "+500% CA",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Thomas Martin",
      role: "Fondateur, TechGadgets",
      content: "L'IA fait tout le travail SEO. Mes produits sont maintenant en première page Google.",
      rating: 5,
      revenue: "+300% trafic",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Sarah Chen",
      role: "E-commerce Manager",
      content: "Fini les heures perdues à copier-coller. Je gère 10x plus de produits maintenant.",
      rating: 5,
      revenue: "+1000% produits",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    }
  ]

  const faqItems = [
    {
      question: "Combien de produits puis-je importer ?",
      answer: "Unlimited ! Importez autant de produits que vous voulez. Nos clients importent en moyenne 5000+ produits par mois."
    },
    {
      question: "L'extension Chrome est-elle gratuite ?",
      answer: "Oui, l'extension Chrome est incluse gratuitement avec tous nos plans. Installation en 30 secondes."
    },
    {
      question: "Les descriptions sont-elles optimisées SEO ?",
      answer: "Absolument ! Notre IA analyse et réécrit automatiquement chaque description pour maximiser votre référencement Google."
    },
    {
      question: "Puis-je me connecter à plusieurs fournisseurs ?",
      answer: "Oui, connectez autant de fournisseurs que vous voulez : AliExpress, Amazon, eBay, Shopify, et 50+ autres plateformes."
    },
    {
      question: "Y a-t-il une synchronisation automatique du stock ?",
      answer: "Oui, le stock se met à jour automatiquement. Fini les ruptures ou surventes !"
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "29",
      period: "/mois",
      description: "Parfait pour commencer",
      features: [
        "500 imports/mois",
        "Extension Chrome",
        "Optimisation SEO basique",
        "Support email"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "79",
      period: "/mois", 
      description: "Le plus populaire",
      features: [
        "Imports illimités",
        "IA avancée",
        "Analytics complets",
        "Support prioritaire",
        "API accès"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "199",
      period: "/mois",
      description: "Pour les gros volumes",
      features: [
        "Tout Professional +",
        "Manager dédié",
        "Formations personnalisées",
        "SLA 99.9%",
        "White-label"
      ],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">
                Shopopti Pro
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-all">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-all">
                Prix
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-all">
                Témoignages
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.location.href = "/auth"}>
                Connexion
              </Button>
              <Button onClick={() => window.location.href = "/auth"}>
                Essai Gratuit
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-6 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-primary/10 border-primary/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  IA + E-commerce = 🚀
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Importez <span className="text-primary">10,000+</span> produits
                  <br />
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    en 1 clic
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  L'IA qui transforme votre e-commerce. Import automatique, SEO optimisé, 
                  et gestion complète. <strong>+2000 marchands</strong> nous font confiance.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
                  <Play className="w-5 h-5 mr-2" />
                  Démo gratuite 2 min
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  <Download className="w-5 h-5 mr-2" />
                  Extension Chrome
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  Essai gratuit 14 jours
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  Aucune carte requise
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  Setup en 5 min
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 blur-3xl" />
              <img 
                src={heroImage} 
                alt="Dashboard Preview" 
                className="relative rounded-2xl shadow-2xl border border-border/50"
              />
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                <Timer className="w-4 h-4 inline mr-1" />
                Live Demo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Companies */}
      <section className="py-16 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-muted-foreground mb-8">
              Ils nous font confiance pour gérer leurs imports
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center opacity-60 hover:opacity-100 transition-opacity">
              {trustedCompanies.map((company, index) => (
                <div key={index} className="flex items-center justify-center">
                  <img 
                    src={company.logo} 
                    alt={company.name}
                    className="h-8 md:h-10 max-w-full filter grayscale hover:grayscale-0 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Fonctionnalités
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin pour
              <span className="text-primary"> dominer</span> votre marché
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Une suite complète d'outils IA pour automatiser, optimiser et faire exploser vos ventes e-commerce
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50">
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="text-xs">
                    {feature.highlight}
                  </Badge>
                </div>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Extension Chrome CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Chrome className="w-20 h-20 mx-auto mb-6 text-primary" />
              <h2 className="text-4xl font-bold mb-4">
                Extension Chrome <span className="text-primary">Gratuite</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Importez des produits directement depuis n'importe quel site web en 1 seul clic. 
                <br />Plus de 50,000+ utilisateurs actifs !
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-background/80 p-6 rounded-lg border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">1 clic</div>
                <p className="text-sm text-muted-foreground">Import instantané</p>
              </div>
              <div className="bg-background/80 p-6 rounded-lg border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">50+ sites</div>
                <p className="text-sm text-muted-foreground">Compatibilité</p>
              </div>
              <div className="bg-background/80 p-6 rounded-lg border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">0€</div>
                <p className="text-sm text-muted-foreground">Toujours gratuit</p>
              </div>
            </div>

            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
              <Download className="w-5 h-5 mr-2" />
              Installer maintenant - Gratuit
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              ⭐ 4.9/5 étoiles sur Chrome Web Store (2,341 avis)
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Users className="w-3 h-3 mr-1" />
              Témoignages
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              +2000 marchands ont
              <span className="text-primary"> explosé</span> leurs ventes
            </h2>
            <p className="text-xl text-muted-foreground">
              Découvrez comment nos clients ont transformé leur business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative border-border/50 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {testimonial.revenue}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <DollarSign className="w-3 h-3 mr-1" />
              Pricing
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Commencez <span className="text-primary">gratuitement</span> aujourd'hui
            </h2>
            <p className="text-xl text-muted-foreground">
              14 jours d'essai gratuit, sans engagement, sans carte bancaire
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary scale-105' : ''} border-border/50`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-white">
                      Le plus populaire
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold">
                    {plan.price}€<span className="text-lg text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Essayer gratuitement
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                FAQ
              </Badge>
              <h2 className="text-4xl font-bold mb-4">
                Questions <span className="text-primary">fréquentes</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Tout ce que vous devez savoir pour commencer
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary via-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Prêt à exploser vos ventes ?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Rejoignez les +2000 marchands qui ont multiplié leur CA grâce à notre IA
          </p>
          
          <div className="max-w-md mx-auto mb-8">
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="votre@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button variant="secondary" size="lg">
                Démarrer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="flex justify-center gap-8 text-sm opacity-80">
            <span>✓ 14 jours gratuits</span>
            <span>✓ Aucune carte requise</span>
            <span>✓ Support 24/7</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-primary">
                  Shopopti Pro
                </span>
              </div>
              <p className="text-muted-foreground">
                La plateforme IA qui révolutionne le dropshipping
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-all">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-foreground transition-all">Tarification</a></li>
                <li><a href="#" className="hover:text-foreground transition-all">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-all">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-all">Guides</a></li>
                <li><a href="#" className="hover:text-foreground transition-all">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-all">À propos</a></li>
                <li><a href="#" className="hover:text-foreground transition-all">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-all">Carrières</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Shopopti Pro. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home