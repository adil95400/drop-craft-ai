import { useState } from 'react'
import { Mail, Send, FileText, Archive, Star, Search, Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface EmailCampaign {
  id: string
  subject: string
  status: 'sent' | 'draft' | 'scheduled'
  recipients: number
  openRate: number
  clickRate: number
  sentAt?: string
  scheduledAt?: string
  content: string
}

const mockCampaigns: EmailCampaign[] = [
  {
    id: '1',
    subject: 'Offre spéciale - 20% sur tous nos produits',
    status: 'sent',
    recipients: 1250,
    openRate: 32.5,
    clickRate: 8.7,
    sentAt: '2024-01-15T10:00:00',
    content: 'Profitez de notre offre exceptionnelle...'
  },
  {
    id: '2',
    subject: 'Nouveautés de la semaine',
    status: 'scheduled',
    recipients: 890,
    openRate: 0,
    clickRate: 0,
    scheduledAt: '2024-01-20T09:00:00',
    content: 'Découvrez nos derniers produits...'
  },
  {
    id: '3',
    subject: 'Rappel panier abandonné',
    status: 'draft',
    recipients: 0,
    openRate: 0,
    clickRate: 0,
    content: 'Vous avez oublié quelque chose dans votre panier...'
  }
]

export default function CRMEmails() {
  const [campaigns, setCampaigns] = useState(mockCampaigns)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [newEmail, setNewEmail] = useState({
    subject: '',
    content: '',
    recipients: 'all'
  })

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    totalCampaigns: campaigns.length,
    sentThisMonth: campaigns.filter(c => c.status === 'sent').length,
    avgOpenRate: campaigns.filter(c => c.openRate > 0).reduce((acc, c) => acc + c.openRate, 0) / campaigns.filter(c => c.openRate > 0).length || 0,
    totalRecipients: campaigns.reduce((acc, c) => acc + c.recipients, 0)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Marketing</h1>
          <p className="text-muted-foreground">Gérez vos campagnes email et newsletters</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Campagne
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle campagne</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sujet</label>
                <Input 
                  placeholder="Sujet de l'email"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({...newEmail, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Destinataires</label>
                <Select value={newEmail.recipients} onValueChange={(value) => setNewEmail({...newEmail, recipients: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les clients</SelectItem>
                    <SelectItem value="active">Clients actifs</SelectItem>
                    <SelectItem value="vip">Clients VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contenu</label>
                <Textarea 
                  placeholder="Contenu de votre email..."
                  rows={6}
                  value={newEmail.content}
                  onChange={(e) => setNewEmail({...newEmail, content: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Sauvegarder brouillon</Button>
                <Button>Programmer envoi</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              Total Campagnes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="h-4 w-4 text-green-500" />
              Envoyées ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sentThisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-orange-500" />
              Taux d'ouverture moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgOpenRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Archive className="h-4 w-4 text-purple-500" />
              Total Destinataires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipients.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une campagne..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="sent">Envoyées</SelectItem>
            <SelectItem value="scheduled">Programmées</SelectItem>
            <SelectItem value="draft">Brouillons</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{campaign.subject}</h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status === 'sent' && 'Envoyée'}
                      {campaign.status === 'scheduled' && 'Programmée'}
                      {campaign.status === 'draft' && 'Brouillon'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {campaign.recipients} destinataires
                    {campaign.sentAt && ` • Envoyée le ${new Date(campaign.sentAt).toLocaleDateString('fr-FR')}`}
                    {campaign.scheduledAt && ` • Programmée pour le ${new Date(campaign.scheduledAt).toLocaleDateString('fr-FR')}`}
                  </div>
                  {campaign.status === 'sent' && (
                    <div className="flex gap-6 text-sm">
                      <span>📧 Ouverture: <strong>{campaign.openRate}%</strong></span>
                      <span>👆 Clics: <strong>{campaign.clickRate}%</strong></span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {campaign.status === 'draft' && (
                    <>
                      <Button size="sm" variant="outline">Modifier</Button>
                      <Button size="sm">Envoyer</Button>
                    </>
                  )}
                  {campaign.status === 'scheduled' && (
                    <Button size="sm" variant="outline">Modifier</Button>
                  )}
                  {campaign.status === 'sent' && (
                    <Button size="sm" variant="outline">Voir rapport</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune campagne trouvée</h3>
            <p className="text-muted-foreground mb-4">Créez votre première campagne email pour commencer</p>
            <Button>Créer une campagne</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}