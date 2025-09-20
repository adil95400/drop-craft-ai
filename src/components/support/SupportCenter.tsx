import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Search,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Book,
  Video,
  FileText,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
}

interface SupportTicket {
  id: string
  subject: string
  status: 'open' | 'pending' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  created: Date
  lastUpdate: Date
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Comment ajouter un nouveau produit ?',
    answer: 'Pour ajouter un nouveau produit, rendez-vous dans la section "Produits" puis cliquez sur "Ajouter un produit". Remplissez les informations requises comme le nom, la description, le prix et les images.',
    category: 'Produits',
    helpful: 15
  },
  {
    id: '2',
    question: 'Comment configurer les notifications automatiques ?',
    answer: 'Les notifications automatiques se configurent dans "Paramètres > Notifications". Vous pouvez activer les alertes pour les commandes, les stocks faibles, et les erreurs système.',
    category: 'Automation',
    helpful: 12
  },
  {
    id: '3',
    question: 'Que faire si mon stock est incorrect ?',
    answer: 'Si votre stock est incorrect, vous pouvez l\'ajuster manuellement dans "Produits > [Votre produit] > Stock" ou utiliser l\'import en masse via fichier CSV.',
    category: 'Inventory',
    helpful: 8
  },
  {
    id: '4',
    question: 'Comment interpréter mes analytics ?',
    answer: 'Le dashboard analytics vous montre vos KPIs principaux : chiffre d\'affaires, nombre de commandes, taux de conversion. Utilisez les filtres de date pour analyser les tendances.',
    category: 'Analytics',
    helpful: 20
  }
]

const supportTickets: SupportTicket[] = [
  {
    id: 'TICK-001',
    subject: 'Problème de synchronisation des stocks',
    status: 'open',
    priority: 'high',
    created: new Date('2024-01-15'),
    lastUpdate: new Date('2024-01-16')
  },
  {
    id: 'TICK-002',
    subject: 'Question sur l\'API automation',
    status: 'pending',
    priority: 'medium',
    created: new Date('2024-01-14'),
    lastUpdate: new Date('2024-01-15')
  }
]

export function SupportCenter() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', 'Produits', 'Automation', 'Inventory', 'Analytics']
  
  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <HelpCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-orange-100 text-orange-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Centre de Support</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Trouvez rapidement les réponses à vos questions ou contactez notre équipe support
        </p>
        
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans la FAQ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="tickets">Mes Tickets</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'Toutes' : category}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Questions Fréquentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQ.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center justify-between w-full mr-4">
                        <span>{item.question}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            👍 {item.helpful}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">{item.answer}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Cette réponse vous a-t-elle aidé ?</span>
                          <Button variant="outline" size="sm">
                            👍 Oui
                          </Button>
                          <Button variant="outline" size="sm">
                            👎 Non
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mes Tickets de Support</h2>
            <Button>
              <MessageCircle className="h-4 w-4 mr-2" />
              Nouveau Ticket
            </Button>
          </div>

          <div className="space-y-4">
            {supportTickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(ticket.status)}
                        <h3 className="font-medium">{ticket.subject}</h3>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.toUpperCase()}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Ticket #{ticket.id}</span>
                        <span>Créé le {ticket.created.toLocaleDateString()}</span>
                        <span>Dernière MAJ: {ticket.lastUpdate.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button variant="outline">
                      Voir détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Video className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Guide de Démarrage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Découvrez comment configurer votre boutique en 10 minutes
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">8 min</Badge>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Book className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Documentation API</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Documentation complète pour intégrer nos APIs
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Documentation</Badge>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Bonnes Pratiques</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Conseils pour optimiser votre boutique en ligne
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Guide</Badge>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Chat en Direct
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Discutez avec notre équipe support en temps réel
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Temps d'attente moyen:</span>
                    <Badge variant="secondary">2 min</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Disponibilité:</span>
                    <Badge className="bg-green-100 text-green-800">En ligne</Badge>
                  </div>
                </div>
                <Button className="w-full">
                  Démarrer le chat
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Support Téléphonique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Appelez-nous directement pour un support immédiat
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Numéro:</span>
                    <span className="font-mono">+33 1 23 45 67 89</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Horaires:</span>
                    <span>9h-18h (Lun-Ven)</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Appeler maintenant
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Envoyez-nous un email détaillé de votre problème
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Email:</span>
                    <span>support@dropcraft.ai</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Réponse sous:</span>
                    <span>24h</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Support Premium
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Support prioritaire avec un temps de réponse garanti
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Réponse garantie:</span>
                    <Badge className="bg-gold-100 text-gold-800">1h</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Manager dédié:</span>
                    <Badge variant="secondary">Inclus</Badge>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-primary/80">
                  Upgrade vers Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}