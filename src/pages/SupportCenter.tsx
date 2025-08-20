import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  HelpCircle, MessageSquare, FileText, Search, Plus, Phone, Mail,
  Clock, CheckCircle, AlertCircle, BookOpen, Video, Download
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Ticket {
  id: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  responses: Array<{
    id: string
    message: string
    from: 'user' | 'support'
    created_at: string
  }>
}

export default function SupportCenter() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  })

  // Mock tickets data
  const tickets: Ticket[] = [
    {
      id: '1',
      title: 'Problème de synchronisation des produits',
      description: 'Les produits ne se synchronisent pas correctement avec ma boutique Shopify.',
      category: 'Integration',
      priority: 'high',
      status: 'in_progress',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      responses: [
        {
          id: '1',
          message: 'Bonjour, merci pour votre demande. Nous allons vérifier la configuration de votre intégration Shopify.',
          from: 'support',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: '2',
      title: 'Demande de fonctionnalité: Export PDF',
      description: 'Serait-il possible d\'ajouter une fonction d\'export PDF pour les rapports ?',
      category: 'Feature Request',
      priority: 'medium',
      status: 'open',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      responses: []
    }
  ]

  const faqItems = [
    {
      question: 'Comment intégrer ma boutique Shopify ?',
      answer: 'Pour intégrer votre boutique Shopify, rendez-vous dans la section Intégrations, cliquez sur "Ajouter une intégration" et sélectionnez Shopify. Vous devrez ensuite fournir votre nom de domaine et vos clés API.'
    },
    {
      question: 'Puis-je importer des produits en masse ?',
      answer: 'Oui, vous pouvez importer des produits en masse via un fichier CSV ou en utilisant nos connecteurs d\'API. Rendez-vous dans la section Import pour commencer.'
    },
    {
      question: 'Comment fonctionne la facturation ?',
      answer: 'La facturation est mensuelle et basée sur votre plan d\'abonnement. Vous pouvez consulter et modifier votre plan dans les paramètres de votre compte.'
    },
    {
      question: 'Que faire si j\'ai oublié mon mot de passe ?',
      answer: 'Cliquez sur "Mot de passe oublié" sur la page de connexion et suivez les instructions envoyées par email.'
    },
    {
      question: 'Comment contacter le support technique ?',
      answer: 'Vous pouvez nous contacter via ce centre de support en créant un ticket, ou directement par email à support@exemple.com.'
    }
  ]

  const resources = [
    {
      title: 'Guide de démarrage rapide',
      description: 'Apprenez les bases en 10 minutes',
      type: 'guide',
      icon: BookOpen,
      url: '#'
    },
    {
      title: 'Tutoriels vidéo',
      description: 'Vidéos étape par étape',
      type: 'video',
      icon: Video,
      url: '#'
    },
    {
      title: 'Documentation API',
      description: 'Référence complète de l\'API',
      type: 'documentation',
      icon: FileText,
      url: '#'
    },
    {
      title: 'Modèles d\'import',
      description: 'Fichiers CSV prêts à utiliser',
      type: 'download',
      icon: Download,
      url: '#'
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'secondary'
      case 'medium': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'default'
      case 'in_progress': return 'secondary'
      case 'closed': return 'outline'
      default: return 'destructive'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      case 'in_progress': return <Clock className="w-4 h-4" />
      case 'closed': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const handleCreateTicket = () => {
    if (!ticketForm.title || !ticketForm.description || !ticketForm.category) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Ticket créé',
      description: 'Votre demande de support a été créée avec succès.'
    })

    setTicketForm({
      title: '',
      description: '',
      category: '',
      priority: 'medium'
    })
    setIsCreateTicketOpen(false)
  }

  const filteredFAQ = faqItems.filter(item =>
    !searchTerm || 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Centre de Support</h1>
            <p className="text-muted-foreground">
              Trouvez de l'aide et contactez notre équipe de support
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            +33 1 23 45 67 89
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            support@exemple.com
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tickets ouverts</p>
                <p className="text-2xl font-bold">
                  {tickets.filter(t => t.status === 'open').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">
                  {tickets.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Résolus</p>
                <p className="text-2xl font-bold">
                  {tickets.filter(t => t.status === 'resolved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Temps de réponse</p>
                <p className="text-2xl font-bold">2h</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tickets">Mes Tickets</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans mes tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Créer un ticket de support</DialogTitle>
                  <DialogDescription>
                    Décrivez votre problème ou votre demande en détail
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={ticketForm.title}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Résumé de votre problème"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select
                      value={ticketForm.category}
                      onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Problème technique</SelectItem>
                        <SelectItem value="Integration">Intégration</SelectItem>
                        <SelectItem value="Billing">Facturation</SelectItem>
                        <SelectItem value="Feature Request">Demande de fonctionnalité</SelectItem>
                        <SelectItem value="Other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Select
                      value={ticketForm.priority}
                      onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Décrivez votre problème en détail..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateTicket} className="flex-1">
                      Créer le ticket
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateTicketOpen(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun ticket</h3>
                  <p className="text-muted-foreground mb-4">
                    Vous n'avez pas encore créé de ticket de support.
                  </p>
                  <Button onClick={() => setIsCreateTicketOpen(true)}>
                    Créer votre premier ticket
                  </Button>
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(ticket.status)}
                          <h4 className="font-medium">{ticket.title}</h4>
                          <Badge variant={getPriorityColor(ticket.priority)}>
                            {ticket.priority === 'urgent' ? 'Urgent' :
                             ticket.priority === 'high' ? 'Élevée' :
                             ticket.priority === 'medium' ? 'Moyenne' : 'Faible'}
                          </Badge>
                          <Badge variant={getStatusColor(ticket.status)}>
                            {ticket.status === 'open' ? 'Ouvert' :
                             ticket.status === 'in_progress' ? 'En cours' :
                             ticket.status === 'resolved' ? 'Résolu' : 'Fermé'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>#{ticket.id}</span>
                          <span>{ticket.category}</span>
                          <span>Créé le {format(new Date(ticket.created_at), 'PPp', { locale: fr })}</span>
                          <span>Mis à jour le {format(new Date(ticket.updated_at), 'PPp', { locale: fr })}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans la FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Questions Fréquemment Posées</CardTitle>
              <CardDescription>
                Trouvez rapidement des réponses aux questions les plus courantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQ.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {resources.map((resource, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <resource.icon className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{resource.title}</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        {resource.description}
                      </p>
                      <Button variant="outline" size="sm">
                        Accéder
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Nous Contacter</CardTitle>
                <CardDescription>
                  Plusieurs moyens pour nous joindre
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">support@exemple.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Téléphone</p>
                    <p className="text-sm text-muted-foreground">+33 1 23 45 67 89</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Horaires</p>
                    <p className="text-sm text-muted-foreground">Lun-Ven: 9h-18h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Temps de Réponse</CardTitle>
                <CardDescription>
                  Nos engagements selon la priorité
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Urgent</span>
                  <Badge variant="destructive">&lt; 1h</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Élevée</span>
                  <Badge variant="secondary">&lt; 4h</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Moyenne</span>
                  <Badge variant="outline">&lt; 24h</Badge>
                </div>
                <div className="flesh justify-between items-center">
                  <span>Faible</span>
                  <Badge variant="outline">&lt; 72h</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon(selectedTicket.status)}
                {selectedTicket.title}
              </DialogTitle>
              <DialogDescription>
                Ticket #{selectedTicket.id} • {selectedTicket.category}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={getPriorityColor(selectedTicket.priority)}>
                  Priorité: {selectedTicket.priority}
                </Badge>
                <Badge variant={getStatusColor(selectedTicket.status)}>
                  {selectedTicket.status}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.responses.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Échanges</h4>
                  <div className="space-y-3">
                    {selectedTicket.responses.map((response) => (
                      <div
                        key={response.id}
                        className={`p-3 rounded ${
                          response.from === 'support' 
                            ? 'bg-primary/10 border-l-4 border-primary' 
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            {response.from === 'support' ? 'Support' : 'Vous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(response.created_at), 'PPp', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm">{response.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="response">Ajouter une réponse</Label>
                <Textarea
                  id="response"
                  placeholder="Votre message..."
                  className="mt-2"
                />
                <Button className="mt-2">
                  Envoyer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}