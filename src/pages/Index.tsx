import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from 'react-helmet-async';
import { OnboardingWizard } from '@/components/commercial/OnboardingWizard';
import { QuotaDisplay } from '@/components/commercial/QuotaDisplay';
import { SmartPlanSelector } from '@/components/plan/SmartPlanSelector';
import { SidebarLayout } from '@/layouts/SidebarLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Crown, Zap, Users, Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Composant Hero temporaire
const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="text-center space-y-4 sm:space-y-6 py-8 sm:py-16 px-4">
      <div className="space-y-3 sm:space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Shopopti+
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Plateforme de dropshipping intelligent. Automatisez vos imports produits, 
          gérez vos fournisseurs et optimisez votre e-commerce avec l'IA.
        </p>
      </div>
      
      {!user && (
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button size="lg" onClick={() => navigate('/auth')} className="w-full sm:w-auto">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Commencer gratuitement
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/pricing')} className="w-full sm:w-auto">
            Voir les tarifs
          </Button>
        </div>
      )}
    </div>
  );
};

// Composant Features temporaire
const Features = () => {
  const features = [
    {
      icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Import automatique",
      description: "Importez des milliers de produits en quelques clics"
    },
    {
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Gestion fournisseurs",
      description: "Connectez et gérez tous vos fournisseurs en un lieu"
    },
    {
      icon: <Star className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "IA d'optimisation",
      description: "Optimisez vos prix et descriptions avec l'IA"
    }
  ];

  return (
    <section className="py-8 sm:py-12 md:py-16 px-4">
      <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold">Fonctionnalités puissantes</h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          Tous les outils dont vous avez besoin pour réussir votre e-commerce
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                  {feature.icon}
                </div>
                <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

// Composant Testimonials temporaire
const Testimonials = () => {
  return (
    <section className="py-8 sm:py-12 md:py-16 px-4">
      <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold">Ce que disent nos clients</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Rejoignez des milliers d'entrepreneurs qui nous font confiance
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              "Shopopti+ a révolutionné ma façon de gérer mes imports. J'économise 10h par semaine !"
            </p>
            <div className="text-sm sm:text-base font-medium">Marie L. - E-commerçante</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              "L'IA d'optimisation a augmenté mes conversions de 30%. Un outil indispensable."
            </p>
            <div className="text-sm sm:text-base font-medium">Pierre M. - Dropshipper</div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

// Composant CTA temporaire
const CTA = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-8 sm:py-12 md:py-16 px-4">
      <Card className="bg-gradient-to-r from-primary to-secondary text-white">
        <CardContent className="text-center py-8 sm:py-12 space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">Prêt à démarrer ?</h2>
          <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-2xl mx-auto px-4">
            Rejoignez des milliers d'entrepreneurs qui utilisent Shopopti+ 
            pour développer leur e-commerce
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/auth')}
            className="w-full sm:w-auto"
          >
            Commencer maintenant
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};

const Index = () => {
  const { user, loading } = useAuth();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Import Pro - Plateforme d'import et de sourcing e-commerce</title>
        <meta name="description" content="Automatisez vos imports produits, trouvez les meilleurs fournisseurs et optimisez votre e-commerce avec l'IA. Solution complète pour les entrepreneurs." />
      </Helmet>

      {user ? (
        <SidebarLayout>
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
              {/* Colonne principale avec onboarding */}
              <div className="xl:col-span-3 space-y-4 sm:space-y-6">
                <OnboardingWizard />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Hero />
                  </div>
                  <div>
                    <Features />
                  </div>
                </div>
                <Testimonials />
              </div>
              
              {/* Colonne sidebar avec quotas */}
              <div className="xl:col-span-1 space-y-4 sm:space-y-6">
                <QuotaDisplay />
              </div>
            </div>
          </div>
        </SidebarLayout>
      ) : (
        <main className="min-h-screen">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <Hero />
            <Features />
            <Testimonials />
            <CTA />
          </div>
        </main>
      )}
    </>
  );
};

export default Index;
