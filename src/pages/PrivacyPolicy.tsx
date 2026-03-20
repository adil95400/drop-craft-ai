import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Lock, UserCheck, Database, Globe, Mail, AlertTriangle, Cookie, Users } from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  const lastUpdated = "1 mars 2025";

  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      icon: Shield,
      content: [
        "La présente Politique de Confidentialité décrit comment ShopOpti (ci-après « nous », « notre » ou « la Plateforme »), accessible à l'adresse shopopti.io, collecte, utilise, stocke et protège vos informations personnelles.",
        "Nous nous engageons à protéger votre vie privée conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi française Informatique et Libertés du 6 janvier 1978 modifiée.",
        "En utilisant nos services, vous acceptez les pratiques décrites dans la présente politique."
      ]
    },
    {
      id: "responsable",
      title: "Responsable du traitement",
      icon: UserCheck,
      content: [
        "Le responsable du traitement des données personnelles est :",
        "• Raison sociale : ShopOpti",
        "• Siège social : [Adresse à compléter]",
        "• Email du DPO : dpo@shopopti.io",
        "• Email de contact : contact@shopopti.io",
        "Pour les données que vous importez concernant vos propres clients (données de commandes, clients e-commerce), vous restez le responsable du traitement et ShopOpti agit en qualité de sous-traitant au sens de l'article 28 du RGPD."
      ]
    },
    {
      id: "data-collection",
      title: "Données collectées",
      icon: Database,
      content: [
        "Nous collectons les catégories de données suivantes :",
        "Données fournies directement :",
        "• Informations d'identification : nom, prénom, adresse email",
        "• Informations de compte : préférences, paramètres, langue",
        "• Données de facturation : traitées par Stripe (nous ne stockons pas vos données bancaires)",
        "Données collectées automatiquement :",
        "• Données techniques : adresse IP (anonymisée), type de navigateur, système d'exploitation",
        "• Données d'utilisation : pages visitées, fonctionnalités utilisées, horodatages",
        "• Cookies et technologies similaires (voir notre section Cookies ci-dessous)",
        "Données importées par vous :",
        "• Catalogues produits, données de commandes, informations clients e-commerce"
      ]
    },
    {
      id: "legal-basis",
      title: "Bases légales du traitement",
      icon: Shield,
      content: [
        "Conformément au RGPD, chaque traitement repose sur une base légale :",
        "• Exécution du contrat (art. 6.1.b) : fourniture de nos services, gestion de votre compte, facturation",
        "• Intérêt légitime (art. 6.1.f) : amélioration de nos services, sécurité, prévention de la fraude",
        "• Consentement (art. 6.1.a) : cookies analytiques, communications marketing, newsletter",
        "• Obligation légale (art. 6.1.c) : conservation des factures, réponse aux autorités",
        "Vous pouvez retirer votre consentement à tout moment sans affecter la licéité du traitement effectué avant le retrait."
      ]
    },
    {
      id: "data-usage",
      title: "Finalités du traitement",
      icon: Eye,
      content: [
        "Vos données sont utilisées exclusivement pour :",
        "• Fournir, maintenir et améliorer nos services d'optimisation e-commerce",
        "• Personnaliser votre expérience utilisateur",
        "• Traiter vos abonnements et paiements via Stripe",
        "• Vous envoyer des communications relatives au service (transactionnelles)",
        "• Vous informer des mises à jour importantes de nos services",
        "• Assurer la sécurité de la plateforme et prévenir la fraude",
        "• Produire des statistiques anonymisées d'utilisation",
        "• Respecter nos obligations légales et réglementaires"
      ]
    },
    {
      id: "data-sharing",
      title: "Partage des données",
      icon: UserCheck,
      content: [
        "Nous ne vendons, ne louons et ne partageons jamais vos données personnelles à des fins commerciales.",
        "Vos données peuvent être partagées uniquement dans les cas suivants :",
        "• Sous-traitants techniques : hébergement (Supabase — UE), paiement (Stripe), monitoring (Sentry)",
        "• Obligation légale : réponse à une injonction judiciaire ou demande d'une autorité compétente",
        "• Protection de nos droits : en cas de fraude avérée ou de violation de nos CGU",
        "• Avec votre consentement explicite préalable",
        "Tous nos sous-traitants sont soumis à des engagements contractuels conformes à l'article 28 du RGPD.",
        "Liste de nos sous-traitants sur demande à dpo@shopopti.io."
      ]
    },
    {
      id: "data-security",
      title: "Sécurité des données",
      icon: Lock,
      content: [
        "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :",
        "• Chiffrement des données en transit (TLS 1.3) et au repos (AES-256)",
        "• Authentification multi-facteurs (MFA) disponible pour tous les comptes",
        "• Contrôle d'accès basé sur les rôles (RBAC) avec principe du moindre privilège",
        "• Isolation des données par tenant (Row Level Security)",
        "• Journalisation et surveillance continue des accès (audit logs immuables)",
        "• Sauvegardes automatiques quotidiennes avec chiffrement",
        "• Tests de sécurité réguliers et analyse statique du code (CodeQL)"
      ]
    },
    {
      id: "international-transfers",
      title: "Transferts internationaux",
      icon: Globe,
      content: [
        "Vos données sont hébergées au sein de l'Union Européenne.",
        "Certains sous-traitants (Stripe, Sentry) peuvent traiter des données aux États-Unis :",
        "• Sur la base du Data Privacy Framework (DPF) UE-États-Unis",
        "• Ou avec des clauses contractuelles types approuvées par la Commission européenne",
        "Vous pouvez obtenir une copie de ces garanties sur demande à dpo@shopopti.io."
      ]
    },
    {
      id: "user-rights",
      title: "Vos droits RGPD",
      icon: UserCheck,
      content: [
        "Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :",
        "• Droit d'accès (art. 15) : obtenir une copie complète de vos données — disponible via Réglages > Exporter mes données",
        "• Droit de rectification (art. 16) : corriger des données inexactes via votre profil",
        "• Droit à l'effacement (art. 17) : supprimer votre compte et données — via Réglages > Sécurité > Supprimer le compte",
        "• Droit à la limitation (art. 18) : restreindre temporairement le traitement",
        "• Droit à la portabilité (art. 20) : récupérer vos données dans un format structuré (JSON/CSV)",
        "• Droit d'opposition (art. 21) : vous opposer au traitement pour motifs légitimes",
        "• Droit de retrait du consentement : à tout moment, sans effet rétroactif",
        "Pour exercer ces droits : dpo@shopopti.io — Réponse sous 30 jours maximum.",
        "Vous avez également le droit d'introduire une réclamation auprès de la CNIL (www.cnil.fr)."
      ]
    },
    {
      id: "retention",
      title: "Durées de conservation",
      icon: Database,
      content: [
        "Nous appliquons les durées de conservation suivantes :",
        "• Données de compte actif : pendant toute la durée de l'abonnement",
        "• Données après suppression de compte : supprimées sous 30 jours (sauf obligation légale)",
        "• Données de facturation : 10 ans (obligation légale française — art. L123-22 Code de commerce)",
        "• Logs de sécurité et audit : 12 mois",
        "• Logs d'accès : 12 mois (obligation légale — décret n°2011-219)",
        "• Données de prospection : 3 ans après le dernier contact",
        "• Cookies : selon la durée définie dans notre bannière cookies (13 mois maximum)",
        "Passé ces délais, vos données sont automatiquement supprimées ou anonymisées."
      ]
    },
    {
      id: "cookies",
      title: "Cookies",
      icon: Cookie,
      content: [
        "Notre plateforme utilise des cookies :",
        "Cookies strictement nécessaires (sans consentement) :",
        "• Authentification et session utilisateur",
        "• Préférences de langue et thème",
        "• Sécurité (protection CSRF)",
        "Cookies soumis à consentement :",
        "• Cookies analytiques (mesure d'audience anonymisée)",
        "• Cookies de performance (optimisation du service)",
        "Vous pouvez gérer vos préférences cookies à tout moment via la bannière cookies ou les paramètres de votre navigateur.",
        "Le refus des cookies analytiques n'affecte en rien l'utilisation de nos services."
      ]
    },
    {
      id: "minors",
      title: "Mineurs",
      icon: Users,
      content: [
        "Nos services ne sont pas destinés aux personnes de moins de 18 ans.",
        "Nous ne collectons pas sciemment de données personnelles de mineurs.",
        "Si nous découvrons qu'un mineur nous a fourni des données personnelles, nous les supprimerons immédiatement."
      ]
    },
    {
      id: "contact",
      title: "Contact",
      icon: Mail,
      content: [
        "Pour toute question relative à la protection de vos données :",
        "• Délégué à la Protection des Données : dpo@shopopti.io",
        "• Support général : contact@shopopti.io",
        "• Site web : https://shopopti.io",
        "Vous pouvez également introduire une réclamation auprès de la CNIL :",
        "• En ligne : www.cnil.fr",
        "• Par courrier : CNIL — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07"
      ]
    }
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>Politique de Confidentialité & RGPD | ShopOpti</title>
        <meta name="description" content="Politique de confidentialité de ShopOpti — Protection des données personnelles, droits RGPD, cookies et sécurité." />
        <link rel="canonical" href="https://shopopti.io/privacy" />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Politique de Confidentialité</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comment ShopOpti protège vos données personnelles conformément au RGPD
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
                  <Shield className="h-8 w-8 text-success mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Données protégées</h3>
                  <p className="text-xs text-muted-foreground">Chiffrement AES-256 + TLS 1.3</p>
                </div>
                <div className="text-center p-4">
                  <Lock className="h-8 w-8 text-info mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Aucune vente</h3>
                  <p className="text-xs text-muted-foreground">Vos données ne sont jamais vendues</p>
                </div>
                <div className="text-center p-4">
                  <UserCheck className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Droits RGPD</h3>
                  <p className="text-xs text-muted-foreground">Accès, rectification, effacement</p>
                </div>
                <div className="text-center p-4">
                  <Globe className="h-8 w-8 text-warning mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Hébergement UE</h3>
                  <p className="text-xs text-muted-foreground">Données stockées en Europe</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Pages */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/terms" className="text-sm text-primary underline">CGU</Link>
            <Link to="/cgv" className="text-sm text-primary underline">CGV</Link>
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

export default PrivacyPolicy;
