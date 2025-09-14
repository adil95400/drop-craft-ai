import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, Plus, Edit, Copy, Trash2, Download, 
  Package, Smartphone, Headphones, Laptop, Camera
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProductTemplate {
  id: string
  name: string
  description: string
  category: string
  defaultPrice?: number
  fields: {
    name: string
    description: string
    tags: string[]
    attributes: Record<string, any>
  }
  usage_count: number
  created_at: string
}

export function ProductTemplates() {
  const [templates, setTemplates] = useState<ProductTemplate[]>([
    {
      id: '1',
      name: 'Smartphone Premium',
      description: 'Modèle pour smartphones haut de gamme',
      category: 'Électronique',
      defaultPrice: 899,
      fields: {
        name: 'Smartphone [MARQUE] [MODÈLE]',
        description: 'Smartphone premium avec [CARACTÉRISTIQUES] et [FONCTIONNALITÉS]',
        tags: ['smartphone', 'mobile', 'premium'],
        attributes: {
          screenSize: '',
          storage: '',
          camera: '',
          battery: '',
          connectivity: '5G'
        }
      },
      usage_count: 23,
      created_at: '2024-01-15'
    },
    {
      id: '2',
      name: 'Écouteurs Sans Fil',
      description: 'Modèle pour écouteurs et casques audio',
      category: 'Audio',
      defaultPrice: 199,
      fields: {
        name: 'Écouteurs [MARQUE] [MODÈLE]',
        description: 'Écouteurs sans fil avec [TECHNOLOGIES] et autonomie [DURÉE]',
        tags: ['écouteurs', 'audio', 'sans-fil'],
        attributes: {
          batteryLife: '',
          noiseCancellation: false,
          connectivity: 'Bluetooth',
          waterResistance: ''
        }
      },
      usage_count: 18,
      created_at: '2024-01-10'
    },
    {
      id: '3',
      name: 'Ordinateur Portable',
      description: 'Modèle pour laptops et ordinateurs portables',
      category: 'Informatique',
      defaultPrice: 1299,
      fields: {
        name: 'Ordinateur [MARQUE] [MODÈLE]',
        description: 'Ordinateur portable [TAILLE]" avec processeur [CPU] et [RAM] de RAM',
        tags: ['ordinateur', 'laptop', 'portable'],
        attributes: {
          processor: '',
          ram: '',
          storage: '',
          graphics: '',
          screenSize: '',
          weight: ''
        }
      },
      usage_count: 31,
      created_at: '2024-01-05'
    }
  ])

  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: '',
    defaultPrice: 0,
    fields: {
      name: '',
      description: '',
      tags: [] as string[],
      attributes: {}
    }
  })

  const { toast } = useToast()

  const getTemplateIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'électronique':
        return Smartphone
      case 'audio':
        return Headphones
      case 'informatique':
        return Laptop
      default:
        return Package
    }
  }

  const handleCreateTemplate = () => {
    const template: ProductTemplate = {
      id: Date.now().toString(),
      ...newTemplate,
      usage_count: 0,
      created_at: new Date().toISOString().split('T')[0]
    }

    setTemplates(prev => [...prev, template])
    setNewTemplate({
      name: '',
      description: '',
      category: '',
      defaultPrice: 0,
      fields: {
        name: '',
        description: '',
        tags: [],
        attributes: {}
      }
    })
    setShowCreateDialog(false)

    toast({
      title: "Modèle créé",
      description: `Le modèle "${template.name}" a été créé avec succès`,
    })
  }

  const handleUseTemplate = (template: ProductTemplate) => {
    // Dans une vraie application, cela ouvrirait un dialog de création de produit pré-rempli
    setTemplates(prev => 
      prev.map(t => 
        t.id === template.id 
          ? { ...t, usage_count: t.usage_count + 1 }
          : t
      )
    )

    toast({
      title: "Modèle utilisé",
      description: `Le modèle "${template.name}" a été appliqué`,
    })
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
    toast({
      title: "Modèle supprimé",
      description: "Le modèle a été supprimé avec succès",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Modèles de Produits
          </h2>
          <p className="text-muted-foreground">
            Créez et utilisez des modèles pour accélérer la création de produits
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Modèle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau modèle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Nom du modèle</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Smartphone Premium"
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Catégorie</Label>
                  <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Électronique">Électronique</SelectItem>
                      <SelectItem value="Audio">Audio</SelectItem>
                      <SelectItem value="Informatique">Informatique</SelectItem>
                      <SelectItem value="Mode">Mode</SelectItem>
                      <SelectItem value="Gaming">Gaming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du modèle..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-price">Prix par défaut (€)</Label>
                  <Input
                    id="template-price"
                    type="number"
                    value={newTemplate.defaultPrice}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, defaultPrice: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="template-name-field">Modèle de nom</Label>
                <Input
                  id="template-name-field"
                  value={newTemplate.fields.name}
                  onChange={(e) => setNewTemplate(prev => ({ 
                    ...prev, 
                    fields: { ...prev.fields, name: e.target.value }
                  }))}
                  placeholder="Ex: [MARQUE] [MODÈLE] - [CARACTÉRISTIQUE]"
                />
              </div>

              <div>
                <Label htmlFor="template-description-field">Modèle de description</Label>
                <Textarea
                  id="template-description-field"
                  value={newTemplate.fields.description}
                  onChange={(e) => setNewTemplate(prev => ({ 
                    ...prev, 
                    fields: { ...prev.fields, description: e.target.value }
                  }))}
                  placeholder="Ex: [PRODUIT] avec [FONCTIONNALITÉS] et [AVANTAGES]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTemplate} disabled={!newTemplate.name}>
                  Créer le modèle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const IconComponent = getTemplateIcon(template.category)
          return (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Aperçu:</div>
                  <div className="bg-muted p-2 rounded text-xs">
                    <div className="font-medium">{template.fields.name}</div>
                    <div className="text-muted-foreground mt-1">
                      {template.fields.description.substring(0, 60)}...
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Utilisé {template.usage_count} fois
                  </span>
                  {template.defaultPrice && (
                    <Badge variant="secondary">
                      {template.defaultPrice}€
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => handleUseTemplate(template)}
                  >
                    Utiliser
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun modèle disponible</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre premier modèle pour accélérer la création de produits.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Créer un modèle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}