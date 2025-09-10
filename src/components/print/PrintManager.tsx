import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Printer, 
  FileText, 
  Settings,
  Download,
  Eye,
  Copy,
  Plus,
  Trash2,
  Edit,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface PrintTemplate {
  id: string
  name: string
  type: 'invoice' | 'receipt' | 'label' | 'report' | 'catalog'
  description: string
  format: 'A4' | 'A5' | 'thermal' | 'label'
  orientation: 'portrait' | 'landscape'
  enabled: boolean
  lastUsed?: string
  usage: number
}

interface PrintJob {
  id: string
  templateId: string
  templateName: string
  type: string
  status: 'pending' | 'printing' | 'completed' | 'failed'
  createdAt: string
  pages: number
  copies: number
  printer?: string
}

const printTemplates: PrintTemplate[] = [
  {
    id: 'invoice-standard',
    name: 'Facture Standard',
    type: 'invoice',
    description: 'Template de facture professionnel avec logo et détails',
    format: 'A4',
    orientation: 'portrait',
    enabled: true,
    lastUsed: '2024-01-16T10:30:00Z',
    usage: 342
  },
  {
    id: 'receipt-thermal',
    name: 'Reçu Thermique',
    type: 'receipt',
    description: 'Reçu optimisé pour imprimantes thermiques',
    format: 'thermal',
    orientation: 'portrait',
    enabled: true,
    lastUsed: '2024-01-16T08:15:00Z',
    usage: 1250
  },
  {
    id: 'shipping-label',
    name: 'Étiquette Expédition',
    type: 'label',
    description: 'Étiquette d\'expédition avec code-barres',
    format: 'label',
    orientation: 'landscape',
    enabled: true,
    lastUsed: '2024-01-15T16:45:00Z',
    usage: 890
  },
  {
    id: 'product-catalog',
    name: 'Catalogue Produits',
    type: 'catalog',
    description: 'Catalogue de produits avec images et prix',
    format: 'A4',
    orientation: 'portrait',
    enabled: false,
    usage: 45
  },
  {
    id: 'sales-report',
    name: 'Rapport de Ventes',
    type: 'report',
    description: 'Rapport détaillé des ventes mensuelles',
    format: 'A4',
    orientation: 'landscape',
    enabled: true,
    lastUsed: '2024-01-14T12:00:00Z',
    usage: 67
  }
]

