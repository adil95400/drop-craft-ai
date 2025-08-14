import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, HelpCircle, MessageSquare, Phone, Mail, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useRealSupport } from "@/hooks/useRealSupport"

export default function Support() {
  const [searchQuery, setSearchQuery] = useState("")
  const { tickets, faqItems, stats, isLoading, createTicket, markFAQHelpful, isCreatingTicket } = useRealSupport()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500'
      case 'pending': return 'bg-yellow-500'
      case 'resolved': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Ouvert'
      case 'pending': return 'En attente'
      case 'resolved': return 'Résolu'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-orange-500'
      case 'low': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Support & Centre d'aide</h1>
            <p className="text-muted-foreground mt-2">
              Trouvez des réponses à vos questions ou contactez notre équipe
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Phone className="w-4 h-4 mr-2" />
              Demander un rappel
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <MessageSquare className="w-4 h-4 mr-2" />
              Nouveau Ticket
            </Button>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Chat en Direct</h3>
              <p className="text-sm text-muted-foreground mb-3">Réponse immédiate</p>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Démarrer le Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-3">Réponse sous 4h</p>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Envoyer Email
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <Phone className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Téléphone</h3>
              <p className="text-sm text-muted-foreground mb-3">Lun-Ven 9h-18h</p>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                +33 1 23 45 67 89
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans la base de connaissances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-12 text-lg"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="tickets">Mes Tickets</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="resources">Ressources</TabsTrigger>
          </TabsList>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Questions Fréquentes
                </CardTitle>
                <CardDescription>
                  Trouvez rapidement des réponses aux questions les plus courantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <details key={index} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                      <summary className="cursor-pointer font-semibold flex items-center justify-between">
                        <span>{item.question}</span>
                        <Badge variant="outline">{item.category}</Badge>
                      </summary>
                      <div className="mt-3 text-muted-foreground">
                        {item.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Mes Tickets de Support</CardTitle>
                <CardDescription>
                  Suivez l'état de vos demandes de support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{ticket.subject}</h3>
                            <Badge variant="outline">{ticket.ticket_number}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Créé le {new Date(ticket.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>Mis à jour {new Date(ticket.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusText(ticket.status)}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Voir Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Créer un Ticket</CardTitle>
                  <CardDescription>
                    Décrivez votre problème et nous vous aiderons rapidement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Sujet</label>
                      <Input placeholder="Décrivez brièvement votre problème" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Catégorie</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Problème technique</SelectItem>
                          <SelectItem value="billing">Facturation</SelectItem>
                          <SelectItem value="feature">Demande de fonctionnalité</SelectItem>
                          <SelectItem value="integration">Intégration</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Priorité</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la priorité" />
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
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea 
                        placeholder="Décrivez votre problème en détail..."
                        rows={6}
                      />
                    </div>
                    
                    <Button className="w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Créer le Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informations de Contact</CardTitle>
                  <CardDescription>
                    Plusieurs moyens de nous contacter selon vos préférences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-muted-foreground mt-1" />
                      <div>
                        <h3 className="font-semibold">Heures d'ouverture</h3>
                        <p className="text-sm text-muted-foreground">
                          Lundi - Vendredi: 9h00 - 18h00<br />
                          Weekend: Support en ligne uniquement
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                      <div>
                        <h3 className="font-semibold">Temps de réponse</h3>
                        <p className="text-sm text-muted-foreground">
                          Chat: Immédiat<br />
                          Email: 4h en moyenne<br />
                          Téléphone: Immédiat aux heures d'ouverture
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-semibold">Support Prioritaire</h3>
                        <p className="text-sm text-muted-foreground">
                          Les clients Premium bénéficient d'un support prioritaire avec des temps de réponse réduits.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>📚 Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Guide de démarrage rapide</li>
                    <li>• Tutoriels vidéo</li>
                    <li>• API Documentation</li>
                    <li>• Bonnes pratiques</li>
                  </ul>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Accéder à la Doc
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🎓 Formations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Webinaires en direct</li>
                    <li>• Cours en ligne</li>
                    <li>• Certification Shopopti</li>
                    <li>• Sessions personnalisées</li>
                  </ul>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Voir les Formations
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>👥 Communauté</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Forum utilisateurs</li>
                    <li>• Discord communauté</li>
                    <li>• Groupes Facebook</li>
                    <li>• Événements utilisateurs</li>
                  </ul>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Rejoindre la Communauté
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  )
}