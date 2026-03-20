import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, Scale, CreditCard, Shield, AlertTriangle, Users, Ban, RefreshCw, Mail, Eye
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  const lastUpdated = "1 mars 2025";
  const effectiveDate = "1 mars 2025";
  const companyName = "ShopOpti";
  const companyEmail = "legal@shopopti.io";
  const companySite = "shopopti.io";

  const sections = [
    {
      id: "acceptance",
      title: "Acceptation des conditions",
      icon: FileText,
      content: [
        `En accédant à la plateforme ${companyName} (${companySite}) et en utilisant nos services, vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation (CGU).`,
        "Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser nos services.",
        "Ces conditions s'appliquent à tous les utilisateurs, visiteurs et autres personnes qui accèdent ou utilisent nos services.",
        "Vous devez avoir au moins 18 ans ou l'âge de la majorité légale dans votre juridiction pour utiliser nos services.",
        "Si vous utilisez nos services au nom d'une entreprise, vous déclarez et garantissez avoir l'autorité nécessaire pour lier cette entité aux présentes conditions."
      ]
    },
    {
      id: "service-description",
      title: "Description des services",
      icon: Users,
      content: [
        `${companyName} est une plateforme SaaS d'optimisation e-commerce offrant des outils d'importation, de gestion et d'optimisation de produits pour les boutiques en ligne.`,
        "Les services incluent notamment :",
        "• Import automatisé de produits depuis diverses sources (AliExpress, CJ Dropshipping, CSV, URL)",
        "• Optimisation IA des titres, descriptions et métadonnées produits",
        "• Intégrations avec les plateformes e-commerce (Shopify, WooCommerce, etc.)",
        "• Outils d'analyse, de reporting et de suivi des performances",
        "• Gestion multi-canaux et synchronisation des stocks",
        "• Support client et assistance technique selon le plan souscrit",
        "Nous nous réservons le droit de modifier, suspendre ou interrompre tout ou partie de nos services à tout moment avec un préavis raisonnable."
      ]
    },
    {
      id: "user-accounts",
      title: "Comptes utilisateurs",
      icon: Users,
      content: [
        "Vous êtes responsable du maintien de la confidentialité de vos identifiants de connexion.",
        "Vous acceptez de fournir des informations exactes, à jour et complètes lors de la création de votre compte.",
        "Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte via contact@shopopti.io.",
        "Un seul compte par personne physique est autorisé sauf autorisation écrite préalable.",
        "Nous nous réservons le droit de suspendre ou résilier tout compte en cas de violation des présentes conditions."
      ]
    },
    {
      id: "acceptable-use",
      title: "Utilisation acceptable",
      icon: Shield,
      content: [
        "Vous vous engagez à utiliser nos services uniquement à des fins légales et conformément aux présentes conditions.",
        "Il est strictement interdit de :",
        "• Violer les lois et réglementations applicables, y compris les règles douanières et fiscales",
        "• Importer ou distribuer du contenu contrefait, illégal, frauduleux ou trompeur",
        "• Tenter d'accéder de manière non autorisée à nos systèmes ou à ceux de tiers",
        "• Interférer avec le fonctionnement normal de la plateforme (attaques DDoS, scraping abusif, etc.)",
        "• Utiliser nos services pour du spam, du phishing ou des communications non sollicitées",
        "• Revendre ou sous-licencier l'accès à nos services sans autorisation écrite",
        "• Copier, modifier, décompiler ou faire de l'ingénierie inverse de notre technologie"
      ]
    },
    {
      id: "payment-billing",
      title: "Paiement et facturation",
      icon: CreditCard,
      content: [
        "Les frais de nos services sont facturés selon le plan tarifaire choisi (Standard à 29€/mois, Pro à 49€/mois, Ultra Pro à 99€/mois).",
        "Les paiements sont traités de manière sécurisée par Stripe. Nous n'avons pas accès à vos données bancaires complètes.",
        "Vous autorisez le prélèvement automatique récurrent sur votre moyen de paiement enregistré.",
        "En cas d'échec de paiement après 3 tentatives, votre compte sera automatiquement rétrogradé au plan gratuit.",
        "Tous les prix s'entendent hors taxes. La TVA applicable sera ajoutée selon votre pays de résidence.",
        "Les prix peuvent être modifiés avec un préavis minimum de 30 jours par email.",
        "Pour toute question de facturation : billing@shopopti.io"
      ]
    },
    {
      id: "cancellation-refunds",
      title: "Annulation et remboursements",
      icon: RefreshCw,
      content: [
        "Vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord ou via le portail Stripe.",
        "L'annulation prend effet à la fin de votre période de facturation en cours. Vous conservez l'accès jusqu'à cette date.",
        "Politique de remboursement :",
        "• Nouveau compte (moins de 14 jours) : remboursement intégral sur demande (droit de rétractation)",
        "• Dysfonctionnement avéré du service : remboursement au prorata",
        "• Annulation volontaire après 14 jours : pas de remboursement pour la période en cours",
        "• Violation des CGU : aucun remboursement",
        "Les demandes de remboursement doivent être adressées à billing@shopopti.io sous 14 jours."
      ]
    },
    {
      id: "intellectual-property",
      title: "Propriété intellectuelle",
      icon: Eye,
      content: [
        `La plateforme ${companyName}, son code source, son design, ses algorithmes et tout le contenu associé sont protégés par les droits de propriété intellectuelle français et internationaux.`,
        "Vous conservez l'intégralité des droits de propriété sur vos données et contenus importés sur la plateforme.",
        "En utilisant nos services, vous nous accordez une licence limitée, non exclusive et révocable pour traiter vos données aux seules fins de fourniture du service.",
        "Cette licence prend fin automatiquement à la suppression de votre compte.",
        "Toute reproduction, distribution ou utilisation non autorisée de notre propriété intellectuelle est strictement interdite et passible de poursuites."
      ]
    },
    {
      id: "data-privacy",
      title: "Données et confidentialité",
      icon: Shield,
      content: [
        "Le traitement de vos données personnelles est régi par notre Politique de Confidentialité, accessible à l'adresse /privacy.",
        "Nous agissons en qualité de sous-traitant au sens du RGPD pour les données que vous importez via notre plateforme.",
        "Vous restez le responsable du traitement pour les données de vos propres clients.",
        "Vous pouvez exporter l'intégralité de vos données à tout moment depuis les paramètres de votre compte.",
        "En cas de violation de données vous concernant, nous vous informerons dans les 72 heures conformément au RGPD."
      ]
    },
    {
      id: "limitation-liability",
      title: "Limitation de responsabilité",
      icon: AlertTriangle,
      content: [
        "Nos services sont fournis « en l'état » et « selon disponibilité », sans garantie d'aucune sorte, expresse ou implicite.",
        "Nous nous engageons à un taux de disponibilité de 99,5% mensuel, hors maintenances programmées.",
        "Notre responsabilité totale est limitée au montant des sommes effectivement versées au cours des 12 derniers mois.",
        "Nous ne sommes en aucun cas responsables des dommages indirects, accessoires ou consécutifs, incluant la perte de bénéfices ou de données.",
        `${companyName} ne saurait être tenu responsable du contenu des produits que vous importez ou des transactions avec vos clients finaux.`,
        "Ces limitations s'appliquent dans toute la mesure permise par le droit français."
      ]
    },
    {
      id: "termination",
      title: "Résiliation",
      icon: Ban,
      content: [
        "Nous pouvons résilier ou suspendre votre compte sans préavis en cas de violation grave des présentes conditions.",
        "Vous pouvez supprimer votre compte à tout moment depuis les paramètres (Réglages > Sécurité > Supprimer le compte).",
        "En cas de résiliation :",
        "• Votre accès aux services cessera immédiatement",
        "• Vos données seront conservées 30 jours puis supprimées définitivement",
        "• Vous pouvez demander l'export de vos données avant la suppression",
        "• Les obligations de paiement pour la période en cours restent dues",
        "• Les clauses de limitation de responsabilité et de propriété intellectuelle survivent à la résiliation"
      ]
    },
    {
      id: "changes-terms",
      title: "Modifications des conditions",
      icon: RefreshCw,
      content: [
        "Nous nous réservons le droit de modifier les présentes conditions à tout moment.",
        "Les modifications substantielles vous seront notifiées par email au moins 30 jours avant leur entrée en vigueur.",
        "Les modifications mineures (clarifications, corrections typographiques) entrent en vigueur immédiatement.",
        "L'utilisation continue de nos services après la période de notification constitue votre acceptation des nouvelles conditions.",
        "Si vous n'acceptez pas les modifications, vous pouvez résilier votre compte avant leur entrée en vigueur.",
        "L'historique des versions de ces conditions est conservé et disponible sur demande."
      ]
    },
    {
      id: "governing-law",
      title: "Droit applicable et juridiction",
      icon: Scale,
      content: [
        "Les présentes conditions sont régies par le droit français.",
        "En cas de litige, les parties s'engagent à rechercher une solution amiable pendant une durée de 60 jours.",
        "À défaut de résolution amiable, tout litige sera soumis à la juridiction exclusive des tribunaux compétents de Paris, France.",
        "Si une clause des présentes conditions est déclarée invalide ou inapplicable, les autres clauses restent pleinement en vigueur.",
        "Conformément à l'article L.612-1 du Code de la consommation, vous pouvez recourir gratuitement au service de médiation MEDICYS (www.medicys.fr)."
      ]
    },
    {
      id: "contact",
      title: "Contact",
      icon: Mail,
      content: [
        "Pour toute question concernant les présentes conditions :",
        `• Email : ${companyEmail}`,
        `• Support : contact@shopopti.io`,
        `• Site web : https://${companySite}`,
        "Nous nous engageons à répondre à toute demande dans un délai de 48 heures ouvrables.",
        "Pour les demandes urgentes relatives à la sécurité : security@shopopti.io"
      ]
    }
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>Conditions Générales d'Utilisation (CGU) | ShopOpti</title>
        <meta name="description" content="Conditions générales d'utilisation de ShopOpti — Règles, obligations et droits des utilisateurs de la plateforme d'optimisation e-commerce." />
        <link rel="canonical" href="https://shopopti.io/terms" />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Scale className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Conditions Générales d'Utilisation</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Les conditions qui régissent l'utilisation de la plateforme ShopOpti
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Badge variant="outline" className="text-sm">
                Dernière mise à jour : {lastUpdated}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Entrée en vigueur : {effectiveDate}
              </Badge>
            </div>
          </div>

          {/* Important Notice */}
          <Card className="border-info/20 bg-info/5 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">Information importante</h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Les présentes CGU constituent un contrat juridiquement contraignant entre vous et ShopOpti. 
                    Veuillez les lire attentivement avant d'utiliser nos services. 
                    Voir aussi nos <Link to="/cgv" className="underline font-medium">Conditions Générales de Vente</Link> et 
                    notre <Link to="/privacy" className="underline font-medium">Politique de Confidentialité</Link>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu rapide</CardTitle>
              <CardDescription>Les points essentiels à retenir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Users className="h-6 w-6 text-info mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Âge minimum</h3>
                  <p className="text-xs text-muted-foreground">18 ans requis</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CreditCard className="h-6 w-6 text-success mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Paiement sécurisé</h3>
                  <p className="text-xs text-muted-foreground">Via Stripe</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <RefreshCw className="h-6 w-6 text-warning mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Rétractation</h3>
                  <p className="text-xs text-muted-foreground">14 jours</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Scale className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Droit applicable</h3>
                  <p className="text-xs text-muted-foreground">Droit français</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <Card key={section.id} id={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                      {index + 1}. {section.title}
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
                    {index + 1}. {section.title}
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

export default TermsOfService;
