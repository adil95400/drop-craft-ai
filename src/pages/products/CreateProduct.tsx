import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  ArrowLeft, Package, Image as ImageIcon, DollarSign, 
  Box, Tag, Globe, Plus, X, TrendingUp, Save, Eye, Upload,
  Sparkles, Wand2, CheckCircle2, AlertTriangle, Loader2,
  FileText, Settings, Truck, BarChart3, Copy, Link
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface ProductVariant {
  id: string;
  name: string;
  values: string[];
}

const CATEGORIES = [
  { value: 'clothing', label: 'Vêtements', icon: '👕' },
  { value: 'electronics', label: 'Électronique', icon: '📱' },
  { value: 'accessories', label: 'Accessoires', icon: '👜' },
  { value: 'home', label: 'Maison', icon: '🏠' },
  { value: 'beauty', label: 'Beauté', icon: '💄' },
  { value: 'sports', label: 'Sport', icon: '⚽' },
  { value: 'toys', label: 'Jouets', icon: '🎮' },
  { value: 'food', label: 'Alimentation', icon: '🍎' },
];

export default function CreateProduct() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
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
    slug: '',
    barcode: '',
    supplier: '',
    warranty: '',
  });

  const [currentTag, setCurrentTag] = useState('');

  // Calculs
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

  const calculateCompletionScore = () => {
    let score = 0;
    if (formData.name) score += 15;
    if (formData.description && formData.description.length > 50) score += 15;
    if (formData.price) score += 15;
    if (images.length > 0) score += 15;
    if (images.length >= 3) score += 10;
    if (formData.category) score += 10;
    if (formData.metaTitle) score += 10;
    if (formData.metaDescription) score += 10;
    return score;
  };

  // Tags
  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] });
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  // Image upload avec dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 10,
  });

  // Variantes
  const addVariant = () => {
    setVariants([...variants, { id: Date.now().toString(), name: '', values: [''] }]);
  };

  const updateVariant = (id: string, field: 'name' | 'values', value: any) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  // Génération IA
  const generateAIContent = async (type: 'description' | 'seo' | 'tags') => {
    if (!formData.name) {
      toast.error('Entrez d\'abord le nom du produit');
      return;
    }

    setIsGeneratingAI(true);
    try {
      // Simulation de génération IA
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (type === 'description') {
        setFormData(prev => ({
          ...prev,
          description: `Découvrez notre ${prev.name}, un produit de qualité premium conçu pour répondre à vos besoins. Fabriqué avec des matériaux de haute qualité, ce produit allie design moderne et fonctionnalité exceptionnelle.\n\nCaractéristiques principales:\n• Qualité supérieure garantie\n• Design élégant et moderne\n• Durabilité exceptionnelle\n• Facile à utiliser et à entretenir`,
          shortDescription: `${prev.name} - Qualité premium, design moderne et durabilité exceptionnelle.`
        }));
        toast.success('Description générée avec succès');
      } else if (type === 'seo') {
        setFormData(prev => ({
          ...prev,
          metaTitle: `${prev.name} | Achat en ligne - ShopOpti`,
          metaDescription: `Achetez ${prev.name} au meilleur prix. Livraison rapide, qualité garantie. Découvrez notre sélection de produits premium.`
        }));
        toast.success('SEO généré avec succès');
      } else if (type === 'tags') {
        const newTags = ['premium', 'qualité', 'bestseller', formData.category || 'tendance'].filter(Boolean);
        setFormData(prev => ({
          ...prev,
          tags: [...new Set([...prev.tags, ...newTags])]
        }));
        toast.success('Tags suggérés ajoutés');
      }
    } catch (error) {
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Nom et prix sont requis');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Non authentifié');
        return;
      }

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
          status: saveAsDraft ? 'draft' : formData.status,
          stock_quantity: formData.stock ? parseInt(formData.stock) : null,
          image_url: images[0] || null,
          tags: formData.tags,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          seo_title: formData.metaTitle || null,
          seo_description: formData.metaDescription || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(saveAsDraft ? 'Brouillon sauvegardé' : 'Produit créé avec succès');
      navigate('/products');
    } catch (error) {
      console.error('Erreur création produit:', error);
      toast.error('Erreur lors de la création du produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionScore = calculateCompletionScore();

  return (
    <>
      <Helmet>
        <title>Créer un Produit - ShopOpti</title>
        <meta name="description" content="Créez un nouveau produit dans votre catalogue avec options avancées et IA" />
      </Helmet>

      <ChannablePageWrapper
        title="Créer un produit"
        subtitle="Catalogue"
        description="Ajoutez un nouveau produit à votre catalogue avec toutes les informations nécessaires"
        heroImage="products"
        badge={{ label: 'Nouveau', icon: Plus }}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/products')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/import/preview', {
                state: {
                  product: {
                    title: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price) || 0,
                    images: images,
                    category: formData.category,
                    sku: formData.sku,
                  },
                  returnTo: '/products/create',
                }
              })}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Aperçu
            </Button>
          </div>
        }
      >
        <form onSubmit={(e) => handleSubmit(e, false)}>
          {/* Barre de progression et actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Complétude du produit</span>
                      <span className="text-sm font-bold text-primary">{completionScore}%</span>
                    </div>
                    <Progress value={completionScore} className="h-2" />
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className={cn("flex items-center gap-1", formData.name && "text-green-600")}>
                        {formData.name ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        Nom
                      </span>
                      <span className={cn("flex items-center gap-1", images.length > 0 && "text-green-600")}>
                        {images.length > 0 ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        Images
                      </span>
                      <span className={cn("flex items-center gap-1", formData.price && "text-green-600")}>
                        {formData.price ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        Prix
                      </span>
                      <span className={cn("flex items-center gap-1", formData.metaTitle && "text-green-600")}>
                        {formData.metaTitle ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        SEO
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={(e) => handleSubmit(e, true)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Brouillon
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-primary">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Publier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs de navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="general" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Général</span>
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Médias</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Prix</span>
              </TabsTrigger>
              <TabsTrigger value="variants" className="gap-2">
                <Box className="h-4 w-4" />
                <span className="hidden sm:inline">Variantes</span>
              </TabsTrigger>
              <TabsTrigger value="seo" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">SEO</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Général */}
            <TabsContent value="general">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                          <div className="flex items-center justify-between">
                            <Label htmlFor="shortDescription">Description courte</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => generateAIContent('description')}
                              disabled={isGeneratingAI || !formData.name}
                              className="gap-1 text-xs"
                            >
                              {isGeneratingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                              Générer avec IA
                            </Button>
                          </div>
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
                            placeholder="Décrivez votre produit en détail..."
                            rows={8}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Statut</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Statut de publication</Label>
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
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Tag className="h-5 w-5" />
                          Organisation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Catégorie</Label>
                          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  <span className="flex items-center gap-2">
                                    {cat.icon} {cat.label}
                                  </span>
                                </SelectItem>
                              ))}
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
                          <div className="flex items-center justify-between">
                            <Label>Tags</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => generateAIContent('tags')}
                              disabled={isGeneratingAI}
                              className="gap-1 text-xs"
                            >
                              <Sparkles className="h-3 w-3" />
                              Suggérer
                            </Button>
                          </div>
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
                  </motion.div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Médias */}
            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Images du produit
                  </CardTitle>
                  <CardDescription>
                    Glissez-déposez vos images ou cliquez pour les sélectionner. Maximum 10 images.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      {isDragActive 
                        ? "Déposez les images ici..." 
                        : "Glissez-déposez vos images ici, ou cliquez pour sélectionner"
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, JPEG, WEBP jusqu'à 10MB
                    </p>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                      {images.map((img, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative aspect-square rounded-lg border bg-muted overflow-hidden group"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const newImages = [...images];
                                if (idx > 0) {
                                  [newImages[0], newImages[idx]] = [newImages[idx], newImages[0]];
                                  setImages(newImages);
                                }
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {idx === 0 && (
                            <Badge className="absolute bottom-2 left-2" variant="secondary">
                              Principale
                            </Badge>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Prix */}
            <TabsContent value="pricing">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Prix et inventaire
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                          <Label htmlFor="comparePrice">Prix barré (€)</Label>
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
                              <Badge className="absolute -top-2 -right-2 bg-red-500" variant="default">
                                -{calculateDiscount()}%
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cost">Coût d'achat (€)</Label>
                          <Input
                            id="cost"
                            type="number"
                            step="0.01"
                            value={formData.cost}
                            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                            placeholder="15.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sku">SKU</Label>
                          <Input
                            id="sku"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="TSH-PREM-001"
                            className="font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="barcode">Code-barres</Label>
                          <Input
                            id="barcode"
                            value={formData.barcode}
                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                            placeholder="3760123456789"
                            className="font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="supplier">Fournisseur</Label>
                          <Input
                            id="supplier"
                            value={formData.supplier}
                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            placeholder="Nom du fournisseur"
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
                </div>

                {/* Sidebar Prix */}
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Analyse de rentabilité
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Prix de vente</span>
                        <span className="font-bold">{formData.price ? `${formData.price} €` : '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Coût</span>
                        <span className="font-medium">{formData.cost ? `${formData.cost} €` : '-'}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Marge brute</span>
                        <span className={cn(
                          "font-bold",
                          parseFloat(String(calculateMargin())) > 30 ? "text-green-600" : "text-yellow-600"
                        )}>
                          {calculateMargin()}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Bénéfice unitaire</span>
                        <span className="font-bold text-green-600">
                          {formData.price && formData.cost 
                            ? `${(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)} €`
                            : '-'
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Expédition
                      </CardTitle>
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
                </div>
              </div>
            </TabsContent>

            {/* Tab: Variantes */}
            <TabsContent value="variants">
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
                  {variants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune variante configurée</p>
                      <p className="text-sm">Ajoutez des options comme taille ou couleur</p>
                    </div>
                  ) : (
                    variants.map((variant) => (
                      <motion.div
                        key={variant.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 p-4 border rounded-lg"
                      >
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
                      </motion.div>
                    ))
                  )}
                  <Button type="button" variant="outline" onClick={addVariant} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une variante
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: SEO */}
            <TabsContent value="seo">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateAIContent('seo')}
                        disabled={isGeneratingAI || !formData.name}
                        className="gap-2"
                      >
                        {isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        Générer le SEO avec IA
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug">URL du produit</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">votresite.com/products/</span>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="t-shirt-premium"
                          className="font-mono"
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
                      <div className="flex justify-between">
                        <p className={cn(
                          "text-xs",
                          formData.metaTitle.length > 50 ? "text-yellow-600" : "text-muted-foreground"
                        )}>
                          {formData.metaTitle.length > 50 ? "Titre un peu long" : "Longueur idéale: 50-60 caractères"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formData.metaTitle.length}/60
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta description</Label>
                      <Textarea
                        id="metaDescription"
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                        placeholder="Découvrez notre T-shirt Premium en coton bio..."
                        rows={3}
                        maxLength={160}
                      />
                      <div className="flex justify-between">
                        <p className={cn(
                          "text-xs",
                          formData.metaDescription.length > 150 ? "text-yellow-600" : "text-muted-foreground"
                        )}>
                          {formData.metaDescription.length > 150 ? "Description un peu longue" : "Longueur idéale: 120-160 caractères"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formData.metaDescription.length}/160
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Aperçu Google */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Aperçu Google
                    </CardTitle>
                    <CardDescription>
                      Voici comment votre produit apparaîtra dans les résultats de recherche
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                      <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                        {formData.metaTitle || formData.name || 'Titre du produit'}
                      </p>
                      <p className="text-green-700 text-sm truncate flex items-center gap-1">
                        <Link className="h-3 w-3" />
                        votresite.com/products/{formData.slug || 'votre-produit'}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {formData.metaDescription || formData.shortDescription || 'Ajoutez une meta description pour améliorer votre référencement...'}
                      </p>
                    </div>

                    <div className="mt-6 space-y-3">
                      <h4 className="text-sm font-medium">Conseils SEO</h4>
                      <div className="space-y-2">
                        <div className={cn(
                          "flex items-center gap-2 text-sm",
                          formData.metaTitle ? "text-green-600" : "text-muted-foreground"
                        )}>
                          {formData.metaTitle ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                          Titre SEO défini
                        </div>
                        <div className={cn(
                          "flex items-center gap-2 text-sm",
                          formData.metaDescription ? "text-green-600" : "text-muted-foreground"
                        )}>
                          {formData.metaDescription ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                          Meta description renseignée
                        </div>
                        <div className={cn(
                          "flex items-center gap-2 text-sm",
                          formData.slug ? "text-green-600" : "text-muted-foreground"
                        )}>
                          {formData.slug ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                          URL personnalisée
                        </div>
                        <div className={cn(
                          "flex items-center gap-2 text-sm",
                          images.length > 0 ? "text-green-600" : "text-muted-foreground"
                        )}>
                          {images.length > 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                          Images ajoutées
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </ChannablePageWrapper>
    </>
  );
}
