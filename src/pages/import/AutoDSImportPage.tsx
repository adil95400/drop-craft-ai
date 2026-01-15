import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link2, Search, Package, ImageIcon, Loader2, CheckCircle2, AlertCircle, Sparkles, ExternalLink, ShoppingCart, Upload, Plus, Trash2, Eye, X, Zap, Globe, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PlatformLogo } from '@/components/ui/platform-logo';
import { getPlatformColor, getPlatformName } from '@/utils/platformLogos';
import { useDropzone } from 'react-dropzone';
interface ProductPreview {
  title: string;
  description: string;
  price: number;
  currency: string;
  suggested_price: number;
  profit_margin: number;
  images: string[];
  brand: string;
  sku: string;
  platform_detected: string;
  source_url: string;
  variants?: any[];
  videos?: string[];
}
interface QueuedUrl {
  id: string;
  url: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  preview?: ProductPreview;
  error?: string;
}
interface QueuedImage {
  id: string;
  file?: File;
  url?: string;
  preview: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  productName?: string;
  error?: string;
}
const supportedPlatforms = ['aliexpress', 'amazon', 'ebay', 'temu', 'wish', 'cjdropshipping', 'bigbuy', 'banggood', 'shein', 'etsy'];
export default function AutoDSImportPage() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();

  // URL Import State
  const [urlInput, setUrlInput] = useState('');
  const [queuedUrls, setQueuedUrls] = useState<QueuedUrl[]>([]);
  const [isProcessingUrls, setIsProcessingUrls] = useState(false);

  // Image Import State
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const [imageProductInfo, setImageProductInfo] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  });
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // Common State
  const [priceMultiplier, setPriceMultiplier] = useState(1.5);
  const [activeTab, setActiveTab] = useState('url');

  // === URL Import Functions ===

  const addUrlsToQueue = () => {
    const urls = urlInput.split(/[\n,\s]+/).map(u => u.trim()).filter(u => u && (u.startsWith('http://') || u.startsWith('https://')));
    if (urls.length === 0) {
      toast.error('Aucune URL valide détectée');
      return;
    }
    const newQueued: QueuedUrl[] = urls.map(url => ({
      id: crypto.randomUUID(),
      url,
      status: 'pending' as const
    }));
    setQueuedUrls(prev => [...prev, ...newQueued]);
    setUrlInput('');
    toast.success(`${urls.length} URL${urls.length > 1 ? 's' : ''} ajoutée${urls.length > 1 ? 's' : ''} à la file`);
  };
  const processUrlQueue = async () => {
    if (queuedUrls.length === 0) return;
    setIsProcessingUrls(true);
    for (const item of queuedUrls) {
      if (item.status !== 'pending') continue;
      setQueuedUrls(prev => prev.map(q => q.id === item.id ? {
        ...q,
        status: 'loading' as const
      } : q));
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('quick-import-url', {
          body: {
            url: item.url,
            user_id: user?.id,
            action: 'preview',
            price_multiplier: priceMultiplier
          }
        });
        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        setQueuedUrls(prev => prev.map(q => q.id === item.id ? {
          ...q,
          status: 'success' as const,
          preview: data.data
        } : q));
      } catch (err) {
        setQueuedUrls(prev => prev.map(q => q.id === item.id ? {
          ...q,
          status: 'error' as const,
          error: err instanceof Error ? err.message : 'Erreur inconnue'
        } : q));
      }
    }
    setIsProcessingUrls(false);
    toast.success('Analyse terminée');
  };
  const importFromUrl = async (item: QueuedUrl) => {
    if (!item.preview) return;
    setQueuedUrls(prev => prev.map(q => q.id === item.id ? {
      ...q,
      status: 'loading' as const
    } : q));
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('quick-import-url', {
        body: {
          url: item.url,
          user_id: user?.id,
          action: 'import',
          price_multiplier: priceMultiplier
        }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      setQueuedUrls(prev => prev.filter(q => q.id !== item.id));
      toast.success(`"${item.preview?.title.slice(0, 50)}..." importé`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'import');
      setQueuedUrls(prev => prev.map(q => q.id === item.id ? {
        ...q,
        status: 'success' as const
      } : q));
    }
  };
  const importAllUrls = async () => {
    const toImport = queuedUrls.filter(q => q.status === 'success' && q.preview);
    for (const item of toImport) {
      await importFromUrl(item);
    }
    toast.success(`${toImport.length} produit${toImport.length > 1 ? 's' : ''} importé${toImport.length > 1 ? 's' : ''}`);
  };
  const removeFromUrlQueue = (id: string) => {
    setQueuedUrls(prev => prev.filter(q => q.id !== id));
  };

  // === Image Import Functions ===

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: QueuedImage[] = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const
    }));
    setQueuedImages(prev => [...prev, ...newImages]);
    toast.success(`${acceptedFiles.length} image${acceptedFiles.length > 1 ? 's' : ''} ajoutée${acceptedFiles.length > 1 ? 's' : ''}`);
  }, []);
  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    multiple: true
  });
  const addImageFromUrl = () => {
    const urlInput = prompt('Entrez l\'URL de l\'image:');
    if (!urlInput) return;
    const newImage: QueuedImage = {
      id: crypto.randomUUID(),
      url: urlInput,
      preview: urlInput,
      status: 'pending'
    };
    setQueuedImages(prev => [...prev, newImage]);
    toast.success('Image ajoutée');
  };
  const removeFromImageQueue = (id: string) => {
    setQueuedImages(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.file) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter(i => i.id !== id);
    });
  };
  const importImages = async () => {
    if (queuedImages.length === 0) {
      toast.error('Aucune image à importer');
      return;
    }
    setIsProcessingImages(true);
    try {
      // Collect image URLs
      const imageUrls: string[] = [];
      for (const img of queuedImages) {
        if (img.url) {
          imageUrls.push(img.url);
        } else if (img.file) {
          // Upload file to storage first
          const fileExt = img.file.name.split('.').pop();
          const fileName = `${user?.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
          const {
            data: uploadData,
            error: uploadError
          } = await supabase.storage.from('product-images').upload(fileName, img.file);
          if (uploadError) {
            console.error('Upload error:', uploadError);
            // Use data URL as fallback
            const dataUrl = await new Promise<string>(resolve => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(img.file!);
            });
            imageUrls.push(dataUrl);
          } else {
            const {
              data: {
                publicUrl
              }
            } = supabase.storage.from('product-images').getPublicUrl(fileName);
            imageUrls.push(publicUrl);
          }
        }
      }

      // Call edge function to import
      const {
        data,
        error
      } = await supabase.functions.invoke('image-product-import', {
        body: {
          imageUrls,
          productInfo: {
            name: imageProductInfo.name || undefined,
            description: imageProductInfo.description || undefined,
            price: imageProductInfo.price ? parseFloat(imageProductInfo.price) : undefined,
            category: imageProductInfo.category || undefined,
            stock_quantity: 999
          }
        }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      toast.success(`${data.imported} produit${data.imported > 1 ? 's' : ''} importé${data.imported > 1 ? 's' : ''} depuis ${queuedImages.length} image${queuedImages.length > 1 ? 's' : ''}`, {
        action: {
          label: 'Voir',
          onClick: () => navigate('/products')
        }
      });

      // Clear queue
      queuedImages.forEach(img => {
        if (img.file) URL.revokeObjectURL(img.preview);
      });
      setQueuedImages([]);
      setImageProductInfo({
        name: '',
        description: '',
        price: '',
        category: ''
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setIsProcessingImages(false);
    }
  };
  const successfulUrls = queuedUrls.filter(q => q.status === 'success');
  return <>
      <Helmet>
        <title>Import Rapide - Style AutoDS - ShopOpti</title>
        <meta name="description" content="Importez des produits depuis URLs ou images, comme AutoDS" />
      </Helmet>

      <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white mb-4">
            <Zap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Import Rapide </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Importez en masse depuis URLs ou images, analysez et ajoutez à votre catalogue
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Import par URL
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Import par Image
            </TabsTrigger>
          </TabsList>

          {/* URL Import Tab */}
          <TabsContent value="url" className="space-y-6">
            {/* Supported Platforms */}
            <div className="flex flex-wrap justify-center gap-2">
              {supportedPlatforms.map(platform => <Badge key={platform} variant="secondary" className={cn("text-xs flex items-center gap-1", getPlatformColor(platform))}>
                  <PlatformLogo platform={platform} size="sm" />
                  {getPlatformName(platform)}
                </Badge>)}
            </div>

            {/* URL Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Ajouter des URLs
                </CardTitle>
                <CardDescription>
                  Collez une ou plusieurs URLs (une par ligne ou séparées par des virgules)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea placeholder="https://www.aliexpress.com/item/123.html
https://www.amazon.fr/dp/B08XYZ123
https://www.temu.com/goods/123456.html" value={urlInput} onChange={e => setUrlInput(e.target.value)} rows={4} className="font-mono text-sm" />
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  {/* Price Multiplier */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Marge bénéficiaire</Label>
                      <span className="text-sm font-medium text-primary">
                        x{priceMultiplier.toFixed(1)} ({Math.round((priceMultiplier - 1) * 100)}%)
                      </span>
                    </div>
                    <Slider value={[priceMultiplier]} onValueChange={([value]) => setPriceMultiplier(value)} min={1.1} max={3} step={0.1} />
                  </div>
                  
                  <Button onClick={addUrlsToQueue} disabled={!urlInput.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter à la file
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* URL Queue */}
            {queuedUrls.length > 0 && <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      File d'attente ({queuedUrls.length})
                    </CardTitle>
                    <CardDescription>
                      {successfulUrls.length} produit{successfulUrls.length > 1 ? 's' : ''} prêt{successfulUrls.length > 1 ? 's' : ''} à importer
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={processUrlQueue} disabled={isProcessingUrls || queuedUrls.every(q => q.status !== 'pending')} variant="outline">
                      {isProcessingUrls ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                      Analyser tout
                    </Button>
                    <Button onClick={importAllUrls} disabled={successfulUrls.length === 0} className="bg-gradient-to-r from-orange-500 to-red-600">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Importer tout ({successfulUrls.length})
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {queuedUrls.map(item => <div key={item.id} className={cn("flex gap-4 p-4 rounded-lg border transition-colors", item.status === 'success' && "bg-green-50 dark:bg-green-950/20 border-green-200", item.status === 'error' && "bg-red-50 dark:bg-red-950/20 border-red-200", item.status === 'loading' && "bg-blue-50 dark:bg-blue-950/20 border-blue-200")}>
                          {/* Preview Image */}
                          <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                            {item.preview?.images?.[0] ? <img src={item.preview.images[0]} alt="" className="w-full h-full object-cover" /> : item.status === 'loading' ? <div className="w-full h-full flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div> : <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>}
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            {item.preview ? <>
                                <h4 className="font-medium truncate">{item.preview.title}</h4>
                                <div className="flex items-center gap-3 text-sm">
                                  <Badge className={getPlatformColor(item.preview.platform_detected)}>
                                    {getPlatformName(item.preview.platform_detected)}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    Prix: {(item.preview.price ?? 0).toFixed(2)} {item.preview.currency}
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    → {(item.preview.suggested_price ?? 0).toFixed(2)} €
                                  </span>
                                </div>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                  <span>{item.preview.images?.length || 0} images</span>
                                  {item.preview.variants && item.preview.variants.length > 0 && <span>• {item.preview.variants.length} variantes</span>}
                                </div>
                              </> : item.error ? <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">{item.error}</span>
                              </div> : <p className="text-sm text-muted-foreground truncate">{item.url}</p>}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {item.status === 'success' && <Button size="sm" onClick={() => importFromUrl(item)} className="bg-green-600 hover:bg-green-700">
                                <ShoppingCart className="h-4 w-4" />
                              </Button>}
                            <Button size="sm" variant="ghost" onClick={() => removeFromUrlQueue(item.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>}

            {/* Empty State */}
            {queuedUrls.length === 0 && <Card className="bg-muted/30">
                <CardContent className="py-12 text-center">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Aucune URL dans la file</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Collez des URLs de produits ci-dessus pour commencer l'import en masse
                  </p>
                </CardContent>
              </Card>}
          </TabsContent>

          {/* Image Import Tab */}
          <TabsContent value="image" className="space-y-6">
            {/* Drop Zone */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Importer depuis des images
                </CardTitle>
                <CardDescription>
                  Glissez-déposez des images ou cliquez pour sélectionner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div {...getRootProps()} className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors", isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50")}>
                  <input {...getInputProps()} />
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  {isDragActive ? <p className="text-primary font-medium">Déposez les images ici...</p> : <>
                      <p className="font-medium mb-1">Glissez vos images ici</p>
                      <p className="text-sm text-muted-foreground">
                        ou cliquez pour sélectionner (PNG, JPG, WebP)
                      </p>
                    </>}
                </div>

                <div className="flex justify-center">
                  <Button variant="outline" onClick={addImageFromUrl}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Ajouter depuis URL
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Image Queue */}
            {queuedImages.length > 0 && <>
                <Card>
                  <CardHeader>
                    <CardTitle>Images à importer ({queuedImages.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {queuedImages.map(img => <div key={img.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img src={img.preview} alt="" className="w-full h-full object-cover" />
                          </div>
                          <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFromImageQueue(img.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>

                {/* Product Info for Images */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations produit (optionnel)</CardTitle>
                    <CardDescription>
                      Ces informations seront appliquées à tous les produits créés
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom du produit</Label>
                        <Input placeholder="Ex: T-Shirt Premium" value={imageProductInfo.name} onChange={e => setImageProductInfo(prev => ({
                      ...prev,
                      name: e.target.value
                    }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Prix (€)</Label>
                        <Input type="number" placeholder="Ex: 29.99" value={imageProductInfo.price} onChange={e => setImageProductInfo(prev => ({
                      ...prev,
                      price: e.target.value
                    }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Catégorie</Label>
                        <Input placeholder="Ex: Vêtements" value={imageProductInfo.category} onChange={e => setImageProductInfo(prev => ({
                      ...prev,
                      category: e.target.value
                    }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Description du produit..." value={imageProductInfo.description} onChange={e => setImageProductInfo(prev => ({
                      ...prev,
                      description: e.target.value
                    }))} rows={2} />
                      </div>
                    </div>

                    <Separator />

                    <Button onClick={importImages} disabled={isProcessingImages} className="w-full bg-gradient-to-r from-orange-500 to-red-600" size="lg">
                      {isProcessingImages ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <ShoppingCart className="h-5 w-5 mr-2" />}
                      Importer {queuedImages.length} produit{queuedImages.length > 1 ? 's' : ''}
                    </Button>
                  </CardContent>
                </Card>
              </>}

            {/* Empty State */}
            {queuedImages.length === 0 && <Card className="bg-muted/30">
                <CardContent className="py-12 text-center">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Aucune image ajoutée</h3>
                  <p className="text-sm text-muted-foreground">
                    Glissez des images produit ou utilisez une URL pour créer des produits
                  </p>
                </CardContent>
              </Card>}
          </TabsContent>
        </Tabs>

        {/* Tips */}
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-orange-900 dark:text-orange-100">Astuces Pro</h3>
                <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1 mt-1">
                  <li>• Importez jusqu'à 50 URLs à la fois pour un import en masse</li>
                  <li>• Les images seront automatiquement optimisées pour votre boutique</li>
                  <li>• Utilisez le multiplicateur de prix pour définir vos marges automatiquement</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>;
}