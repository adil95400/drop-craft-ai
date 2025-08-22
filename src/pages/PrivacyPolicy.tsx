import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Lock, UserCheck, Database, Globe, Mail, AlertTriangle } from 'lucide-react';

const PrivacyPolicy = () => {
  const lastUpdated = "15 janvier 2024";

  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      icon: Shield,
      content: [
        "Cette politique de confidentialité décrit comment nous collectons, utilisons, stockons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme.",
        "Nous nous engageons à protéger votre vie privée et à respecter la réglementation européenne RGPD ainsi que les lois françaises sur la protection des données.",
        "En utilisant nos services, vous acceptez les pratiques décrites dans cette politique."
      ]
    },
    {
      id: "data-collection",
      title: "Collecte des données",
      icon: Database,
      content: [
        "Nous collectons différents types d'informations :",
        "• Informations d'identification : nom, email, numéro de téléphone",
        "• Informations de compte : préférences, paramètres, historique d'utilisation",
        "• Données techniques : adresse IP, type de navigateur, données de connexion",
        "• Données commerciales : produits importés, commandes, analyses de performance",
        "• Cookies et technologies similaires pour améliorer votre expérience"
      ]
    },
    {
      id: "data-usage",
      title: "Utilisation des données",
      icon: Eye,
      content: [
        "Vos données sont utilisées pour :",
        "• Fournir et améliorer nos services",
        "• Personnaliser votre expérience utilisateur",
        "• Traiter vos commandes et transactions",
        "• Vous envoyer des communications importantes",
        "• Analyser l'utilisation de la plateforme",
        "• Assurer la sécurité et prévenir la fraude",
        "• Respecter nos obligations légales"
      ]
    },
    {
      id: "data-sharing", 
      title: "Partage des données",
      icon: UserCheck,
      content: [
        "Nous ne vendons jamais vos données personnelles.",
        "Nous pouvons partager vos données uniquement dans les cas suivants :",
        "• Avec votre consentement explicite",
        "• Avec nos prestataires de services (hébergement, paiement, analytics)",
        "• Pour respecter une obligation légale",
        "• Pour protéger nos droits ou votre sécurité",
        "• En cas de fusion ou acquisition (après notification)",
        "Tous nos partenaires sont soumis à des accords de confidentialité stricts."
      ]
    },
    {
      id: "data-security",
      title: "Sécurité des données",
      icon: Lock,
      content: [
        "Nous mettons en place des mesures de sécurité robustes :",
        "• Chiffrement des données en transit et au repos (AES-256)",
        "• Authentification à deux facteurs disponible",
        "• Accès restreint basé sur le principe du moindre privilège",
        "• Surveillance continue et détection d'intrusions",
        "• Sauvegardes régulières et plan de récupération",
        "• Audits de sécurité périodiques",
        "• Formation régulière de nos équipes sur la sécurité"
      ]
    },
    {
      id: "international-transfers",
      title: "Transferts internationaux",
      icon: Globe,
      content: [
        "Vos données peuvent être transférées vers des pays hors UE :",
        "• Uniquement vers des pays avec un niveau de protection adéquat",
        "• Ou avec des garanties appropriées (clauses contractuelles types)",
        "• Nous utilisons des services d'hébergement européens quand possible",
        "• Vous êtes informés de tout transfert et pouvez vous y opposer",
        "• Nous respectons les décisions de la Commission européenne"
      ]
    },
    {
      id: "user-rights",
      title: "Vos droits",
      icon: UserCheck,
      content: [
        "Conformément au RGPD, vous disposez des droits suivants :",
        "• Droit d'accès : obtenir une copie de vos données",
        "• Droit de rectification : corriger des données inexactes",
        "• Droit à l'effacement : supprimer vos données",
        "• Droit à la limitation : restreindre le traitement",
        "• Droit à la portabilité : récupérer vos données",
        "• Droit d'opposition : vous opposer au traitement",
        "• Droit de retrait du consentement à tout moment",
        "Pour exercer vos droits, contactez-nous à privacy@exemple.fr"
      ]
    },
    {
      id: "retention",
      title: "Conservation des données",
      icon: Database,
      content: [
        "Nous conservons vos données uniquement le temps nécessaire :",
        "• Données de compte : pendant la durée de votre abonnement + 3 ans",
        "• Données de facturation : 10 ans (obligation légale)",
        "• Logs de sécurité : 1 an maximum",
        "• Données marketing : jusqu'à retrait du consentement",
        "• Cookies : selon les durées définies dans notre politique cookies",
        "Passé ces délais, vos données sont automatiquement supprimées."
      ]
    },
    {
      id: "contact",
      title: "Contact",
      icon: Mail,
      content: [
        "Pour toute question concernant cette politique :",
        "• Email : privacy@exemple.fr",
        "• Courrier : Délégué à la Protection des Données, [Adresse]",
        "• Téléphone : +33 1 23 45 67 89",
        "Vous pouvez également introduire une réclamation auprès de la CNIL :",
        "• En ligne : www.cnil.fr",
        "• Par courrier : CNIL, 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07"
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Politique de confidentialité</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Votre vie privée est importante pour nous. Découvrez comment nous protégeons vos données.
        </p>
        <Badge variant="outline" className="text-sm">
          Dernière mise à jour : {lastUpdated}
        </Badge>
      </div>

      {/* Quick Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            En résumé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Données protégées</h3>
              <p className="text-xs text-muted-foreground">Chiffrement AES-256</p>
            </div>
            <div className="text-center p-4">
              <Lock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Pas de vente</h3>
              <p className="text-xs text-muted-foreground">Nous ne vendons jamais vos données</p>
            </div>
            <div className="text-center p-4">
              <UserCheck className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Vos droits</h3>
              <p className="text-xs text-muted-foreground">Contrôle total RGPD</p>
            </div>
            <div className="text-center p-4">
              <Globe className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Hébergement UE</h3>
              <p className="text-xs text-muted-foreground">Données stockées en Europe</p>
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

      {/* Important Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-orange-800">Modifications de cette politique</h3>
              <p className="text-orange-700 text-sm">
                Nous pouvons modifier cette politique de confidentialité de temps en temps. 
                Les modifications importantes vous seront notifiées par email ou via un avis 
                sur notre plateforme au moins 30 jours avant leur entrée en vigueur.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table of Contents */}
      <Card>
        <CardHeader>
          <CardTitle>Table des matières</CardTitle>
          <CardDescription>Navigation rapide dans cette politique</CardDescription>
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
  );
};

export default PrivacyPolicy;