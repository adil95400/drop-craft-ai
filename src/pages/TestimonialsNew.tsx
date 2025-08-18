import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Sparkles,
  Star,
  Quote,
  TrendingUp,
  Users,
  Award,
  Play,
  ArrowRight,
  CheckCircle,
  BarChart3,
  ShoppingCart,
  Zap,
  Target,
  Calendar,
  Video
} from "lucide-react";

const TestimonialsNew = () => {
  const featuredTestimonials = [
    {
      id: 1,
      name: "Marie Dubois",
      role: "Fondatrice",
      company: "Bella Fashion",
      location: "Paris, France",
      avatar: "MD",
      rating: 5,
      revenue: "150k€",
      timeframe: "6 mois",
      products: "2,500+",
      comment: "ShopOpti a complètement révolutionné mon approche du e-commerce. En 6 mois, j'ai atteint 150k€ de chiffre d'affaires avec plus de 2,500 produits vendus. L'IA de détection des produits gagnants est tout simplement magique !",
      fullStory: "Ancienne employée dans la mode, Marie a créé sa boutique en ligne avec ShopOpti et a réussi à dépasser ses objectifs les plus optimistes. Son secret ? L'utilisation intelligente de notre IA pour identifier les tendances avant ses concurrents.",
      videoUrl: "/testimonials/marie-dubois-full.mp4",
      beforeAfter: {
        before: {
          revenue: "0€",
          products: "0",
          timespent: "60h/semaine"
        },
        after: {
          revenue: "150k€",
          products: "2,500+",
          timespent: "20h/semaine"
        }
      },
      featured: true
    },
    {
      id: 2,
      name: "Alexandre Moreau",
      role: "E-commerce Entrepreneur",
      company: "TechFlow Store",
      location: "Lyon, France",
      avatar: "AM",
      rating: 5,
      revenue: "280k€",
      timeframe: "8 mois",
      products: "4,200+",
      comment: "Grâce à ShopOpti, j'ai pu automatiser 90% de mes processus. Mes 3 boutiques génèrent maintenant 280k€ de CA avec seulement 15h de travail par semaine. C'est la liberté entrepreneuriale que je cherchais !",
      fullStory: "Alexandre gérait manuellement ses boutiques avant de découvrir ShopOpti. Aujourd'hui, il dirige un empire e-commerce automatisé qui lui permet de voyager tout en générant des revenus passifs.",
      videoUrl: "/testimonials/alexandre-moreau.mp4",
      beforeAfter: {
        before: {
          revenue: "30k€/an",
          products: "200",
          timespent: "70h/semaine"
        },
        after: {
          revenue: "280k€/an",
          products: "4,200+",
          timespent: "15h/semaine"
        }
      },
      featured: true
    }
  ];

  const customerTestimonials = [
    {
      name: "Sophie Laurent",
      role: "Dropshippeuse",
      company: "Beauty & Wellness",
      avatar: "SL",
      rating: 5,
      results: { sales: "+320%", time: "25h économisées", products: "1,800+" },
      comment: "L'interface est tellement intuitive ! En tant que débutante, j'ai pu lancer ma boutique en 2 semaines. Le support client est exceptionnel, toujours là pour m'aider."
    },
    {
      name: "Thomas Petit",
      role: "Gérant E-commerce",
      company: "Sport Elite",
      avatar: "TP",
      rating: 5,
      results: { sales: "+280%", time: "30h économisées", products: "3,200+" },
      comment: "Les analyses prédictives m'ont permis d'anticiper les tendances. J'ai lancé des produits saisonniers au bon moment et mes ventes ont explosé !"
    },
    {
      name: "Camille Rousseau",
      role: "Propriétaire de boutique",
      company: "Home Decor Plus",
      avatar: "CR",
      rating: 5,
      results: { sales: "+350%", time: "20h économisées", products: "2,700+" },
      comment: "Les intégrations avec Shopify et Facebook Ads sont parfaites. Plus besoin de jongler entre 10 outils, tout est centralisé dans ShopOpti."
    },
    {
      name: "Julien Bernard",
      role: "Multi-boutiques",
      company: "Digital Empire",
      avatar: "JB",
      rating: 5,
      results: { sales: "+500%", time: "40h économisées", products: "8,500+" },
      comment: "Je gère maintenant 5 boutiques rentables grâce à l'automatisation. ShopOpti m'a permis de scaler sans stress et de garder ma vie personnelle."
    },
    {
      name: "Emma Durand",
      role: "Consultante E-commerce",
      company: "Growth Solutions",
      avatar: "ED",
      rating: 5,
      results: { sales: "+400%", time: "35h économisées", products: "5,100+" },
      comment: "En tant que consultante, je recommande ShopOpti à tous mes clients. Les résultats parlent d'eux-mêmes : croissance rapide et ROI exceptionnel."
    },
    {
      name: "Lucas Martin",
      role: "Entrepreneur Digital",
      company: "Fashion Forward",
      avatar: "LM",
      rating: 5,
      results: { sales: "+260%", time: "22h économisées", products: "1,950+" },
      comment: "L'IA de ShopOpti a identifié des niches que je n'aurais jamais trouvées seul. Mes marges ont augmenté de 60% en suivant leurs recommandations."
    }
  ];

  const successMetrics = [
    { value: "500%", label: "Croissance moyenne des ventes", icon: <TrendingUp className="w-6 h-6" /> },
    { value: "85,000+", label: "Entrepreneurs satisfaits", icon: <Users className="w-6 h-6" /> },
    { value: "4.9/5", label: "Satisfaction client", icon: <Star className="w-6 h-6" /> },
    { value: "30h", label: "Temps économisé par semaine", icon: <Zap className="w-6 h-6" /> }
  ];

  const caseStudies = [
    {
      title: "De 0 à 100k€ en 4 mois",
      subtitle: "L'histoire de Marie : employée devenue entrepreneure",
      author: "Marie Dubois",
      category: "Dropshipping Mode",
      duration: "4 mois",
      results: ["150k€ de CA", "2,500+ ventes", "ROI de 300%"],
      image: "/case-studies/marie-transformation.jpg",
      description: "Découvrez comment Marie a utilisé notre IA pour identifier les produits tendance et automatiser sa croissance."
    },
    {
      title: "Empire Multi-Boutiques Automatisé",
      subtitle: "Alexandre et ses 5 boutiques rentables",
      author: "Alexandre Moreau",
      category: "Multi-stores Tech",
      duration: "8 mois",
      results: ["280k€ de CA", "5 boutiques", "15h/semaine"],
      image: "/case-studies/alexandre-empire.jpg",
      description: "Comment gérer un empire e-commerce en travaillant seulement 15h par semaine grâce à l'automatisation."
    },
    {
      title: "Consultant vers Entrepreneur",
      subtitle: "Emma transforme son expertise en business",
      author: "Emma Durand",
      category: "Consulting to Commerce",
      duration: "6 mois",
      results: ["400% de croissance", "5,100+ ventes", "Leader de niche"],
      image: "/case-studies/emma-expertise.jpg",
      description: "L'évolution d'une consultante e-commerce vers la création de sa propre boutique ultra-rentable."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5" />
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ShopOpti
              </span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-primary hover:bg-primary-hover">
                  Commencer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4 bg-gradient-hero/5">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-success/10 text-success border-success/20">
            <Award className="w-4 h-4 mr-2" />
            Success Stories
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Transformations{" "}
            <span className="bg-gradient-success bg-clip-text text-transparent">
              extraordinaires
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Découvrez comment nos clients ont révolutionné leur e-commerce avec ShopOpti. 
            Des histoires vraies, des résultats mesurables, des succès inspirants.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow">
              <Play className="w-5 h-5 mr-2" />
              Voir les Témoignages Vidéo
            </Button>
            <Button variant="outline" size="lg">
              <Calendar className="w-5 h-5 mr-2" />
              Planifier une Démo
            </Button>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {successMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4 text-primary">
                  {metric.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Success Stories */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Histoires de{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                réussite
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Plongez dans les parcours de nos entrepreneurs les plus performants
            </p>
          </div>

          <div className="space-y-16">
            {featuredTestimonials.map((testimonial, index) => (
              <Card key={testimonial.id} className="overflow-hidden shadow-glow border-primary/20">
                <div className={`grid lg:grid-cols-2 ${index % 2 === 1 ? 'lg:grid-cols-2' : ''}`}>
                  <div className={`relative bg-gradient-primary/10 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="absolute inset-0 bg-gradient-primary/20" />
                    <div className="relative z-10 p-12 flex flex-col justify-center h-full">
                      <Badge className="mb-6 bg-primary w-fit">
                        <Star className="w-4 h-4 mr-2" />
                        Success Story
                      </Badge>
                      
                      <Quote className="w-12 h-12 text-primary mb-6" />
                      
                      <blockquote className="text-2xl font-medium mb-8 leading-relaxed">
                        "{testimonial.comment}"
                      </blockquote>
                      
                      <div className="flex items-center space-x-4 mb-8">
                        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{testimonial.name}</div>
                          <div className="text-muted-foreground">{testimonial.role}</div>
                          <div className="text-sm text-primary font-medium">{testimonial.company}</div>
                          <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                        </div>
                      </div>
                      
                      <div className="flex mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>

                      <p className="text-muted-foreground mb-6">{testimonial.fullStory}</p>

                      <Button variant="outline" className="w-fit">
                        <Video className="w-4 h-4 mr-2" />
                        Voir le Témoignage Complet
                      </Button>
                    </div>
                  </div>
                  
                  <div className={`p-12 flex flex-col justify-center ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <h3 className="text-2xl font-bold mb-8">Résultats Exceptionnels</h3>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="text-center p-4 bg-gradient-success/10 rounded-lg">
                        <div className="text-2xl font-bold text-success mb-1">{testimonial.revenue}</div>
                        <div className="text-xs text-muted-foreground">Chiffre d'affaires</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-accent/10 rounded-lg">
                        <div className="text-2xl font-bold text-accent mb-1">{testimonial.timeframe}</div>
                        <div className="text-xs text-muted-foreground">Durée</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-hero/10 rounded-lg">
                        <div className="text-2xl font-bold mb-1">{testimonial.products}</div>
                        <div className="text-xs text-muted-foreground">Produits vendus</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-primary/10 rounded-lg">
                        <div className="text-2xl font-bold text-primary mb-1">95%</div>
                        <div className="text-xs text-muted-foreground">Taux de profit</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Avant / Après ShopOpti</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="font-medium text-destructive">Avant :</div>
                          <div className="space-y-1">
                            <div>• CA: {testimonial.beforeAfter.before.revenue}</div>
                            <div>• Produits: {testimonial.beforeAfter.before.products}</div>
                            <div>• Temps: {testimonial.beforeAfter.before.timespent}</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="font-medium text-success">Après :</div>
                          <div className="space-y-1">
                            <div>• CA: {testimonial.beforeAfter.after.revenue}</div>
                            <div>• Produits: {testimonial.beforeAfter.after.products}</div>
                            <div>• Temps: {testimonial.beforeAfter.after.timespent}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Grid */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Nos clients{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                témoignent
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Plus de 85,000 entrepreneurs nous font confiance pour développer leur e-commerce
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {customerTestimonials.map((testimonial, index) => (
              <Card key={index} className="group hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-xs text-primary font-medium">{testimonial.company}</div>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-muted-foreground italic mb-6">
                    "{testimonial.comment}"
                  </blockquote>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Ventes:</span>
                      <span className="font-semibold text-success">{testimonial.results.sales}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Temps économisé:</span>
                      <span className="font-semibold text-accent">{testimonial.results.time}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Produits vendus:</span>
                      <span className="font-semibold">{testimonial.results.products}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Études de cas{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                détaillées
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Analysez les stratégies exactes utilisées par nos clients les plus performants
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {caseStudies.map((study, index) => (
              <Card key={index} className="group hover:shadow-glow transition-all duration-300 cursor-pointer">
                <div className="relative h-48 bg-gradient-primary/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-primary/20" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-success">
                      {study.category}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <Badge variant="outline" className="bg-background/80">
                      {study.duration}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {study.title}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-accent">
                    {study.subtitle}
                  </CardDescription>
                  <p className="text-sm text-muted-foreground">
                    {study.description}
                  </p>
                  <div className="text-sm text-primary font-medium">
                    Par {study.author}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2 mb-6">
                    {study.results.map((result, resultIndex) => (
                      <div key={resultIndex} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        <span>{result}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Lire l'Étude Complète
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-hero/5">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à écrire votre{" "}
              <span className="bg-gradient-success bg-clip-text text-transparent">
                success story
              </span>{" "}
              ?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Rejoignez plus de 85,000 entrepreneurs qui ont transformé leur vie avec ShopOpti. 
              Votre succès commence aujourd'hui.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow">
                <Target className="w-5 h-5 mr-2" />
                Commencer Maintenant
              </Button>
              <Button variant="outline" size="lg">
                <Calendar className="w-5 h-5 mr-2" />
                Planifier une Démo
              </Button>
            </div>

            <div className="mt-8 text-sm text-muted-foreground">
              ✅ Essai gratuit de 14 jours • ✅ Sans engagement • ✅ Support expert inclus
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestimonialsNew;