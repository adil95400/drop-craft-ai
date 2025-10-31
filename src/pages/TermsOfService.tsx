import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Scale, 
  CreditCard, 
  Shield, 
  AlertTriangle, 
  Users, 
  Ban, 
  RefreshCw,
  Mail,
  Eye
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Helmet } from 'react-helmet-async';

const TermsOfService = () => {
  const lastUpdated = "15 janvier 2024";
  const effectiveDate = "1 février 2024";

  const sections = [
    {
      id: "acceptance",
      title: "Acceptation des conditions",
      icon: FileText,
      content: [
        "En accédant à notre plateforme et en utilisant nos services, vous acceptez d'être lié par ces conditions d'utilisation.",
        "Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser nos services.",
        "Ces conditions s'appliquent à tous les utilisateurs, visiteurs et autres personnes qui accèdent ou utilisent nos services.",
        "Vous devez avoir au moins 18 ans ou l'âge de majorité dans votre juridiction pour utiliser nos services.",
        "Si vous utilisez nos services au nom d'une entreprise, vous déclarez avoir l'autorité pour lier cette entreprise à ces conditions."
      ]
    },
    {
      id: "service-description",
      title: "Description des services",
      icon: Users,
      content: [
        "Notre plateforme fournit des outils d'importation, de gestion et d'optimisation de produits e-commerce.",
        "Les services incluent :",
        "• Import automatisé de produits depuis diverses sources",
        "• Optimisation IA des descriptions et métadonnées",
        "• Intégrations avec plateformes e-commerce populaires",
        "• Outils d'analyse et de reporting",
        "• Support client et assistance technique",
        "Nous nous réservons le droit de modifier, suspendre ou interrompre tout ou partie de nos services à tout moment."
      ]
    },
    {
      id: "user-accounts",
      title: "Comptes utilisateurs", 
      icon: Users,
      content: [
        "Vous êtes responsable de maintenir la confidentialité de votre compte et mot de passe.",
        "Vous acceptez de fournir des informations exactes et complètes lors de la création de votre compte.",
        "Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte.",
        "Vous ne pouvez pas transférer votre compte à une autre personne sans notre autorisation écrite.",
        "Nous nous réservons le droit de suspendre ou résilier votre compte en cas de violation de ces conditions."
      ]
    },
    {
      id: "acceptable-use",
      title: "Utilisation acceptable",
      icon: Shield,
      content: [
        "Vous acceptez d'utiliser nos services uniquement à des fins légales et conformément à ces conditions.",
        "Il est interdit de :",
        "• Violer des lois ou réglementations applicables",
        "• Importer ou distribuer du contenu illégal, frauduleux ou trompeur",
        "• Tenter d'accéder non autorisé à nos systèmes",
        "• Interférer avec le fonctionnement normal de nos services",
        "• Utiliser nos services pour du spam ou des communications non sollicitées",
        "• Copier, modifier ou distribuer notre propriété intellectuelle sans autorisation"
      ]
    },
    {
      id: "payment-billing",
      title: "Paiement et facturation",
      icon: CreditCard,
      content: [
        "Les frais de nos services sont facturés selon le plan tarifaire choisi.",
        "Les paiements sont traités mensuellement ou annuellement selon votre sélection.",
        "Vous autorisez le prélèvement automatique sur votre mode de paiement enregistré.",
        "En cas d'échec de paiement, nous nous réservons le droit de suspendre votre compte.",
        "Les remboursements sont accordés conformément à notre politique de remboursement.",
        "Vous êtes responsable de tous les impôts applicables sur vos achats.",
        "Les prix peuvent être modifiés avec un préavis de 30 jours."
      ]
    },
    {
      id: "cancellation-refunds",
      title: "Annulation et remboursements",
      icon: RefreshCw,
      content: [
        "Vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord.",
        "L'annulation prend effet à la fin de votre période de facturation courante.",
        "Remboursements :",
        "• Nouveau compte : remboursement intégral dans les 30 jours",
        "• Dysfonctionnement de service : remboursement au prorata",
        "• Annulation volontaire : pas de remboursement pour la période en cours",
        "• Violation des conditions : aucun remboursement",
        "Les demandes de remboursement doivent être faites par écrit à billing@exemple.fr"
      ]
    },
    {
      id: "intellectual-property",
      title: "Propriété intellectuelle",
      icon: Eye,
      content: [
        "Nos services et tout le contenu associé sont protégés par des droits de propriété intellectuelle.",
        "Vous conservez la propriété de vos données et contenus téléchargés sur notre plateforme.",
        "En utilisant nos services, vous nous accordez une licence limitée pour traiter vos données.",
        "Vous ne pouvez pas :",
        "• Copier, modifier ou créer des œuvres dérivées de nos services",
        "• Utiliser notre propriété intellectuelle sans autorisation",
        "• Faire de l'ingénierie inverse de notre technologie",
        "Nous respectons la propriété intellectuelle des tiers et attendons la même chose de nos utilisateurs."
      ]
    },
    {
      id: "data-privacy",
      title: "Données et confidentialité",
      icon: Shield,
      content: [
        "Nous traitons vos données personnelles conformément à notre Politique de Confidentialité.",
        "Vous conservez tous les droits sur vos données et pouvez les exporter à tout moment.",
        "Nous mettons en place des mesures de sécurité pour protéger vos informations.",
        "Vous êtes responsable de la légalité des données que vous importez sur notre plateforme.",
        "Nous pouvons traiter vos données pour améliorer nos services et assurer leur fonctionnement.",
        "En cas de violation de données, nous vous informerons dans les délais légaux requis."
      ]
    },
    {
      id: "limitation-liability",
      title: "Limitation de responsabilité",
      icon: AlertTriangle,
      content: [
        "Nos services sont fournis 'en l'état' sans garantie d'aucune sorte.",
        "Nous ne garantissons pas que nos services seront ininterrompus ou exempts d'erreurs.",
        "Notre responsabilité est limitée au montant que vous avez payé au cours des 12 derniers mois.",
        "Nous ne sommes pas responsables des dommages indirects ou consécutifs.",
        "Cette limitation s'applique dans la mesure permise par la loi applicable.",
        "Certaines juridictions ne permettent pas ces limitations, elles peuvent donc ne pas s'appliquer."
      ]
    },
    {
      id: "termination",
      title: "Résiliation",
      icon: Ban,
      content: [
        "Nous pouvons résilier ou suspendre votre compte immédiatement en cas de violation de ces conditions.",
        "Vous pouvez résilier votre compte à tout moment en nous contactant.",
        "En cas de résiliation :",
        "• Votre accès aux services cessera immédiatement",
        "• Vos données seront supprimées selon notre politique de rétention",
        "• Les obligations de paiement restent dues",
        "• Les clauses de limitation de responsabilité survivent à la résiliation",
        "Nous vous notifierons de toute résiliation par email à l'adresse de votre compte."
      ]
    },
    {
      id: "changes-terms",
      title: "Modifications des conditions",
      icon: RefreshCw,
      content: [
        "Nous nous réservons le droit de modifier ces conditions à tout moment.",
        "Les modifications importantes vous seront notifiées par email ou via notre plateforme.",
        "Vous disposerez de 30 jours pour accepter les nouvelles conditions ou résilier votre compte.",
        "L'utilisation continue de nos services après notification constitue une acceptation des nouvelles conditions.",
        "Si vous n'acceptez pas les modifications, vous devez cesser d'utiliser nos services.",
        "L'historique des modifications est disponible sur demande."
      ]
    },
    {
      id: "governing-law",
      title: "Droit applicable et juridiction",
      icon: Scale,
      content: [
        "Ces conditions sont régies par le droit français.",
        "Tout litige sera soumis à la juridiction exclusive des tribunaux de Paris, France.",
        "Nous tenterons de résoudre les litiges à l'amiable avant toute action judiciaire.",
        "Si une clause de ces conditions est déclarée invalide, les autres clauses restent en vigueur.",
        "Ces conditions constituent l'accord complet entre vous et nous concernant nos services.",
        "Aucune renonciation à ces conditions ne sera valable sans accord écrit."
      ]
    },
    {
      id: "contact",
      title: "Contact",
      icon: Mail,
      content: [
        "Pour toute question concernant ces conditions :",
        "• Email : legal@exemple.fr",
        "• Courrier : Service Juridique, [Adresse complète]",
        "• Téléphone : +33 1 23 45 67 89",
        "Nous nous efforcerons de répondre à vos questions dans un délai de 48 heures ouvrables.",
        "Pour les demandes urgentes, utilisez notre formulaire de contact prioritaire.",
        "Conservez une copie de ces conditions pour vos dossiers."
      ]
    }
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>Conditions d'Utilisation | ShopOpti+</title>
        <meta name="description" content="Conditions générales d'utilisation de ShopOpti+ - Règles, obligations et droits des utilisateurs." />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Scale className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Conditions d'utilisation</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Les conditions générales qui régissent l'utilisation de notre plateforme
        </p>
        <div className="flex justify-center gap-4">
          <Badge variant="outline" className="text-sm">
            Dernière mise à jour : {lastUpdated}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            Entrée en vigueur : {effectiveDate}
          </Badge>
        </div>
      </div>

      {/* Important Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-800">Information importante</h3>
              <p className="text-blue-700 text-sm">
                Ces conditions d'utilisation constituent un contrat légalement contraignant entre vous et nous. 
                Veuillez les lire attentivement avant d'utiliser nos services.
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                <FileText className="h-4 w-4 mr-2" />
                Télécharger en PDF
              </Button>
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
              <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Âge minimum</h3>
              <p className="text-xs text-muted-foreground">18 ans requis</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CreditCard className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Facturation</h3>
              <p className="text-xs text-muted-foreground">Mensuelle ou annuelle</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <RefreshCw className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Annulation</h3>
              <p className="text-xs text-muted-foreground">À tout moment</p>
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

      {/* Changes Notification */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-orange-800">Notification des modifications</h3>
              <p className="text-orange-700 text-sm">
                Nous vous notifierons par email de toute modification importante de ces conditions 
                au moins 30 jours avant leur entrée en vigueur. L'utilisation continue de nos services 
                après cette période constitue votre acceptation des nouvelles conditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table of Contents */}
      <Card>
        <CardHeader>
          <CardTitle>Table des matières</CardTitle>
          <CardDescription>Navigation rapide dans ces conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {sections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="p-2 rounded hover:bg-muted/50 text-sm transition-colors"
              >
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