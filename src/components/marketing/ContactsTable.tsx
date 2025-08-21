import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  Search, Download, MoreHorizontal, 
  Edit, Trash2, Eye, Mail, Phone,
  Users, TrendingUp, Star, Building
} from 'lucide-react'

interface CRMContact {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  lifecycle_stage?: string
  lead_score?: number
  status?: string
  tags?: string[]
  source?: string
  last_activity_at?: string
  created_at: string
  updated_at: string
}

interface ContactsTableProps {
  onEdit?: (contact: CRMContact) => void
  onView?: (contact: CRMContact) => void
}

export function ContactsTable({ onEdit, onView }: ContactsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { contacts, isLoading } = useRealTimeMarketing()
  const { toast } = useToast()

  const filteredContacts = useMemo(() => {
    if (!contacts) return []
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.position && contact.position.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [contacts, searchTerm])

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
        description: "Le contact a été supprimé avec succès.",
      })
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le contact.",
        variant: "destructive"
      })
    }
  }

  const exportToCsv = () => {
    const csvData = filteredContacts.map(contact => ({
      'Nom': contact.name,
      'Email': contact.email,
      'Téléphone': contact.phone || '',
      'Entreprise': contact.company || '',
      'Poste': contact.position || '',
      'Statut': contact.lifecycle_stage || '',
      'Score': contact.lead_score || 0,
      'Source': contact.source || '',
      'Créé le': new Date(contact.created_at).toLocaleDateString('fr-FR')
    }))

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-crm-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getLifecycleStageColor = (stage: string) => {
    switch (stage) {
      case 'subscriber': return 'bg-blue-100 text-blue-800'
      case 'lead': return 'bg-yellow-100 text-yellow-800'
      case 'prospect': return 'bg-orange-100 text-orange-800'
      case 'customer': return 'bg-green-100 text-green-800'
      case 'evangelist': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Calculate summary stats
  const totalContacts = contacts?.length || 0
  const leadContacts = contacts?.filter(c => c.lifecycle_stage === 'lead').length || 0
  const customerContacts = contacts?.filter(c => c.lifecycle_stage === 'customer').length || 0
  const avgLeadScore = contacts?.length 
    ? Math.round(contacts.reduce((sum, c) => sum + (c.lead_score || 0), 0) / contacts.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{leadContacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{customerContacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLeadScore}/100</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Export */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher des contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={exportToCsv} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {searchTerm ? 'Aucun contact trouvé' : 'Aucun contact créé'}
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                        {contact.phone && (
                          <>
                            <Phone className="h-3 w-3 ml-2" />
                            {contact.phone}
                          </>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {contact.company && (
                        <div className="font-medium">{contact.company}</div>
                      )}
                      {contact.position && (
                        <div className="text-sm text-muted-foreground">{contact.position}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getLifecycleStageColor(contact.lifecycle_stage || 'subscriber')}>
                      {contact.lifecycle_stage || 'subscriber'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getLeadScoreColor(contact.lead_score || 0)}`}>
                        {contact.lead_score || 0}
                      </span>
                      <span className="text-muted-foreground">/100</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {contact.source || 'Manuel'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(contact.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView?.(contact)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(contact)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`mailto:${contact.email}`)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Envoyer un email
                        </DropdownMenuItem>
                        {contact.phone && (
                          <DropdownMenuItem onClick={() => window.open(`tel:${contact.phone}`)}>
                            <Phone className="mr-2 h-4 w-4" />
                            Appeler
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(contact.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}