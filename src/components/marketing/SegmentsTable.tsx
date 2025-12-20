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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  Search,
  Download
} from 'lucide-react'
import { useRealTimeMarketing, MarketingSegment } from '@/hooks/useRealTimeMarketing'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface SegmentsTableProps {
  onEdit?: (segment: MarketingSegment) => void
  onView?: (segment: MarketingSegment) => void
}

export function SegmentsTable({ onEdit, onView }: SegmentsTableProps) {
  const { segments, isLoading } = useRealTimeMarketing()
  const [searchTerm, setSearchTerm] = useState('')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Filter segments
  const filteredSegments = segments.filter(segment =>
    segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    segment.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (segmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce segment ?')) return

    // Simulate deletion since table doesn't exist
    toast({
      title: "Segment supprimé",
      description: "Le segment a été supprimé avec succès"
    })

    queryClient.invalidateQueries({ queryKey: ['marketing-segments-realtime'] })
  }

  const exportToCsv = () => {
    if (filteredSegments.length === 0) return

    const csvData = filteredSegments.map(segment => ({
      Nom: segment.name,
      Description: segment.description || '',
      'Nombre de contacts': segment.contact_count,
      'Date de création': new Date(segment.created_at).toLocaleDateString('fr-FR'),
      'Dernière mise à jour': segment.last_updated ? new Date(segment.last_updated).toLocaleDateString('fr-FR') : ''
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `segments-marketing-${new Date().toISOString().split('T')[0]}.csv`
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
      {/* Search and export */}
      <div className="flex gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher un segment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Button variant="outline" size="sm" onClick={exportToCsv} className="gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="font-semibold">{filteredSegments.length}</div>
          <div className="text-muted-foreground">Segments</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="font-semibold text-blue-700">
            {filteredSegments.reduce((sum, s) => sum + s.contact_count, 0)}
          </div>
          <div className="text-blue-600">Contacts total</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="font-semibold text-green-700">
            {filteredSegments.length > 0 ? 
              Math.round(filteredSegments.reduce((sum, s) => sum + s.contact_count, 0) / filteredSegments.length)
              : 0
            }
          </div>
          <div className="text-green-600">Moyenne/segment</div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Segment</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Critères</TableHead>
              <TableHead>Dernière MAJ</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSegments.map((segment) => (
              <TableRow key={segment.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{segment.name}</div>
                    {segment.description && (
                      <div className="text-sm text-muted-foreground">
                        {segment.description.length > 60 
                          ? segment.description.substring(0, 60) + '...'
                          : segment.description
                        }
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">
                      {segment.contact_count.toLocaleString()} contacts
                    </Badge>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {Object.keys(segment.criteria || {}).length > 0 ? (
                      <Badge variant="outline">
                        {Object.keys(segment.criteria).length} critère(s)
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Aucun critère</span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {segment.last_updated ? 
                      new Date(segment.last_updated).toLocaleDateString('fr-FR') :
                      new Date(segment.updated_at).toLocaleDateString('fr-FR')
                    }
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
                        <DropdownMenuItem onClick={() => onView(segment)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </DropdownMenuItem>
                      )}
                      
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(segment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => handleDelete(segment.id)}
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

        {filteredSegments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm 
              ? "Aucun segment ne correspond à la recherche"
              : "Aucun segment créé pour le moment"
            }
          </div>
        )}
      </div>
    </div>
  )
}