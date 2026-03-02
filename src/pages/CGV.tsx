import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, CreditCard, RefreshCw, Shield, AlertTriangle, Scale, Mail, Clock, FileText, Users
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const CGV = () => {
  const lastUpdated = "1 mars 2025";

  const sections = [
    {
      id: "objet",
      title: "Objet",
      icon: FileText,
      content: [
        "Les présentes Conditions Générales de Vente (CGV) définissent les droits et obligations des parties dans le cadre de la souscription aux services proposés par ShopOpti, accessible à l'adresse shopopti.io.",
        "ShopOpti est une plateforme SaaS (Software as a Service) d'optimisation e-commerce proposée sous forme d'abonnement.",
        "Les présentes CGV s'appliquent à toute commande passée sur notre site, que l'acheteur soit un professionnel ou un consommateur.",
        "Toute souscription implique l'acceptation sans réserve des présentes CGV."
      ]
    },
    {
      id: "offres",
      title: "Description des offres",
      icon: ShoppingCart,
      content: [
        "ShopOpti propose les plans d'abonnement suivants :",
        "• Plan Gratuit : accès limité aux fonctionnalités de base (pas de frais)",
        "• Plan Standard — 29€ HT/mois : 1 000 produits, 3 intégrations, 100 imports/mois, support email",
        "• Plan Pro — 49€ HT/mois : 10 000 produits, intégrations illimitées, 1 000 imports/mois, IA avancée, support prioritaire",
        "• Plan Ultra Pro — 99€ HT/mois : produits illimités, tout illimité, white-label, API complète, support dédié 24/7",
        "Le détail des fonctionnalités incluses dans chaque plan est consultable sur la page Tarifs (shopopti.io/pricing).",
        "ShopOpti se réserve le droit de modifier ses offres et tarifs. Toute modification sera communiquée 30 jours avant son application."
      ]
    },
    {
      id: "souscription",
      title: "Souscription et accès au service",
      icon: Users,
      content: [
        "La souscription s'effectue exclusivement en ligne sur shopopti.io.",
        "Pour souscrire, l'utilisateur doit :",
        "• Créer un compte avec une adresse email valide",
        "• Choisir un plan d'abonnement",
        "• Fournir un moyen de paiement valide",
        "• Accepter les CGU, CGV et la Politique de Confidentialité",
        "L'accès au service est activé immédiatement après validation du paiement.",
        "Un email de confirmation récapitulant les détails de l'abonnement est envoyé à l'adresse du compte."
      ]
    },
    {
      id: "tarifs-paiement",
      title: "Tarifs et paiement",
      icon: CreditCard,
      content: [
        "Les prix sont indiqués en euros, hors taxes. La TVA applicable sera ajoutée au moment du paiement selon le pays de résidence de l'acheteur.",
        "Le paiement est effectué par carte bancaire via la plateforme sécurisée Stripe. ShopOpti n'a jamais accès à vos données bancaires complètes.",
        "L'abonnement est facturé mensuellement de manière récurrente à la date anniversaire de souscription.",
        "En cas d'échec de paiement, ShopOpti effectuera jusqu'à 3 tentatives de prélèvement. Au-delà, le compte sera automatiquement rétrogradé au plan gratuit.",
        "Les factures sont disponibles dans l'espace client et via le portail Stripe.",
        "Pour les clients professionnels de l'UE disposant d'un numéro de TVA intracommunautaire valide, l'autoliquidation de TVA s'applique."
      ]
    },
    {
      id: "droit-retractation",
      title: "Droit de rétractation",
      icon: RefreshCw,
      content: [
        "Conformément aux articles L.221-18 et suivants du Code de la consommation, le consommateur dispose d'un délai de 14 jours calendaires à compter de la souscription pour exercer son droit de rétractation, sans avoir à justifier de motifs ni à payer de pénalités.",
        "Pour exercer ce droit, envoyez votre demande à : billing@shopopti.io en précisant :",
        "• Votre nom et adresse email de compte",
        "• La date de souscription",
        "• Votre souhait de vous rétracter",
        "Le remboursement sera effectué sous 14 jours suivant la réception de la demande, par le même moyen de paiement que celui utilisé pour la souscription.",
        "Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne peut être exercé si le service a été pleinement exécuté avant la fin du délai de rétractation avec votre accord exprès et reconnaissance de la perte du droit de rétractation."
      ]
    },
    {
      id: "duree-resiliation",
      title: "Durée et résiliation",
      icon: Clock,
      content: [
        "L'abonnement est souscrit pour une durée indéterminée avec une période minimale d'un mois.",
        "L'utilisateur peut résilier son abonnement à tout moment :",
        "• Depuis le tableau de bord : Réglages > Abonnement > Annuler",
        "• Via le portail de gestion Stripe",
        "• Par email à billing@shopopti.io",
        "La résiliation prend effet à la fin de la période de facturation en cours. L'accès aux fonctionnalités payantes est maintenu jusqu'à cette date.",
        "Les données sont conservées 30 jours après la résiliation pour permettre une éventuelle réactivation. Passé ce délai, les données sont supprimées conformément à notre Politique de Confidentialité.",
        "ShopOpti se réserve le droit de résilier un abonnement sans préavis en cas de violation des CGU."
      ]
    },
    {
      id: "disponibilite",
      title: "Disponibilité et niveaux de service",
      icon: Shield,
      content: [
        "ShopOpti s'engage à un taux de disponibilité de 99,5% mensuel, hors maintenances programmées.",
        "Les maintenances programmées font l'objet d'un préavis de 48 heures minimum par email et notification in-app.",
        "En cas d'indisponibilité dépassant le SLA, les utilisateurs des plans payants pourront demander un avoir au prorata de la durée d'indisponibilité.",
        "ShopOpti ne saurait être tenu responsable des interruptions de service résultant de :",
        "• Cas de force majeure",
        "• Dysfonctionnements des réseaux ou hébergeurs tiers",
        "• Actions ou omissions de l'utilisateur"
      ]
    },
    {
      id: "responsabilite",
      title: "Responsabilité",
      icon: AlertTriangle,
      content: [
        "ShopOpti s'engage à fournir ses services avec diligence et conformément aux règles de l'art.",
        "ShopOpti est soumis à une obligation de moyens, non de résultat.",
        "La responsabilité de ShopOpti est limitée au montant total des sommes effectivement versées par l'utilisateur au cours des 12 mois précédant le fait générateur.",
        "ShopOpti décline toute responsabilité pour :",
        "• Les dommages indirects (perte de chiffre d'affaires, de bénéfices, de données, d'opportunités commerciales)",
        "• Le contenu des produits importés ou publiés par l'utilisateur",
        "• Les transactions entre l'utilisateur et ses clients finaux",
        "• L'utilisation non conforme du service par l'utilisateur",
        "L'utilisateur garantit ShopOpti contre tout recours de tiers lié à l'utilisation du service."
      ]
    },
    {
      id: "propriete-intellectuelle",
      title: "Propriété intellectuelle",
      icon: FileText,
      content: [
        "L'abonnement confère à l'utilisateur un droit d'utilisation personnel, non exclusif, non cessible et non transférable de la plateforme pendant la durée de l'abonnement.",
        "ShopOpti conserve l'intégralité des droits de propriété intellectuelle sur la plateforme, ses algorithmes, son code source et ses interfaces.",
        "L'utilisateur conserve la pleine propriété de ses données et contenus importés sur la plateforme.",
        "Toute reproduction, représentation ou utilisation non autorisée de la plateforme constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle."
      ]
    },
    {
      id: "donnees-personnelles",
      title: "Données personnelles",
      icon: Shield,
      content: [
        "Le traitement des données personnelles dans le cadre de la fourniture de nos services est décrit dans notre Politique de Confidentialité, consultable à l'adresse shopopti.io/privacy.",
        "ShopOpti agit en qualité de sous-traitant au sens du RGPD pour les données que l'utilisateur importe sur la plateforme.",
        "Un accord de sous-traitance (DPA) est disponible sur demande à dpo@shopopti.io."
      ]
    },
    {
      id: "litiges",
      title: "Droit applicable et litiges",
      icon: Scale,
      content: [
        "Les présentes CGV sont soumises au droit français.",
        "En cas de litige, les parties s'engagent à rechercher une solution amiable préalablement à toute action judiciaire.",
        "Conformément aux articles L.611-1 et R.612-1 du Code de la consommation, le consommateur peut recourir gratuitement au service de médiation MEDICYS :",
        "• En ligne : www.medicys.fr",
        "• Par courrier : MEDICYS — 73 boulevard de Clichy, 75009 Paris",
        "Conformément à l'article 14 du Règlement (UE) n°524/2013, la Commission européenne met à disposition une plateforme de règlement en ligne des litiges : https://ec.europa.eu/consumers/odr",
        "À défaut de résolution amiable, les tribunaux de Paris seront seuls compétents."
      ]
    },
    {
      id: "contact",
      title: "Contact",
      icon: Mail,
      content: [
        "Pour toute question relative aux présentes CGV :",
        "• Email commercial : contact@shopopti.io",
        "• Email facturation : billing@shopopti.io",
        "• Site web : https://shopopti.io",
        "Délai de réponse : 48 heures ouvrables maximum."
      ]
    }
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>Conditions Générales de Vente (CGV) | ShopOpti</title>
        <meta name="description" content="Conditions générales de vente de ShopOpti — Abonnements, tarifs, paiement, droit de rétractation et obligations." />
        <link rel="canonical" href="https://shopopti.io/cgv" />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Conditions Générales de Vente</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Les conditions commerciales applicables aux abonnements ShopOpti
            </p>
            <Badge variant="outline" className="text-sm">
              Dernière mise à jour : {lastUpdated}
            </Badge>
          </div>

          {/* Related Pages */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/terms" className="text-sm text-primary underline">CGU</Link>
            <Link to="/privacy" className="text-sm text-primary underline">Politique de Confidentialité</Link>
          </div>

          {/* Detailed Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <Card key={section.id} id={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                      Article {index + 1} — {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {section.content.map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-muted-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Table of Contents */}
          <Card>
            <CardHeader>
              <CardTitle>Table des matières</CardTitle>
              <CardDescription>Navigation rapide</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {sections.map((section, index) => (
                  <a key={section.id} href={`#${section.id}`} className="p-2 rounded hover:bg-muted/50 text-sm transition-colors">
                    Art. {index + 1} — {section.title}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};

export default CGV;
