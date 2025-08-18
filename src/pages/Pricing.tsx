import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Sparkles,
  Crown,
  Star,
  Zap,
  Check,
  TrendingUp,
  Shield,
  Rocket,
  Users,
  BarChart3,
  Bot,
  Settings,
  HeadphonesIcon,
  ArrowRight
} from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Standard",
      price: "Gratuit",
      description: "Parfait pour débuter en dropshipping",
      features: [
        "10 imports produits/jour",
        "100 produits dans le catalogue",
        "Support par email",
        "Intégrations de base",
        "Analytics basiques"
      ],
      limitations: [
        "Pas d'IA avancée",
        "Pas d'automatisation",
        "Support limité"
      ],
      color: "border-border",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Pro",
      price: "49€",
      description: "Pour les entrepreneurs sérieux",
      features: [
        "100 imports produits/jour",
        "Catalogue illimité",
        "IA Analytics avancée",
        "5 automatisations",
        "Support prioritaire",
        "API accès basique",
        "Rapports détaillés"
      ],
      limitations: [],
      color: "border-primary",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Ultra Pro",
      price: "149€",
      description: "La puissance maximale pour les experts",
      features: [
        "Imports illimités",
        "Catalogue illimité",
        "IA prédictive avancée",
        "Automatisations illimitées",
        "Support 24/7",
        "API complète",
        "Intégrations personnalisées",
        "Manager dédié",
        "Formation privée"
      ],
      limitations: [],
      color: "border-gradient-to-r from-primary to-accent",
      buttonVariant: "default" as const,
      popular: false
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
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Crown className="w-4 h-4 mr-2" />
            Plans & Tarifs
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Choisissez votre{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              plan parfait
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Choisissez le plan parfait pour vos besoins de dropshipping et e-commerce. 
            Commencez gratuitement et évoluez selon vos besoins.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              Mise à niveau instantanée
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Star className="h-3 w-3" />
              Support inclus
            </Badge>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.color} ${plan.popular ? 'scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Plus populaire
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary mb-2">
                    {plan.price}
                    {plan.price !== "Gratuit" && <span className="text-lg text-muted-foreground font-normal">/mois</span>}
                  </div>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant={plan.buttonVariant} 
                    className="w-full"
                    size="lg"
                  >
                    {plan.price === "Gratuit" ? "Commencer Gratuitement" : "Choisir ce Plan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <Card>
        <CardHeader>
          <CardTitle className="text-center">Comparaison détaillée des fonctionnalités</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Fonctionnalité</th>
                  <th className="text-center p-4">Standard</th>
                  <th className="text-center p-4">Pro</th>
                  <th className="text-center p-4">Ultra Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Import produits/jour</td>
                  <td className="text-center p-4">10</td>
                  <td className="text-center p-4">100</td>
                  <td className="text-center p-4">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Catalogue produits</td>
                  <td className="text-center p-4">100</td>
                  <td className="text-center p-4">Illimité</td>
                  <td className="text-center p-4">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">IA Analytics</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">✅</td>
                  <td className="text-center p-4">✅ Avancé</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Automatisation</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">5 tâches</td>
                  <td className="text-center p-4">Illimité</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Support</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4">Prioritaire</td>
                  <td className="text-center p-4">24/7</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">API Access</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">Basique</td>
                  <td className="text-center p-4">Complète</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="text-center">Questions Fréquentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Puis-je changer de plan à tout moment ?</h3>
            <p className="text-muted-foreground">
              Oui, vous pouvez mettre à niveau votre plan à tout moment. La facturation est ajustée au prorata.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Y a-t-il des frais cachés ?</h3>
            <p className="text-muted-foreground">
              Non, tous nos tarifs sont transparents. Pas de frais d'installation ou de configuration.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Comment fonctionne la période d'essai ?</h3>
            <p className="text-muted-foreground">
              Commencez avec le plan Standard gratuit, puis passez à Pro ou Ultra Pro quand vous êtes prêt.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Que se passe-t-il si je dépasse mes quotas ?</h3>
            <p className="text-muted-foreground">
              Vous recevrez une notification et pourrez soit attendre la réinitialisation, soit passer à un plan supérieur.
            </p>
          </div>
        </CardContent>
      </Card>
        </div>
      </section>
    </div>
  );
};

export default Pricing;