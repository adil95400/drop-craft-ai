/**
 * Page FAQ de l'extension Chrome
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HelpCircle, 
  Search, 
  Download, 
  Settings, 
  AlertTriangle,
  Zap,
  Shield,
  Globe,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ExtensionFAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const faqCategories = [
    {
      category: "Installation",
      icon: <Download className="h-5 w-5" />,
      questions: [
        {
          question: "Comment installer l'extension Chrome ?",
          answer: "Téléchargez le fichier ZIP depuis notre page de téléchargement, décompressez-le, puis chargez-le dans Chrome via chrome://extensions en activant le mode développeur."
        },
        {
          question: "L'extension fonctionne-t-elle sur d'autres navigateurs ?",
          answer: "L'extension est optimisée pour Chrome et les navigateurs basés sur Chromium (Edge, Brave, Opera). Une version Firefox est prévue pour 2024."
        },
        {
          question: "Comment mettre à jour l'extension ?",
          answer: "Téléchargez la nouvelle version, remplacez les fichiers dans votre dossier d'extension existant, puis cliquez sur le bouton 'Actualiser' dans chrome://extensions."
        },
        {
          question: "Puis-je utiliser l'extension sur plusieurs ordinateurs ?",
          answer: "Oui, vous pouvez installer l'extension sur autant d'ordinateurs que vous le souhaitez. Connectez-vous à votre compte ShopOpti pour synchroniser vos données."
        }
      ]
    },
    {
      category: "Fonctionnalités",
      icon: <Zap className="h-5 w-5" />,
      questions: [
        {
          question: "Quelles plateformes sont supportées ?",
          answer: "L'extension supporte AliExpress, Temu, Amazon, eBay, CJDropshipping, Banggood, 1688, Taobao, DHgate, Wish, Shein, Walmart et d'autres plateformes majeures."
        },
        {
          question: "Comment importer les avis clients ?",
          answer: "Sur la page produit, cliquez sur l'icône ShopOpti+ puis sur 'Importer les avis'. Vous pouvez filtrer par note et choisir d'inclure les photos."
        },
        {
          question: "La surveillance des prix est-elle automatique ?",
          answer: "Oui, une fois qu'un produit est ajouté à votre liste de surveillance, l'extension vérifie automatiquement les prix toutes les heures et vous alerte en cas de changement."
        },
        {
          question: "Puis-je importer plusieurs produits à la fois ?",
          answer: "Oui, utilisez la fonction 'Import en masse' disponible sur les pages de résultats de recherche. Sélectionnez les produits souhaités et importez-les en un clic."
        }
      ]
    },
    {
      category: "Configuration",
      icon: <Settings className="h-5 w-5" />,
      questions: [
        {
          question: "Comment changer la boutique de destination ?",
          answer: "Ouvrez les paramètres de l'extension (icône engrenage), puis sélectionnez votre boutique dans le menu déroulant 'Boutique par défaut'."
        },
        {
          question: "Comment configurer le multiplicateur de prix ?",
          answer: "Dans les paramètres > Options d'import, définissez votre multiplicateur de prix. Par exemple, 2.5 signifie que le prix de vente sera 2.5x le prix fournisseur."
        },
        {
          question: "Puis-je désactiver les notifications ?",
          answer: "Oui, rendez-vous dans Paramètres > Notifications et désactivez les alertes que vous ne souhaitez pas recevoir."
        }
      ]
    },
    {
      category: "Problèmes courants",
      icon: <AlertTriangle className="h-5 w-5" />,
      questions: [
        {
          question: "L'extension ne détecte pas le produit",
          answer: "Assurez-vous d'être sur une page produit (pas une page de recherche). Rechargez la page si nécessaire. Si le problème persiste, le site peut ne pas être supporté."
        },
        {
          question: "Chrome affiche 'Extension non vérifiée'",
          answer: "C'est normal pour les extensions en mode développeur. Cliquez sur 'Conserver les modifications' pour continuer à utiliser l'extension."
        },
        {
          question: "Les images ne s'importent pas correctement",
          answer: "Certains sites protègent leurs images. Essayez de recharger la page ou d'utiliser l'option 'Téléchargement alternatif' dans les paramètres."
        },
        {
          question: "L'extension est très lente",
          answer: "Désactivez les autres extensions que vous n'utilisez pas. Videz le cache de l'extension via Paramètres > Avancé > Vider le cache."
        }
      ]
    },
    {
      category: "Sécurité",
      icon: <Shield className="h-5 w-5" />,
      questions: [
        {
          question: "L'extension est-elle sécurisée ?",
          answer: "Oui, l'extension ne collecte aucune donnée personnelle de navigation. Elle fonctionne uniquement sur les sites e-commerce supportés et tout le code est auditable."
        },
        {
          question: "Mes identifiants de connexion sont-ils en sécurité ?",
          answer: "L'extension n'a jamais accès à vos mots de passe. L'authentification se fait via un token sécurisé stocké localement dans Chrome."
        },
        {
          question: "Quelles permissions l'extension demande-t-elle ?",
          answer: "L'extension demande l'accès à l'onglet actif (pour lire les données produit), au stockage local (pour vos préférences) et aux notifications."
        }
      ]
    },
    {
      category: "Compatibilité",
      icon: <Globe className="h-5 w-5" />,
      questions: [
        {
          question: "L'extension est-elle compatible avec Shopify ?",
          answer: "Oui, vous pouvez importer directement les produits dans votre boutique Shopify. Connectez votre boutique dans les paramètres."
        },
        {
          question: "Fonctionne-t-elle avec WooCommerce ?",
          answer: "Oui, WooCommerce est entièrement supporté. Configurez vos identifiants API dans les paramètres pour activer l'import direct."
        },
        {
          question: "Puis-je utiliser l'extension sur mobile ?",
          answer: "L'extension Chrome ne fonctionne que sur ordinateur. Cependant, les produits importés sont accessibles depuis l'application mobile ShopOpti."
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <Badge variant="secondary">FAQ</Badge>
        <h1 className="text-3xl font-bold">Questions Fréquentes</h1>
        <p className="text-muted-foreground">
          Trouvez rapidement des réponses à vos questions sur l'extension Chrome
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une question..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* FAQ Categories */}
      <div className="space-y-6">
        {filteredCategories.map((category, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                {category.icon}
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`${index}-${faqIndex}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {searchQuery && filteredCategories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Aucun résultat trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Nous n'avons pas trouvé de réponse correspondant à "{searchQuery}"
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Effacer la recherche
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Support */}
      <Card className="bg-gradient-to-br from-primary/5 to-blue-500/5 border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold">Vous ne trouvez pas votre réponse ?</h3>
              <p className="text-sm text-muted-foreground">
                Notre équipe support est disponible 24/7 pour vous aider
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/support')}>
            Contacter le Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
