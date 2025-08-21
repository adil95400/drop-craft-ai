import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Database, 
  HardDrive, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2,
  Search,
  Filter,
  Archive,
  Shield,
  Clock,
  BarChart3
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface DatabaseStats {
  total_size: string
  table_count: number
  row_count: number
  index_count: number
}

interface TableInfo {
  table_name: string
  row_count: number
  size: string
  last_updated: string
  status: 'active' | 'archived' | 'readonly'
}

interface BackupInfo {
  id: string
  name: string
  size: string
  created_at: string
  type: 'full' | 'incremental' | 'differential'
  status: 'completed' | 'running' | 'failed'
}

export default function DataManagement() {
  const [dbStats, setDbStats] = useState<DatabaseStats>({
    total_size: '0 MB',
    table_count: 0,
    row_count: 0,
    index_count: 0
  })
  const [tables, setTables] = useState<TableInfo[]>([])
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDataManagementInfo()
  }, [])

  const fetchDataManagementInfo = async () => {
    try {
      setLoading(true)
      
      // Mock database stats (in real app, would use system queries)
      const mockStats: DatabaseStats = {
        total_size: '2.4 GB',
        table_count: 23,
        row_count: 150847,
        index_count: 45
      }
      setDbStats(mockStats)

      // Mock table information
      const mockTables: TableInfo[] = [
        {
          table_name: 'customers',
          row_count: 15420,
          size: '234 MB',
          last_updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        },
        {
          table_name: 'orders',
          row_count: 45230,
          size: '567 MB',
          last_updated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'active'
        },
        {
          table_name: 'products',
          row_count: 8934,
          size: '123 MB',
          last_updated: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        },
        {
          table_name: 'catalog_products',
          row_count: 125000,
          size: '890 MB',
          last_updated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          status: 'readonly'
        },
        {
          table_name: 'security_events',
          row_count: 23450,
          size: '156 MB',
          last_updated: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          status: 'active'
        },
        {
          table_name: 'old_transactions_2023',
          row_count: 98765,
          size: '445 MB',
          last_updated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'archived'
        }
      ]
      setTables(mockTables)

      // Mock backup information
      const mockBackups: BackupInfo[] = [
        {
          id: '1',
          name: 'daily_backup_2024_01_08',
          size: '2.1 GB',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          type: 'full',
          status: 'completed'
        },
        {
          id: '2',
          name: 'incremental_backup_2024_01_08_14h',
          size: '145 MB',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          type: 'incremental',
          status: 'completed'
        },
        {
          id: '3',
          name: 'backup_in_progress',
          size: '1.2 GB',
          created_at: new Date().toISOString(),
          type: 'full',
          status: 'running'
        }
      ]
      setBackups(mockBackups)

    } catch (error) {
      console.error('Error fetching data management info:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations de gestion des données",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'readonly': return 'secondary'
      case 'archived': return 'outline'
      case 'completed': return 'default'
      case 'running': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Database className="w-4 h-4" />
      case 'readonly': return <Shield className="w-4 h-4" />
      case 'archived': return <Archive className="w-4 h-4" />
      case 'completed': return <HardDrive className="w-4 h-4" />
      case 'running': return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'failed': return <Trash2 className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  const filteredTables = tables.filter(table =>
    table.table_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedTable === '' || table.status === selectedTable)
  )

  const startBackup = async (type: 'full' | 'incremental') => {
    toast({
      title: "Sauvegarde lancée",
      description: `Sauvegarde ${type} en cours...`,
    })
    
    // Simulate backup process
    setTimeout(() => {
      toast({
        title: "Sauvegarde terminée",
        description: `Sauvegarde ${type} complétée avec succès`,
      })
      fetchDataManagementInfo()
    }, 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Données</h1>
          <p className="text-muted-foreground">
            Administration et surveillance de la base de données
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => startBackup('incremental')} 
            variant="outline" 
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Sauvegarde Incrémentale
          </Button>
          <Button 
            onClick={() => startBackup('full')} 
            className="gap-2"
          >
            <HardDrive className="w-4 h-4" />
            Sauvegarde Complète
          </Button>
        </div>
      </div>

      {/* Database Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taille Totale</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.total_size}</div>
            <Progress value={65} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              65% de l'espace utilisé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tables</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.table_count}</div>
            <p className="text-xs text-muted-foreground">
              {tables.filter(t => t.status === 'active').length} actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enregistrements</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dbStats.row_count.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Index</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.index_count}</div>
            <p className="text-xs text-muted-foreground">
              Optimisés
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="backups">Sauvegardes</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="monitoring">Surveillance</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Tables de la Base de Données</CardTitle>
                  <CardDescription>
                    Gestion et surveillance des tables système
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Rechercher une table..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="active">Actives</SelectItem>
                      <SelectItem value="readonly">Lecture seule</SelectItem>
                      <SelectItem value="archived">Archivées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTables.map((table) => (
                  <div key={table.table_name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(table.status)}
                      <div>
                        <p className="font-medium">{table.table_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {table.row_count.toLocaleString()} enregistrements • {table.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(table.status) as any}>
                        {table.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(table.last_updated).toLocaleString()}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Sauvegardes</CardTitle>
              <CardDescription>
                Gestion des sauvegardes et restauration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(backup.status)}
                      <div>
                        <p className="font-medium">{backup.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {backup.size} • Type: {backup.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(backup.status) as any}>
                        {backup.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(backup.created_at).toLocaleString()}
                      </span>
                      {backup.status === 'completed' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Optimisation</CardTitle>
                <CardDescription>
                  Tâches d'optimisation et nettoyage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Réindexer les tables</p>
                    <p className="text-sm text-muted-foreground">Optimise les performances de recherche</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Lancer
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Nettoyer le cache</p>
                    <p className="text-sm text-muted-foreground">Supprime les données temporaires</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Nettoyer
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Analyser les statistiques</p>
                    <p className="text-sm text-muted-foreground">Met à jour les métadonnées</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Analyser
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nettoyage</CardTitle>
                <CardDescription>
                  Suppression des données obsolètes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Logs anciens</p>
                    <p className="text-sm text-muted-foreground">{'>'}90 jours • 2.3 GB</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Supprimer
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Sessions expirées</p>
                    <p className="text-sm text-muted-foreground">456 sessions • 12 MB</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Purger
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Cache API</p>
                    <p className="text-sm text-muted-foreground">Expiré • 145 MB</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Vider
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Temps de réponse</span>
                    <span className="text-sm font-medium">45ms</span>
                  </div>
                  <Progress value={85} />
                  <div className="flex justify-between">
                    <span className="text-sm">Requêtes/sec</span>
                    <span className="text-sm font-medium">1,234</span>
                  </div>
                  <Progress value={67} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Connexions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Actives</span>
                    <span className="text-sm font-medium">42/100</span>
                  </div>
                  <Progress value={42} />
                  <div className="flex justify-between">
                    <span className="text-sm">En attente</span>
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <Progress value={3} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ressources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">CPU</span>
                    <span className="text-sm font-medium">23%</span>
                  </div>
                  <Progress value={23} />
                  <div className="flex justify-between">
                    <span className="text-sm">Mémoire</span>
                    <span className="text-sm font-medium">67%</span>
                  </div>
                  <Progress value={67} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}