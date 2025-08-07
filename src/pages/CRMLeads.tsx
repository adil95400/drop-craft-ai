import { useState } from 'react'
import { UserPlus, Mail, Phone, Star, DollarSign, Calendar, Search, Plus, Filter, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  value: number
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  lastContact?: string
  notes?: string
}

const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Marie Dubois',
    email: 'marie.dubois@email.com',
    phone: '+33 1 23 45 67 89',
    company: 'Boutique Paris',
    source: 'Site web',
    status: 'qualified',
    value: 5000,
    priority: 'high',
    createdAt: '2024-01-15T10:00:00',
    lastContact: '2024-01-15T14:30:00',
    notes: 'Intéressée par notre collection printemps'
  },
  {
    id: '2',
    name: 'Pierre Martin',
    email: 'p.martin@commerce.fr',
    phone: '+33 6 12 34 56 78',
    company: 'E-commerce Plus',
    source: 'Référence',
    status: 'proposal',
    value: 12000,
    priority: 'high',
    createdAt: '2024-01-14T09:30:00',
    lastContact: '2024-01-15T11:15:00'
  },
  {
    id: '3',
    name: 'Sophie Bernard',
    email: 'sophie@startupmode.com',
    phone: '+33 7 98 76 54 32',
    company: 'Startup Mode',
    source: 'LinkedIn',
    status: 'new',
    value: 3000,
    priority: 'medium',
    createdAt: '2024-01-15T16:45:00'
  },
  {
    id: '4',
    name: 'Lucas Petit',
    email: 'lucas.petit@retail.com',
    phone: '+33 1 11 22 33 44',
    company: 'Retail Solutions',
    source: 'Salon professionnel',
    status: 'negotiation',
    value: 8500,
    priority: 'high',
    createdAt: '2024-01-13T14:20:00',
    lastContact: '2024-01-14T16:00:00'
  }
]

export default function CRMLeads() {
  const [leads, setLeads] = useState(mockLeads)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'Site web',
    value: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'proposal': return 'bg-purple-100 text-purple-800'
      case 'negotiation': return 'bg-orange-100 text-orange-800'
      case 'closed_won': return 'bg-emerald-100 text-emerald-800'
      case 'closed_lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Nouveau'
      case 'contacted': return 'Contacté'
      case 'qualified': return 'Qualifié'
      case 'proposal': return 'Proposition'
      case 'negotiation': return 'Négociation'
      case 'closed_won': return 'Gagné'
      case 'closed_lost': return 'Perdu'
      default: return 'Inconnu'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === 'new').length,
    qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
    totalValue: leads.reduce((acc, l) => acc + l.value, 0),
    conversionRate: leads.filter(l => l.status === 'closed_won').length / leads.length * 100
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Prospects</h1>
          <p className="text-muted-foreground">Suivez et gérez vos prospects commerciaux</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Prospect
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un prospect</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom complet</label>
                  <Input 
                    placeholder="Nom Prénom"
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Entreprise</label>
                  <Input 
                    placeholder="Nom de l'entreprise"
                    value={newLead.company}
                    onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input 
                    type="email"
                    placeholder="email@exemple.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Téléphone</label>
                  <Input 
                    placeholder="+33 1 23 45 67 89"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Source</label>
                  <Select value={newLead.source} onValueChange={(value) => setNewLead({...newLead, source: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Site web">Site web</SelectItem>
                      <SelectItem value="Référence">Référence</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Salon professionnel">Salon professionnel</SelectItem>
                      <SelectItem value="Publicité">Publicité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valeur estimée (€)</label>
                  <Input 
                    type="number"
                    placeholder="5000"
                    value={newLead.value}
                    onChange={(e) => setNewLead({...newLead, value: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priorité</label>
                  <Select value={newLead.priority} onValueChange={(value) => setNewLead({...newLead, priority: value as 'low' | 'medium' | 'high'})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full">Ajouter le prospect</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-500" />
              Total Prospects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-green-500" />
              Nouveaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-orange-500" />
              Qualifiés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualifiedLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              Valeur Totale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalValue.toLocaleString()}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-emerald-500" />
              Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un prospect..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="new">Nouveaux</SelectItem>
            <SelectItem value="contacted">Contactés</SelectItem>
            <SelectItem value="qualified">Qualifiés</SelectItem>
            <SelectItem value="proposal">Proposition</SelectItem>
            <SelectItem value="negotiation">Négociation</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prospect</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-muted/50">
                <TableCell>
                  <div>
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-sm text-muted-foreground">{lead.company}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="flex items-center gap-1 mb-1">
                      <Mail className="h-3 w-3" />
                      {lead.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(lead.status)}>
                    {getStatusText(lead.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getPriorityColor(lead.priority)} variant="outline">
                    {lead.priority === 'high' && 'Haute'}
                    {lead.priority === 'medium' && 'Moyenne'}
                    {lead.priority === 'low' && 'Faible'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {lead.value.toLocaleString()}€
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {lead.source}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedLead(lead)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mail className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Phone className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun prospect trouvé</h3>
            <p className="text-muted-foreground mb-4">Commencez à ajouter vos premiers prospects</p>
            <Button>Ajouter un prospect</Button>
          </CardContent>
        </Card>
      )}

      {/* Lead Detail Dialog */}
      {selectedLead && (
        <Dialog open={true} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du prospect - {selectedLead.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informations générales</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Entreprise:</strong> {selectedLead.company}</div>
                    <div><strong>Email:</strong> {selectedLead.email}</div>
                    <div><strong>Téléphone:</strong> {selectedLead.phone}</div>
                    <div><strong>Source:</strong> {selectedLead.source}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Statut commercial</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(selectedLead.status)}>
                        {getStatusText(selectedLead.status)}
                      </Badge>
                      <Badge className={getPriorityColor(selectedLead.priority)} variant="outline">
                        Priorité {selectedLead.priority}
                      </Badge>
                    </div>
                    <div className="text-sm"><strong>Valeur:</strong> {selectedLead.value.toLocaleString()}€</div>
                    <div className="text-sm"><strong>Créé le:</strong> {new Date(selectedLead.createdAt).toLocaleDateString('fr-FR')}</div>
                    {selectedLead.lastContact && (
                      <div className="text-sm"><strong>Dernier contact:</strong> {new Date(selectedLead.lastContact).toLocaleDateString('fr-FR')}</div>
                    )}
                  </div>
                </div>
              </div>
              {selectedLead.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    {selectedLead.notes}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Envoyer Email
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Appeler
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Programmer RDV
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}