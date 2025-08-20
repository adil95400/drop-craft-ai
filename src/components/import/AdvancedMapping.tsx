import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowRight,
  Zap,
  FileText,
  Settings,
  Eye,
  Save,
  Upload,
  Download,
  Copy,
  Trash2,
  Plus,
  Brain,
  Target,
  Filter
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface FieldMapping {
  id: string
  source: string
  target: string
  transform?: string
  required: boolean
  aiSuggested?: boolean
}

interface MappingTemplate {
  id: string
  name: string
  description: string
  mappings: FieldMapping[]
  source_type: 'csv' | 'json' | 'xml' | 'api'
  created_at: string
}

const defaultMappings: FieldMapping[] = [
  { id: '1', source: 'product_name', target: 'name', required: true },
  { id: '2', source: 'product_description', target: 'description', required: false },
  { id: '3', source: 'price', target: 'price', required: true },
  { id: '4', source: 'cost', target: 'cost_price', required: false },
  { id: '5', source: 'sku', target: 'sku', required: false },
  { id: '6', source: 'category', target: 'category', required: false },
  { id: '7', source: 'image_url', target: 'image_urls', transform: 'split_by_comma', required: false },
  { id: '8', source: 'tags', target: 'tags', transform: 'split_by_comma', required: false }
]

const availableTargets = [
  'name', 'description', 'price', 'cost_price', 'sku', 'category', 
  'supplier_name', 'image_urls', 'tags', 'meta_title', 'meta_description',
  'weight', 'dimensions', 'brand', 'model'
]

const transformOptions = [
  { value: 'none', label: 'Aucune transformation' },
  { value: 'uppercase', label: 'MAJUSCULES' },
  { value: 'lowercase', label: 'minuscules' },
  { value: 'capitalize', label: 'Première Lettre Majuscule' },
  { value: 'split_by_comma', label: 'Diviser par virgule' },
  { value: 'split_by_semicolon', label: 'Diviser par point-virgule' },
  { value: 'remove_html', label: 'Supprimer HTML' },
  { value: 'currency_to_number', label: 'Devise vers nombre' },
  { value: 'date_format', label: 'Formater date' }
]

const mockTemplates: MappingTemplate[] = [
  {
    id: '1',
    name: 'Template AliExpress',
    description: 'Mapping optimisé pour les flux AliExpress',
    source_type: 'csv',
    created_at: '2024-01-15T10:00:00Z',
    mappings: [
      { id: '1', source: 'Product Name', target: 'name', required: true },
      { id: '2', source: 'Description', target: 'description', required: false },
      { id: '3', source: 'Price USD', target: 'price', required: true, transform: 'currency_to_number' },
      { id: '4', source: 'Category', target: 'category', required: false },
      { id: '5', source: 'Image URLs', target: 'image_urls', transform: 'split_by_comma', required: false }
    ]
  },
  {
    id: '2',
    name: 'Template BigBuy',
    description: 'Configuration pour l\'API BigBuy',
    source_type: 'api',
    created_at: '2024-01-14T15:30:00Z',
    mappings: [
      { id: '1', source: 'title', target: 'name', required: true },
      { id: '2', source: 'description', target: 'description', required: false },
      { id: '3', source: 'retailPrice', target: 'price', required: true },
      { id: '4', source: 'wholesalePrice', target: 'cost_price', required: false },
      { id: '5', source: 'sku', target: 'sku', required: false }
    ]
  }
]

