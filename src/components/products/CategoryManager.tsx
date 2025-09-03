import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Edit, Trash2, FolderOpen, Folder, 
  ChevronRight, ChevronDown, 
  Save, X, Search, Filter, ArrowUp, ArrowDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  level: number;
  order: number;
  product_count: number;
  is_active: boolean;
  seo_title: string;
  seo_description: string;
  children?: Category[];
}

const CategoryManager = () => {
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: 'Électronique',
      slug: 'electronique',
      description: 'Appareils électroniques et accessoires',
      parent_id: null,
      level: 0,
      order: 1,
      product_count: 245,
      is_active: true,
      seo_title: 'Électronique - Appareils et Accessoires',
      seo_description: 'Découvrez notre large gamme d\'appareils électroniques',
      children: [
        {
          id: '2',
          name: 'Smartphones',
          slug: 'smartphones',
          description: 'Téléphones intelligents de toutes marques',
          parent_id: '1',
          level: 1,
          order: 1,
          product_count: 89,
          is_active: true,
          seo_title: 'Smartphones - iPhone, Samsung, Huawei',
          seo_description: 'Achetez les derniers smartphones aux meilleurs prix'
        },
        {
          id: '3',
          name: 'Ordinateurs',
          slug: 'ordinateurs',
          description: 'PC portables et de bureau',
          parent_id: '1',
          level: 1,
          order: 2,
          product_count: 67,
          is_active: true,
          seo_title: 'Ordinateurs - PC Portables et de Bureau',
          seo_description: 'Trouvez l\'ordinateur parfait pour vos besoins'
        },
        {
          id: '4',
          name: 'Accessoires',
          slug: 'accessoires-electronique',
          description: 'Coques, chargeurs, écouteurs',
          parent_id: '1',
          level: 1,
          order: 3,
          product_count: 89,
          is_active: true,
          seo_title: 'Accessoires Électronique',
          seo_description: 'Accessoires pour tous vos appareils électroniques'
        }
      ]
    },
    {
      id: '5',
      name: 'Mode & Vêtements',
      slug: 'mode-vetements',
      description: 'Vêtements pour homme, femme et enfant',
      parent_id: null,
      level: 0,
      order: 2,
      product_count: 156,
      is_active: true,
      seo_title: 'Mode & Vêtements - Tendances Actuelles',
      seo_description: 'Découvrez les dernières tendances mode'
    },
    {
      id: '6',
      name: 'Maison & Jardin',
      slug: 'maison-jardin',
      description: 'Tout pour la maison et le jardin',
      parent_id: null,
      level: 0,
      order: 3,
      product_count: 203,
      is_active: true,
      seo_title: 'Maison & Jardin - Décoration et Équipement',
      seo_description: 'Équipez et décorez votre maison et jardin'
    }
  ]);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['1']);
  const [searchTerm, setSearchTerm] = useState('');

  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    parent_id: null,
    is_active: true,
    seo_title: '',
    seo_description: ''
  });

  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    
    const traverse = (categories: Category[], level = 0) => {
      categories.forEach(cat => {
        result.push({ ...cat, level });
        if (cat.children) {
          traverse(cat.children, level + 1);
        }
      });
    };
    
    traverse(cats);
    return result;
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreateCategory = () => {
    if (!newCategory.name) {
      toast({
        title: "Nom manquant",
        description: "Veuillez saisir un nom pour la catégorie.",
        variant: "destructive"
      });
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      slug: newCategory.slug || generateSlug(newCategory.name),
      description: newCategory.description || '',
      parent_id: newCategory.parent_id || null,
      level: newCategory.parent_id ? 1 : 0,
      order: categories.length + 1,
      product_count: 0,
      is_active: newCategory.is_active ?? true,
      seo_title: newCategory.seo_title || newCategory.name,
      seo_description: newCategory.seo_description || `Découvrez notre sélection ${newCategory.name.toLowerCase()}`
    };

    if (newCategory.parent_id) {
      // Ajouter comme sous-catégorie
      setCategories(prev => prev.map(cat => {
        if (cat.id === newCategory.parent_id) {
          return {
            ...cat,
            children: [...(cat.children || []), category]
          };
        }
        return cat;
      }));
    } else {
      // Ajouter comme catégorie principale
      setCategories(prev => [...prev, category]);
    }

    setNewCategory({
      name: '',
      slug: '',
      description: '',
      parent_id: null,
      is_active: true,
      seo_title: '',
      seo_description: ''
    });
    setIsCreating(false);

    toast({
      title: "Catégorie créée",
      description: `La catégorie "${category.name}" a été créée avec succès.`
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory({ ...category });
  };

  const handleSaveEdit = () => {
    if (!editingCategory) return;

    setCategories(prev => prev.map(cat => {
      if (cat.id === editingCategory.id) {
        return editingCategory;
      }
      if (cat.children) {
        return {
          ...cat,
          children: cat.children.map(child => 
            child.id === editingCategory.id ? editingCategory : child
          )
        };
      }
      return cat;
    }));

    setEditingCategory(null);
    toast({
      title: "Catégorie mise à jour",
      description: `La catégorie "${editingCategory.name}" a été mise à jour.`
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    const deleteFromCategories = (cats: Category[]): Category[] => {
      return cats.filter(cat => {
        if (cat.id === categoryId) return false;
        if (cat.children) {
          cat.children = deleteFromCategories(cat.children);
        }
        return true;
      });
    };

    setCategories(prev => deleteFromCategories(prev));
    toast({
      title: "Catégorie supprimée",
      description: "La catégorie a été supprimée avec succès."
    });
  };

  const moveCategory = (categoryId: string, direction: 'up' | 'down') => {
    // Logique de réorganisation des catégories
    toast({
      title: "Catégorie déplacée",
      description: `La catégorie a été déplacée vers le ${direction === 'up' ? 'haut' : 'bas'}.`
    });
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCategory = (category: Category, level = 0) => {
    const isExpanded = expandedCategories.includes(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const isEditing = editingCategory?.id === category.id;

    return (
      <div key={category.id} className="space-y-2">
        <Card className={`${level > 0 ? 'ml-6' : ''} ${!category.is_active ? 'opacity-60' : ''}`}>
          <CardContent className="p-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({
                        ...editingCategory,
                        name: e.target.value,
                        slug: generateSlug(e.target.value)
                      })}
                    />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={editingCategory.slug}
                      onChange={(e) => setEditingCategory({
                        ...editingCategory,
                        slug: e.target.value
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editingCategory.description}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory,
                      description: e.target.value
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Titre SEO</Label>
                    <Input
                      value={editingCategory.seo_title}
                      onChange={(e) => setEditingCategory({
                        ...editingCategory,
                        seo_title: e.target.value
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-8">
                    <Label>Catégorie active</Label>
                    <Switch
                      checked={editingCategory.is_active}
                      onCheckedChange={(checked) => setEditingCategory({
                        ...editingCategory,
                        is_active: checked
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description SEO</Label>
                  <Textarea
                    value={editingCategory.seo_description}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory,
                      seo_description: e.target.value
                    })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {hasChildren && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleExpanded(category.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  )}

                  <div className="flex items-center gap-2">
                    {hasChildren ? (
                      <FolderOpen className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Folder className="w-5 h-5 text-gray-500" />
                    )}
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{category.name}</h4>
                        {!category.is_active && (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                        <Badge variant="outline">
                          {category.product_count} produits
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                      <p className="text-xs text-muted-foreground">/{category.slug}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => moveCategory(category.id, 'up')}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => moveCategory(category.id, 'down')}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEditCategory(category)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(category.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {hasChildren && isExpanded && category.children && (
          <div className="space-y-2">
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Catégories</h2>
          <p className="text-muted-foreground">Organisez vos produits par catégories</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Catégorie
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flattenCategories(categories).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Catégories Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {flattenCategories(categories).filter(c => c.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.reduce((sum, cat) => sum + cat.product_count, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Catégories Vides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {flattenCategories(categories).filter(c => c.product_count === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de création */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle Catégorie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom *</Label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({
                    ...newCategory,
                    name: e.target.value,
                    slug: generateSlug(e.target.value)
                  })}
                  placeholder="Ex: Smartphones"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({
                    ...newCategory,
                    slug: e.target.value
                  })}
                  placeholder="smartphones"
                />
              </div>
            </div>

            <div>
              <Label>Catégorie parent (optionnel)</Label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md"
                value={newCategory.parent_id || ''}
                onChange={(e) => setNewCategory({
                  ...newCategory,
                  parent_id: e.target.value || null
                })}
              >
                <option value="">Aucune (catégorie principale)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({
                  ...newCategory,
                  description: e.target.value
                })}
                placeholder="Description de la catégorie..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Titre SEO</Label>
                <Input
                  value={newCategory.seo_title}
                  onChange={(e) => setNewCategory({
                    ...newCategory,
                    seo_title: e.target.value
                  })}
                  placeholder="Titre pour les moteurs de recherche"
                />
              </div>
              <div className="flex items-center justify-between pt-8">
                <Label>Catégorie active</Label>
                <Switch
                  checked={newCategory.is_active}
                  onCheckedChange={(checked) => setNewCategory({
                    ...newCategory,
                    is_active: checked
                  })}
                />
              </div>
            </div>

            <div>
              <Label>Description SEO</Label>
              <Textarea
                value={newCategory.seo_description}
                onChange={(e) => setNewCategory({
                  ...newCategory,
                  seo_description: e.target.value
                })}
                placeholder="Description pour les moteurs de recherche"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateCategory}>
                <Save className="w-4 h-4 mr-2" />
                Créer la catégorie
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des catégories */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune catégorie trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Aucune catégorie ne correspond à votre recherche.' : 'Créez votre première catégorie pour organiser vos produits.'}
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une catégorie
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCategories.map(category => renderCategory(category))
        )}
      </div>
    </div>
  );
};

export default CategoryManager;