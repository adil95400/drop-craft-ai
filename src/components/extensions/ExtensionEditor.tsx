import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  Code2, Save, Eye, Upload, TestTube, GitBranch, FileCode, Settings,
  Image, Tag, DollarSign, Globe, Shield, CheckCircle, AlertCircle,
  Plus, Trash2, Edit3, Copy, Download, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface ExtensionManifest {
  name: string
  version: string
  description: string
  author: string
  category: string
  price: number
  currency: string
  tags: string[]
  permissions: string[]
  api_endpoints: string[]
  screenshots: string[]
  changelog: string
  main_file: string
  dependencies: Record<string, string>
}

export const ExtensionEditor = () => {
  const [manifest, setManifest] = useState<ExtensionManifest>({
    name: '',
    version: '1.0.0',
    description: '',
    author: '',
    category: '',
    price: 0,
    currency: 'EUR',
    tags: [],
    permissions: [],
    api_endpoints: [],
    screenshots: [],
    changelog: '',
    main_file: 'index.js',
    dependencies: {}
  })

  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [codeContent, setCodeContent] = useState(`// Extension principale
export default class MyExtension {
  constructor() {
    this.name = '${manifest.name}';
    this.version = '${manifest.version}';
  }

  async init() {
    console.log('Extension initialisée');
  }

  async execute(data) {
    // Logique principale ici
    return { success: true, data };
  }
}`)

  const categories = [
    'AI & Machine Learning',
    'Analytics & Reporting', 
    'Marketing & SEO',
    'Inventory Management',
    'Customer Service',
    'Payment & Billing',
    'Shipping & Logistics',
    'Design & UX',
    'Development Tools',
    'Security & Compliance'
  ]

  const availablePermissions = [
    'products.read',
    'products.write', 
    'orders.read',
    'orders.write',
    'customers.read',
    'customers.write',
    'analytics.read',
    'settings.read',
    'settings.write',
    'files.read',
    'files.write',
    'notifications.send'
  ]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Extension sauvegardée avec succès!')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    toast.info('Tests en cours...', { duration: 2000 })
    // Simulation de tests
    setTimeout(() => {
      toast.success('Tous les tests sont passés!')
    }, 2000)
  }

  const handlePublish = async () => {
    toast.info('Publication en cours...', { duration: 3000 })
    setTimeout(() => {
      toast.success('Extension publiée sur le marketplace!')
    }, 3000)
  }

  const addTag = (tag: string) => {
    if (tag && !manifest.tags.includes(tag)) {
      setManifest(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setManifest(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addPermission = (permission: string) => {
    if (!manifest.permissions.includes(permission)) {
      setManifest(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }))
    }
  }

  const removePermission = (permissionToRemove: string) => {
    setManifest(prev => ({
      ...prev,
      permissions: prev.permissions.filter(p => p !== permissionToRemove)
    }))
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Code2 className="w-8 h-8 text-primary" />
            </div>
            Éditeur d'Extension
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez et configurez votre extension Drop Craft AI
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTest}>
            <TestTube className="w-4 h-4 mr-2" />
            Tester
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Sauvegarder
          </Button>
          <Button onClick={handlePublish} className="bg-gradient-to-r from-green-600 to-blue-600">
            <Upload className="w-4 h-4 mr-2" />
            Publier
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="monetization">Monétisation</TabsTrigger>
          <TabsTrigger value="media">Médias</TabsTrigger>
          <TabsTrigger value="testing">Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
                <CardDescription>
                  Configurez les informations principales de votre extension
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'extension *</Label>
                  <Input
                    id="name"
                    value={manifest.name}
                    onChange={(e) => setManifest(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Mon Extension Incroyable"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={manifest.version}
                      onChange={(e) => setManifest(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Auteur</Label>
                    <Input
                      id="author"
                      value={manifest.author}
                      onChange={(e) => setManifest(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={manifest.category} onValueChange={(value) => setManifest(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={manifest.description}
                    onChange={(e) => setManifest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez votre extension..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags et métadonnées</CardTitle>
                <CardDescription>
                  Ajoutez des tags pour améliorer la découvrabilité
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {manifest.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ajouter un tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTag((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="main_file">Fichier principal</Label>
                  <Input
                    id="main_file"
                    value={manifest.main_file}
                    onChange={(e) => setManifest(prev => ({ ...prev, main_file: e.target.value }))}
                    placeholder="index.js"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="changelog">Changelog</Label>
                  <Textarea
                    id="changelog"
                    value={manifest.changelog}
                    onChange={(e) => setManifest(prev => ({ ...prev, changelog: e.target.value }))}
                    placeholder="- Nouvelle fonctionnalité X\n- Correction du bug Y"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                Éditeur de code
              </CardTitle>
              <CardDescription>
                Développez la logique principale de votre extension
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="font-mono text-sm min-h-[400px] resize-none"
                  placeholder="Tapez votre code ici..."
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button size="sm" variant="ghost">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Permissions et API
              </CardTitle>
              <CardDescription>
                Gérez les permissions et endpoints API de votre extension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Permissions requises</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availablePermissions.map(permission => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Switch
                        checked={manifest.permissions.includes(permission)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            addPermission(permission)
                          } else {
                            removePermission(permission)
                          }
                        }}
                      />
                      <Label className="text-sm">{permission}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endpoints API personnalisés</Label>
                <div className="space-y-2">
                  {manifest.api_endpoints.map((endpoint, index) => (
                    <div key={index} className="flex gap-2">
                      <Input value={endpoint} readOnly />
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un endpoint
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monetization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Monétisation
              </CardTitle>
              <CardDescription>
                Configurez les options de prix et de monétisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={manifest.price}
                    onChange={(e) => setManifest(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select value={manifest.currency} onValueChange={(value) => setManifest(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Simulation des revenus</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Prix de vente:</span>
                    <span className="font-bold">{manifest.price.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission plateforme (30%):</span>
                    <span className="text-red-600">-{(manifest.price * 0.3).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Vos revenus:</span>
                    <span className="text-green-600">{(manifest.price * 0.7).toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Médias et captures d'écran
              </CardTitle>
              <CardDescription>
                Ajoutez des images et captures d'écran pour votre extension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {manifest.screenshots.map((screenshot, index) => (
                  <div key={index} className="relative aspect-video bg-muted rounded-lg">
                    <img 
                      src={screenshot} 
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setManifest(prev => ({
                          ...prev,
                          screenshots: prev.screenshots.filter((_, i) => i !== index)
                        }))
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="text-center">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Ajouter une image</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Tests automatisés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Tests syntaxiques
                    </span>
                    <Badge variant="secondary">Passé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Tests de permissions
                    </span>
                    <Badge variant="secondary">Passé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      Tests de performance
                    </span>
                    <Badge variant="outline">En attente</Badge>
                  </div>
                </div>
                <Progress value={75} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  3/4 tests réussis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Validation marketplace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Informations complètes</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Code valide</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Captures d'écran</span>
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tests réussis</span>
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="w-full" disabled>
                    Prêt pour publication
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ExtensionEditor