import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowLeft,
  Sparkles,
  Search,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  BookOpen,
  Video,
  MessageCircle,
  Zap,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  CreditCard,
  Users,
  Rocket,
  CheckCircle
} from "lucide-react";

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState<string[]>(["general"]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const faqCategories = [
    {
      id: "general",
      title: "Questions Générales",
      icon: <HelpCircle className="w-5 h-5" />,
      questions: [
        {
          question: "Qu'est-ce que ShopOpti exactement ?",
          answer: "ShopOpti est une plateforme SaaS qui utilise l'intelligence artificielle pour aider les e-commerçants et dropshippers à identifier, importer et vendre les produits gagnants. Notre IA analyse des millions de produits pour vous proposer ceux avec le plus fort potentiel de vente."
        },
        {
          question: "Ai-je besoin d'expérience en e-commerce pour utiliser ShopOpti ?",
          answer: "Non ! ShopOpti est conçu pour tous les niveaux. Nos outils sont intuitifs et nous proposons des formations complètes pour les débutants. L'IA vous guide dans vos choix et automatise les tâches complexes."
        },
        {
          question: "Combien de temps faut-il pour voir des résultats ?",
          answer: "Nos utilisateurs voient généralement leurs premières ventes dans les 7-14 jours suivant le lancement de leur boutique. Cependant, les résultats dépendent de votre engagement et de votre stratégie marketing."
        },
        {
          question: "ShopOpti fonctionne-t-il dans tous les pays ?",
          answer: "Oui, ShopOpti est disponible dans plus de 50 pays. Nos fournisseurs livrent mondialement et notre plateforme supporte plusieurs devises et langues."
        }
      ]
    },
    {
      id: "pricing",
      title: "Tarifs & Abonnements",
      icon: <CreditCard className="w-5 h-5" />,
      questions: [
        {
          question: "Y a-t-il un essai gratuit ?",
          answer: "Oui ! Nous offrons un essai gratuit de 14 jours sur tous nos plans. Aucune carte de crédit requise pour commencer. Vous avez accès à toutes les fonctionnalités pendant cette période."
        },
        {
          question: "Puis-je changer de plan à tout moment ?",
          answer: "Absolument ! Vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement et nous calculons la différence au prorata."
        },
        {
          question: "Que se passe-t-il si j'annule mon abonnement ?",
          answer: "Vous gardez l'accès à votre compte jusqu'à la fin de votre période de facturation. Vos données sont conservées 90 jours pour vous permettre de réactiver facilement votre compte."
        },
        {
          question: "Proposez-vous des remises pour les étudiants ?",
          answer: "Oui, nous offrons une remise de 50% sur tous nos plans pour les étudiants avec une adresse email universitaire valide. Contactez notre support pour en bénéficier."
        }
      ]
    },
    {
      id: "features",
      title: "Fonctionnalités",
      icon: <Zap className="w-5 h-5" />,
      questions: [
        {
          question: "Comment fonctionne l'IA de détection de produits gagnants ?",
          answer: "Notre IA analyse en temps réel plus de 2 millions de produits en surveillant les tendances, les ventes, les avis clients, et les signaux sociaux. Elle utilise plus de 50 critères pour calculer un score de potentiel pour chaque produit."
        },
        {
          question: "Combien de produits puis-je importer ?",
          answer: "Cela dépend de votre plan : Starter (100/mois), Pro (illimité), Ultra Pro (illimité). Vous pouvez toujours upgrader si vous atteignez vos limites."
        },
        {
          question: "Quels fournisseurs sont supportés ?",
          answer: "Nous travaillons avec plus de 50 fournisseurs incluant AliExpress, BigBuy, Spocket, Oberlo, et de nombreux fournisseurs européens vérifiés. La liste complète est disponible dans votre tableau de bord."
        },
        {
          question: "L'import de produits est-il vraiment en 1 clic ?",
          answer: "Oui ! Une fois votre boutique connectée, vous pouvez importer n'importe quel produit en un seul clic. L'IA optimise automatiquement les descriptions, titres et prix selon votre stratégie."
        }
      ]
    },
    {
      id: "integrations",
      title: "Intégrations",
      icon: <Package className="w-5 h-5" />,
      questions: [
        {
          question: "Avec quelles plateformes e-commerce puis-je connecter ShopOpti ?",
          answer: "ShopOpti s'intègre avec Shopify, WooCommerce, PrestaShop, Magento, BigCommerce, et plus de 20 autres plateformes. Nous ajoutons régulièrement de nouvelles intégrations."
        },
        {
          question: "Comment connecter ma boutique Shopify ?",
          answer: "C'est très simple ! Allez dans Intégrations > Shopify, cliquez sur 'Connecter', autorisez l'accès, et votre boutique sera synchronisée en quelques minutes."
        },
        {
          question: "Mes données sont-elles synchronisées en temps réel ?",
          answer: "Oui, toutes les données (stocks, prix, commandes) sont synchronisées en temps réel. Vous pouvez aussi configurer la fréquence de synchronisation selon vos besoins."
        },
        {
          question: "Puis-je gérer plusieurs boutiques ?",
          answer: "Oui ! Le plan Pro permet 5 boutiques, et Ultra Pro permet un nombre illimité. Vous pouvez basculer entre vos boutiques depuis le tableau de bord."
        }
      ]
    },
    {
      id: "support",
      title: "Support & Formation",
      icon: <Users className="w-5 h-5" />,
      questions: [
        {
          question: "Quel type de support proposez-vous ?",
          answer: "Nous offrons un support par chat 24/7, email, et téléphone selon votre plan. Les utilisateurs Ultra Pro bénéficient d'un account manager dédié."
        },
        {
          question: "Proposez-vous des formations ?",
          answer: "Oui ! Nous avons une académie complète avec des cours vidéo, webinaires hebdomadaires, et sessions de coaching personnalisées pour les plans Pro et Ultra Pro."
        },
        {
          question: "Dans combien de temps puis-je obtenir de l'aide ?",
          answer: "Chat en direct : instantané, Email : moins de 4h, Téléphone : disponible en heures ouvrables. Les urgences sont traitées en priorité."
        },
        {
          question: "Avez-vous une communauté d'utilisateurs ?",
          answer: "Oui ! Rejoignez notre communauté Discord de plus de 10,000 e-commerçants où vous pouvez échanger conseils, stratégies et retours d'expérience."
        }
      ]
    },
    {
      id: "technical",
      title: "Technique & Sécurité",
      icon: <Settings className="w-5 h-5" />,
      questions: [
        {
          question: "Mes données sont-elles sécurisées ?",
          answer: "Absolument ! Nous utilisons un chiffrement AES-256, sommes conformes RGPD, et hébergés sur AWS avec une garantie d'uptime de 99.9%. Vos données ne sont jamais partagées."
        },
        {
          question: "Proposez-vous une API ?",
          answer: "Oui, notre API REST complète est disponible pour les plans Pro et Ultra Pro. Documentation disponible sur developers.shopopti.com"
        },
        {
          question: "Comment migrer mes données existantes ?",
          answer: "Nous proposons un service de migration gratuit pour tous les nouveaux clients. Notre équipe technique s'occupe de tout pour une transition sans interruption."
        },
        {
          question: "Que se passe-t-il en cas de panne ?",
          answer: "Notre infrastructure redondante garantit 99.9% d'uptime. En cas de problème, nous vous informons immédiatement et nos équipes travaillent 24/7 pour restaurer le service."
        }
      ]
    }
  ];

  const filterQuestions = (questions: any[], searchTerm: string) => {
    if (!searchTerm) return questions;
    return questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const quickLinks = [
    { title: "Guide de démarrage rapide", icon: <Rocket className="w-4 h-4" />, href: "/guides/quick-start" },
    { title: "Tutoriels vidéo", icon: <Video className="w-4 h-4" />, href: "/tutorials" },
    { title: "Documentation API", icon: <BookOpen className="w-4 h-4" />, href: "/api-docs" },
    { title: "Communauté Discord", icon: <MessageCircle className="w-4 h-4" />, href: "/discord" },
    { title: "Centre d'aide", icon: <HelpCircle className="w-4 h-4" />, href: "/help" },
    { title: "Nous contacter", icon: <MessageCircle className="w-4 h-4" />, href: "/contact" }
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
      <section className="py-16 px-4 bg-gradient-hero/5">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <HelpCircle className="w-4 h-4 mr-2" />
            Centre d'Aide
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Comment pouvons-nous{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              vous aider
            </span>{" "}
            ?
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Trouvez rapidement les réponses à vos questions sur ShopOpti. 
            Notre base de connaissances couvre tous les aspects de la plateforme.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans la FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Liens Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickLinks.map((link, index) => (
                  <Link 
                    key={index} 
                    to={link.href}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="text-primary group-hover:text-primary-hover">
                      {link.icon}
                    </div>
                    <span className="text-sm font-medium">{link.title}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {faqCategories.map((category) => {
                const filteredQuestions = filterQuestions(category.questions, searchTerm);
                
                if (filteredQuestions.length === 0 && searchTerm) return null;

                return (
                  <Card key={category.id} className="overflow-hidden">
                    <Collapsible 
                      open={openSections.includes(category.id)}
                      onOpenChange={() => toggleSection(category.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-white">
                                {category.icon}
                              </div>
                              <div>
                                <CardTitle className="text-xl">{category.title}</CardTitle>
                                <CardDescription>
                                  {filteredQuestions.length} question{filteredQuestions.length > 1 ? 's' : ''}
                                </CardDescription>
                              </div>
                            </div>
                            {openSections.includes(category.id) ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-6">
                            {filteredQuestions.map((faq, index) => (
                              <div key={index} className="border-l-4 border-primary/20 pl-6 py-4">
                                <h3 className="font-semibold text-lg mb-3 text-foreground">
                                  {faq.question}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                  {faq.answer}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>

            {/* No Results */}
            {searchTerm && faqCategories.every(cat => filterQuestions(cat.questions, searchTerm).length === 0) && (
              <Card className="text-center py-12">
                <CardContent>
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun résultat trouvé</h3>
                  <p className="text-muted-foreground mb-6">
                    Essayez avec d'autres mots-clés ou contactez notre support.
                  </p>
                  <Link to="/contact">
                    <Button>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contacter le Support
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Vous ne trouvez pas votre{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              réponse
            </span>{" "}
            ?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Notre équipe d'experts est là pour vous aider. Contactez-nous et obtenez 
            une réponse personnalisée en moins de 4 heures.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow">
                <MessageCircle className="w-5 h-5 mr-2" />
                Contacter le Support
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              <Video className="w-5 h-5 mr-2" />
              Demander une Démo
            </Button>
          </div>
          
          <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Réponse rapide</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Support expert</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Disponible 24/7</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;