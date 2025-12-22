import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, Package, Image as ImageIcon, DollarSign, 
  Box, Tag, Globe, AlertCircle, Plus, X, TrendingUp,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductVariant {
  id: string;
  name: string;
  values: string[];
}

export default function CreateProduct() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [compareAtPrice, setCompareAtPrice] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    shortDescription: '',
    price: '',
    cost: '',
    stock: '',
    lowStockThreshold: '10',
    category: '',
    brand: '',
    status: 'active',
    featured: false,
    trackInventory: true,
    allowBackorder: false,
    weight: '',
    dimensions: '',
    tags: [] as string[],
    metaTitle: '',
    metaDescription: '',
    slug: ''
  });

  const [currentTag, setCurrentTag] = useState('');

  const calculateMargin = () => {
    const price = parseFloat(formData.price) || 0;
    const cost = parseFloat(formData.cost) || 0;
    if (price === 0) return 0;
    return (((price - cost) / price) * 100).toFixed(1);
  };

  const calculateDiscount = () => {
    const price = parseFloat(formData.price) || 0;
    const compare = parseFloat(compareAtPrice) || 0;
    if (compare === 0) return 0;
    return (((compare - price) / compare) * 100).toFixed(0);
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] });
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const addVariant = () => {
    setVariants([...variants, { id: Date.now().toString(), name: '', values: [''] }]);
  };

  const updateVariant = (id: string, field: 'name' | 'values', value: any) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Nom et prix sont requis');
      return;
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Non authentifié');
        return;
      }

      // Insertion dans la base de données
      const { data, error } = await (supabase
        .from('products') as any)
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          cost_price: formData.cost ? parseFloat(formData.cost) : null,
          sku: formData.sku,
          category: formData.category,
          status: formData.status,
          stock_quantity: formData.stock ? parseInt(formData.stock) : null,
          image_url: images[0] || null,
          tags: formData.tags,
          weight: formData.weight ? parseFloat(formData.weight) : null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Produit créé avec succès');
      navigate('/products');
    } catch (error) {
      console.error('Erreur création produit:', error);
      toast.error('Erreur lors de la création du produit');
    }
  };

  return (
    <>
      <Helmet>
        <title>Créer un Produit - ShopOpti</title>
        <meta name="description" content="Créez un nouveau produit dans votre catalogue ShopOpti avec options avancées" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/products')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux produits
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => toast.info('Brouillon sauvegardé')}>
                Sauvegarder en brouillon
              </Button>
              <Button onClick={handleSubmit}>
                Publier le produit
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Informations générales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du produit *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ 
                            ...formData, 
                            name: value,
                            slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                          });
                        }}
                        placeholder="Ex: T-shirt Premium Bio"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shortDescription">Description courte</Label>
                      <Input
                        id="shortDescription"
                        value={formData.shortDescription}
                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                        placeholder="Une phrase accrocheuse pour décrire le produit"
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {formData.shortDescription.length}/160
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description détaillée</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Décrivez votre produit en détail : caractéristiques, avantages, utilisation..."
                        rows={6}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      Images du produit
                    </CardTitle>
                    <CardDescription>
                      Ajoutez jusqu'à 10 images. La première sera l'image principale.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg border bg-muted overflow-hidden group">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition"
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {idx === 0 && (
                            <Badge className="absolute bottom-2 left-2" variant="secondary">
                              Principale
                            </Badge>
                          )}
                        </div>
                      ))}
                      <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 flex flex-col items-center justify-center cursor-pointer transition">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">Ajouter</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Prix et inventaire
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Prix de vente (€) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="29.99"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comparePrice">Prix comparé (€)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="relative">
                                <Input
                                  id="comparePrice"
                                  type="number"
                                  step="0.01"
                                  value={compareAtPrice}
                                  onChange={(e) => setCompareAtPrice(e.target.value)}
                                  placeholder="39.99"
                                />
                                {compareAtPrice && formData.price && (
                                  <Badge className="absolute -top-2 -right-2" variant="secondary">
                                    -{calculateDiscount()}%
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Affiche un prix barré pour montrer la réduction</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cost">Coût (€)</Label>
                        <Input
                          id="cost"
                          type="number"
                          step="0.01"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                          placeholder="15.00"
                        />
                        {formData.cost && formData.price && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Marge: {calculateMargin()}%
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          placeholder="TSH-PREM-001"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Suivre l'inventaire</Label>
                        <p className="text-sm text-muted-foreground">
                          Gérer le stock de ce produit
                        </p>
                      </div>
                      <Switch
                        checked={formData.trackInventory}
                        onCheckedChange={(checked) => setFormData({ ...formData, trackInventory: checked })}
                      />
                    </div>

                    {formData.trackInventory && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="stock">Stock actuel</Label>
                            <Input
                              id="stock"
                              type="number"
                              value={formData.stock}
                              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                              placeholder="100"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="lowStock">Seuil stock bas</Label>
                            <Input
                              id="lowStock"
                              type="number"
                              value={formData.lowStockThreshold}
                              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                              placeholder="10"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Autoriser les précommandes</Label>
                            <p className="text-sm text-muted-foreground">
                              Vendre même en rupture de stock
                            </p>
                          </div>
                          <Switch
                            checked={formData.allowBackorder}
                            onCheckedChange={(checked) => setFormData({ ...formData, allowBackorder: checked })}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="h-5 w-5 text-primary" />
                      Variantes du produit
                    </CardTitle>
                    <CardDescription>
                      Ajoutez des variantes comme la taille, la couleur, etc.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {variants.map((variant) => (
                      <div key={variant.id} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Input
                            placeholder="Option (ex: Taille)"
                            value={variant.name}
                            onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVariant(variant.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {variant.values.map((value, idx) => (
                            <Input
                              key={idx}
                              placeholder="Valeur"
                              value={value}
                              onChange={(e) => {
                                const newValues = [...variant.values];
                                newValues[idx] = e.target.value;
                                updateVariant(variant.id, 'values', newValues);
                              }}
                              className="w-32"
                            />
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newValues = [...variant.values, ''];
                              updateVariant(variant.id, 'values', newValues);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Valeur
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addVariant} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une variante
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      SEO et visibilité
                    </CardTitle>
                    <CardDescription>
                      Optimisez le référencement de votre produit
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL du produit</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">votresite.com/products/</span>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="t-shirt-premium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Titre SEO</Label>
                      <Input
                        id="metaTitle"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                        placeholder="T-shirt Premium Bio | ShopOpti"
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {formData.metaTitle.length}/60
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta description</Label>
                      <Textarea
                        id="metaDescription"
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                        placeholder="Découvrez notre T-shirt Premium en coton bio, confortable et écologique..."
                        rows={3}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {formData.metaDescription.length}/160
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Statut</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Statut de publication</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              Actif
                            </div>
                          </SelectItem>
                          <SelectItem value="draft">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-yellow-500" />
                              Brouillon
                            </div>
                          </SelectItem>
                          <SelectItem value="archived">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-gray-500" />
                              Archivé
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Produit en vedette</Label>
                      <Switch
                        checked={formData.featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Organisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clothing">Vêtements</SelectItem>
                          <SelectItem value="electronics">Électronique</SelectItem>
                          <SelectItem value="accessories">Accessoires</SelectItem>
                          <SelectItem value="home">Maison</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand">Marque</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="Nom de la marque"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          placeholder="Ajouter un tag"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button type="button" size="icon" variant="outline" onClick={addTag}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expédition</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Poids (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="0.5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dimensions">Dimensions (cm)</Label>
                      <Input
                        id="dimensions"
                        value={formData.dimensions}
                        onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                        placeholder="30 x 20 x 5"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Conseils de création
                        </p>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• Ajoutez au moins 3 images</li>
                          <li>• Remplissez la description SEO</li>
                          <li>• Définissez un prix compétitif</li>
                          <li>• Utilisez des tags pertinents</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
