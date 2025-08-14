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
  Target
} from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Marie Dubois",
      role: "E-commercante",
      company: "Bella Fashion",
      avatar: "MD",
      rating: 5,
      comment: "ShopOpti a complètement transformé mon business ! En 3 mois, j'ai augmenté mes ventes de 300%. L'IA pour détecter les produits gagnants est juste incroyable.",
      results: {
        salesIncrease: "300%",
        timeReduction: "20h/semaine",
        productsSold: "2,500+"
      },
      featured: true,
      videoUrl: "/testimonials/marie-dubois.mp4"
    },
    {
      id: 2,
      name: "Alex Martin",
      role: "Dropshipper Pro",
      company: "TechDrop Store",
      avatar: "AM",
      rating: 5,
      comment: "J'utilise ShopOpti depuis 1 an et c'est la meilleure décision que j'ai prise. L'automatisation me fait gagner un temps fou et les produits suggérés sont toujours rentables.",
      results: {
        salesIncrease: "450%",
        timeReduction: "25h/semaine",
        productsSold: "5,000+"
      },
      featured: false
    },
    {
      id: 3,
      name: "Sophie Leroy",
      role: "Entrepreneur",
      company: "Home & Garden Plus",
      avatar: "SL",
      rating: 5,
      comment: "Interface super intuitive, même pour une débutante comme moi. Le support client est exceptionnel et les formations m'ont aidée à maîtriser rapidement la plateforme.",
      results: {
        salesIncrease: "200%",
        timeReduction: "15h/semaine",
        productsSold: "1,800+"
      },
      featured: false
    },
    {
      id: 4,
      name: "Thomas Petit",
      role: "E-commerce Manager",
      company: "Sport Extreme",
      avatar: "TP",
      rating: 5,
      comment: "Avant ShopOpti, je passais des heures à analyser les tendances manuellement. Maintenant, l'IA fait tout le travail et mes résultats sont bien meilleurs.",
      results: {
        salesIncrease: "280%",
        timeReduction: "30h/semaine",
        productsSold: "3,200+"
      },
      featured: false
    },
    {
      id: 5,
      name: "Camille Rousseau",
      role: "Dropshippeuse",
      company: "Beauty Trends",
      avatar: "CR",
      rating: 5,
      comment: "Les intégrations avec Shopify et Facebook sont parfaites. Plus besoin de jongler entre 10 outils différents, tout est centralisé dans ShopOpti.",
      results: {
        salesIncrease: "350%",
        timeReduction: "18h/semaine",
        productsSold: "4,100+"
      },
      featured: false
    },
    {
      id: 6,
      name: "Julien Bernard",
      role: "Créateur de Boutiques",
      company: "Multi-Store Pro",
      avatar: "JB",
      rating: 5,
      comment: "Je gère 5 boutiques grâce à ShopOpti. L'IA m'aide à identifier les niches rentables et l'automatisation me permet de tout gérer seul.",
      results: {
        salesIncrease: "500%",
        timeReduction: "40h/semaine",
        productsSold: "8,500+"
      },
      featured: true,
      videoUrl: "/testimonials/julien-bernard.mp4"
    }
  ];

  const successStories = [
    {
      title: "De 0 à 50k€/mois en 6 mois",
      description: "Comment Marie a utilisé l'IA de ShopOpti pour créer une boutique de mode rentable",
      author: "Marie Dubois",
      results: ["300% d'augmentation des ventes", "20h économisées par semaine", "2,500+ produits vendus"],
      image: "/case-studies/marie-success.jpg"
    },
    {
      title: "5 boutiques gérées par une seule personne",
      description: "L'histoire de Julien qui automatise tout son business multi-boutiques",
      author: "Julien Bernard",
      results: ["500% de croissance", "5 boutiques actives", "8,500+ ventes réalisées"],
      image: "/case-studies/julien-success.jpg"
    },
    {
      title: "Du débutant au pro en 3 mois",
      description: "Sophie partage sa transformation d'employée à entrepreneure à succès",
      author: "Sophie Leroy",
      results: ["Premier business rentable", "200% de croissance", "Indépendance financière"],
      image: "/case-studies/sophie-success.jpg"
    }
  ];

  const stats = [
    { value: "50,000+", label: "Utilisateurs Satisfaits", icon: <Users className="w-6 h-6" /> },
    { value: "4.9/5", label: "Note Moyenne", icon: <Star className="w-6 h-6" /> },
    { value: "300%", label: "Augmentation Moyenne des Ventes", icon: <TrendingUp className="w-6 h-6" /> },
    { value: "95%", label: "Taux de Satisfaction", icon: <Award className="w-6 h-6" /> }
  ];

  const featuredTestimonial = testimonials.find(t => t.featured && t.id === 1);

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
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-success/10 text-success border-success/20">
            <Star className="w-4 h-4 mr-2" />
            Témoignages Clients
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Ils ont transformé leur{" "}
            <span className="bg-gradient-success bg-clip-text text-transparent">
              business
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Découvrez comment nos clients utilisent ShopOpti pour créer des boutiques 
            e-commerce rentables et automatiser leur croissance.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4 text-primary">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Testimonial */}
      {featuredTestimonial && (
        <section className="py-24 px-4">
          <div className="container mx-auto">
            <div className="max-w-6xl mx-auto">
              <Card className="overflow-hidden shadow-glow border-primary/20">
                <div className="grid lg:grid-cols-2">
                  <div className="relative bg-gradient-primary/10">
                    <div className="absolute inset-0 bg-gradient-primary/20" />
                    <div className="relative z-10 p-12 flex flex-col justify-center h-full">
                      <Badge className="mb-6 bg-primary w-fit">
                        <Star className="w-4 h-4 mr-2" />
                        Témoignage Vedette
                      </Badge>
                      
                      <Quote className="w-12 h-12 text-primary mb-6" />
                      
                      <blockquote className="text-2xl font-medium mb-8 leading-relaxed">
                        "{featuredTestimonial.comment}"
                      </blockquote>
                      
                      <div className="flex items-center space-x-4 mb-8">
                        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {featuredTestimonial.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{featuredTestimonial.name}</div>
                          <div className="text-muted-foreground">{featuredTestimonial.role}</div>
                          <div className="text-sm text-primary font-medium">{featuredTestimonial.company}</div>
                        </div>
                      </div>
                      
                      <div className="flex">
                        {[...Array(featuredTestimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-12 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold mb-8">Résultats Impressionnants</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-success rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-success">{featuredTestimonial.results.salesIncrease}</div>
                          <div className="text-sm text-muted-foreground">Augmentation des ventes</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-accent">{featuredTestimonial.results.timeReduction}</div>
                          <div className="text-sm text-muted-foreground">Temps économisé</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{featuredTestimonial.results.productsSold}</div>
                          <div className="text-sm text-muted-foreground">Produits vendus</div>
                        </div>
                      </div>
                    </div>
                    
                    {featuredTestimonial.videoUrl && (
                      <Button className="mt-8 w-fit" variant="outline">
                        <Play className="w-4 h-4 mr-2" />
                        Voir la Vidéo Témoignage
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* All Testimonials */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Ce que disent nos{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                clients
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Plus de 50,000 entrepreneurs nous font confiance pour développer leur e-commerce
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.filter(t => !t.featured || t.id !== 1).map((testimonial) => (
              <Card key={testimonial.id} className="group hover:shadow-glow transition-all duration-300">
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
                      <span className="font-semibold text-success">+{testimonial.results.salesIncrease}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Temps économisé:</span>
                      <span className="font-semibold text-accent">{testimonial.results.timeReduction}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Produits vendus:</span>
                      <span className="font-semibold">{testimonial.results.productsSold}</span>
                    </div>
                  </div>
                  
                  {testimonial.videoUrl && (
                    <Button variant="ghost" size="sm" className="mt-4 w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Vidéo Témoignage
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Études de{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                cas détaillées
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Plongez dans les stratégies exactes utilisées par nos clients les plus performants
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <Card key={index} className="group hover:shadow-glow transition-all duration-300 cursor-pointer">
                <div className="relative h-48 bg-gradient-primary/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-primary/20" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-success text-success-foreground">
                      Étude de Cas
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {story.title}
                  </CardTitle>
                  <CardDescription>
                    {story.description}
                  </CardDescription>
                  <div className="text-sm text-primary font-medium">
                    Par {story.author}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2 mb-6">
                    {story.results.map((result, resultIndex) => (
                      <div key={resultIndex} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>{result}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                success story
              </span>{" "}
              ?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Rejoignez les milliers d'entrepreneurs qui transforment déjà leur e-commerce 
              avec ShopOpti. Votre réussite commence aujourd'hui.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow text-lg px-12 py-4">
                  <Target className="w-5 h-5 mr-2" />
                  Commencer Mon Succès
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-12 py-4">
                <Play className="w-5 h-5 mr-2" />
                Voir Plus de Témoignages
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Essai gratuit 14 jours</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Résultats garantis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Support inclus</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Testimonials;