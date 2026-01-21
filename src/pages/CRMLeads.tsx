import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Mail, Phone, Star, DollarSign, Calendar, Search, Plus, Filter, Eye, Loader2, MoreVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useCRMLeads, CRMLead } from '@/hooks/useCRMLeads'
import { OptimizedModal, QuickActionModal } from '@/components/ui/optimized-modal'
import { OptimizedTable } from '@/components/ui/optimized-table'
import { StatsGrid, StatCard } from '@/components/ui/optimized-stats-grid'
import { FormGrid, EnhancedInput, EnhancedSelect } from '@/components/ui/optimized-form'
import { useIsMobile } from '@/hooks/use-media-query'

export default function CRMLeads() {
  const { leads, stats, isLoading, createLead, isCreating } = useCRMLeads()
  const isMobile = useIsMobile()
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
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
      case 'contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
      case 'qualified': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
      case 'proposal': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
      case 'negotiation': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
      case 'won': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      case 'lost': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
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
    if (score >= 70) return { label: 'Haute', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' }
    if (score >= 40) return { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' }
    return { label: 'Faible', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' }
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

  const tableColumns = [
    {
      id: 'name',
      header: 'Prospect',
      accessorKey: 'name' as keyof CRMLead,
      sortable: true,
      cell: (lead: CRMLead) => (
        <div>
          <div className="font-medium">{lead.name}</div>
          <div className="text-sm text-muted-foreground">{lead.company || '-'}</div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      hideOnMobile: true,
      cell: (lead: CRMLead) => (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="truncate max-w-[200px]">{lead.email}</span>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {lead.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Statut',
      accessorKey: 'status' as keyof CRMLead,
      sortable: true,
      cell: (lead: CRMLead) => (
        <Badge className={getStatusColor(lead.status)}>
          {getStatusText(lead.status)}
        </Badge>
      ),
    },
    {
      id: 'score',
      header: 'Score',
      accessorKey: 'lead_score' as keyof CRMLead,
      sortable: true,
      hideOnMobile: true,
      cell: (lead: CRMLead) => {
        const priority = getPriorityFromScore(lead.lead_score)
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{lead.lead_score}</span>
            <Badge className={priority.color} variant="outline">
              {priority.label}
            </Badge>
          </div>
        )
      },
    },
    {
      id: 'value',
      header: 'Valeur',
      accessorKey: 'estimated_value' as keyof CRMLead,
      sortable: true,
      cell: (lead: CRMLead) => (
        <span className="font-medium">
          {(lead.estimated_value || 0).toLocaleString('fr-FR')}€
        </span>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement des prospects...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 sm:p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Prospects</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Suivez et gérez vos prospects commerciaux</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          {isMobile ? 'Ajouter' : 'Nouveau Prospect'}
        </Button>
      </div>

      {/* Stats */}
      <StatsGrid columns={isMobile ? 2 : 5}>
        <StatCard
          label="Total Prospects"
          value={stats.total}
          icon={UserPlus}
          iconColor="text-blue-500"
        />
        <StatCard
          label="Nouveaux"
          value={stats.new}
          icon={Star}
          iconColor="text-green-500"
        />
        <StatCard
          label="Qualifiés"
          value={stats.qualified}
          icon={Star}
          iconColor="text-orange-500"
        />
        <StatCard
          label="Valeur Totale"
          value={`${stats.totalValue.toLocaleString()}€`}
          icon={DollarSign}
          iconColor="text-purple-500"
        />
        <StatCard
          label="Score Moyen"
          value={stats.avgScore.toFixed(0)}
          icon={Star}
          iconColor="text-emerald-500"
        />
      </StatsGrid>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un prospect..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="new">Nouveaux</SelectItem>
                  <SelectItem value="contacted">Contactés</SelectItem>
                  <SelectItem value="qualified">Qualifiés</SelectItem>
                  <SelectItem value="proposal">Proposition</SelectItem>
                  <SelectItem value="won">Gagnés</SelectItem>
                  <SelectItem value="lost">Perdus</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <OptimizedTable
        data={filteredLeads}
        columns={tableColumns}
        rowKey="id"
        onRowClick={(lead) => setSelectedLead(lead)}
        searchable={false}
        emptyState={
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
        }
        actions={(lead) => (
          <>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Mail className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Phone className="h-4 w-4" />
            </Button>
          </>
        )}
      />

      {/* Add Lead Modal */}
      <OptimizedModal
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Ajouter un prospect"
        description="Créez un nouveau profil prospect"
        icon={<UserPlus className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isCreating}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddLead}
              disabled={isCreating || !newLead.name || !newLead.email}
            >
              {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Ajouter
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormGrid columns={2}>
            <div className="space-y-2">
              <Label>Nom complet *</Label>
              <Input 
                placeholder="Nom Prénom"
                value={newLead.name}
                onChange={(e) => setNewLead({...newLead, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <Input 
                placeholder="Nom de l'entreprise"
                value={newLead.company}
                onChange={(e) => setNewLead({...newLead, company: e.target.value})}
              />
            </div>
          </FormGrid>
          <FormGrid columns={2}>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email"
                placeholder="email@exemple.com"
                value={newLead.email}
                onChange={(e) => setNewLead({...newLead, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input 
                placeholder="+33 1 23 45 67 89"
                value={newLead.phone}
                onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
              />
            </div>
          </FormGrid>
          <FormGrid columns={2}>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={newLead.source} onValueChange={(value) => setNewLead({...newLead, source: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Site web">Site web</SelectItem>
                  <SelectItem value="Référence">Référence</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Salon professionnel">Salon</SelectItem>
                  <SelectItem value="Publicité">Publicité</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valeur estimée (€)</Label>
              <Input 
                type="number"
                placeholder="5000"
                value={newLead.value}
                onChange={(e) => setNewLead({...newLead, value: e.target.value})}
              />
            </div>
          </FormGrid>
        </div>
      </OptimizedModal>

      {/* Lead Detail Modal */}
      <OptimizedModal
        open={!!selectedLead}
        onOpenChange={() => setSelectedLead(null)}
        title={selectedLead?.name || 'Détails du prospect'}
        description={selectedLead?.company || ''}
        icon={<UserPlus className="h-5 w-5" />}
        size="lg"
      >
        {selectedLead && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase">Informations générales</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{selectedLead.email}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="font-medium">{selectedLead.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">{selectedLead.source || '-'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase">Statut commercial</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Statut</span>
                    <Badge className={getStatusColor(selectedLead.status)}>
                      {getStatusText(selectedLead.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-medium">{selectedLead.lead_score}/100</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Valeur estimée</span>
                    <span className="font-medium">{(selectedLead.estimated_value || 0).toLocaleString()}€</span>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedLead.notes && (
              <div>
                <h4 className="font-medium mb-2 text-sm text-muted-foreground uppercase">Notes</h4>
                <p className="text-sm p-3 rounded bg-muted/50">{selectedLead.notes}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button className="flex-1" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Envoyer un email
              </Button>
              <Button className="flex-1" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Appeler
              </Button>
              <Button className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Planifier
              </Button>
            </div>
          </div>
        )}
      </OptimizedModal>
    </motion.div>
  )
}
