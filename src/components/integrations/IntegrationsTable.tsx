import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Search, 
  MoreHorizontal, 
  TestTube, 
  RefreshCw, 
  Settings, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Download
} from 'lucide-react'
import { useIntegrationsUnified } from '@/hooks/unified'
import { useToast } from '@/hooks/use-toast'
import { EditIntegrationModal } from './EditIntegrationModal'

export const IntegrationsTable = () => {
  const [search, setSearch] = useState('')
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const { 
    integrations, 
    stats, 
    isLoading,
    testConnection,
    syncIntegration,
    deleteIntegration,
    isTesting,
    isSyncing,
    isDeleting
  } = useIntegrationsUnified()
  const { toast } = useToast()

  const filteredIntegrations = integrations.filter(integration =>
    integration.platform_name.toLowerCase().includes(search.toLowerCase()) ||
    integration.platform_type.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Connecté</Badge>
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erreur</Badge>
      case 'disconnected':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Déconnecté</Badge>
      default:
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Inconnu</Badge>
    }
  }

  const handleTest = async (integration: any) => {
    try {
      await testConnection(integration.id)
    } catch (error) {
      toast({
        title: "Test échoué",
        description: "La connexion ne fonctionne pas correctement.",
        variant: "destructive"
      })
    }
  }

  const handleSync = async (integration: any) => {
    try {
      await syncIntegration(integration.id)
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de lancer la synchronisation.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (integration: any) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'intégration ${integration.platform_name} ?`)) {
      try {
        await deleteIntegration(integration.id)
      } catch (error) {
        toast({
          title: "Erreur de suppression",
          description: "Impossible de supprimer l'intégration.",
          variant: "destructive"
        })
      }
    }
  }

  const exportData = () => {
    const csvContent = [
      ['Plateforme', 'Type', 'Statut', 'Actif', 'Dernière Sync', 'Créé le'].join(','),
      ...filteredIntegrations.map(integration => [
        integration.platform_name,
        integration.platform_type,
        integration.connection_status,
        integration.is_active ? 'Oui' : 'Non',
        integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleDateString() : 'Jamais',
        new Date(integration.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'integrations.csv'
    a.click()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connectées</p>
                <p className="text-2xl font-bold text-green-600">{stats.connected}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actives</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Déconnectées</p>
                <p className="text-2xl font-bold text-orange-600">{stats.disconnected}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des Intégrations</CardTitle>
              <CardDescription>
                Gérez toutes vos intégrations depuis cette interface centralisée
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportData} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher une intégration..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plateforme</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead>Dernière Sync</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIntegrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {search ? 'Aucune intégration trouvée' : 'Aucune intégration configurée'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIntegrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {integration.platform_name}
                          {integration.platform_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={integration.platform_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {integration.platform_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(integration.connection_status)}</TableCell>
                      <TableCell>
                        {integration.is_active ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {integration.last_sync_at 
                          ? new Date(integration.last_sync_at).toLocaleString()
                          : 'Jamais'
                        }
                      </TableCell>
                      <TableCell>{new Date(integration.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleTest(integration)}
                              disabled={isTesting}
                            >
                              <TestTube className="w-4 h-4 mr-2" />
                              Tester la connexion
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSync(integration)}
                              disabled={isSyncing}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Synchroniser
                            </DropdownMenuItem>
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Modifier l'intégration</DialogTitle>
                                </DialogHeader>
                                <EditIntegrationModal integration={integration} />
                              </DialogContent>
                            </Dialog>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(integration)}
                              disabled={isDeleting}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
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
        </CardContent>
      </Card>
    </div>
  )
}