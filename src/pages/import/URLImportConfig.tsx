import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Play, Settings, Globe, Brain, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const URLImportConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState({
    url: '',
    scraping_mode: 'smart' as 'smart' | 'basic' | 'deep',
    auto_optimize: true,
    extract_images: true,
    validate_products: true,
    batch_size: 50,
    delay_between_requests: 1000,
    max_pages: 100,
    css_selectors: {
      title: '',
      price: '',
      description: '',
      images: '',
      stock: ''
    },
    filters: {
      min_price: '',
      max_price: '',
      exclude_keywords: '',
      include_only: ''
    }
  });

  const handleSave = () => {
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres d'import par URL ont été enregistrés.",
    });
  };

  const handleTest = () => {
    if (!config.url) {
      toast({
        title: "URL manquante",
        description: "Veuillez saisir une URL pour tester la configuration.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Test en cours",
      description: "Test de l'import en cours d'exécution...",
    });
  };

  const handleStartImport = () => {
    if (!config.url) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez configurer au moins une URL source.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Import démarré",
      description: "L'import par URL a été lancé avec succès.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/import')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configuration Import par URL</h1>
          <p className="text-muted-foreground">Importez des produits directement depuis des URLs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration de base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Configuration de base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="url">URL source</Label>
                <Input
                  id="url"
                  placeholder="https://exemple.com/produits"
                  value={config.url}
                  onChange={(e) => setConfig({...config, url: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scraping_mode">Mode de scraping</Label>
                  <Select value={config.scraping_mode} onValueChange={(value) => setConfig({...config, scraping_mode: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basique</SelectItem>
                      <SelectItem value="smart">Intelligent</SelectItem>
                      <SelectItem value="deep">Profond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="batch_size">Taille des lots</Label>
                  <Input
                    id="batch_size"
                    type="number"
                    value={config.batch_size}
                    onChange={(e) => setConfig({...config, batch_size: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delay">Délai entre requêtes (ms)</Label>
                  <Input
                    id="delay"
                    type="number"
                    value={config.delay_between_requests}
                    onChange={(e) => setConfig({...config, delay_between_requests: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="max_pages">Pages maximum</Label>
                  <Input
                    id="max_pages"
                    type="number"
                    value={config.max_pages}
                    onChange={(e) => setConfig({...config, max_pages: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options avancées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Options avancées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto_optimize">Optimisation automatique IA</Label>
                <Switch
                  id="auto_optimize"
                  checked={config.auto_optimize}
                  onCheckedChange={(checked) => setConfig({...config, auto_optimize: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="extract_images">Extraire les images</Label>
                <Switch
                  id="extract_images"
                  checked={config.extract_images}
                  onCheckedChange={(checked) => setConfig({...config, extract_images: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="validate_products">Validation des produits</Label>
                <Switch
                  id="validate_products"
                  checked={config.validate_products}
                  onCheckedChange={(checked) => setConfig({...config, validate_products: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sélecteurs CSS personnalisés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Sélecteurs CSS personnalisés
                <Badge variant="secondary">Avancé</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title_selector">Titre</Label>
                  <Input
                    id="title_selector"
                    placeholder=".product-title, h1"
                    value={config.css_selectors.title}
                    onChange={(e) => setConfig({
                      ...config, 
                      css_selectors: {...config.css_selectors, title: e.target.value}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="price_selector">Prix</Label>
                  <Input
                    id="price_selector"
                    placeholder=".price, .cost"
                    value={config.css_selectors.price}
                    onChange={(e) => setConfig({
                      ...config, 
                      css_selectors: {...config.css_selectors, price: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="images_selector">Images</Label>
                  <Input
                    id="images_selector"
                    placeholder=".product-images img"
                    value={config.css_selectors.images}
                    onChange={(e) => setConfig({
                      ...config, 
                      css_selectors: {...config.css_selectors, images: e.target.value}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="stock_selector">Stock</Label>
                  <Input
                    id="stock_selector"
                    placeholder=".stock-quantity"
                    value={config.css_selectors.stock}
                    onChange={(e) => setConfig({
                      ...config, 
                      css_selectors: {...config.css_selectors, stock: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description_selector">Description</Label>
                <Textarea
                  id="description_selector"
                  placeholder=".product-description, .product-content"
                  value={config.css_selectors.description}
                  onChange={(e) => setConfig({
                    ...config, 
                    css_selectors: {...config.css_selectors, description: e.target.value}
                  })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtres de produits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_price">Prix minimum (€)</Label>
                  <Input
                    id="min_price"
                    type="number"
                    step="0.01"
                    value={config.filters.min_price}
                    onChange={(e) => setConfig({
                      ...config, 
                      filters: {...config.filters, min_price: e.target.value}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="max_price">Prix maximum (€)</Label>
                  <Input
                    id="max_price"
                    type="number"
                    step="0.01"
                    value={config.filters.max_price}
                    onChange={(e) => setConfig({
                      ...config, 
                      filters: {...config.filters, max_price: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="exclude_keywords">Mots-clés à exclure</Label>
                <Input
                  id="exclude_keywords"
                  placeholder="défectueux, abîmé, occasion"
                  value={config.filters.exclude_keywords}
                  onChange={(e) => setConfig({
                    ...config, 
                    filters: {...config.filters, exclude_keywords: e.target.value}
                  })}
                />
              </div>

              <div>
                <Label htmlFor="include_only">N'inclure que ces mots-clés</Label>
                <Input
                  id="include_only"
                  placeholder="neuf, original, premium"
                  value={config.filters.include_only}
                  onChange={(e) => setConfig({
                    ...config, 
                    filters: {...config.filters, include_only: e.target.value}
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral d'actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
              
              <Button onClick={handleTest} variant="outline" className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Tester la config
              </Button>
              
              <Button onClick={handleStartImport} variant="default" className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Démarrer l'import
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aperçu de la configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <Badge variant="outline">{config.scraping_mode}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lot:</span>
                  <span>{config.batch_size} produits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pages max:</span>
                  <span>{config.max_pages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IA activée:</span>
                  <Badge variant={config.auto_optimize ? "default" : "secondary"}>
                    {config.auto_optimize ? "Oui" : "Non"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default URLImportConfig;