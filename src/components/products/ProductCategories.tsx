import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useProductsUnified } from '@/hooks/unified'
import { 
  Plus, MoreHorizontal, Edit, Trash2, Tag, Package, 
  TrendingUp, Eye, Search, Filter, Folder, FileText
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
  description?: string
  slug: string
  parent_id?: string
  product_count: number
  created_at: string
  seo_title?: string
  seo_description?: string
  image_url?: string
  is_active: boolean
}

export function ProductCategories() {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: 'Électronique',
      description: 'Produits électroniques et gadgets',
      slug: 'electronique',
      product_count: 245,
      created_at: '2024-01-15',
      is_active: true
    },
    {
      id: '2',
      name: 'Mode',
      description: 'Vêtements et accessoires',
      slug: 'mode',
      product_count: 189,
      created_at: '2024-01-10',
      is_active: true
    },
    {
      id: '3',
      name: 'Maison & Jardin',
      description: 'Articles pour la maison et le jardin',
      slug: 'maison-jardin',
      product_count: 156,
      created_at: '2024-01-05',
      is_active: true
    }
  ])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    seo_title: '',
    seo_description: '',
    image_url: ''
  })
  
  const { toast } = useToast()

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateCategory = () => {
    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      description: newCategory.description,
      slug: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
      product_count: 0,
      created_at: new Date().toISOString().split('T')[0],
      seo_title: newCategory.seo_title,
      seo_description: newCategory.seo_description,
      image_url: newCategory.image_url,
      is_active: true
    }

    setCategories(prev => [...prev, category])
    setNewCategory({
      name: '',
      description: '',
      seo_title: '',
      seo_description: '',
      image_url: ''
    })
    setShowCreateDialog(false)

    toast({
      title: "Catégorie créée",
      description: `La catégorie "${category.name}" a été créée avec succès`,
    })
  }

  const handleDeleteCategory = (id: string) => {
    const category = categories.find(c => c.id === id)
    if (category && category.product_count > 0) {
      toast({
        title: "Impossible de supprimer",
        description: "Cette catégorie contient des produits. Déplacez-les d'abord.",
        variant: "destructive"
      })
      return
    }

    setCategories(prev => prev.filter(c => c.id !== id))
    toast({
      title: "Catégorie supprimée",
      description: "La catégorie a été supprimée avec succès",
    })
  }

  const totalProducts = categories.reduce((sum, cat) => sum + cat.product_count, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Catégories de Produits</h2>
          <p className="text-muted-foreground">
            Organisez vos produits par catégories pour une meilleure navigation
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category-name">Nom de la catégorie</Label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Électronique"
                  />
                </div>
                <div>
                  <Label htmlFor="category-image">URL de l'image</Label>
                  <Input
                    id="category-image"
                    value={newCategory.image_url}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="category-description">Description</Label>
                <Textarea
                  id="category-description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de la catégorie..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="seo-title">Titre SEO</Label>
                  <Input
                    id="seo-title"
                    value={newCategory.seo_title}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="Titre optimisé pour les moteurs de recherche"
                  />
                </div>
                <div>
                  <Label htmlFor="seo-description">Description SEO</Label>
                  <Textarea
                    id="seo-description"
                    value={newCategory.seo_description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, seo_description: e.target.value }))}
                    placeholder="Description meta pour SEO"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateCategory} disabled={!newCategory.name}>
                  Créer la catégorie
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Folder className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{categories.length}</div>
            <div className="text-sm text-muted-foreground">Catégories totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalProducts}</div>
            <div className="text-sm text-muted-foreground">Produits classés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{categories.filter(c => c.is_active).length}</div>
            <div className="text-sm text-muted-foreground">Catégories actives</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {Math.round(totalProducts / categories.length)}
            </div>
            <div className="text-sm text-muted-foreground">Produits/catégorie</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des catégories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Catégories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catégorie</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        {category.image_url ? (
                          <img 
                            src={category.image_url} 
                            alt={category.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <Tag className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        {category.seo_title && (
                          <div className="text-xs text-muted-foreground">
                            SEO: {category.seo_title}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="text-sm">{category.description}</div>
                      {category.seo_description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {category.seo_description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {category.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {category.product_count}
                      </Badge>
                      {category.product_count > 100 && (
                        <Badge variant="outline" className="text-xs">
                          Populaire
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? "secondary" : "outline"}>
                      {category.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(category.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les produits
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          Exporter
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteCategory(category.id)}
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

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune catégorie trouvée</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre première catégorie pour organiser vos produits.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Créer une catégorie
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}