const printJobs: PrintJob[] = [
  {
    id: 'job-001',
    templateId: 'invoice-standard',
    templateName: 'Facture Standard',
    type: 'invoice',
    status: 'completed',
    createdAt: '2024-01-16T10:30:00Z',
    pages: 2,
    copies: 1,
    printer: 'HP LaserJet Pro'
  },
  {
    id: 'job-002',
    templateId: 'receipt-thermal',
    templateName: 'Reçu Thermique',
    type: 'receipt',
    status: 'printing',
    createdAt: '2024-01-16T10:25:00Z',
    pages: 1,
    copies: 3,
    printer: 'Epson TM-T20III'
  },
  {
    id: 'job-003',
    templateId: 'shipping-label',
    templateName: 'Étiquette Expédition',
    type: 'label',
    status: 'pending',
    createdAt: '2024-01-16T10:20:00Z',
    pages: 1,
    copies: 5,
    printer: 'Zebra ZD421'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800'
    case 'printing': return 'bg-blue-100 text-blue-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'failed': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'invoice': return <FileText className="w-4 h-4" />
    case 'receipt': return <ShoppingBag className="w-4 h-4" />
    case 'label': return <Package className="w-4 h-4" />
    case 'report': return <BarChart3 className="w-4 h-4" />
    case 'catalog': return <Users className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

export const PrintManager: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const handlePrint = (templateId: string) => {
    toast.success(`Impression lancée pour le template ${templateId}`)
  }

  const handlePreview = (templateId: string) => {
    toast.info(`Aperçu du template ${templateId}`)
  }

  const handleDuplicate = (templateId: string) => {
    toast.success(`Template ${templateId} dupliqué`)
  }

  const filteredTemplates = printTemplates.filter(template => {
    if (filterType !== 'all' && template.type !== filterType) return false
    return true
  })

  const filteredJobs = printJobs.filter(job => {
    if (filterStatus !== 'all' && job.status !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600">
              <Printer className="w-8 h-8 text-white" />
            </div>
            Gestionnaire d'Impression
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos templates d'impression et jobs d'impression
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Template
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{printTemplates.length}</div>
            <div className="text-sm text-muted-foreground">Templates</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Printer className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {printJobs.filter(job => job.status === 'printing').length}
            </div>
            <div className="text-sm text-muted-foreground">En cours</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {printTemplates.reduce((sum, t) => sum + t.usage, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Impressions totales</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">24h</div>
            <div className="text-sm text-muted-foreground">Dernière impression</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="jobs">Jobs d'Impression</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <h2 className="text-2xl font-bold">Templates d'Impression</h2>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="invoice">Factures</SelectItem>
                  <SelectItem value="receipt">Reçus</SelectItem>
                  <SelectItem value="label">Étiquettes</SelectItem>
                  <SelectItem value="report">Rapports</SelectItem>
                  <SelectItem value="catalog">Catalogues</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getTypeIcon(template.type)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {template.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch 
                        checked={template.enabled}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Format:</span>
                      <span className="font-medium">{template.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Orientation:</span>
                      <span className="font-medium capitalize">{template.orientation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Utilisations:</span>
                      <span className="font-medium">{template.usage}</span>
                    </div>
                    {template.lastUsed && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dernière utilisation:</span>
                        <span className="font-medium">
                          {new Date(template.lastUsed).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handlePrint(template.id)}
                    >
                      <Printer className="w-3 h-3 mr-1" />
                      Imprimer
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePreview(template.id)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDuplicate(template.id)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <h2 className="text-2xl font-bold">Jobs d'Impression</h2>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="printing">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="bg-muted/50">
                      <th className="text-left p-4 font-medium">Template</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Statut</th>
                      <th className="text-left p-4 font-medium">Pages/Copies</th>
                      <th className="text-left p-4 font-medium">Imprimante</th>
                      <th className="text-left p-4 font-medium">Créé le</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map(job => (
                      <tr key={job.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(job.type)}
                            <span className="font-medium">{job.templateName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">
                            {job.type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">
                          {job.pages} page{job.pages > 1 ? 's' : ''} × {job.copies}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {job.printer || 'Non définie'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-3 h-3" />
                            </Button>
                            {job.status === 'failed' && (
                              <Button variant="outline" size="sm">
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h2 className="text-2xl font-bold">Paramètres d'Impression</h2>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Générale</CardTitle>
                <CardDescription>
                  Paramètres par défaut pour l'impression
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Imprimante par défaut</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une imprimante" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hp-laserjet">HP LaserJet Pro</SelectItem>
                        <SelectItem value="epson-thermal">Epson TM-T20III</SelectItem>
                        <SelectItem value="zebra-label">Zebra ZD421</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Qualité d'impression</label>
                    <Select defaultValue="high">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                        <SelectItem value="high">Haute qualité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Impression automatique</h4>
                      <p className="text-sm text-muted-foreground">
                        Imprimer automatiquement certains documents
                      </p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Conservation des jobs</h4>
                      <p className="text-sm text-muted-foreground">
                        Garder l'historique des impressions pendant 30 jours
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifications d'impression</h4>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des notifications pour les jobs d'impression
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formats Supportés</CardTitle>
                <CardDescription>
                  Gérez les formats d'impression disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['A4', 'A5', 'Letter', 'Legal', 'Thermal 80mm', 'Label 4x6'].map(format => (
                    <div key={format} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium text-sm">{format}</span>
                      <Switch defaultChecked={['A4', 'Thermal 80mm', 'Label 4x6'].includes(format)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PrintManager