export const AdvancedMapping = () => {
  const [mappings, setMappings] = useState<FieldMapping[]>(defaultMappings)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [sampleData, setSampleData] = useState<any[]>([])
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [newMappingDialog, setNewMappingDialog] = useState(false)

  const handleAddMapping = useCallback(() => {
    const newMapping: FieldMapping = {
      id: Date.now().toString(),
      source: '',
      target: '',
      required: false
    }
    setMappings(prev => [...prev, newMapping])
  }, [])

  const handleUpdateMapping = useCallback((id: string, field: keyof FieldMapping, value: any) => {
    setMappings(prev => prev.map(mapping => 
      mapping.id === id ? { ...mapping, [field]: value } : mapping
    ))
  }, [])

  const handleDeleteMapping = useCallback((id: string) => {
    setMappings(prev => prev.filter(mapping => mapping.id !== id))
  }, [])

  const handleLoadTemplate = useCallback((templateId: string) => {
    const template = mockTemplates.find(t => t.id === templateId)
    if (template) {
      setMappings(template.mappings)
      toast.success(`Template "${template.name}" chargé`)
    }
  }, [])

  const handleSaveTemplate = useCallback(() => {
    toast.success('Template sauvegardé avec succès')
  }, [])

  const handleAISuggestions = useCallback(async () => {
    toast.info('Analyse IA en cours...')
    
    // Simulation de suggestions IA
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const aiSuggestions: FieldMapping[] = [
      { id: 'ai1', source: 'product_title', target: 'name', required: true, aiSuggested: true },
      { id: 'ai2', source: 'long_description', target: 'description', required: false, aiSuggested: true },
      { id: 'ai3', source: 'selling_price', target: 'price', required: true, aiSuggested: true },
      { id: 'ai4', source: 'wholesale_cost', target: 'cost_price', required: false, aiSuggested: true }
    ]
    
    setMappings(prev => [...prev, ...aiSuggestions])
    toast.success('4 suggestions IA ajoutées')
  }, [])

  const handleTestMapping = useCallback(() => {
    setIsPreviewMode(true)
    toast.success('Aperçu du mapping généré')
  }, [])

  const MappingEditor = () => (
    <div className="space-y-4">
      {mappings.map((mapping) => (
        <Card key={mapping.id} className={mapping.aiSuggested ? 'border-purple-200 bg-purple-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {mapping.aiSuggested && (
                <Brain className="w-5 h-5 text-purple-500" />
              )}
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm">Champ Source</Label>
                  <Input
                    value={mapping.source}
                    onChange={(e) => handleUpdateMapping(mapping.id, 'source', e.target.value)}
                    placeholder="ex: product_name"
                  />
                </div>
                
                <ArrowRight className="w-5 h-5 text-muted-foreground self-end mb-2 hidden md:block" />
                
                <div>
                  <Label className="text-sm">Champ Cible</Label>
                  <Select
                    value={mapping.target}
                    onValueChange={(value) => handleUpdateMapping(mapping.id, 'target', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTargets.map(target => (
                        <SelectItem key={target} value={target}>{target}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Transformation</Label>
                  <Select
                    value={mapping.transform || 'none'}
                    onValueChange={(value) => handleUpdateMapping(mapping.id, 'transform', value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {transformOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={mapping.required}
                    onCheckedChange={(checked) => handleUpdateMapping(mapping.id, 'required', checked)}
                  />
                  <Label className="text-sm">Requis</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMapping(mapping.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Button onClick={handleAddMapping} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter un Mapping
      </Button>
    </div>
  )

  const TemplateManager = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Templates de Mapping</h3>
        <Button onClick={handleSaveTemplate}>
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder Template
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockTemplates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <Badge variant="outline">{template.source_type.toUpperCase()}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {template.mappings.length} champs mappés
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadTemplate(template.id)}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Charger
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const PreviewResults = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Aperçu du Mapping</CardTitle>
          <CardDescription>Visualisation des transformations appliquées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Données Source (Exemple)</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
{`{
  "product_name": "iPhone 15 Pro Max",
  "product_description": "<p>Latest iPhone</p>",
  "price": "$1199.99",
  "category": "Electronics",
  "image_url": "img1.jpg,img2.jpg"
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Données Transformées</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
{`{
  "name": "iPhone 15 Pro Max",
  "description": "Latest iPhone",
  "price": 1199.99,
  "category": "Electronics",
  "image_urls": ["img1.jpg", "img2.jpg"]
}`}
                </pre>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleTestMapping}>
                <Eye className="w-4 h-4 mr-2" />
                Tester sur Plus de Données
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exporter Configuration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mapping Avancé</h2>
          <p className="text-muted-foreground">
            Configuration intelligente du mapping de champs avec suggestions IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAISuggestions} variant="outline">
            <Brain className="w-4 h-4 mr-2" />
            Suggestions IA
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Configurer
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Tabs defaultValue="mapping" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mapping">Configuration Mapping</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="mapping">
          <MappingEditor />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager />
        </TabsContent>

        <TabsContent value="preview">
          <PreviewResults />
        </TabsContent>

        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Validation des Règles</CardTitle>
              <CardDescription>Vérification de la cohérence du mapping</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Target className="w-4 h-4" />
                  <span>Tous les champs requis sont mappés</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <Target className="w-4 h-4" />
                  <span>Aucun conflit de mapping détecté</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-600">
                  <Filter className="w-4 h-4" />
                  <span>2 transformations recommandées non appliquées</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}