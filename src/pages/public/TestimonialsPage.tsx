import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Quote, 
  TrendingUp, 
  Users, 
  Award,
  ArrowRight,
  Play,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TestimonialsPage = () => {
  const navigate = useNavigate();

  const featuredTestimonials = [
    {
      name: "Marie Dupont",
      company: "FashionDrop.fr",
      role: "Fondatrice",
      image: "MD",
      quote: "ShopOpti+ a transformé mon business. En 6 mois, j'ai multiplié mon CA par 3 grâce à l'automatisation et l'IA d'optimisation des fiches produits.",
      metrics: { revenue: "+215%", time: "-20h/sem", products: "5,000+" },
      rating: 5,
      featured: true
    },
    {
      name: "Thomas Bernard",
      company: "TechGadgets.eu",
      role: "CEO",
      image: "TB",
      quote: "La synchronisation multi-canal nous a permis de vendre sur 5 marketplaces sans effort supplémentaire. Le ROI est incroyable.",
      metrics: { revenue: "+180%", channels: "5", orders: "2,500/mois" },
      rating: 5,
      featured: true
    },
    {
      name: "Sophie Martin",
      company: "BeautyBox",
      role: "E-commerce Manager",
      image: "SM",
      quote: "L'IA de ShopOpti+ optimise nos descriptions produits mieux que notre équipe de copywriters. Un gain de temps et de qualité énorme.",
      metrics: { conversion: "+45%", seo: "+120%", time: "-15h/sem" },
      rating: 5,
      featured: true
    }
  ];

  const testimonials = [
    {
      name: "Lucas Petit",
      company: "SportWear Pro",
      role: "Fondateur",
      image: "LP",
      quote: "Interface intuitive, support réactif, et des résultats concrets dès le premier mois. Je recommande à 100%.",
      rating: 5
    },
    {
      name: "Emma Laurent",
      company: "DécoMaison",
      role: "Directrice E-commerce",
      image: "EL",
      quote: "Nous avons testé plusieurs solutions avant ShopOpti+. Aucune n'arrive à ce niveau de fonctionnalités et de facilité d'utilisation.",
      rating: 5
    },
    {
      name: "Antoine Moreau",
      company: "ElectroShop",
      role: "CEO",
      image: "AM",
      quote: "Le fulfillment automatique nous fait gagner des heures chaque jour. Plus d'erreurs, plus de stress.",
      rating: 5
    },
    {
      name: "Julie Roux",
      company: "KidsWorld",
      role: "Gérante",
      image: "JR",
      quote: "Parfait pour les débutants comme les experts. L'onboarding est clair et le support toujours disponible.",
      rating: 5
    },
    {
      name: "Pierre Dubois",
      company: "GourmetFood",
      role: "Fondateur",
      image: "PD",
      quote: "L'analyse IA des tendances nous a permis d'identifier des produits gagnants avant la concurrence.",
      rating: 5
    },
    {
      name: "Camille Leroy",
      company: "PetSupplies.fr",
      role: "E-commerce Manager",
      image: "CL",
      quote: "La gestion multi-fournisseurs est un game-changer. Tout est centralisé et automatisé.",
      rating: 5
    }
  ];

  const stats = [
    { value: "10,000+", label: "Clients actifs", icon: Users },
    { value: "98%", label: "Satisfaction", icon: Award },
    { value: "+185%", label: "Croissance moyenne", icon: TrendingUp },
    { value: "4.9/5", label: "Note moyenne", icon: Star }
  ];

  const caseStudies = [
    {
      title: "FashionDrop multiplie son CA par 3",
      description: "Comment Marie a automatisé son business de dropshipping mode",
      category: "Mode",
      result: "+215% de revenus"
    },
    {
      title: "TechGadgets conquiert 5 marketplaces",
      description: "L'expansion multi-canal réussie d'une boutique électronique",
      category: "Électronique",
      result: "+180% de ventes"
    },
    {
      title: "BeautyBox optimise 10,000 fiches",
      description: "L'IA au service de l'optimisation SEO à grande échelle",
      category: "Beauté",
      result: "+45% conversion"
    }
  ];

  return (
    <PublicLayout>
      <SEO
        title="Témoignages Clients ShopOpti+ | Avis et Success Stories E-commerce"
        description="Découvrez les témoignages de nos clients qui ont transformé leur e-commerce avec ShopOpti+. +10K entrepreneurs satisfaits, +185% de croissance moyenne."
        path="/testimonials"
        keywords="avis ShopOpti, témoignages e-commerce, success stories dropshipping, clients satisfaits"
      />

      <div className="bg-background min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 px-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
              Témoignages Clients
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Ils ont <span className="text-primary">transformé</span> leur business
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Découvrez comment +10,000 entrepreneurs utilisent ShopOpti+ pour développer leur e-commerce
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Testimonials */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Success Stories
            </h2>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {featuredTestimonials.map((testimonial, index) => (
                <Card key={index} className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-xl transition-all">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.image}
                      </div>
                      <div>
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    <blockquote className="relative">
                      <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20" />
                      <p className="text-foreground pl-6 italic">"{testimonial.quote}"</p>
                    </blockquote>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                      {Object.entries(testimonial.metrics).map(([key, value], i) => (
                        <div key={i} className="text-center">
                          <div className="text-lg font-bold text-primary">{value}</div>
                          <div className="text-xs text-muted-foreground capitalize">{key}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Video Testimonial */}
        <section className="py-16 px-6 bg-muted/20">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/40" />
              <Button size="lg" variant="secondary" className="relative z-10 h-16 w-16 rounded-full">
                <Play className="h-8 w-8" />
              </Button>
              <div className="absolute bottom-6 left-6 right-6 z-10 text-white">
                <h3 className="text-xl font-bold mb-2">Comment FashionDrop a multiplié son CA par 3</h3>
                <p className="text-white/80">Marie Dupont partage son expérience avec ShopOpti+</p>
              </div>
            </div>
          </div>
        </section>

        {/* More Testimonials Grid */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Ce que disent nos clients
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="hover:shadow-lg transition-all">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                        {testimonial.image}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{testimonial.name}</h4>
                        <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-0.5">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">"{testimonial.quote}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Case Studies */}
        <section className="py-16 px-6 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Études de cas</h2>
              <p className="text-muted-foreground">Analyses détaillées de réussites clients</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {caseStudies.map((study, index) => (
                <Card key={index} className="hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="p-6 space-y-4">
                    <Badge variant="outline">{study.category}</Badge>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {study.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{study.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-primary font-semibold">{study.result}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              {["Shopify Partner", "Google Partner", "Meta Partner", "TrustPilot 4.9★", "RGPD Compliant"].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-background to-accent/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Rejoignez nos <span className="text-primary">10,000+</span> clients satisfaits
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Commencez gratuitement et découvrez pourquoi les entrepreneurs choisissent ShopOpti+
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-gradient-primary text-lg px-8 py-6 h-auto"
              >
                Essai gratuit 14 jours
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/pricing")}
                className="text-lg px-8 py-6 h-auto"
              >
                Voir les tarifs
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default TestimonialsPage;
