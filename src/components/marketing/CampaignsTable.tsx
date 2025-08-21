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
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Target,
  Share2,
  MessageSquare,
  Search,
  Filter,
  Download
} from 'lucide-react'
import { useRealTimeMarketing, MarketingCampaign } from '@/hooks/useRealTimeMarketing'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface CampaignsTableProps {
  onEdit?: (campaign: MarketingCampaign) => void
  onView?: (campaign: MarketingCampaign) => void
}

export function CampaignsTable({ onEdit, onView }: CampaignsTableProps) {
  const { campaigns, isLoading } = useRealTimeMarketing()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'budget_total'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Filtrer et trier les campagnes
  const filteredCampaigns = campaigns
    .filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
      const matchesType = typeFilter === 'all' || campaign.type === typeFilter
      return matchesSearch && matchesStatus && matchesType
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
        case 'budget_total':
          aValue = a.budget_total || 0
          bValue = b.budget_total || 0
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
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'social': return <Share2 className="h-4 w-4" />
      case 'ads': return <Target className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', campaignId)

      if (error) throw error

      toast({
        title: "Statut mis à jour",
        description: `Le statut de la campagne a été changé vers "${newStatus}"`
      })

      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-realtime'] })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) return

    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) throw error

      toast({
        title: "Campagne supprimée",
        description: "La campagne a été supprimée avec succès"
      })

      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-realtime'] })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la campagne",
        variant: "destructive"
      })
    }
  }

  const exportToCsv = () => {
    const csvData = filteredCampaigns.map(campaign => ({
      Nom: campaign.name,
      Type: campaign.type,
      Statut: campaign.status,
      'Budget Total': campaign.budget_total || 0,
      'Budget Dépensé': campaign.budget_spent,
      'Date de création': new Date(campaign.created_at).toLocaleDateString('fr-FR')
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campagnes-marketing-${new Date().toISOString().split('T')[0]}.csv`
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
      {/* Filtres et recherche */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher une campagne..."
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
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="paused">En pause</SelectItem>
              <SelectItem value="completed">Terminées</SelectItem>
              <SelectItem value="draft">Brouillons</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="social">Réseaux sociaux</SelectItem>
              <SelectItem value="ads">Publicités</SelectItem>
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
              <DropdownMenuItem onClick={() => setSortBy('budget_total')}>
                Budget {sortBy === 'budget_total' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                Inverser l'ordre
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="font-semibold">{filteredCampaigns.length}</div>
          <div className="text-muted-foreground">Campagnes</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="font-semibold text-green-700">
            {filteredCampaigns.filter(c => c.status === 'active').length}
          </div>
          <div className="text-green-600">Actives</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="font-semibold text-blue-700">
            {formatCurrency(filteredCampaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0))}
          </div>
          <div className="text-blue-600">Budget total</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="font-semibold text-purple-700">
            {formatCurrency(filteredCampaigns.reduce((sum, c) => sum + c.budget_spent, 0))}
          </div>
          <div className="text-purple-600">Dépensé</div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campagne</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.map((campaign) => {
              const metrics = campaign.metrics as any || {}
              const budgetUsage = campaign.budget_total ? 
                (campaign.budget_spent / campaign.budget_total) * 100 : 0

              return (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      {campaign.description && (
                        <div className="text-sm text-muted-foreground">
                          {campaign.description.length > 50 
                            ? campaign.description.substring(0, 50) + '...'
                            : campaign.description
                          }
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(campaign.type)}
                      <span className="capitalize">{campaign.type}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatCurrency(campaign.budget_spent)}</div>
                      {campaign.budget_total && (
                        <div className="text-muted-foreground">
                          / {formatCurrency(campaign.budget_total)} ({budgetUsage.toFixed(0)}%)
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {metrics.impressions ? (
                        <>
                          <div>{metrics.impressions.toLocaleString()} vues</div>
                          <div className="text-muted-foreground">
                            {metrics.clicks || 0} clics • {((metrics.clicks || 0) / metrics.impressions * 100).toFixed(1)}% CTR
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground">Aucune donnée</div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
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
                          <DropdownMenuItem onClick={() => onView(campaign)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                        )}
                        
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(campaign)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        
                        {campaign.status === 'active' ? (
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(campaign.id, 'paused')}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Mettre en pause
                          </DropdownMenuItem>
                        ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(campaign.id, 'active')}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Activer
                          </DropdownMenuItem>
                        ) : null}
                        
                        <DropdownMenuItem 
                          onClick={() => handleDelete(campaign.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? "Aucune campagne ne correspond aux critères de recherche"
              : "Aucune campagne créée pour le moment"
            }
          </div>
        )}
      </div>
    </div>
  )
}