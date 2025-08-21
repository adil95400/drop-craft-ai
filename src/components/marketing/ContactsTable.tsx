import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  Search,
  Filter,
  Download,
  Star
} from 'lucide-react'
import { useRealTimeMarketing, CRMContact } from '@/hooks/useRealTimeMarketing'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface ContactsTableProps {
  onEdit?: (contact: CRMContact) => void
  onView?: (contact: CRMContact) => void
}

export function ContactsTable({ onEdit, onView }: ContactsTableProps) {
  const { contacts, isLoading } = useRealTimeMarketing()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'lead_score'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Filter and sort contacts
  const filteredContacts = contacts
    .filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter
      const matchesStage = stageFilter === 'all' || contact.lifecycle_stage === stageFilter
      return matchesSearch && matchesStatus && matchesStage
    })
    .sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'lead_score':
          aValue = a.lead_score
          bValue = b.lead_score
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'qualified': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'unqualified': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'subscriber': return 'bg-purple-100 text-purple-800'
      case 'lead': return 'bg-yellow-100 text-yellow-800'
      case 'marketing_qualified_lead': return 'bg-orange-100 text-orange-800'
      case 'sales_qualified_lead': return 'bg-blue-100 text-blue-800'
      case 'opportunity': return 'bg-indigo-100 text-indigo-800'
      case 'customer': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const handleDelete = async (contactId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) return

    try {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error

      toast({
        title: "Contact supprimé",
        description: "Le contact a été supprimé avec succès"
      })

      queryClient.invalidateQueries({ queryKey: ['crm-contacts-realtime'] })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le contact",
        variant: "destructive"
      })
    }
  }

  const exportToCsv = () => {
    const csvData = filteredContacts.map(contact => ({
      Nom: contact.name,
      Email: contact.email,
      Téléphone: contact.phone || '',
      Entreprise: contact.company || '',
      Poste: contact.position || '',
      Statut: contact.status,
      'Phase du cycle': contact.lifecycle_stage,
      'Score de lead': contact.lead_score,
      Source: contact.source || '',
      'Date de création': new Date(contact.created_at).toLocaleDateString('fr-FR')
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-crm-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher un contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="qualified">Qualifiés</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
              <SelectItem value="unqualified">Non qualifiés</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les phases</SelectItem>
              <SelectItem value="subscriber">Abonné</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="marketing_qualified_lead">MQL</SelectItem>
              <SelectItem value="sales_qualified_lead">SQL</SelectItem>
              <SelectItem value="opportunity">Opportunité</SelectItem>
              <SelectItem value="customer">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCsv} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Trier par
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Nom {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('created_at')}>
                Date de création {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('lead_score')}>
                Score de lead {sortBy === 'lead_score' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                Inverser l'ordre
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="font-semibold">{filteredContacts.length}</div>
          <div className="text-muted-foreground">Contacts</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="font-semibold text-green-700">
            {filteredContacts.filter(c => c.status === 'active').length}
          </div>
          <div className="text-green-600">Actifs</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="font-semibold text-blue-700">
            {filteredContacts.filter(c => c.lifecycle_stage === 'customer').length}
          </div>
          <div className="text-blue-600">Clients</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="font-semibold text-purple-700">
            {filteredContacts.length > 0 ? 
              Math.round(filteredContacts.reduce((sum, c) => sum + c.lead_score, 0) / filteredContacts.length)
              : 0
            }
          </div>
          <div className="text-purple-600">Score moyen</div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                      {contact.phone && (
                        <>
                          <Phone className="h-3 w-3 ml-2" />
                          {contact.phone}
                        </>
                      )}
                    </div>
                    {contact.company && (
                      <div className="text-sm text-muted-foreground">
                        {contact.company} {contact.position && `• ${contact.position}`}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge className={getStatusColor(contact.status)}>
                    {contact.status}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <Badge variant="secondary" className={getStageColor(contact.lifecycle_stage)}>
                    {contact.lifecycle_stage.replace('_', ' ')}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className={`flex items-center gap-1 font-medium ${getLeadScoreColor(contact.lead_score)}`}>
                    <Star className="h-4 w-4" />
                    {contact.lead_score}/100
                  </div>
                </TableCell>
                
                <TableCell>
                  {contact.source ? (
                    <Badge variant="outline">{contact.source}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {new Date(contact.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(contact)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </DropdownMenuItem>
                      )}
                      
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(contact)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredContacts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || stageFilter !== 'all' 
              ? "Aucun contact ne correspond aux critères de recherche"
              : "Aucun contact créé pour le moment"
            }
          </div>
        )}
      </div>
    </div>
  )
}