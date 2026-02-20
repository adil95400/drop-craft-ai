import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Target, 
  Award, 
  Rocket,
  Brain,
  Shield,
  Globe,
  Zap,
  Heart,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Linkedin,
  Twitter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/layouts/PublicLayout";
import { OrganizationSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Brain,
      title: "Innovation IA",
      description: "Nous repoussons les limites de l'intelligence artificielle pour révolutionner le dropshipping et l'e-commerce."
    },
    {
      icon: Users,
      title: "Client First",
      description: "Chaque décision est prise en pensant à nos clients. Leur succès est notre priorité absolue."
    },
    {
      icon: Shield,
      title: "Sécurité Maximale",
      description: "Protection des données et conformité RGPD garanties avec les plus hauts standards de sécurité."
    },
    {
      icon: Globe,
      title: "Vision Globale",
      description: "Nous construisons l'avenir du commerce international avec des solutions adaptées à chaque marché."
    }
  ];

  const stats = [
    { icon: Users, value: "Beta", label: "Programme Pilote" },
    { icon: Globe, value: "24+", label: "Plateformes Intégrées" },
    { icon: TrendingUp, value: "IA", label: "Propulsé par l'IA" },
    { icon: Award, value: "2025", label: "Lancement Officiel" }
  ];

  // Team section removed - will be added when real team is ready to be public

  return (
    <PublicLayout>
      <SEO
        title="À Propos de ShopOpti+ | Plateforme E-commerce IA Nouvelle Génération"
        description="Découvrez ShopOpti+, la plateforme d'automatisation e-commerce propulsée par l'IA. Mission : démocratiser le dropshipping intelligent pour les entrepreneurs ambitieux."
        path="/about"
        keywords="ShopOpti, plateforme dropshipping IA, automatisation e-commerce, startup française, SaaS e-commerce"
      />
      <OrganizationSchema />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "À Propos", url: "https://shopopti.io/about" },
      ]} />

      <div className="bg-background">
        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
          
          <div className="relative max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Heart className="w-4 h-4 mr-2" />
              Notre Histoire
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Révolutionner l'<span className="text-primary">e-commerce</span> avec l'IA
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Depuis 2022, nous développons les outils d'intelligence artificielle les plus avancés 
              pour démocratiser le succès en dropshipping et e-commerce.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-3">
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-6 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="secondary" className="mb-4">
                  <Target className="w-4 h-4 mr-2" />
                  Notre Mission
                </Badge>
                <h2 className="text-4xl font-bold mb-6">
                  Démocratiser le <span className="text-primary">succès</span> en e-commerce
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Nous croyons que chaque entrepreneur mérite d'avoir accès aux mêmes outils d'intelligence 
                  artificielle que les grandes entreprises. C'est pourquoi nous développons Shopopti Pro : 
                  une plateforme qui met la puissance de l'IA au service de tous.
                </p>
                <Button 
                  size="lg"
                  onClick={() => navigate("/contact")}
                  className="bg-gradient-primary"
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Rejoindre l'Aventure
                </Button>
              </div>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center">
                  <div className="text-center">
                    <Rocket className="w-24 h-24 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Innovation Continue</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Nous investissons 40% de nos ressources en R&D pour rester 
                      à la pointe de l'innovation IA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Nos <span className="text-primary">Valeurs</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Les principes qui guident chacune de nos décisions
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="border-border bg-card shadow-card hover:shadow-intense transition-all duration-300 text-center">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                      <value.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why ShopOpti Section - Replacing fake team */}
        <section className="py-16 px-6 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <Zap className="w-4 h-4 mr-2" />
                Pourquoi ShopOpti+
              </Badge>
              <h2 className="text-4xl font-bold mb-4">
                Conçu pour les <span className="text-primary">entrepreneurs ambitieux</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Une plateforme pensée pour ceux qui veulent automatiser et scaler
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Brain, title: "IA Intégrée", desc: "Génération automatique de fiches produit, descriptions SEO et images optimisées" },
                { icon: Zap, title: "Automatisation Totale", desc: "Importation, synchronisation des stocks et passage de commandes en 1 clic" },
                { icon: Shield, title: "Fiabilité Enterprise", desc: "Infrastructure cloud robuste, données sécurisées, support prioritaire" }
              ].map((feature, index) => (
                <Card key={index} className="border-border bg-card text-center hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Notre <span className="text-primary">Histoire</span>
              </h2>
            </div>
            
            <div className="space-y-8">
              {[
                { year: "2024", title: "Conception", desc: "Naissance de l'idée : automatiser le dropshipping avec l'IA pour les entrepreneurs" },
                { year: "Q1 2025", title: "Développement", desc: "Construction de la plateforme : intégrations multi-sources, IA générative, synchronisation temps réel" },
                { year: "Q2 2025", title: "Beta Privée", desc: "Programme pilote avec utilisateurs sélectionnés, itérations produit intensives" },
                { year: "2025", title: "Lancement", desc: "Ouverture officielle avec support Shopify, 24+ plateformes et IA intégrée" }
              ].map((milestone, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                    {milestone.year}
                  </div>
                  <div className="pt-4">
                    <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-background to-accent/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Prêt à faire partie de l'<span className="text-primary">aventure</span> ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez notre programme Beta et soyez parmi les premiers à transformer 
              votre business avec l'IA. L'avenir de l'e-commerce commence maintenant.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-gradient-primary text-lg px-8 py-6 h-auto shadow-intense hover:shadow-floating"
              >
                <Zap className="mr-2 h-5 w-5" />
                Commencer Gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/contact")}
                className="text-lg px-8 py-6 h-auto"
              >
                Nous Contacter
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default About;