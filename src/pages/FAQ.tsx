import { useState } from 'react'
import { HelpCircle, Search, Plus, ChevronDown, ChevronRight, MessageCircle, BookOpen, Video, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const faqCategories = [
  {
    id: 'getting-started',
    title: 'Démarrage',
    description: 'Premiers pas avec la plateforme',
    count: 8,
    questions: [
      {
        id: 1,
        question: 'Comment créer mon premier produit ?',
        answer: 'Pour créer votre premier produit, rendez-vous dans la section "Catalogue" puis cliquez sur "Ajouter un produit". Remplissez les informations obligatoires : nom, prix, description et ajoutez au moins une image. Vous pouvez aussi utiliser notre système d\'import automatique depuis une URL.',
        tags: ['produit', 'création', 'import']
      },
      {
        id: 2,
        question: 'Comment configurer ma première intégration ?',
        answer: 'Allez dans "Intégrations" et choisissez votre plateforme (Shopify, WooCommerce, etc.). Suivez l\'assistant de configuration en saisissant vos clés API. Une fois connecté, vous pourrez synchroniser vos produits automatiquement.',
        tags: ['intégration', 'API', 'synchronisation']
      },
      {
        id: 3,
        question: 'Comment importer des produits en masse ?',
        answer: 'Utilisez l\'outil d\'import dans la section "Import". Vous pouvez importer via CSV, URL de produit, ou directement depuis vos fournisseurs connectés. Notre IA analyse automatiquement les données et propose un mapping intelligent.',
        tags: ['import', 'CSV', 'masse']
      }
    ]
  },
  {
    id: 'products',
    title: 'Gestion Produits',
    description: 'Gérer votre catalogue produits',
    count: 12,
    questions: [
      {
        id: 4,
        question: 'Comment optimiser mes fiches produits pour le SEO ?',
        answer: 'Utilisez notre outil d\'optimisation SEO automatique qui génère des titres, descriptions et mots-clés optimisés. Ajoutez des images de qualité avec des balises alt, et utilisez notre analyseur de contenu pour améliorer votre référencement.',
        tags: ['SEO', 'optimisation', 'référencement']
      },
      {
        id: 5,
        question: 'Comment gérer les variations de produits ?',
        answer: 'Dans l\'éditeur de produit, ajoutez des variations (taille, couleur, etc.) via l\'onglet "Variations". Définissez les prix, stocks et images pour chaque variante. Vous pouvez aussi importer des variations via CSV.',
        tags: ['variations', 'options', 'stock']
      }
    ]
  },
  {
    id: 'orders',
    title: 'Commandes & Livraison',
    description: 'Gérer les commandes et expéditions',
    count: 10,
    questions: [
      {
        id: 6,
        question: 'Comment suivre mes commandes automatiquement ?',
        answer: 'Notre système de tracking automatique récupère les informations de livraison depuis vos transporteurs. Configurez vos comptes transporteurs dans "Intégrations" pour un suivi en temps réel et des notifications automatiques aux clients.',
        tags: ['tracking', 'livraison', 'automatisation']
      },
      {
        id: 7,
        question: 'Comment gérer les retours et remboursements ?',
        answer: 'Accédez à la section "Commandes", sélectionnez la commande concernée et utilisez les actions "Retour" ou "Remboursement". Vous pouvez définir des règles automatiques de traitement selon vos conditions générales.',
        tags: ['retours', 'remboursements', 'SAV']
      }
    ]
  },
  {
    id: 'integrations',
    title: 'Intégrations',
    description: 'Connecter vos outils et plateformes',
    count: 15,
    questions: [
      {
        id: 8,
        question: 'Quelles plateformes sont supportées ?',
        answer: 'Nous supportons Shopify, WooCommerce, PrestaShop, Magento, Amazon, eBay, et plus de 50 autres plateformes. Consultez notre liste complète dans la section "Intégrations" ou contactez-nous pour des besoins spécifiques.',
        tags: ['plateformes', 'compatibilité', 'e-commerce']
      },
      {
        id: 9,
        question: 'Comment configurer la synchronisation automatique ?',
        answer: 'Dans chaque intégration, définissez la fréquence de synchronisation (temps réel, horaire, quotidienne). Choisissez les données à synchroniser : produits, stocks, commandes, clients. Activez les notifications pour être informé des mises à jour.',
        tags: ['synchronisation', 'automatique', 'configuration']
      }
    ]
  }
]

const contactOptions = [
  {
    icon: MessageCircle,
    title: 'Chat en Direct',
    description: 'Assistance immédiate avec notre équipe',
    action: 'Démarrer le chat',
    available: true
  },
  {
    icon: Mail,
    title: 'Support Email',
    description: 'Réponse sous 24h maximum',
    action: 'Envoyer un email',
    available: true
  },
  {
    icon: Video,
    title: 'Appel Vidéo',
    description: 'Démonstration personnalisée',
    action: 'Planifier un appel',
    available: false
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Guides détaillés et tutoriels',
    action: 'Voir la doc',
    available: true
  }
]

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('faq')

  // Filter questions based on search and category
  const filteredQuestions = faqCategories.flatMap(category => {
    if (selectedCategory !== 'all' && selectedCategory !== category.id) return []
    
    return category.questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    ).map(q => ({ ...q, category: category.title }))
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <HelpCircle className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Centre d'Aide</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Trouvez rapidement les réponses à vos questions ou contactez notre équipe support
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          {/* Search & Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher dans la FAQ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    Toutes les catégories
                  </Button>
                  {faqCategories.map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.title} ({category.count})
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Categories Overview */}
          {!searchTerm && selectedCategory === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {faqCategories.map(category => (
                <Card key={category.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Badge variant="outline">{category.count} questions</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* FAQ Questions */}
          <Card>
            <CardHeader>
              <CardTitle>
                {searchTerm ? `Résultats pour "${searchTerm}"` : 'Questions Fréquentes'}
              </CardTitle>
              <CardDescription>
                {filteredQuestions.length} question(s) trouvée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-4">
                {filteredQuestions.map((question) => (
                  <AccordionItem key={question.id} value={question.id.toString()}>
                    <AccordionTrigger className="text-left">
                      <div className="space-y-1">
                        <div>{question.question}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {question.category}
                          </Badge>
                          {question.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {question.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {filteredQuestions.length === 0 && (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucune question trouvée. Essayez d'autres mots-clés ou contactez notre support.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Guides Détaillés</h2>
              <p className="text-muted-foreground mb-6">
                Accédez à nos guides complets et tutoriels vidéo
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">Guide de Démarrage</CardTitle>
                    <CardDescription>Configuration complète en 10 étapes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-green-100 text-green-800">Recommandé</Badge>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">Import Avancé</CardTitle>
                    <CardDescription>Maîtrisez tous les outils d'import</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">Avancé</Badge>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">Optimisation SEO</CardTitle>
                    <CardDescription>Boostez votre référencement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">Marketing</Badge>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactOptions.map((option, index) => (
              <Card key={index} className={`${!option.available ? 'opacity-50' : 'cursor-pointer hover:shadow-lg'} transition-all`}>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <option.icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle>{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    className="w-full" 
                    disabled={!option.available}
                    variant={option.available ? 'default' : 'outline'}
                  >
                    {option.action}
                  </Button>
                  {!option.available && (
                    <p className="text-xs text-muted-foreground mt-2">Bientôt disponible</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Rapide</CardTitle>
              <CardDescription>Envoyez-nous votre question directement</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nom</label>
                    <Input placeholder="Votre nom" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="votre@email.com" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Sujet</label>
                  <Input placeholder="Sujet de votre demande" />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <textarea 
                    className="w-full min-h-32 p-3 border rounded-md resize-none"
                    placeholder="Décrivez votre problème ou question..."
                  />
                </div>
                <Button className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer le Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}