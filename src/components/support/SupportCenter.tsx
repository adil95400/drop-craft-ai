import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search, HelpCircle, MessageCircle, Phone, Mail,
  Book, Video, FileText, ExternalLink, Clock,
  CheckCircle, AlertCircle, Loader2, Send, Plus
} from 'lucide-react'
import { useSupportTickets, useTicketMessages } from '@/hooks/useSupportTickets'
import { CreateTicketDialog } from './CreateTicketDialog'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
}

const faqData: FAQItem[] = [
  { id: '1', question: 'Comment ajouter un nouveau produit ?', answer: 'Pour ajouter un nouveau produit, rendez-vous dans la section "Produits" puis cliquez sur "Ajouter un produit". Remplissez les informations requises comme le nom, la description, le prix et les images.', category: 'Produits', helpful: 15 },
  { id: '2', question: 'Comment configurer les notifications automatiques ?', answer: 'Les notifications automatiques se configurent dans "Paramètres > Notifications". Vous pouvez activer les alertes pour les commandes, les stocks faibles, et les erreurs système.', category: 'Automation', helpful: 12 },
  { id: '3', question: 'Que faire si mon stock est incorrect ?', answer: 'Si votre stock est incorrect, vous pouvez l\'ajuster manuellement dans "Produits > [Votre produit] > Stock" ou utiliser l\'import en masse via fichier CSV.', category: 'Inventory', helpful: 8 },
  { id: '4', question: 'Comment interpréter mes analytics ?', answer: 'Le dashboard analytics vous montre vos KPIs principaux : chiffre d\'affaires, nombre de commandes, taux de conversion. Utilisez les filtres de date pour analyser les tendances.', category: 'Analytics', helpful: 20 },
]

function TicketDetailDialog({ ticketId, open, onOpenChange }: { ticketId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { messages, isLoading, addMessage, isAddingMessage } = useTicketMessages(ticketId)
  const [newMessage, setNewMessage] = useState('')

  const handleSend = () => {
    if (!ticketId || !newMessage.trim()) return
    addMessage({ ticketId, message: newMessage.trim() })
    setNewMessage('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Conversation du ticket</DialogTitle>
          <DialogDescription>Historique et réponses</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64 border rounded-lg p-3 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun message pour l'instant.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`mb-3 p-3 rounded-lg text-sm ${msg.is_staff ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'}`}>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">{msg.is_staff ? 'Support' : 'Vous'}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString('fr-FR')}</span>
                </div>
                <p>{msg.message}</p>
              </div>
            ))
          )}
        </ScrollArea>
        <div className="flex gap-2">
          <Textarea
            placeholder="Votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[60px]"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} disabled={isAddingMessage || !newMessage.trim()} size="icon" className="shrink-0">
            {isAddingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SupportCenter() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const { tickets, isLoadingTickets } = useSupportTickets()

  const categories = ['all', 'Produits', 'Automation', 'Inventory', 'Analytics']

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'pending': case 'in_progress': return <Clock className="h-4 w-4 text-warning" />
      case 'resolved': case 'closed': return <CheckCircle className="h-4 w-4 text-success" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-destructive/10 text-destructive'
      case 'pending': case 'in_progress': return 'bg-warning/10 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'resolved': case 'closed': return 'bg-success/10 text-success dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': case 'urgent': return 'bg-destructive/10 text-destructive'
      case 'medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'low': return 'bg-info/10 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-muted text-muted-foreground'
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
          <Input placeholder="Rechercher dans la FAQ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="tickets">Mes Tickets {tickets.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{tickets.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button key={category} variant={selectedCategory === category ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(category)}>
                {category === 'all' ? 'Toutes' : category}
              </Button>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>Questions Fréquentes</CardTitle></CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQ.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center justify-between w-full mr-4">
                        <span>{item.question}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                          <span className="text-xs text-muted-foreground">👍 {item.helpful}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">{item.answer}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Cette réponse vous a-t-elle aidé ?</span>
                          <Button variant="outline" size="sm">👍 Oui</Button>
                          <Button variant="outline" size="sm">👎 Non</Button>
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
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Ticket
            </Button>
          </div>

          {isLoadingTickets ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <MessageCircle className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">Aucun ticket</h3>
                <p className="text-sm text-muted-foreground mb-4">Vous n'avez pas encore créé de ticket de support.</p>
                <Button onClick={() => setCreateOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Créer un ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(ticket.status)}
                          <h3 className="font-medium">{ticket.subject}</h3>
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status.toUpperCase()}</Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>#{ticket.id.slice(0, 8)}</span>
                          <span>Créé le {new Date(ticket.created_at).toLocaleDateString('fr-FR')}</span>
                          <span>MAJ: {new Date(ticket.updated_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => setSelectedTicketId(ticket.id)}>
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
          <TicketDetailDialog ticketId={selectedTicketId} open={!!selectedTicketId} onOpenChange={(v) => { if (!v) setSelectedTicketId(null); }} />
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Video className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Guide de Démarrage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Découvrez comment configurer votre boutique en 10 minutes</p>
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
                <p className="text-muted-foreground mb-4">Documentation complète pour intégrer nos APIs</p>
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
                <p className="text-muted-foreground mb-4">Conseils pour optimiser votre boutique en ligne</p>
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
                <CardTitle className="flex items-center"><MessageCircle className="h-5 w-5 mr-2" />Chat en Direct</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Discutez avec notre équipe support en temps réel</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm"><span>Temps d'attente moyen:</span><Badge variant="secondary">2 min</Badge></div>
                  <div className="flex items-center justify-between text-sm"><span>Disponibilité:</span><Badge className="bg-success/10 text-success dark:bg-green-900/30 dark:text-green-400">En ligne</Badge></div>
                </div>
                <Button className="w-full">Démarrer le chat</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Phone className="h-5 w-5 mr-2" />Support Téléphonique</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Appelez-nous directement pour un support immédiat</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm"><span>Numéro:</span><span className="font-mono">+33 1 23 45 67 89</span></div>
                  <div className="flex items-center justify-between text-sm"><span>Horaires:</span><span>9h-18h (Lun-Ven)</span></div>
                </div>
                <Button variant="outline" className="w-full"><Phone className="h-4 w-4 mr-2" />Appeler maintenant</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Mail className="h-5 w-5 mr-2" />Email Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Envoyez-nous un email détaillé de votre problème</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm"><span>Email:</span><span>support@shopopti.com</span></div>
                  <div className="flex items-center justify-between text-sm"><span>Réponse sous:</span><span>24h</span></div>
                </div>
                <Button variant="outline" className="w-full"><Mail className="h-4 w-4 mr-2" />Envoyer un email</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><HelpCircle className="h-5 w-5 mr-2" />Support Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Support prioritaire avec un temps de réponse garanti</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm"><span>Réponse garantie:</span><Badge variant="secondary">1h</Badge></div>
                  <div className="flex items-center justify-between text-sm"><span>Manager dédié:</span><Badge variant="secondary">Inclus</Badge></div>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-primary/80">Upgrade vers Premium</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
