import React, { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HelpCircle, MessageCircle, Mail, Phone, Search, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react'

export default function SupportPage() {
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')
  const [ticketPriority, setTicketPriority] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const supportStats = [
    { label: 'Temps de réponse moyen', value: '< 4h', icon: Clock },
    { label: 'Taux de résolution', value: '96%', icon: CheckCircle },
    { label: 'Tickets résolus ce mois', value: '2,847', icon: Zap },
    { label: 'Note de satisfaction', value: '4.8/5', icon: HelpCircle }
  ]

  const contactMethods = [
    {
      title: 'Chat en Direct',
      description: 'Support instantané pendant les heures ouvrables',
      availability: 'Lun-Ven 9h-18h (CET)',
      responseTime: 'Immédiat',
      icon: MessageCircle,
      action: 'Démarrer le chat'
    },
    {
      title: 'Ticket Support',
      description: 'Pour les questions techniques détaillées',
      availability: '24h/24, 7j/7',
      responseTime: '< 4h',
      icon: Mail,
      action: 'Créer un ticket'
    },
    {
      title: 'Support Téléphonique',
      description: 'Pour les clients Premium et Enterprise',
      availability: 'Lun-Ven 9h-17h (CET)',
      responseTime: 'Immédiat',
      icon: Phone,
      action: 'Programmer un appel'
    }
  ]

  const faqItems = [
    {
      id: 'installation',
      question: 'Comment installer une extension Chrome ?',
      answer: 'Pour installer une extension Chrome : 1) Téléchargez le fichier .zip depuis notre marketplace, 2) Ouvrez Chrome et allez dans chrome://extensions/, 3) Activez le mode développeur, 4) Cliquez sur "Charger l\'extension non empaquetée" et sélectionnez le dossier extrait.',
      category: 'Installation',
      helpful: 124,
      notHelpful: 8
    },
    {
      id: 'permissions',
      question: 'Pourquoi l\'extension demande-t-elle certaines permissions ?',
      answer: 'Les extensions demandent des permissions spécifiques pour fonctionner correctement. Par exemple, l\'accès aux onglets permet de détecter les pages web, et l\'accès au stockage permet de sauvegarder vos configurations. Nous suivons le principe du moindre privilège.',
      category: 'Sécurité',
      helpful: 89,
      notHelpful: 12
    },
    {
      id: 'pricing',
      question: 'Quels sont les différents plans tarifaires ?',
      answer: 'Nous proposons 3 plans : Standard (gratuit) avec fonctionnalités de base, Pro (€19/mois) avec features avancées et Analytics, et Ultra Pro (€49/mois) avec toutes les fonctionnalités, API illimitée et support prioritaire.',
      category: 'Facturation',
      helpful: 156,
      notHelpful: 5
    },
    {
      id: 'api-limits',
      question: 'Quelles sont les limites de l\'API ?',
      answer: 'Les limites dépendent de votre plan : Standard (100 requêtes/heure), Pro (1000 requêtes/heure), Ultra Pro (illimité). Les limites se réinitialisent chaque heure. Pour des besoins spécifiques, contactez notre équipe.',
      category: 'API',
      helpful: 73,
      notHelpful: 3
    },
    {
      id: 'data-security',
      question: 'Comment mes données sont-elles protégées ?',
      answer: 'Toutes les données sont chiffrées en transit (TLS 1.3) et au repos (AES-256). Nous ne stockons jamais vos mots de passe en clair et appliquons des politiques strictes de sécurité. Conformité RGPD assurée.',
      category: 'Sécurité',
      helpful: 201,
      notHelpful: 7
    },
    {
      id: 'troubleshooting',
      question: 'L\'extension ne fonctionne pas, que faire ?',
      answer: 'Étapes de dépannage : 1) Vérifiez que l\'extension est activée, 2) Rechargez la page et l\'extension, 3) Vérifiez la console pour les erreurs (F12), 4) Testez en mode navigation privée, 5) Si le problème persiste, contactez le support avec les logs.',
      category: 'Dépannage',
      helpful: 167,
      notHelpful: 23
    }
  ]

  const tickets = [
    {
      id: 'TIC-2024-001',
      subject: 'Erreur de synchronisation avec l\'API Shopify',
      status: 'open',
      priority: 'high',
      created: '2024-01-15 10:30',
      lastUpdate: '2024-01-15 14:20',
      responses: 3
    },
    {
      id: 'TIC-2024-002',
      subject: 'Question sur les limites de scraping',
      status: 'resolved',
      priority: 'medium',
      created: '2024-01-14 16:45',
      lastUpdate: '2024-01-15 09:15',
      responses: 5
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { variant: 'secondary' as const, text: 'Ouvert' },
      resolved: { variant: 'default' as const, text: 'Résolu' },
      pending: { variant: 'outline' as const, text: 'En attente' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { variant: 'destructive' as const, text: 'Haute' },
      medium: { variant: 'secondary' as const, text: 'Moyenne' },
      low: { variant: 'outline' as const, text: 'Basse' }
    }
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement ticket creation
    setTicketSubject('')
    setTicketMessage('')
    setTicketPriority('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Support & Assistance
        </h1>
        <p className="text-muted-foreground mt-2">
          Obtenez l'aide dont vous avez besoin pour utiliser nos extensions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {supportStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="tickets">Mes Tickets</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Questions Fréquemment Posées</CardTitle>
              <CardDescription>
                Trouvez rapidement des réponses aux questions les plus courantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher dans la FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Accordion type="single" collapsible className="space-y-2">
                {filteredFAQ.map((item) => (
                  <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-left">{item.question}</span>
                        <Badge variant="outline" className="ml-2">{item.category}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <p className="text-muted-foreground">{item.answer}</p>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-muted-foreground">Cette réponse vous a-t-elle aidé ?</span>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              👍 {item.helpful}
                            </Button>
                            <Button variant="outline" size="sm">
                              👎 {item.notHelpful}
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

        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon
              return (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <Icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold text-lg mb-2">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{method.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="text-xs text-muted-foreground">
                        <strong>Disponibilité:</strong> {method.availability}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <strong>Temps de réponse:</strong> {method.responseTime}
                      </div>
                    </div>
                    <Button className="w-full">{method.action}</Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Créer un Ticket de Support</CardTitle>
              <CardDescription>
                Décrivez votre problème en détail pour une assistance rapide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Sujet</label>
                    <Input
                      id="subject"
                      placeholder="Résumez votre problème en quelques mots"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="priority" className="text-sm font-medium">Priorité</label>
                    <Select value={ticketPriority} onValueChange={setTicketPriority} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse - Question générale</SelectItem>
                        <SelectItem value="medium">Moyenne - Problème fonctionnel</SelectItem>
                        <SelectItem value="high">Haute - Erreur critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">Description détaillée</label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre problème, les étapes pour le reproduire, et toute information utile..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    rows={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Envoyer le ticket
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes Tickets de Support</CardTitle>
              <CardDescription>
                Suivez l'état de vos demandes de support
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun ticket de support pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-sm text-muted-foreground">{ticket.id}</span>
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <span className="text-sm text-muted-foreground">{ticket.responses} réponses</span>
                        </div>
                        
                        <h3 className="font-semibold mb-2">{ticket.subject}</h3>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Créé le {ticket.created}</span>
                          <span>Dernière mise à jour : {ticket.lastUpdate}</span>
                        </div>
                        
                        <div className="flex justify-end mt-3 space-x-2">
                          <Button variant="outline" size="sm">Voir détails</Button>
                          {ticket.status === 'open' && (
                            <Button size="sm">Répondre</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Guide de démarrage rapide
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Documentation API complète
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Tutoriels vidéo
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Exemples de code
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communauté</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Forum communautaire
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Discord officiel
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Stack Overflow
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  GitHub Discussions
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}