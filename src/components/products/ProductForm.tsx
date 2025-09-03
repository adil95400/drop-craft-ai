import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, Eye, Upload, Plus, X, Star, Globe, 
  Search, Tag, Package, Euro, BarChart3, Image as ImageIcon,
  Zap, Brain, Languages
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductFormProps {
  productId?: string;
  onSave?: (product: any) => void;
  onCancel?: () => void;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: { [key: string]: string };
}

const ProductForm = ({ productId, onSave, onCancel }: ProductFormProps) => {
  const { toast } = useToast();
  
  const [product, setProduct] = useState({
    name: '',
    sku: '',
    description: '',
    short_description: '',
    price: 0,
    cost_price: 0,
    compare_at_price: 0,
    category: '',
    brand: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'active' | 'archived',
    featured: false,
    track_inventory: true,
    stock: 0,
    low_stock_threshold: 5,
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    images: [] as string[],
    seo: {
      title: '',
      description: '',
      slug: '',
      keywords: ''
    },
    shipping: {
      free_shipping: false,
      shipping_class: '',
      separate_shipping: false
    }
  });

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const categories = [
    'Électronique', 'Vêtements', 'Maison & Jardin', 'Sports & Loisirs',
    'Beauté & Santé', 'Automobile', 'Livres', 'Jouets', 'Alimentation'
  ];

  const handleSave = () => {
    if (!product.name || !product.sku || !product.price) {
      toast({
        title: "Champs obligatoires manquants",
        description: "Veuillez remplir au moins le nom, SKU et prix.",
        variant: "destructive"
      });
      return;
    }

    const productData = {
      ...product,
      variants: variants.length > 0 ? variants : undefined,
      id: productId || Date.now().toString()
    };

    onSave?.(productData);
    
    toast({
      title: productId ? "Produit mis à jour" : "Produit créé",
      description: `Le produit "${product.name}" a été ${productId ? 'mis à jour' : 'créé'} avec succès.`
    });
  };

  const handlePreview = () => {
    toast({
      title: "Aperçu du produit",
      description: "Ouverture de l'aperçu dans un nouvel onglet..."
    });
  };

  const generateSKU = () => {
    const prefix = product.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const generatedSKU = `${prefix}-${timestamp}`;
    setProduct({ ...product, sku: generatedSKU });
    
    toast({
      title: "SKU généré",
      description: `Nouveau SKU: ${generatedSKU}`
    });
  };

  const addTag = () => {
    if (newTag.trim() && !product.tags.includes(newTag.trim())) {
      setProduct({
        ...product,
        tags: [...product.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProduct({
      ...product,
      tags: product.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const optimizeWithAI = async () => {
    setIsOptimizing(true);
    
    // Simuler l'optimisation IA
    setTimeout(() => {
      const optimized = {
        ...product,
        name: product.name || "Produit Premium Optimisé IA",
        description: product.description || "Description optimisée par IA avec mots-clés pertinents et structure SEO. Ce produit offre une qualité exceptionnelle et répond parfaitement aux besoins des clients.",
        seo: {
          title: `${product.name} - Achat en ligne | Livraison rapide`,
          description: `Découvrez ${product.name}. Prix compétitif, qualité garantie. Livraison rapide et service client exceptionnel.`,
          slug: product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          keywords: `${product.name}, ${product.category}, achat en ligne, livraison`
        },
        tags: [...product.tags, 'optimisé-ia', 'recommandé', 'populaire']
      };
      
      setProduct(optimized);
      setIsOptimizing(false);
      
      toast({
        title: "Optimisation IA terminée",
        description: "Le produit a été optimisé pour le SEO et les conversions."
      });
    }, 2000);
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: `Variante ${variants.length + 1}`,
      sku: `${product.sku}-V${variants.length + 1}`,
      price: product.price,
      stock: 0,
      attributes: {}
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (variantId: string) => {
    setVariants(variants.filter(v => v.id !== variantId));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {productId ? 'Modifier le produit' : 'Nouveau produit'}
          </h1>
          <p className="text-muted-foreground">
            {productId ? 'Modifiez les informations du produit' : 'Créez un nouveau produit pour votre catalogue'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button 
            onClick={optimizeWithAI} 
            variant="outline"
            disabled={isOptimizing}
          >
            <Brain className="w-4 h-4 mr-2" />
            {isOptimizing ? 'Optimisation...' : 'Optimiser IA'}
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            {productId ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="pricing">Prix</TabsTrigger>
          <TabsTrigger value="inventory">Stock</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="media">Médias</TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={product.name}
                    onChange={(e) => setProduct({...product, name: e.target.value})}
                    placeholder="Ex: iPhone 15 Pro Max"
                  />
                </div>

                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sku"
                      value={product.sku}
                      onChange={(e) => setProduct({...product, sku: e.target.value})}
                      placeholder="Ex: IPH15PM-256"
                    />
                    <Button variant="outline" onClick={generateSKU}>
                      <Zap className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={product.category} onValueChange={(value) => setProduct({...product, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="brand">Marque</Label>
                  <Input
                    id="brand"
                    value={product.brand}
                    onChange={(e) => setProduct({...product, brand: e.target.value})}
                    placeholder="Ex: Apple"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={product.description}
                  onChange={(e) => setProduct({...product, description: e.target.value})}
                  rows={5}
                  placeholder="Description détaillée du produit..."
                />
              </div>

              <div>
                <Label htmlFor="short_description">Description courte</Label>
                <Textarea
                  id="short_description"
                  value={product.short_description}
                  onChange={(e) => setProduct({...product, short_description: e.target.value})}
                  rows={2}
                  placeholder="Résumé en quelques mots..."
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {product.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ajouter un tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={product.status} onValueChange={(value) => setProduct({...product, status: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-8">
                  <Label htmlFor="featured">Produit vedette</Label>
                  <Switch
                    id="featured"
                    checked={product.featured}
                    onCheckedChange={(checked) => setProduct({...product, featured: checked})}
                  />
                </div>

                <div className="flex items-center justify-between pt-8">
                  <Label htmlFor="track_inventory">Suivre le stock</Label>
                  <Switch
                    id="track_inventory"
                    checked={product.track_inventory}
                    onCheckedChange={(checked) => setProduct({...product, track_inventory: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Prix */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="w-5 h-5" />
                Configuration des prix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Prix de vente * (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => setProduct({...product, price: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="cost_price">Prix de revient (€)</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={product.cost_price}
                    onChange={(e) => setProduct({...product, cost_price: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="compare_at_price">Prix barré (€)</Label>
                  <Input
                    id="compare_at_price"
                    type="number"
                    step="0.01"
                    value={product.compare_at_price}
                    onChange={(e) => setProduct({...product, compare_at_price: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              {product.price > 0 && product.cost_price > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Analyse de marge</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Marge brute</p>
                      <p className="font-semibold text-green-600">
                        {(product.price - product.cost_price).toFixed(2)}€
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Marge (%)</p>
                      <p className="font-semibold text-green-600">
                        {(((product.price - product.cost_price) / product.price) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ratio de marge</p>
                      <p className="font-semibold">
                        {(product.price / product.cost_price).toFixed(2)}x
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Stock */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Gestion des stocks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Quantité en stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={product.stock}
                    onChange={(e) => setProduct({...product, stock: parseInt(e.target.value)})}
                    disabled={!product.track_inventory}
                  />
                </div>

                <div>
                  <Label htmlFor="low_stock_threshold">Seuil de stock faible</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    value={product.low_stock_threshold}
                    onChange={(e) => setProduct({...product, low_stock_threshold: parseInt(e.target.value)})}
                    disabled={!product.track_inventory}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="weight">Poids (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={product.weight}
                  onChange={(e) => setProduct({...product, weight: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <Label>Dimensions (cm)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Longueur"
                    type="number"
                    value={product.dimensions.length}
                    onChange={(e) => setProduct({
                      ...product, 
                      dimensions: {...product.dimensions, length: parseFloat(e.target.value)}
                    })}
                  />
                  <Input
                    placeholder="Largeur"
                    type="number"
                    value={product.dimensions.width}
                    onChange={(e) => setProduct({
                      ...product, 
                      dimensions: {...product.dimensions, width: parseFloat(e.target.value)}
                    })}
                  />
                  <Input
                    placeholder="Hauteur"
                    type="number"
                    value={product.dimensions.height}
                    onChange={(e) => setProduct({
                      ...product, 
                      dimensions: {...product.dimensions, height: parseFloat(e.target.value)}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Variantes */}
        <TabsContent value="variants" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Variantes du produit
                </CardTitle>
                <Button onClick={addVariant}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter variante
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucune variante</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez des variantes pour des produits avec différentes options (taille, couleur, etc.).
                  </p>
                  <Button onClick={addVariant}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une variante
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <Card key={variant.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Variante {index + 1}</h4>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeVariant(variant.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Nom</Label>
                            <Input
                              value={variant.name}
                              onChange={(e) => {
                                const updated = variants.map(v => 
                                  v.id === variant.id ? {...v, name: e.target.value} : v
                                );
                                setVariants(updated);
                              }}
                            />
                          </div>
                          
                          <div>
                            <Label>SKU</Label>
                            <Input
                              value={variant.sku}
                              onChange={(e) => {
                                const updated = variants.map(v => 
                                  v.id === variant.id ? {...v, sku: e.target.value} : v
                                );
                                setVariants(updated);
                              }}
                            />
                          </div>
                          
                          <div>
                            <Label>Prix (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.price}
                              onChange={(e) => {
                                const updated = variants.map(v => 
                                  v.id === variant.id ? {...v, price: parseFloat(e.target.value)} : v
                                );
                                setVariants(updated);
                              }}
                            />
                          </div>
                          
                          <div>
                            <Label>Stock</Label>
                            <Input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => {
                                const updated = variants.map(v => 
                                  v.id === variant.id ? {...v, stock: parseInt(e.target.value)} : v
                                );
                                setVariants(updated);
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet SEO */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Optimisation SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo_title">Titre SEO</Label>
                <Input
                  id="seo_title"
                  value={product.seo.title}
                  onChange={(e) => setProduct({
                    ...product,
                    seo: {...product.seo, title: e.target.value}
                  })}
                  placeholder="Titre optimisé pour les moteurs de recherche"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {product.seo.title.length}/60 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="seo_description">Méta description</Label>
                <Textarea
                  id="seo_description"
                  value={product.seo.description}
                  onChange={(e) => setProduct({
                    ...product,
                    seo: {...product.seo, description: e.target.value}
                  })}
                  placeholder="Description pour les résultats de recherche"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {product.seo.description.length}/160 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="seo_slug">Slug URL</Label>
                <Input
                  id="seo_slug"
                  value={product.seo.slug}
                  onChange={(e) => setProduct({
                    ...product,
                    seo: {...product.seo, slug: e.target.value}
                  })}
                  placeholder="url-du-produit"
                />
              </div>

              <div>
                <Label htmlFor="seo_keywords">Mots-clés</Label>
                <Input
                  id="seo_keywords"
                  value={product.seo.keywords}
                  onChange={(e) => setProduct({
                    ...product,
                    seo: {...product.seo, keywords: e.target.value}
                  })}
                  placeholder="mot-clé1, mot-clé2, mot-clé3"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Médias */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Images du produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg mb-2">Glissez-déposez vos images ici</p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou cliquez pour sélectionner des fichiers
                </p>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Sélectionner des images
                </Button>
              </div>
              
              {product.images.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {product.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => {
                          const updatedImages = product.images.filter((_, i) => i !== index);
                          setProduct({...product, images: updatedImages});
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductForm;