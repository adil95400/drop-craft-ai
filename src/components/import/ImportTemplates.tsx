import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Download, 
  Upload, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Copy,
  Search,
  Star,
  Clock,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'csv' | 'xml' | 'json' | 'custom';
  category: 'ecommerce' | 'catalog' | 'inventory' | 'custom';
  fields: number;
  downloads: number;
  isPopular: boolean;
  createdAt: Date;
  preview?: string;
}

export const ImportTemplates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [createDialog, setCreateDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; template: Template | null }>({
    open: false,
    template: null
  });
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'csv' as const,
    category: 'catalog' as const
  });

  // Mock templates data
  const templates: Template[] = [
    {
      id: '1',
      name: 'E-commerce Standard',
      description: 'Template standard pour produits e-commerce avec prix, stock, descriptions',
      type: 'csv',
      category: 'ecommerce',
      fields: 25,
      downloads: 1247,
      isPopular: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      preview: 'Name,SKU,Price,Description,Category,Stock,Weight,Image_URL'
    },
    {
      id: '2',
      name: 'Catalogue Produits Simple',
      description: 'Template basique pour import de catalogue avec informations essentielles',
      type: 'csv',
      category: 'catalog',
      fields: 12,
      downloads: 856,
      isPopular: true,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      preview: 'Product_Name,SKU,Price,Category,Brand,Description'
    },
    {
      id: '3',
      name: 'Shopify Export Format',
      description: 'Compatible avec le format d\'export Shopify pour migration facile',
      type: 'csv',
      category: 'ecommerce',
      fields: 45,
      downloads: 623,
      isPopular: false,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      preview: 'Handle,Title,Body,Vendor,Type,Tags,Published,Variant_SKU'
    },
    {
      id: '4',
      name: 'Flux XML Alimentaire',
      description: 'Template spécialisé pour produits alimentaires avec dates de péremption',
      type: 'xml',
      category: 'catalog',
      fields: 18,
      downloads: 234,
      isPopular: false,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      preview: '<product><name/><expiry_date/><nutritional_info/></product>'
    },
    {
      id: '5',
      name: 'API JSON Products',
      description: 'Format JSON pour intégration API avec métadonnées avancées',
      type: 'json',
      category: 'custom',
      fields: 30,
      downloads: 189,
      isPopular: false,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      preview: '{"products":[{"id":"","name":"","metadata":{},"variants":[]}]}'
    },
    {
      id: '6',
      name: 'Inventaire Warehouse',
      description: 'Gestion d\'inventaire avec emplacements, lots et quantités',
      type: 'csv',
      category: 'inventory',
      fields: 15,
      downloads: 445,
      isPopular: false,
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      preview: 'SKU,Location,Lot_Number,Quantity,Reserved,Available'
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'Toutes catégories', count: templates.length },
    { value: 'ecommerce', label: 'E-commerce', count: templates.filter(t => t.category === 'ecommerce').length },
    { value: 'catalog', label: 'Catalogue', count: templates.filter(t => t.category === 'catalog').length },
    { value: 'inventory', label: 'Inventaire', count: templates.filter(t => t.category === 'inventory').length },
    { value: 'custom', label: 'Personnalisé', count: templates.filter(t => t.category === 'custom').length }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'csv': return '📊';
      case 'xml': return '🗂️';
      case 'json': return '📋';
      default: return '📄';
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      csv: 'bg-green-100 text-green-800',
      xml: 'bg-blue-100 text-blue-800',
      json: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[type as keyof typeof colors] || colors.custom}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const handleDownload = (template: Template) => {
    toast.success(`Template "${template.name}" téléchargé avec succès`);
  };

  const handleDuplicate = (template: Template) => {
    toast.success(`Template "${template.name}" dupliqué avec succès`);
  };

  const handlePreview = (template: Template) => {
    setPreviewDialog({ open: true, template });
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast.error('Veuillez saisir un nom pour le template');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Template "${newTemplate.name}" créé avec succès`);
      setCreateDialog(false);
      setNewTemplate({ name: '', description: '', type: 'csv', category: 'catalog' });
    } catch (error) {
      toast.error('Erreur lors de la création du template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Create */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates d'Import</h2>
          <p className="text-muted-foreground">
            Utilisez nos templates prêts à l'emploi ou créez vos propres formats
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Créer un template
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="text-xs"
                >
                  {category.label} ({category.count})
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getTypeIcon(template.type)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.isPopular && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                          <Star className="w-3 h-3 mr-1" />
                          Populaire
                        </Badge>
                      )}
                    </div>
                    {getTypeBadge(template.type)}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {template.fields} champs
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {template.downloads}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {template.createdAt.toLocaleDateString('fr-FR')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDownload(template)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreview(template)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicate(template)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Aucun template trouvé</h3>
          <p className="text-sm text-muted-foreground">
            Essayez de modifier vos critères de recherche ou créez un nouveau template
          </p>
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Nom du template</Label>
              <Input
                id="template-name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: Mon template personnalisé"
              />
            </div>
            
            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez l'usage de ce template..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de fichier</Label>
                <select
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                >
                  <option value="csv">CSV</option>
                  <option value="xml">XML</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              
              <div>
                <Label>Catégorie</Label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                >
                  <option value="catalog">Catalogue</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="inventory">Inventaire</option>
                  <option value="custom">Personnalisé</option>
                </select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateTemplate}>
              Créer le template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog({ open, template: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{previewDialog.template && getTypeIcon(previewDialog.template.type)}</span>
              Aperçu: {previewDialog.template?.name}
            </DialogTitle>
          </DialogHeader>
          
          {previewDialog.template && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {previewDialog.template.description}
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-sm font-medium">Aperçu de la structure</Label>
                <pre className="text-xs bg-white p-3 mt-2 rounded border overflow-x-auto">
                  {previewDialog.template.preview}
                </pre>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">{previewDialog.template.fields}</div>
                  <div className="text-xs text-muted-foreground">Champs</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{previewDialog.template.downloads}</div>
                  <div className="text-xs text-muted-foreground">Téléchargements</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{previewDialog.template.createdAt.toLocaleDateString('fr-FR')}</div>
                  <div className="text-xs text-muted-foreground">Créé le</div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialog({ open: false, template: null })}>
              Fermer
            </Button>
            {previewDialog.template && (
              <Button onClick={() => handleDownload(previewDialog.template!)}>
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};