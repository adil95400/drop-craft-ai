import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  ArrowLeft,
  Sparkles,
  Search,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Phone,
  Mail,
  Video,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Users,
  Zap,
  Shield,
  CreditCard,
  Bot,
  Settings,
  TrendingUp
} from "lucide-react";

const FAQNew = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      id: "general",
      title: "Questions Générales",
      icon: <HelpCircle className="w-6 h-6" />,
      color: "bg-gradient-primary",
      questions: [
        {
          question: "Qu'est-ce que ShopOpti exactement ?",
          answer: "ShopOpti est la première plateforme française d'intelligence artificielle dédiée au dropshipping et e-commerce. Nous automatisons la recherche de produits gagnants, l'importation, la gestion des stocks et l'optimisation des ventes grâce à des algorithmes avancés."
        },
        {
          question: "Comment fonctionne l'IA de détection de produits gagnants ?",
          answer: "Notre IA analyse plus de 100 millions de produits quotidiennement en croisant des données de ventes, tendances Google, réseaux sociaux, avis clients et métriques de concurrence. Elle calcule un score de probabilité de succès pour chaque produit basé sur 47 critères différents."
        },
        {
          question: "Puis-je utiliser ShopOpti avec ma boutique existante ?",
          answer: "Absolument ! ShopOpti s'intègre avec toutes les plateformes populaires : Shopify, WooCommerce, PrestaShop, Magento, BigCommerce et plus. L'intégration prend moins de 5 minutes."
        },
        {
          question: "Quelle est la différence avec les autres outils de dropshipping ?",
          answer: "ShopOpti est la seule plateforme qui combine IA prédictive, sourcing automatique et optimisation temps réel. Contrairement aux autres outils qui ne font que copier AliExpress, nous analysons 50+ fournisseurs et prédisons les tendances 30 jours à l'avance."
        }
      ]
    },
    {
      id: "pricing",
      title: "Plans & Tarification",
      icon: <CreditCard className="w-6 h-6" />,
      color: "bg-gradient-success",
      questions: [
        {
          question: "Combien coûte ShopOpti ?",
          answer: "Nous proposons 3 plans : Standard (gratuit pour toujours), Pro (49€/mois) et Ultra Pro (149€/mois). Chaque plan inclut différentes limites d'imports, fonctionnalités IA et niveau de support. Pas de frais cachés."
        },
        {
          question: "Y a-t-il une période d'essai gratuite ?",
          answer: "Oui ! Le plan Standard est gratuit à vie avec 10 imports/jour. Pour les plans payants, vous bénéficiez de 14 jours d'essai gratuit sans engagement ni carte bancaire requise."
        },
        {
          question: "Puis-je changer de plan à tout moment ?",
          answer: "Bien sûr ! Vous pouvez passer à un plan supérieur ou rétrograder quand vous le souhaitez. Les changements prennent effet immédiatement et la facturation est ajustée au prorata."
        },
        {
          question: "Quels sont les moyens de paiement acceptés ?",
          answer: "Nous acceptons toutes les cartes bancaires (Visa, Mastercard, American Express), PayPal, virements SEPA et même les cryptomonnaies (Bitcoin, Ethereum). Tous les paiements sont sécurisés par Stripe."
        },
        {
          question: "Y a-t-il des frais supplémentaires ?",
          answer: "Non, aucun frais caché. Nos prix incluent toutes les fonctionnalités mentionnées. Pas de frais d'installation, de configuration ou de résiliation. Vous payez uniquement votre abonnement mensuel."
        }
      ]
    },
    {
      id: "features",
      title: "Fonctionnalités",
      icon: <Zap className="w-6 h-6" />,
      color: "bg-gradient-accent",
      questions: [
        {
          question: "Combien de produits puis-je importer par jour ?",
          answer: "Cela dépend de votre plan : Standard (10/jour), Pro (100/jour), Ultra Pro (illimité). Ces limites se réinitialisent chaque jour à minuit. Vous pouvez voir votre usage en temps réel dans votre tableau de bord."
        },
        {
          question: "L'IA peut-elle vraiment prédire les produits gagnants ?",
          answer: "Notre IA a un taux de précision de 87% sur les prédictions à 30 jours. Elle analyse les micro-tendances, saisonnalité, comportements d'achat et signaux faibles que l'œil humain ne peut détecter. Plus de 15,000 clients valident quotidiennement ses recommandations."
        },
        {
          question: "Comment fonctionne la synchronisation automatique ?",
          answer: "ShopOpti se connecte directement aux APIs de vos fournisseurs et boutiques. Les prix, stocks et descriptions se mettent à jour automatiquement toutes les heures. Vous pouvez aussi configurer des règles personnalisées (ex: marge minimum 200%)."
        },
        {
          question: "Puis-je personnaliser les descriptions automatiques ?",
          answer: "Oui ! Notre IA génère des descriptions optimisées SEO, mais vous pouvez définir votre ton, longueur, mots-clés prioritaires. Vous pouvez aussi créer des templates personnalisés que l'IA utilisera comme base."
        }
      ]
    },
    {
      id: "technical",
      title: "Questions Techniques",
      icon: <Settings className="w-6 h-6" />,
      color: "bg-gradient-hero",
      questions: [
        {
          question: "Comment intégrer ShopOpti avec ma boutique Shopify ?",
          answer: "1) Connectez-vous à ShopOpti, 2) Allez dans 'Intégrations', 3) Cliquez 'Connecter Shopify', 4) Autorisez l'accès, 5) C'est terminé ! L'intégration complète prend moins de 3 minutes. Un guide vidéo est disponible."
        },
        {
          question: "Mes données sont-elles sécurisées ?",
          answer: "Absolument. Nous utilisons un chiffrement AES-256, hébergement AWS certifié SOC2, conformité RGPD complète. Vos données ne sont jamais vendues ni partagées. Nos serveurs sont en France et nous sommes audités trimestriellement."
        },
        {
          question: "Que se passe-t-il si un fournisseur n'est plus disponible ?",
          answer: "Notre IA surveille automatiquement la disponibilité de vos fournisseurs. En cas d'indisponibilité, elle trouve automatiquement des alternatives similaires et vous notifie. Vous pouvez configurer des fournisseurs de backup."
        },
        {
          question: "Comment fonctionne l'API de ShopOpti ?",
          answer: "Notre API REST permet d'intégrer ShopOpti dans vos propres outils. Documentation complète disponible, authentification par token, rate limiting, webhooks temps réel. L'API est incluse dans les plans Pro et Ultra Pro."
        }
      ]
    },
    {
      id: "support",
      title: "Support & Formation",
      icon: <Users className="w-6 h-6" />,
      color: "bg-gradient-soft",
      questions: [
        {
          question: "Quel type de support proposez-vous ?",
          answer: "Support par email (Standard), chat prioritaire (Pro), support 24/7 avec manager dédié (Ultra Pro). Nous proposons aussi des formations lives, guides vidéo, communauté Discord et documentation complète."
        },
        {
          question: "Proposez-vous des formations pour débuter ?",
          answer: "Oui ! Formation gratuite de 2h pour tous les nouveaux utilisateurs, masterclasses hebdomadaires, guides étape par étape, et pour les Ultra Pro : session privée 1-on-1 avec un expert. Plus de 50h de contenu de formation disponible."
        },
        {
          question: "Puis-je obtenir de l'aide pour configurer ma première boutique ?",
          answer: "Bien sûr ! Nous proposons un service 'Done With You' où nos experts vous accompagnent dans la création complète de votre boutique (choix niche, produits, design, marketing). Tarifs sur demande."
        },
        {
          question: "Comment contacter le support en cas d'urgence ?",
          answer: "Plans Pro/Ultra Pro : chat en direct 24/7. Plan Standard : email avec réponse sous 24h. Pour les urgences Ultra Pro : numéro de téléphone direct. Nous garantissons une résolution sous 4h pour les problèmes critiques."
        }
      ]
    }
  ];

  const popularQuestions = [
    "Comment commencer avec ShopOpti ?",
    "Quels fournisseurs sont intégrés ?",
    "Comment annuler mon abonnement ?",
    "L'IA fonctionne-t-elle en français ?",
    "Puis-je gérer plusieurs boutiques ?",
    "Comment optimiser mes conversions ?"
  ];

  const contactOptions = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Chat en Direct",
      description: "Réponse immédiate",
      availability: "24/7 (Pro/Ultra Pro)",
      action: "Démarrer le Chat",
      color: "bg-primary"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Réponse détaillée",
      availability: "< 24h",
      action: "support@shopopti.com",
      color: "bg-success"
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Démo Personnalisée",
      description: "Session privée",
      availability: "Sur rendez-vous",
      action: "Planifier",
      color: "bg-accent"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Appel d'Urgence",
      description: "Support téléphonique",
      availability: "Ultra Pro uniquement",
      action: "+33 1 23 45 67 89",
      color: "bg-hero"
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      searchTerm === "" || 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

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
            <BookOpen className="w-4 h-4 mr-2" />
            Centre d'Aide
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Comment pouvons-nous{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              vous aider
            </span>{" "}
            ?
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Trouvez rapidement les réponses à toutes vos questions sur ShopOpti. 
            Notre centre d'aide couvre tous les aspects de la plateforme.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Rechercher dans la FAQ (ex: comment importer, tarifs, intégration...)"
              className="pl-12 py-6 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Popular Questions */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-sm text-muted-foreground mr-4">Questions populaires :</span>
            {popularQuestions.map((question, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSearchTerm(question)}
              >
                {question}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">150+</div>
              <div className="text-sm text-muted-foreground">Questions Répondues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">Moins de 2h</div>
              <div className="text-sm text-muted-foreground">Temps de Réponse Moyen</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">98%</div>
              <div className="text-sm text-muted-foreground">Problèmes Résolus</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-hero">24/7</div>
              <div className="text-sm text-muted-foreground">Support Disponible</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun résultat trouvé</h3>
              <p className="text-muted-foreground mb-6">
                Essayez des mots-clés différents ou parcourez nos catégories ci-dessous.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Effacer la Recherche
              </Button>
            </div>
          ) : (
            <div className="space-y-16">
              {filteredCategories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center space-x-4 mb-8">
                    <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center text-white`}>
                      {category.icon}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{category.title}</h2>
                      <p className="text-muted-foreground">{category.questions.length} questions</p>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((item, index) => (
                          <AccordionItem key={index} value={`${category.id}-${index}`} className="border-b last:border-b-0">
                            <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-muted/50">
                              <span className="font-medium">{item.question}</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                              <div className="text-muted-foreground leading-relaxed">
                                {item.answer}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Vous ne trouvez pas votre{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                réponse
              </span>{" "}
              ?
            </h2>
            <p className="text-xl text-muted-foreground">
              Notre équipe d'experts est là pour vous aider
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactOptions.map((option, index) => (
              <Card key={index} className="text-center hover:shadow-glow transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className={`w-16 h-16 ${option.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-4`}>
                    {option.icon}
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {option.availability}
                  </div>
                  <Button variant="outline" className="w-full">
                    {option.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ressources Complémentaires</h2>
            <p className="text-muted-foreground">Explorez nos autres ressources pour maximiser votre succès</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Video className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>Guides Vidéo</CardTitle>
                <CardDescription>
                  Plus de 50 tutoriels vidéo pour maîtriser chaque fonctionnalité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Voir les Guides
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 text-success mx-auto mb-4" />
                <CardTitle>Communauté</CardTitle>
                <CardDescription>
                  Rejoignez 15,000+ entrepreneurs sur notre Discord privé
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Rejoindre
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-accent mx-auto mb-4" />
                <CardTitle>Blog Expert</CardTitle>
                <CardDescription>
                  Stratégies avancées et études de cas détaillées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Lire le Blog
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-12">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">
                Prêt à{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  commencer
                </span>{" "}
                ?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Toutes les réponses à vos questions sont là. Il ne vous reste plus qu'à 
                vous lancer avec ShopOpti !
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Commencer Gratuitement
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Parler à un Expert
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>14 jours gratuits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Support inclus</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Sans engagement</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default FAQNew;