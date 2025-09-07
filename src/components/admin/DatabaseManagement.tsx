import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Database, 
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Settings,
  Activity,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TableInfo {
  name: string
  rows: number
  size: string
  lastModified: string
  status: 'healthy' | 'warning' | 'error'
}

interface BackupInfo {
  id: string
  name: string
  size: string
  created: string
  type: 'manual' | 'auto'
  status: 'completed' | 'running' | 'failed'
}

const tables: TableInfo[] = [
  { name: 'users', rows: 15847, size: '24.5 MB', lastModified: '2024-01-15 14:30', status: 'healthy' },
  { name: 'products', rows: 128450, size: '156.2 MB', lastModified: '2024-01-15 12:15', status: 'healthy' },
  { name: 'orders', rows: 45621, size: '78.9 MB', lastModified: '2024-01-15 13:45', status: 'warning' },
  { name: 'suppliers', rows: 342, size: '2.1 MB', lastModified: '2024-01-14 16:20', status: 'healthy' },
  { name: 'imports', rows: 8924, size: '12.4 MB', lastModified: '2024-01-15 11:10', status: 'healthy' },
  { name: 'analytics', rows: 2847521, size: '892.1 MB', lastModified: '2024-01-15 14:25', status: 'error' },
]

const backups: BackupInfo[] = [
  { id: '1', name: 'backup_2024_01_15_14_00', size: '2.4 GB', created: '2024-01-15 14:00', type: 'auto', status: 'completed' },
  { id: '2', name: 'backup_manual_users', size: '156 MB', created: '2024-01-15 10:30', type: 'manual', status: 'completed' },
  { id: '3', name: 'backup_2024_01_14_14_00', size: '2.3 GB', created: '2024-01-14 14:00', type: 'auto', status: 'completed' },
  { id: '4', name: 'backup_emergency', size: '1.8 GB', created: '2024-01-13 09:15', type: 'manual', status: 'failed' },
]

export const DatabaseManagement = () => {
  const [loading, setLoading] = useState(false)
  const [dbStats, setDbStats] = useState({
    totalSize: '2.4 GB',
    usedSpace: 67,
    totalTables: 23,
    activeConnections: 15,
    qps: 145, // Queries per second
    uptime: '15 jours 8h'
  })
  const { toast } = useToast()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Saine</Badge>
      case 'warning':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Attention</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Erreur</Badge>
      default:
        return <Badge variant="outline">Inconnue</Badge>
    }
  }

  const handleBackup = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Sauvegarde créée",
        description: "La sauvegarde complète a été créée avec succès",
      })
    }, 3000)
  }

  const handleOptimize = () => {
    toast({
      title: "Optimisation lancée",
      description: "L'optimisation de la base de données est en cours...",
    })
  }

  const handleRestore = (backupName: string) => {
    toast({
      title: "Restauration initiée",
      description: `Restauration depuis ${backupName} en cours...`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Gestion Base de Données
          </h2>
          <p className="text-muted-foreground">
            Surveillez et gérez votre infrastructure de données
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOptimize}>
            <Settings className="h-4 w-4 mr-2" />
            Optimiser
          </Button>
          <Button onClick={handleBackup} disabled={loading}>
            <Download className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taille Totale</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.totalSize}</div>
            <div className="mt-2">
              <Progress value={dbStats.usedSpace} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {dbStats.usedSpace}% utilisé
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tables Actives</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.totalTables}</div>
            <p className="text-xs text-muted-foreground">
              {tables.filter(t => t.status === 'healthy').length} saines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connexions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              {dbStats.qps} req/sec
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilité</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              Uptime: {dbStats.uptime}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="backups">Sauvegardes</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tables de la Base de Données</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom de la Table</TableHead>
                    <TableHead>Lignes</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Dernière Modification</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow key={table.name}>
                      <TableCell className="font-medium">{table.name}</TableCell>
                      <TableCell>{table.rows.toLocaleString()}</TableCell>
                      <TableCell>{table.size}</TableCell>
                      <TableCell>{table.lastModified}</TableCell>
                      <TableCell>{getStatusBadge(table.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Sauvegardes Disponibles</h3>
              <p className="text-sm text-muted-foreground">
                Gérez vos sauvegardes automatiques et manuelles
              </p>
            </div>
            <Button onClick={handleBackup} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Nouvelle Sauvegarde
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.name}</TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>{backup.created}</TableCell>
                      <TableCell>
                        <Badge variant={backup.type === 'auto' ? 'default' : 'secondary'}>
                          {backup.type === 'auto' ? 'Automatique' : 'Manuelle'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            backup.status === 'completed' ? 'default' :
                            backup.status === 'running' ? 'secondary' : 'destructive'
                          }
                        >
                          {backup.status === 'completed' ? 'Terminée' :
                           backup.status === 'running' ? 'En cours' : 'Échouée'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={backup.status !== 'completed'}>
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la Restauration</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir restaurer depuis cette sauvegarde ? 
                                  Cette action remplacera toutes les données actuelles.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRestore(backup.name)}>
                                  Restaurer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Programmée</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sauvegarde Automatique</Label>
                  <div className="flex items-center gap-2">
                    <Input type="time" defaultValue="02:00" className="w-32" />
                    <span className="text-sm text-muted-foreground">Quotidien à 2h00</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Optimisation Automatique</Label>
                  <div className="flex items-center gap-2">
                    <Input type="time" defaultValue="03:00" className="w-32" />
                    <span className="text-sm text-muted-foreground">Hebdomadaire le dimanche</span>
                  </div>
                </div>
                <Button className="w-full">
                  Sauvegarder Configuration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions de Maintenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser Statistiques
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Vérifier Intégrité
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Optimiser Index
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Nettoyer Logs Anciens
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance en Temps Réel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Utilisation CPU</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Mémoire RAM</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>I/O Disque</span>
                    <span>23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Connexions Actives</span>
                    <span>15/100</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Requête lente détectée</p>
                      <p className="text-xs text-muted-foreground">il y a 2 min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sauvegarde terminée</p>
                      <p className="text-xs text-muted-foreground">il y a 1h</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Aucune autre alerte
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}