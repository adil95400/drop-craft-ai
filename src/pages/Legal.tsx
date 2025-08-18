import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Sparkles,
  Shield,
  FileText,
  Eye,
  Lock,
  Scale,
  Calendar,
  Mail
} from "lucide-react";

const Legal = () => {
  const lastUpdated = "15 janvier 2024";

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
            <Scale className="w-4 h-4 mr-2" />
            Informations Légales
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Mentions{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              légales
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Toutes les informations légales concernant ShopOpti et l'utilisation de notre plateforme.
          </p>

          <Badge variant="outline" className="mb-12">
            <Calendar className="w-4 h-4 mr-2" />
            Dernière mise à jour : {lastUpdated}
          </Badge>
        </div>
      </section>

      {/* Legal Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-8">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Informations sur l'entreprise</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Éditeur du site</h4>
                  <p className="text-muted-foreground">
                    ShopOpti SAS<br />
                    Capital social : 100,000 €<br />
                    SIRET : 123 456 789 00012<br />
                    RCS Paris : 123 456 789<br />
                    TVA Intracommunautaire : FR12345678901
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Siège social</h4>
                  <p className="text-muted-foreground">
                    42 Avenue des Champs-Élysées<br />
                    75008 Paris, France
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Contact</h4>
                  <p className="text-muted-foreground">
                    Email : legal@shopopti.com<br />
                    Téléphone : +33 1 23 45 67 89
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Directeur de la publication</h4>
                  <p className="text-muted-foreground">
                    Alexandre Dubois, Président Directeur Général
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Hosting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Hébergement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Le site www.shopopti.com est hébergé par :<br />
                  Amazon Web Services (AWS)<br />
                  410 Terry Avenue North<br />
                  Seattle, WA 98109, États-Unis<br />
                  Téléphone : +1 206-266-1000
                </p>
              </CardContent>
            </Card>

            {/* Terms of Service */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Conditions générales d'utilisation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">1. Objet</h4>
                  <p className="text-muted-foreground">
                    Les présentes conditions générales d'utilisation (CGU) régissent l'utilisation 
                    de la plateforme ShopOpti, service en ligne d'aide à la création et gestion 
                    de boutiques en ligne et de dropshipping.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">2. Acceptation des conditions</h4>
                  <p className="text-muted-foreground">
                    L'utilisation de la plateforme ShopOpti implique l'acceptation pleine et entière 
                    des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas 
                    utiliser nos services.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">3. Description des services</h4>
                  <p className="text-muted-foreground">
                    ShopOpti propose une plateforme SaaS permettant aux utilisateurs de :
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>Rechercher et analyser des produits pour le dropshipping</li>
                    <li>Intégrer des fournisseurs et plateformes e-commerce</li>
                    <li>Utiliser des outils d'intelligence artificielle pour l'optimisation</li>
                    <li>Gérer leurs commandes et stocks</li>
                    <li>Accéder à des formations et guides</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">4. Inscription et compte utilisateur</h4>
                  <p className="text-muted-foreground">
                    L'inscription sur ShopOpti nécessite la création d'un compte personnel. 
                    L'utilisateur s'engage à fournir des informations exactes et à maintenir 
                    la confidentialité de ses identifiants.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">5. Responsabilités de l'utilisateur</h4>
                  <p className="text-muted-foreground">
                    L'utilisateur s'engage à utiliser la plateforme conformément aux lois en vigueur 
                    et à ne pas porter atteinte aux droits de tiers. Il est seul responsable de 
                    l'utilisation qu'il fait des données et outils fournis par ShopOpti.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">6. Limitation de responsabilité</h4>
                  <p className="text-muted-foreground">
                    ShopOpti fournit ses services "en l'état" et ne peut garantir l'exactitude 
                    absolue des données fournies. Notre responsabilité est limitée au montant 
                    des frais payés par l'utilisateur.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">7. Propriété intellectuelle</h4>
                  <p className="text-muted-foreground">
                    Tous les éléments de la plateforme ShopOpti (logiciels, textes, images, designs) 
                    sont protégés par le droit d'auteur et appartiennent à ShopOpti SAS ou à ses 
                    partenaires licenciés.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">8. Résiliation</h4>
                  <p className="text-muted-foreground">
                    L'utilisateur peut résilier son compte à tout moment. ShopOpti se réserve 
                    le droit de suspendre ou résilier un compte en cas de violation des présentes 
                    CGU.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Politique de confidentialité</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Collecte des données</h4>
                  <p className="text-muted-foreground">
                    Nous collectons les informations que vous nous fournissez directement 
                    (nom, email, informations de facturation) ainsi que des données d'usage 
                    automatiques (logs, cookies, analytics).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Utilisation des données</h4>
                  <p className="text-muted-foreground">
                    Vos données sont utilisées pour fournir nos services, améliorer la plateforme, 
                    vous contacter concernant votre compte et respecter nos obligations légales.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Partage des données</h4>
                  <p className="text-muted-foreground">
                    Nous ne vendons pas vos données personnelles. Nous pouvons les partager 
                    avec nos partenaires techniques nécessaires au fonctionnement du service 
                    (hébergement, paiement, analytics).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Vos droits</h4>
                  <p className="text-muted-foreground">
                    Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, 
                    d'effacement, de portabilité et d'opposition concernant vos données personnelles.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Sécurité</h4>
                  <p className="text-muted-foreground">
                    Nous mettons en œuvre des mesures techniques et organisationnelles appropriées 
                    pour protéger vos données contre les accès non autorisés, la perte ou la divulgation.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* GDPR */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Conformité RGPD</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  ShopOpti est conforme au Règlement Général sur la Protection des Données (RGPD). 
                  Notre délégué à la protection des données peut être contacté à l'adresse : 
                  dpo@shopopti.com
                </p>
                
                <div>
                  <h4 className="font-semibold mb-2">Base légale du traitement</h4>
                  <p className="text-muted-foreground">
                    Le traitement de vos données personnelles est basé sur l'exécution du contrat 
                    de service, votre consentement explicite et nos intérêts légitimes.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Durée de conservation</h4>
                  <p className="text-muted-foreground">
                    Nous conservons vos données personnelles pendant la durée nécessaire aux 
                    finalités pour lesquelles elles ont été collectées, et conformément aux 
                    obligations légales.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Politique des cookies</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
                  Ces cookies nous permettent de :
                </p>
                
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Maintenir votre session de connexion</li>
                  <li>Mémoriser vos préférences</li>
                  <li>Analyser l'usage du site pour l'améliorer</li>
                  <li>Personnaliser le contenu et les publicités</li>
                </ul>

                <p className="text-muted-foreground">
                  Vous pouvez gérer vos préférences de cookies via les paramètres de votre 
                  navigateur ou notre centre de préférences.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Contact juridique</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pour toute question concernant ces mentions légales ou nos pratiques de 
                  confidentialité, vous pouvez nous contacter :
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-muted-foreground">
                    <strong>Email :</strong> legal@shopopti.com
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Courrier :</strong> ShopOpti SAS - Service Juridique<br />
                    42 Avenue des Champs-Élysées<br />
                    75008 Paris, France
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Legal;