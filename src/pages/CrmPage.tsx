import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  Search,
  Plus,
  Filter,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  Star,
  Activity,
  Target,
  Send,
  UserPlus,
  MessageSquare,
  BarChart3,
  Zap,
  Heart,
  Clock,
  ShoppingCart,
  ChevronRight
} from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  status: 'active' | 'inactive' | 'lead' | 'customer'
  lifecycle_stage: 'subscriber' | 'lead' | 'opportunity' | 'customer' | 'evangelist'
  lead_score: number
  total_orders?: number
  total_spent?: number
  last_contacted_at?: string
  last_activity_at?: string
  source?: string
  tags: string[]
  created_at: string
}

interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms' | 'push'
  status: 'draft' | 'active' | 'paused' | 'completed'
  sent_count: number
  open_rate: number
  click_rate: number
  conversion_rate: number
  created_at: string
}

const CrmPage = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)

  // Load real contacts and campaigns from Supabase
  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      setLoading(true)
      try {
        // Load contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from('crm_contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('lead_score', { ascending: false })

        if (contactsError) throw contactsError

        // Map crm_contacts to Contact format
        const mappedContacts = (contactsData || []).map(contact => ({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone || undefined,
          company: contact.company || undefined,
          position: contact.position || undefined,
          status: (contact.status || 'active') as 'active' | 'inactive' | 'lead' | 'customer',
          lifecycle_stage: (contact.lifecycle_stage || 'subscriber') as 'subscriber' | 'lead' | 'opportunity' | 'customer' | 'evangelist',
          lead_score: contact.lead_score || 0,
          total_orders: 0,
          total_spent: 0,
          last_contacted_at: contact.last_contacted_at || undefined,
          last_activity_at: contact.last_activity_at || undefined,
          source: contact.source || undefined,
          tags: contact.tags || [],
          created_at: contact.created_at
        }))

        setContacts(mappedContacts)

        // Load campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('automated_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (campaignsError) throw campaignsError

        // Map automated_campaigns to Campaign format
        const mappedCampaigns = (campaignsData || []).map(camp => ({
          id: camp.id,
          name: camp.campaign_name,
          type: camp.campaign_type as 'email' | 'sms' | 'push',
          status: camp.status as 'draft' | 'active' | 'paused' | 'completed',
          sent_count: (camp.current_metrics as any)?.sent || 0,
          open_rate: (camp.current_metrics as any)?.open_rate || 0,
          click_rate: (camp.current_metrics as any)?.click_rate || 0,
          conversion_rate: (camp.current_metrics as any)?.conversion_rate || 0,
          created_at: camp.created_at
        }))

        setCampaigns(mappedCampaigns)
      } catch (error) {
        console.error('Error loading CRM data:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données CRM',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id, toast])

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus
    const matchesStage = selectedStage === 'all' || contact.lifecycle_stage === selectedStage
    return matchesSearch && matchesStatus && matchesStage
  })

  const getStageColor = (stage: string) => {
    const colors = {
      subscriber: 'bg-gray-100 text-gray-800',
      lead: 'bg-blue-100 text-blue-800',
      opportunity: 'bg-yellow-100 text-yellow-800',
      customer: 'bg-green-100 text-green-800',
      evangelist: 'bg-purple-100 text-purple-800'
    }
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleContactAction = (action: string, contact: Contact) => {
    switch (action) {
      case 'email':
        window.open(`mailto:${contact.email}`, '_blank')
        break
      case 'call':
        if (contact.phone) {
          window.open(`tel:${contact.phone}`, '_blank')
        }
        break
      case 'edit':
        setSelectedContact(contact)
        setIsContactDialogOpen(true)
        break
      default:
        toast({
          title: "Action simulée",
          description: `Action "${action}" pour ${contact.name}`
        })
    }
  }

  const handleCreateCampaign = () => {
    toast({
      title: "Créateur de campagne",
      description: "Fonctionnalité de création de campagne marketing à venir"
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            CRM & Marketing
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos contacts, prospects et campagnes marketing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateCampaign}>
            <Send className="mr-2 h-4 w-4" />
            Nouvelle Campagne
          </Button>
          <Button onClick={() => setIsContactDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouveau Contact
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-6">
          {/* CRM Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contacts</p>
                    <p className="text-2xl font-bold">{contacts.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Leads Actifs</p>
                    <p className="text-2xl font-bold">{contacts.filter(c => c.lifecycle_stage === 'lead').length}</p>
                  </div>
                  <Target className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clients</p>
                    <p className="text-2xl font-bold">{contacts.filter(c => c.lifecycle_stage === 'customer').length}</p>
                  </div>
                  <Heart className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">CA Total</p>
                    <p className="text-2xl font-bold">
                      ${contacts.reduce((acc, c) => acc + (c.total_spent || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Rechercher contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="customer">Client</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Étape" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes étapes</SelectItem>
                    <SelectItem value="subscriber">Abonné</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="opportunity">Opportunité</SelectItem>
                    <SelectItem value="customer">Client</SelectItem>
                    <SelectItem value="evangelist">Ambassadeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contacts List */}
          <div className="grid gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`} />
                        <AvatarFallback>
                          {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{contact.name}</h3>
                          <Badge className={getStageColor(contact.lifecycle_stage)}>
                            {contact.lifecycle_stage}
                          </Badge>
                          {contact.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                          {contact.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </div>
                          )}
                          {contact.company && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {contact.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Score Lead:</span>
                          <span className={`font-bold ${getScoreColor(contact.lead_score)}`}>
                            {contact.lead_score}/100
                          </span>
                        </div>
                        {contact.total_spent ? (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              ${contact.total_spent.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({contact.total_orders} commandes)
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Aucun achat
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContactAction('email', contact)}
                        >
                          <Mail className="h-3 w-3" />
                        </Button>
                        {contact.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContactAction('call', contact)}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContactAction('edit', contact)}
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Campaign Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Campagnes Actives</p>
                    <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Emails Envoyés</p>
                    <p className="text-2xl font-bold">
                      {campaigns.reduce((acc, c) => acc + c.sent_count, 0).toLocaleString()}
                    </p>
                  </div>
                  <Send className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taux d'Ouverture Moy.</p>
                    <p className="text-2xl font-bold">
                      {(campaigns.reduce((acc, c) => acc + c.open_rate, 0) / campaigns.length).toFixed(1)}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Moy.</p>
                    <p className="text-2xl font-bold">
                      {(campaigns.reduce((acc, c) => acc + c.conversion_rate, 0) / campaigns.length).toFixed(1)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns List */}
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {campaign.type === 'email' && <Mail className="h-5 w-5 text-primary" />}
                        {campaign.type === 'sms' && <MessageSquare className="h-5 w-5 text-primary" />}
                        {campaign.type === 'push' && <Send className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          Campagne {campaign.type} • {campaign.sent_count.toLocaleString()} envoyés
                        </p>
                      </div>
                    </div>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Taux d'ouverture</span>
                        <span className="font-medium">{campaign.open_rate}%</span>
                      </div>
                      <Progress value={campaign.open_rate} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Taux de clic</span>
                        <span className="font-medium">{campaign.click_rate}%</span>
                      </div>
                      <Progress value={campaign.click_rate} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Conversion</span>
                        <span className="font-medium">{campaign.conversion_rate}%</span>
                      </div>
                      <Progress value={campaign.conversion_rate} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics CRM</CardTitle>
              <CardDescription>
                Analysez les performances de vos efforts marketing et CRM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Avancés</h3>
                <p className="text-muted-foreground mb-4">
                  Tableaux de bord interactifs et rapports détaillés à venir
                </p>
                <Button variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Voir les métriques détaillées
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Automation</CardTitle>
              <CardDescription>
                Automatisez vos campagnes et workflows marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Automation Avancée</h3>
                <p className="text-muted-foreground mb-4">
                  Workflows automatisés, déclencheurs et séquences marketing
                </p>
                <Button variant="outline" onClick={handleCreateCampaign}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedContact ? 'Modifier le contact' : 'Nouveau contact'}
            </DialogTitle>
            <DialogDescription>
              Ajoutez ou modifiez les informations du contact
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Formulaire de contact à venir
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CrmPage