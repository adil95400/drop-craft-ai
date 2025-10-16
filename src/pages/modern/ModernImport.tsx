/**
 * Interface d'import moderne multi-onglets avec drag-and-drop
 * CSV, URL, XML, API, FTP avec éditeur de mappage et historique
 */
import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  Link,
  FileText,
  Plug,
  Server,
  History,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Database,
  MapPin,
  Zap,
  Brain
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useLegacyPlan } from '@/lib/migration-helper'

interface ImportJob {
  id: string
  name: string
  type: 'csv' | 'url' | 'xml' | 'api' | 'ftp'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  total_items: number
  processed_items: number
  successful_items: number
  failed_items: number
  created_at: string
}

const mockJobs: ImportJob[] = [
  {
    id: '1',
    name: 'Import AliExpress CSV',
    type: 'csv',
    status: 'completed',
    progress: 100,
    total_items: 500,
    processed_items: 500,
    successful_items: 485,
    failed_items: 15,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Sync API Spocket',
    type: 'api',
    status: 'running',
    progress: 65,
    total_items: 1200,
    processed_items: 780,
    successful_items: 765,
    failed_items: 15,
    created_at: '2024-01-15T11:45:00Z'
  }
]

export default function ModernImport() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { isPro, isUltraPro } = useLegacyPlan()
  
  const [activeTab, setActiveTab] = useState('csv')
  const [jobs, setJobs] = useState<ImportJob[]>(mockJobs)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [mapping, setMapping] = useState({
    name: '',
    price: '',
    sku: '',
    description: '',
    category: ''
  })

  // Dropzone pour CSV
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      toast({
        title: "Fichier sélectionné",
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      })
    }
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  })

  const startImport = (type: string) => {
    const newJob: ImportJob = {
      id: Date.now().toString(),
      name: `Import ${type.toUpperCase()} ${new Date().toLocaleTimeString()}`,
      type: type as any,
      status: 'running',
      progress: 0,
      total_items: 100,
      processed_items: 0,
      successful_items: 0,
      failed_items: 0,
      created_at: new Date().toISOString()
    }

    setJobs(prev => [newJob, ...prev])
    
    // Simulation du progress
    const interval = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.id === newJob.id && job.progress < 100) {
          const newProgress = Math.min(100, job.progress + Math.random() * 20)
          return {
            ...job,
            progress: newProgress,
            processed_items: Math.floor((newProgress / 100) * job.total_items),
            successful_items: Math.floor((newProgress / 100) * job.total_items * 0.95),
            failed_items: Math.floor((newProgress / 100) * job.total_items * 0.05),
            status: newProgress >= 100 ? 'completed' : 'running'
          }
        }
        return job
      }))
    }, 1000)

    setTimeout(() => clearInterval(interval), 8000)

    toast({
      title: "Import démarré",
      description: `L'import ${type.toUpperCase()} a été lancé`
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import de Produits</h1>
          <p className="text-muted-foreground">
            Importez vos produits depuis différentes sources avec notre interface moderne
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isUltraPro && (
            <Button variant="outline" size="sm">
              <Brain className="mr-2 h-4 w-4" />
              Assistant IA
            </Button>
          )}
          <Button variant="outline" size="sm">
            <History className="mr-2 h-4 w-4" />
            Historique complet
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imports Aujourd'hui</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +3 depuis hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Importés</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,547</div>
            <p className="text-xs text-muted-foreground">
              Ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97%</div>
            <p className="text-xs text-muted-foreground">
              Moyenne 7 jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sources Actives</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Fournisseurs connectés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interface multi-onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            CSV/Excel
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            URL/Web
          </TabsTrigger>
          <TabsTrigger value="xml" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            XML/Feed
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Plug className="w-4 h-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="ftp" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            FTP
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* CSV Import */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Import CSV / Excel
              </CardTitle>
              <CardDescription>
                Importez vos produits depuis un fichier CSV ou Excel avec mappage automatique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Zone de drop */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {isDragActive ? 'Déposez votre fichier ici' : 'Glissez-déposez votre fichier'}
                  </h3>
                  <p className="text-muted-foreground">
                    Ou cliquez pour sélectionner un fichier CSV, XLS ou XLSX
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Taille maximale: 50MB • Formats supportés: CSV, XLS, XLSX
                  </p>
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-medium">{selectedFile.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => setSelectedFile(null)} variant="outline" size="sm">
                    Changer
                  </Button>
                </div>
              )}

              {/* Mappage des colonnes */}
              {selectedFile && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Mappage des Colonnes
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name-mapping">Nom du produit</Label>
                      <Select value={mapping.name} onValueChange={(value) => setMapping({...mapping, name: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la colonne" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="title">Titre</SelectItem>
                          <SelectItem value="name">Nom</SelectItem>
                          <SelectItem value="product_name">Nom du produit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price-mapping">Prix</Label>
                      <Select value={mapping.price} onValueChange={(value) => setMapping({...mapping, price: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la colonne" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price">Prix</SelectItem>
                          <SelectItem value="sale_price">Prix de vente</SelectItem>
                          <SelectItem value="cost">Coût</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku-mapping">SKU</Label>
                      <Select value={mapping.sku} onValueChange={(value) => setMapping({...mapping, sku: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la colonne" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sku">SKU</SelectItem>
                          <SelectItem value="product_id">ID Produit</SelectItem>
                          <SelectItem value="reference">Référence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category-mapping">Catégorie</Label>
                      <Select value={mapping.category} onValueChange={(value) => setMapping({...mapping, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la colonne" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="category">Catégorie</SelectItem>
                          <SelectItem value="type">Type</SelectItem>
                          <SelectItem value="section">Section</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={() => startImport('csv')} className="w-full" size="lg">
                    <Play className="mr-2 h-4 w-4" />
                    Démarrer l'import CSV
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* URL Import */}
        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Import depuis URL
              </CardTitle>
              <CardDescription>
                Scrapez et importez des produits depuis n'importe quelle page web
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-input">URL de la page produit</Label>
                <div className="flex gap-2">
                  <Input
                    id="url-input"
                    placeholder="https://example.com/products"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <Button variant="outline">
                    Prévisualiser
                  </Button>
                </div>
              </div>

              {isUltraPro && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Détection IA Ultra Pro</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    L'IA détectera automatiquement les champs produit (nom, prix, images, description)
                  </p>
                </div>
              )}

              <Button onClick={() => startImport('url')} className="w-full" disabled={!urlInput}>
                <Play className="mr-2 h-4 w-4" />
                Démarrer le scraping
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Import */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Synchronisation API
              </CardTitle>
              <CardDescription>
                Connectez-vous aux APIs de vos fournisseurs pour une synchronisation automatique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">AliExpress API</div>
                      <div className="text-sm text-muted-foreground">2.5M produits</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Spocket API</div>
                      <div className="text-sm text-muted-foreground">150K produits EU/US</div>
                    </div>
                  </div>
                </Card>
              </div>

              <Button onClick={() => startImport('api')} className="w-full">
                <Plug className="mr-2 h-4 w-4" />
                Configurer une nouvelle API
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique des imports */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des Imports
              </CardTitle>
              <CardDescription>
                Suivez le statut de tous vos imports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Import</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Résultats</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="font-medium">{job.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {job.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(job.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(job.status)}
                          {job.status === 'completed' ? 'Terminé' :
                           job.status === 'running' ? 'En cours' :
                           job.status === 'failed' ? 'Échec' : 'En attente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={job.progress} className="w-full h-2" />
                          <div className="text-xs text-muted-foreground">
                            {job.processed_items}/{job.total_items} éléments
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-green-600">✓ {job.successful_items}</div>
                          <div className="text-red-600">✗ {job.failed_items}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(job.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}