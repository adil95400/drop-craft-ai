/**
 * Centre d'aide et support client
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  Search, MessageCircle, Book, Video, Phone, Mail, 
  ExternalLink, Star, ThumbsUp, Clock, Users, Zap
} from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
  views: number
}

interface GuideItem {
  id: string
  title: string
  description: string
  duration: string
  level: 'Débutant' | 'Intermédiaire' | 'Avancé'
  category: string
  url: string
  type: 'article' | 'video' | 'tutorial'
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    question: 'Comment importer mes premiers produits ?',
    answer: 'Rendez-vous dans la section Import > Sources de données. Vous pouvez importer via CSV, connecter un fournisseur ou utiliser notre IA pour analyser des catalogues en ligne.',
    category: 'Import',
    helpful: 45,
    views: 234
  },
  {
    id: '2',
    question: 'Comment configurer la synchronisation automatique ?',
    answer: 'Dans Intégrations > Fournisseurs, sélectionnez votre fournisseur et activez la synchronisation automatique. Vous pouvez définir la fréquence et les conditions de mise à jour.',
    category: 'Synchronisation',
    helpful: 38,
    views: 198
  },
  {
    id: '3',
    question: 'Que signifient les scores de compétitivité ?',
    answer: 'Les scores de compétitivité analysent vos prix par rapport au marché, la demande du produit et sa rentabilité potentielle. Plus le score est élevé, plus le produit est recommandé.',
    category: 'Analytics',
    helpful: 67,
    views: 456
  },
  {
    id: '4',
    question: 'Comment utiliser l\'IA pour optimiser mes descriptions ?',
    answer: 'Dans la section IA > Optimisation, sélectionnez vos produits et choisissez "Optimiser descriptions". L\'IA analysera et améliorera automatiquement vos contenus.',
    category: 'IA',
    helpful: 52,
    views: 287
  },
  {
    id: '5',
    question: 'Comment configurer les alertes de stock ?',
    answer: 'Allez dans Paramètres > Notifications et configurez les seuils d\'alerte pour vos produits. Vous recevrez des notifications quand le stock est faible.',
    category: 'Gestion',
    helpful: 29,
    views: 145
  }
]

const GUIDES: GuideItem[] = [
  {
    id: '1',
    title: 'Guide de démarrage rapide',
    description: 'Apprenez les bases de Drop Craft AI en 10 minutes',
    duration: '10 min',
    level: 'Débutant',
    category: 'Démarrage',
    url: '/guides/quick-start',
    type: 'article'
  },
  {
    id: '2',
    title: 'Maîtriser l\'import de données',
    description: 'Techniques avancées pour importer et nettoyer vos catalogues',
    duration: '25 min',
    level: 'Intermédiaire',
    category: 'Import',
    url: '/guides/data-import',
    type: 'video'
  },
  {
    id: '3',
    title: 'Automatisation avec l\'IA',
    description: 'Configurer des workflows intelligents pour votre business',
    duration: '30 min',
    level: 'Avancé',
    category: 'IA',
    url: '/guides/ai-automation',
    type: 'tutorial'
  },
  {
    id: '4',
    title: 'Analytics et reporting',
    description: 'Comprendre et utiliser les métriques de performance',
    duration: '20 min',
    level: 'Intermédiaire',
    category: 'Analytics',
    url: '/guides/analytics',
    type: 'article'
  }
]

const CATEGORIES = ['Tous', 'Import', 'Synchronisation', 'Analytics', 'IA', 'Gestion']

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [selectedTab, setSelectedTab] = useState('faq')

  const filteredFAQ = FAQ_ITEMS.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Tous' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredGuides = GUIDES.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Tous' || guide.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getLevelColor = (level: GuideItem['level']) => {
    switch (level) {
      case 'Débutant': return 'bg-green-100 text-green-800'
      case 'Intermédiaire': return 'bg-yellow-100 text-yellow-800'
      case 'Avancé': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: GuideItem['type']) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'tutorial': return <Zap className="h-4 w-4" />
      default: return <Book className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-4 flex items-center justify-center">
          <MessageCircle className="h-8 w-8 mr-3 text-primary" />
          Centre d'aide
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Trouvez rapidement les réponses à vos questions et apprenez à utiliser Drop Craft AI efficacement
        </p>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Book className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">150+</p>
                <p className="text-xs text-muted-foreground">Articles d'aide</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">45</p>
                <p className="text-xs text-muted-foreground">Tutoriels vidéo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-xs text-muted-foreground">Support chat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">&lt; 2h</p>
                <p className="text-xs text-muted-foreground">Temps de réponse</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher dans l'aide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {CATEGORIES.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact rapide */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Chat en direct</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Obtenez une aide immédiate de notre équipe
            </p>
            <Button className="w-full">
              Commencer le chat
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Mail className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Email support</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Décrivez votre problème en détail
            </p>
            <Button variant="outline" className="w-full">
              Envoyer un email
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Phone className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Support téléphone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Parlez directement à un expert
            </p>
            <Button variant="outline" className="w-full">
              Programmer un appel
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faq">Questions fréquentes</TabsTrigger>
          <TabsTrigger value="guides">Guides & Tutoriels</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Questions fréquentes</CardTitle>
              <CardDescription>
                {filteredFAQ.length} question{filteredFAQ.length > 1 ? 's' : ''} trouvées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {filteredFAQ.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center justify-between w-full mr-4">
                        <span>{item.question}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.category}</Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ThumbsUp className="h-3 w-3" />
                            {item.helpful}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2">
                        <p className="text-muted-foreground mb-4">{item.answer}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{item.views} vues</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Utile
                            </Button>
                            <Button size="sm" variant="outline">
                              Plus d'infos
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredGuides.map((guide) => (
              <Card key={guide.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(guide.type)}
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getLevelColor(guide.level)}>
                        {guide.level}
                      </Badge>
                      <Badge variant="outline">{guide.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {guide.duration}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Aucun résultat */}
      {(filteredFAQ.length === 0 && selectedTab === 'faq') || 
       (filteredGuides.length === 0 && selectedTab === 'guides') ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Aucun résultat trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Essayez de modifier votre recherche ou contactez notre support
            </p>
            <Button>
              Contacter le support
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}