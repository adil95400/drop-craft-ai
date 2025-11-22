import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { productScraperService, ScrapedProduct } from '@/services/ProductScraperService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Link2, 
  Search, 
  Package, 
  AlertCircle, 
  CheckCircle2,
  ArrowLeft,
  Loader2,
  ShoppingCart,
  ExternalLink,
  ImageIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function URLImportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [url, setUrl] = useState('');
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const [scrapedProduct, setScrapedProduct] = useState<ScrapedProduct | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Editable product fields
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [editedCategory, setEditedCategory] = useState('');

  const handleScrapeProduct = async () => {
    if (!url.trim()) {
      toast.error('Veuillez entrer une URL de produit');
      return;
    }

    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setIsScrapingLoading(true);
    
    try {
      const result = await productScraperService.scrapeProductFromUrl(url);
      
      if (result.success && result.product) {
        setScrapedProduct(result.product);
        setEditedName(result.product.name);
        setEditedDescription(result.product.description);
        setEditedPrice(result.product.price.toString());
        setEditedCategory(result.product.category || '');
        
        toast.success('Produit extrait avec succès !');
      } else {
        toast.error(result.error || 'Impossible d\'extraire le produit');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'extraction du produit');
    } finally {
      setIsScrapingLoading(false);
    }
  };

  const handleImportProduct = async () => {
    if (!scrapedProduct || !user) return;

    setIsImporting(true);

    try {
      const customizations = {
        name: editedName,
        description: editedDescription,
        price: parseFloat(editedPrice),
        category: editedCategory
      };

      const result = await productScraperService.importProductToCatalog(
        scrapedProduct,
        user.id,
        customizations
      );

      if (result.success) {
        toast.success('Produit importé dans le catalogue !');
        navigate(`/products/${result.productId}`);
      } else {
        toast.error(result.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'import du produit');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setScrapedProduct(null);
    setEditedName('');
    setEditedDescription('');
    setEditedPrice('');
    setEditedCategory('');
  };

  const supportedPlatforms = [
    { name: 'AliExpress', example: 'aliexpress.com/item/...' },
    { name: 'Amazon', example: 'amazon.com/dp/...' },
    { name: 'Temu', example: 'temu.com/...' },
    { name: 'eBay', example: 'ebay.com/itm/...' },
    { name: 'Walmart', example: 'walmart.com/ip/...' },
    { name: 'Etsy', example: 'etsy.com/listing/...' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/products')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Link2 className="h-8 w-8 text-primary" />
              Import par URL
            </h1>
            <p className="text-muted-foreground mt-1">
              Importez des produits en copiant l'URL depuis n'importe quel fournisseur
            </p>
          </div>
        </div>

        {/* Main Content */}
        {!scrapedProduct ? (
          <div className="space-y-6">
            {/* URL Input Card */}
            <Card className="p-6 border-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="product-url" className="text-base font-semibold">
                    URL du produit
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Collez l'URL complète du produit que vous souhaitez importer
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      id="product-url"
                      type="url"
                      placeholder="https://www.aliexpress.com/item/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleScrapeProduct()}
                      className="h-12 text-base"
                      disabled={isScrapingLoading}
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleScrapeProduct}
                    disabled={isScrapingLoading || !url.trim()}
                    className="min-w-[140px]"
                  >
                    {isScrapingLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Extraction...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        Extraire
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    L'extraction automatique peut prendre quelques secondes. 
                    Vous pourrez modifier toutes les informations avant l'import.
                  </p>
                </div>
              </div>
            </Card>

            {/* Supported Platforms */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Plateformes supportées
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {supportedPlatforms.map((platform) => (
                  <div
                    key={platform.name}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">{platform.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Tips */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="font-semibold mb-3 text-primary">💡 Conseils rapides</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Utilisez des URLs de produits individuels, pas des pages de recherche</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Les données extraites incluent: titre, description, prix, images et variantes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Vous pouvez modifier toutes les informations avant de les ajouter à votre catalogue</span>
                </li>
              </ul>
            </Card>
          </div>
        ) : (
          /* Product Preview & Edit */
          <div className="space-y-6">
            {/* Product Preview Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Aperçu du produit</h2>
                  <p className="text-muted-foreground mt-1">
                    Vérifiez et modifiez les informations avant l'import
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Nouvelle URL
                  </Button>
                  <Button 
                    onClick={handleImportProduct}
                    disabled={isImporting}
                    size="lg"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Import...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Importer dans le catalogue
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Images Section */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Images du produit</Label>
                    {scrapedProduct.images && scrapedProduct.images.length > 0 ? (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {scrapedProduct.images.slice(0, 4).map((image, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted"
                          >
                            <img
                              src={image}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/400?text=Image+Non+Disponible';
                              }}
                            />
                            {index === 0 && (
                              <Badge className="absolute top-2 left-2">
                                Principale
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-center aspect-square border-2 border-dashed border-border rounded-lg bg-muted/30">
                        <div className="text-center text-muted-foreground">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Aucune image disponible</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Supplier Info */}
                  <Card className="p-4 bg-muted/30">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Fournisseur</span>
                        <Badge variant="secondary">{scrapedProduct.supplier_name}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Stock</span>
                        <Badge 
                          variant={scrapedProduct.stock_status === 'in_stock' ? 'default' : 'destructive'}
                        >
                          {scrapedProduct.stock_status === 'in_stock' ? 'En stock' : 'Rupture'}
                        </Badge>
                      </div>
                      {scrapedProduct.rating && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Note</span>
                          <span className="text-sm">
                            ⭐ {scrapedProduct.rating}/5 ({scrapedProduct.reviews_count} avis)
                          </span>
                        </div>
                      )}
                      <Separator />
                      <a
                        href={scrapedProduct.supplier_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Voir le produit original
                      </a>
                    </div>
                  </Card>
                </div>

                {/* Editable Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name" className="text-base font-semibold">
                      Nom du produit *
                    </Label>
                    <Input
                      id="edit-name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="mt-2"
                      placeholder="Nom du produit"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description" className="text-base font-semibold">
                      Description
                    </Label>
                    <Textarea
                      id="edit-description"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="mt-2 min-h-[120px]"
                      placeholder="Description du produit"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-price" className="text-base font-semibold">
                        Prix de vente *
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="edit-price"
                          type="number"
                          step="0.01"
                          value={editedPrice}
                          onChange={(e) => setEditedPrice(e.target.value)}
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {scrapedProduct.currency}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-category" className="text-base font-semibold">
                        Catégorie
                      </Label>
                      <Input
                        id="edit-category"
                        value={editedCategory}
                        onChange={(e) => setEditedCategory(e.target.value)}
                        className="mt-2"
                        placeholder="Catégorie"
                      />
                    </div>
                  </div>

                  {scrapedProduct.variants && scrapedProduct.variants.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold">
                        Variantes détectées
                      </Label>
                      <div className="mt-2 space-y-2">
                        {scrapedProduct.variants.slice(0, 5).map((variant, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
                          >
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(variant.options).map(([key, value]) => (
                                <Badge key={key} variant="outline">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                            {variant.price && (
                              <span className="text-sm font-medium">
                                {variant.price} {scrapedProduct.currency}
                              </span>
                            )}
                          </div>
                        ))}
                        {scrapedProduct.variants.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{scrapedProduct.variants.length - 5} autres variantes
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
