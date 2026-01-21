import { useState } from 'react'
import { UserPlus, Mail, Phone, Star, DollarSign, Calendar, Search, Plus, Filter, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useCRMLeads, CRMLead } from '@/hooks/useCRMLeads'

export default function CRMLeads() {
  const { leads, stats, isLoading, createLead, isCreating } = useCRMLeads()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'Site web',
    value: '',
    notes: ''
  })

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    
    let matchesPriority = true
    if (priorityFilter !== 'all') {
      const score = lead.lead_score
      switch (priorityFilter) {
        case 'high': matchesPriority = score >= 70; break
        case 'medium': matchesPriority = score >= 40 && score < 70; break
        case 'low': matchesPriority = score < 40; break
      }
    }
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'proposal': return 'bg-purple-100 text-purple-800'
      case 'negotiation': return 'bg-orange-100 text-orange-800'
      case 'won': return 'bg-emerald-100 text-emerald-800'
      case 'lost': return 'bg-red-100 text-red-800'
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
      case 'won': return 'Gagné'
      case 'lost': return 'Perdu'
      default: return 'Inconnu'
    }
  }

  const getPriorityFromScore = (score: number) => {
    if (score >= 70) return { label: 'Haute', color: 'bg-red-100 text-red-800' }
    if (score >= 40) return { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Faible', color: 'bg-green-100 text-green-800' }
  }

  const handleAddLead = () => {
    if (!newLead.name || !newLead.email) return
    
    createLead({
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone || undefined,
      company: newLead.company || undefined,
      source: newLead.source,
      estimated_value: newLead.value ? parseFloat(newLead.value) : undefined,
      notes: newLead.notes || undefined,
    })
    
    setNewLead({ name: '', email: '', phone: '', company: '', source: 'Site web', value: '', notes: '' })
    setIsAddDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement des prospects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Prospects</h1>
          <p className="text-muted-foreground">Suivez et gérez vos prospects commerciaux</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                  <Label>Nom complet *</Label>
                  <Input 
                    placeholder="Nom Prénom"
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Entreprise</Label>
                  <Input 
                    placeholder="Nom de l'entreprise"
                    value={newLead.company}
                    onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    placeholder="email@exemple.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input 
                    placeholder="+33 1 23 45 67 89"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source</Label>
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
                  <Label>Valeur estimée (€)</Label>
                  <Input 
                    type="number"
                    placeholder="5000"
                    value={newLead.value}
                    onChange={(e) => setNewLead({...newLead, value: e.target.value})}
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleAddLead}
                disabled={isCreating || !newLead.name || !newLead.email}
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Ajouter le prospect
              </Button>
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
            <div className="text-2xl font-bold">{stats.total}</div>
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
            <div className="text-2xl font-bold">{stats.new}</div>
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
            <div className="text-2xl font-bold">{stats.qualified}</div>
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
              Score Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore.toFixed(0)}</div>
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
            <SelectItem value="won">Gagnés</SelectItem>
            <SelectItem value="lost">Perdus</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            <SelectItem value="high">Haute (score ≥70)</SelectItem>
            <SelectItem value="medium">Moyenne (40-69)</SelectItem>
            <SelectItem value="low">Faible (&lt;40)</SelectItem>
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
              <TableHead>Score</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => {
              const priority = getPriorityFromScore(lead.lead_score)
              return (
                <TableRow key={lead.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">{lead.company || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1 mb-1">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.status)}>
                      {getStatusText(lead.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lead.lead_score}</span>
                      <Badge className={priority.color} variant="outline">
                        {priority.label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {(lead.estimated_value || 0).toLocaleString()}€
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.source || '-'}
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
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun prospect trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {leads.length === 0 
                ? 'Commencez à ajouter vos premiers prospects' 
                : 'Aucun prospect ne correspond aux filtres'}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>Ajouter un prospect</Button>
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
                    <div><strong>Entreprise:</strong> {selectedLead.company || '-'}</div>
                    <div><strong>Email:</strong> {selectedLead.email}</div>
                    <div><strong>Téléphone:</strong> {selectedLead.phone || '-'}</div>
                    <div><strong>Source:</strong> {selectedLead.source || '-'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Statut commercial</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <strong>Statut:</strong>
                      <Badge className={getStatusColor(selectedLead.status)}>
                        {getStatusText(selectedLead.status)}
                      </Badge>
                    </div>
                    <div><strong>Score:</strong> {selectedLead.lead_score}/100</div>
                    <div><strong>Valeur estimée:</strong> {(selectedLead.estimated_value || 0).toLocaleString()}€</div>
                    <div><strong>Date de création:</strong> {new Date(selectedLead.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
              </div>
              {selectedLead.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedLead.notes}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedLead(null)}>Fermer</Button>
                <Button>Modifier</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
