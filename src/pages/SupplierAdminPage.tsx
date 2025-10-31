import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useSupplierAdmin } from '@/hooks/useSupplierAdmin'
import { Shield, Plus, Edit, Trash2, Upload, Download, Loader2, Database, Cloud } from 'lucide-react'

export default function SupplierAdminPage() {
  const { toast } = useToast()
  const {
    suppliers,
    isLoading,
    addSupplier,
    isAdding,
    updateSupplier,
    isUpdating,
    deleteSupplier,
    isDeleting,
    importFromAPI,
    isImporting,
    exportSuppliers,
    isExporting
  } = useSupplierAdmin()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [apiProvider, setApiProvider] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    description: '',
    logo_url: '',
    website_url: '',
    api_endpoint: '',
    contact_email: '',
    categories: [] as string[],
    tier: 'gold' as 'gold' | 'platinum' | 'diamond',
    minimum_order_value: 0,
    avg_delivery_days: 7,
    return_policy_days: 30,
    featured: false,
    is_active: true
  })

  const availableCategories = [
    'Mode', 'Électronique', 'Maison', 'Beauté', 'Sport', 'Accessoires',
    'Tech', 'Gadgets', 'Cuisine', 'Décoration', 'Vêtements', 'Luxe'
  ]

  const apiProviders = [
    { id: 'spocket', name: 'Spocket', needsKey: true },
    { id: 'modalyst', name: 'Modalyst', needsKey: true },
    { id: 'printful', name: 'Printful', needsKey: true },
    { id: 'oberlo', name: 'Oberlo', needsKey: true },
    { id: 'cjdropshipping', name: 'CJ Dropshipping', needsKey: true },
    { id: 'aliexpress', name: 'AliExpress', needsKey: true },
    { id: 'sample', name: 'Import données test (sans API)', needsKey: false }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingSupplier) {
      updateSupplier({ id: editingSupplier.id, ...formData }, {
        onSuccess: () => {
          setIsAddDialogOpen(false)
          setEditingSupplier(null)
          resetForm()
        }
      })
    } else {
      addSupplier(formData, {
        onSuccess: () => {
          setIsAddDialogOpen(false)
          resetForm()
        }
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
      description: '',
      logo_url: '',
      website_url: '',
      api_endpoint: '',
      contact_email: '',
      categories: [],
      tier: 'gold',
      minimum_order_value: 0,
      avg_delivery_days: 7,
      return_policy_days: 30,
      featured: false,
      is_active: true
    })
  }

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      country: supplier.country,
      description: supplier.description || '',
      logo_url: supplier.logo_url || '',
      website_url: supplier.website_url || '',
      api_endpoint: supplier.api_endpoint || '',
      contact_email: supplier.contact_email || '',
      categories: supplier.categories || [],
      tier: supplier.tier || 'gold',
      minimum_order_value: supplier.minimum_order_value || 0,
      avg_delivery_days: supplier.avg_delivery_days || 7,
      return_policy_days: supplier.return_policy_days || 30,
      featured: supplier.featured || false,
      is_active: supplier.is_active ?? true
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      deleteSupplier(id)
    }
  }

  const handleImportFromAPI = () => {
    if (!apiProvider) {
      toast({
        title: 'Fournisseur requis',
        description: 'Sélectionnez un fournisseur API',
        variant: 'destructive'
      })
      return
    }

    const provider = apiProviders.find(p => p.id === apiProvider)
    if (provider?.needsKey && !apiKey) {
      toast({
        title: 'Clé API requise',
        description: 'Entrez votre clé API',
        variant: 'destructive'
      })
      return
    }

    importFromAPI({ provider: apiProvider, apiKey })
  }

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Shield className="h-10 w-10 text-primary" />
              Administration Fournisseurs
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos fournisseurs premium et importez depuis les APIs
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => exportSuppliers()} disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Exporter
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Fournisseur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSupplier ? 'Modifier le fournisseur' : 'Ajouter un nouveau fournisseur'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom du fournisseur *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Ex: Premium Fashion USA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pays *</Label>
                      <Input
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        required
                        placeholder="Ex: USA, France, Allemagne"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Description du fournisseur..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>URL du logo</Label>
                      <Input
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Site web</Label>
                      <Input
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>API Endpoint</Label>
                      <Input
                        value={formData.api_endpoint}
                        onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                        placeholder="https://api.supplier.com/v1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email de contact</Label>
                      <Input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        placeholder="contact@supplier.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Catégories</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableCategories.map(category => (
                        <Badge
                          key={category}
                          variant={formData.categories.includes(category) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleCategory(category)}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tier</Label>
                      <Select value={formData.tier} onValueChange={(value: any) => setFormData({ ...formData, tier: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                          <SelectItem value="diamond">Diamond</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Commande min (€)</Label>
                      <Input
                        type="number"
                        value={formData.minimum_order_value}
                        onChange={(e) => setFormData({ ...formData, minimum_order_value: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Livraison (jours)</Label>
                      <Input
                        type="number"
                        value={formData.avg_delivery_days}
                        onChange={(e) => setFormData({ ...formData, avg_delivery_days: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Fournisseur mis en avant</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Actif</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isAdding || isUpdating}>
                      {(isAdding || isUpdating) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {editingSupplier ? 'Mettre à jour' : 'Ajouter'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total fournisseurs</p>
                <p className="text-3xl font-bold">{suppliers?.length || 0}</p>
              </div>
              <Database className="h-10 w-10 text-primary" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-3xl font-bold">
                  {suppliers?.filter(s => s.is_active).length || 0}
                </p>
              </div>
              <Shield className="h-10 w-10 text-green-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Premium+</p>
                <p className="text-3xl font-bold">
                  {suppliers?.filter(s => s.tier === 'platinum' || s.tier === 'diamond').length || 0}
                </p>
              </div>
              <Shield className="h-10 w-10 text-yellow-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En vedette</p>
                <p className="text-3xl font-bold">
                  {suppliers?.filter(s => s.featured).length || 0}
                </p>
              </div>
              <Shield className="h-10 w-10 text-blue-500" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Liste des fournisseurs</TabsTrigger>
            <TabsTrigger value="import">Importer depuis API</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {suppliers && suppliers.length > 0 ? (
              <div className="grid gap-4">
                {suppliers.map((supplier) => (
                  <Card key={supplier.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        {supplier.logo_url && (
                          <img src={supplier.logo_url} alt={supplier.name} className="w-16 h-16 rounded object-cover" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{supplier.name}</h3>
                            <Badge variant={supplier.tier === 'diamond' ? 'default' : 'secondary'}>
                              {supplier.tier}
                            </Badge>
                            {supplier.featured && <Badge>⭐ Featured</Badge>}
                            <Badge variant={supplier.is_active ? 'default' : 'destructive'}>
                              {supplier.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{supplier.description}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {supplier.categories?.map((cat: string) => (
                              <Badge key={cat} variant="outline">{cat}</Badge>
                            ))}
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Pays: </span>
                              <span className="font-medium">{supplier.country}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Min: </span>
                              <span className="font-medium">{supplier.minimum_order_value}€</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Livraison: </span>
                              <span className="font-medium">{supplier.avg_delivery_days}j</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Produits: </span>
                              <span className="font-medium">{supplier.product_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(supplier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => handleDelete(supplier.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun fournisseur</h3>
                <p className="text-muted-foreground mb-6">
                  Ajoutez votre premier fournisseur manuellement ou importez depuis une API
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Importer depuis une API externe</h3>
                <p className="text-muted-foreground">
                  Connectez-vous à vos fournisseurs préférés et importez automatiquement leur catalogue
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sélectionnez un fournisseur API</Label>
                  <Select value={apiProvider} onValueChange={setApiProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un fournisseur..." />
                    </SelectTrigger>
                    <SelectContent>
                      {apiProviders.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {apiProvider && apiProviders.find(p => p.id === apiProvider)?.needsKey && (
                  <div className="space-y-2">
                    <Label>Clé API</Label>
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Entrez votre clé API..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Votre clé API sera stockée de manière sécurisée
                    </p>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleImportFromAPI}
                  disabled={isImporting || !apiProvider}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-5 w-5 mr-2" />
                      Importer les fournisseurs
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-3">Fournisseurs supportés :</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {apiProviders.map(provider => (
                    <div key={provider.id} className="flex items-center gap-2 p-3 border rounded">
                      <Upload className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider.needsKey ? 'API Key requise' : 'Aucune configuration'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
