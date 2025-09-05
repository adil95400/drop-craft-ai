import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Quote, 
  TrendingUp, 
  Shield, 
  Zap,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  Play
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";

const Testimonials = () => {
  const navigate = useNavigate();

  const testimonials = [
    {
      id: 1,
      name: "Marie Dubois",
      role: "E-commerçante",
      company: "Fashion Store Paris",
      rating: 5,
      comment: "Shopopti Pro a révolutionné mon business. +300% de CA en 6 mois ! L'IA trouve automatiquement les produits tendances et l'importation est instantanée.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b332c2cc?w=64&h=64&fit=crop&crop=face",
      results: {
        revenue: "+300%",
        products: "2.5K+",
        time_saved: "15h/semaine"
      },
      featured: true
    },
    {
      id: 2,
      name: "Thomas Martin",
      role: "Dropshipper Pro",
      company: "TechDrop Solutions",
      rating: 5,
      comment: "L'IA de Shopopti trouve les produits gagnants automatiquement. Mon ROI a explosé grâce aux analyses prédictives et à l'automatisation complète.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      results: {
        revenue: "+450%",
        products: "1.8K+", 
        time_saved: "20h/semaine"
      },
      featured: true
    },
    {
      id: 3,
      name: "Sophie Laurent",
      role: "Marketplace Seller",
      company: "Global Trends Co",
      rating: 5,
      comment: "Interface intuitive et résultats exceptionnels. Le tracking en temps réel et les alertes intelligentes m'ont permis de scaler rapidement.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
      results: {
        revenue: "+275%",
        products: "3.2K+",
        time_saved: "12h/semaine"
      },
      featured: false
    }
  ];

  const stats = [
    { 
      icon: Users, 
      value: "10,000+", 
      label: "Utilisateurs Satisfaits"
    },
    { 
      icon: TrendingUp, 
      value: "€15M+", 
      label: "CA Généré"
    },
    { 
      icon: Award, 
      value: "4.9/5", 
      label: "Note Moyenne"
    },
    { 
      icon: CheckCircle, 
      value: "98%", 
      label: "Satisfaction"
    }
  ];

  return (
    <>
      <SEO
        title="Témoignages Clients | Shopopti Pro - Success Stories E-commerce"
        description="Découvrez comment +10 000 entrepreneurs utilisent Shopopti Pro pour automatiser leur dropshipping et multiplier leur CA. Témoignages authentiques et résultats prouvés."
        path="/testimonials"
        keywords="témoignages Shopopti, avis clients dropshipping, success stories e-commerce"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
          
          <div className="relative max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Award className="w-4 h-4 mr-2" />
              +10 000 Entrepreneurs Satisfaits
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Ils ont <span className="text-primary">révolutionné</span> leur e-commerce
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Découvrez comment nos clients utilisent Shopopti Pro pour automatiser leur dropshipping 
              et multiplier leur chiffre d'affaires par 3, 4 ou même 5.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
              {stats.map((stat, index) => (
                <Card key={index} className="border-border bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-2">
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">{stat.value}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium text-center">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Testimonials */}
        <section className="py-16 px-6 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Success Stories <span className="text-primary">Exceptionnelles</span>
            </h2>

            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {testimonials.filter(t => t.featured).map((testimonial) => (
                <Card key={testimonial.id} className="border-border bg-card shadow-card hover:shadow-intense transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                        />
                        <div>
                          <div className="font-bold text-lg">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                          <div className="text-xs text-primary font-medium">{testimonial.company}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {testimonial.rating}.0
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {Object.entries(testimonial.results).map(([key, value]) => (
                        <div key={key} className="text-center p-3 bg-muted/40 rounded-lg">
                          <div className="font-bold text-lg text-primary">{value}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {key.replace('_', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <Quote className="w-8 h-8 text-primary/40 mb-3" />
                    <p className="text-muted-foreground italic leading-relaxed">
                      "{testimonial.comment}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-background to-accent/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Rejoignez nos <span className="text-primary">10 000+</span> clients satisfaits
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Commencez votre success story avec Shopopti Pro. Essai gratuit de 14 jours, 
              aucun engagement, résultats garantis.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/")}
                className="bg-gradient-primary text-lg px-8 py-6 h-auto shadow-intense hover:shadow-floating"
              >
                <Zap className="mr-2 h-5 w-5" />
                Commencer Gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Testimonials;