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
    <div className="text-center space-y-6 py-16">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Import Pro
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Plateforme d'import et de sourcing e-commerce. Automatisez vos imports produits, 
          trouvez les meilleurs fournisseurs et optimisez votre e-commerce avec l'IA.
        </p>
      </div>
      
      {!user && (
        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={() => navigate('/auth')}>
            <Crown className="w-5 h-5 mr-2" />
            Commencer gratuitement
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/pricing')}>
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
      icon: <Zap className="w-6 h-6" />,
      title: "Import automatique",
      description: "Importez des milliers de produits en quelques clics"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Gestion fournisseurs",
      description: "Connectez et gérez tous vos fournisseurs en un lieu"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "IA d'optimisation",
      description: "Optimisez vos prix et descriptions avec l'IA"
    }
  ];

  return (
    <section className="py-16">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl font-bold">Fonctionnalités puissantes</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Tous les outils dont vous avez besoin pour réussir votre e-commerce
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
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
    <section className="py-16">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl font-bold">Ce que disent nos clients</h2>
        <p className="text-muted-foreground">
          Rejoignez des milliers d'entrepreneurs qui nous font confiance
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              "Import Pro a révolutionné ma façon de gérer mes imports. J'économise 10h par semaine !"
            </p>
            <div className="font-medium">Marie L. - E-commerçante</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              "L'IA d'optimisation a augmenté mes conversions de 30%. Un outil indispensable."
            </p>
            <div className="font-medium">Pierre M. - Dropshipper</div>
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
    <section className="py-16">
      <Card className="bg-gradient-to-r from-primary to-secondary text-white">
        <CardContent className="text-center py-12 space-y-6">
          <h2 className="text-3xl font-bold">Prêt à démarrer ?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Rejoignez des milliers d'entrepreneurs qui utilisent Import Pro 
            pour développer leur e-commerce
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/auth')}
          >
            Commencer maintenant
            <ArrowRight className="w-5 h-5 ml-2" />
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
          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Colonne principale avec onboarding */}
              <div className="xl:col-span-3 space-y-6">
                <OnboardingWizard />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="xl:col-span-1 space-y-6">
                <QuotaDisplay />
              </div>
            </div>
          </div>
        </SidebarLayout>
      ) : (
        <main>
          <Hero />
          <Features />
          <Testimonials />
          <CTA />
        </main>
      )}
    </>
  );
};

export default Index;
