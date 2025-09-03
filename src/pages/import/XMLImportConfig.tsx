import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Play, FileText, Clock, MapPin, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const XMLImportConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState({
    feed_url: '',
    feed_type: 'google_shopping' as 'google_shopping' | 'lengow' | 'custom_rss' | 'facebook_catalog',
    auto_sync: true,
    sync_frequency: 'daily' as 'hourly' | 'daily' | 'weekly',
    validate_feed: true,
    auto_categorize: true,
    update_existing: true,
    batch_size: 100,
    field_mapping: {
      title: 'title',
      description: 'description',
      price: 'price',
      image_link: 'image_link',
      product_type: 'product_type',
      brand: 'brand',
      gtin: 'gtin',
      mpn: 'mpn',
      condition: 'condition',
      availability: 'availability'
    },
    filters: {
      min_price: '',
      max_price: '',
      allowed_brands: '',
      excluded_categories: '',
      availability_filter: 'all' as 'all' | 'in_stock' | 'preorder'
    },
    authentication: {
      username: '',
      password: '',
      api_key: ''
    }
  });

  const feedTypes = [
    { value: 'google_shopping', label: 'Google Shopping Feed', description: 'Format XML Google Merchant Center' },
    { value: 'lengow', label: 'Lengow Feed', description: 'Format Lengow marketplace' },
    { value: 'facebook_catalog', label: 'Facebook Catalog', description: 'Format Facebook Commerce' },
    { value: 'custom_rss', label: 'RSS/XML Personnalisé', description: 'Format XML personnalisé' }
  ];

  const handleSave = () => {
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres d'import XML ont été enregistrés.",
    });
  };

  const handleTest = () => {
    if (!config.feed_url) {
      toast({
        title: "URL manquante",
        description: "Veuillez saisir une URL de flux XML pour tester.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Test en cours",
      description: "Validation du flux XML en cours...",
    });
  };

  const handleStartImport = () => {
    if (!config.feed_url) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez configurer l'URL du flux XML.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Import démarré",
      description: "L'import XML a été lancé avec succès.",
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
          <h1 className="text-2xl font-bold">Configuration Import XML</h1>
          <p className="text-muted-foreground">Importez des produits depuis des flux XML/RSS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration du flux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Configuration du flux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="feed_url">URL du flux XML</Label>
                <Input
                  id="feed_url"
                  placeholder="https://exemple.com/products.xml"
                  value={config.feed_url}
                  onChange={(e) => setConfig({...config, feed_url: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="feed_type">Type de flux</Label>
                <Select value={config.feed_type} onValueChange={(value) => setConfig({...config, feed_type: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {feedTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sync_frequency">Fréquence de sync</Label>
                  <Select value={config.sync_frequency} onValueChange={(value) => setConfig({...config, sync_frequency: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
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
            </CardContent>
          </Card>

          {/* Options de synchronisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Options de synchronisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto_sync">Synchronisation automatique</Label>
                <Switch
                  id="auto_sync"
                  checked={config.auto_sync}
                  onCheckedChange={(checked) => setConfig({...config, auto_sync: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="validate_feed">Valider le flux</Label>
                <Switch
                  id="validate_feed"
                  checked={config.validate_feed}
                  onCheckedChange={(checked) => setConfig({...config, validate_feed: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto_categorize">Catégorisation automatique</Label>
                <Switch
                  id="auto_categorize"
                  checked={config.auto_categorize}
                  onCheckedChange={(checked) => setConfig({...config, auto_categorize: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="update_existing">Mettre à jour existants</Label>
                <Switch
                  id="update_existing"
                  checked={config.update_existing}
                  onCheckedChange={(checked) => setConfig({...config, update_existing: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mapping des champs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Mapping des champs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title_field">Champ titre</Label>
                  <Input
                    id="title_field"
                    value={config.field_mapping.title}
                    onChange={(e) => setConfig({
                      ...config, 
                      field_mapping: {...config.field_mapping, title: e.target.value}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="price_field">Champ prix</Label>
                  <Input
                    id="price_field"
                    value={config.field_mapping.price}
                    onChange={(e) => setConfig({
                      ...config, 
                      field_mapping: {...config.field_mapping, price: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand_field">Champ marque</Label>
                  <Input
                    id="brand_field"
                    value={config.field_mapping.brand}
                    onChange={(e) => setConfig({
                      ...config, 
                      field_mapping: {...config.field_mapping, brand: e.target.value}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="image_field">Champ image</Label>
                  <Input
                    id="image_field"
                    value={config.field_mapping.image_link}
                    onChange={(e) => setConfig({
                      ...config, 
                      field_mapping: {...config.field_mapping, image_link: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description_field">Champ description</Label>
                <Input
                  id="description_field"
                  value={config.field_mapping.description}
                  onChange={(e) => setConfig({
                    ...config, 
                    field_mapping: {...config.field_mapping, description: e.target.value}
                  })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Filtres d'import
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
                <Label htmlFor="allowed_brands">Marques autorisées (séparées par virgule)</Label>
                <Input
                  id="allowed_brands"
                  placeholder="Nike, Adidas, Samsung"
                  value={config.filters.allowed_brands}
                  onChange={(e) => setConfig({
                    ...config, 
                    filters: {...config.filters, allowed_brands: e.target.value}
                  })}
                />
              </div>

              <div>
                <Label htmlFor="excluded_categories">Catégories exclues</Label>
                <Textarea
                  id="excluded_categories"
                  placeholder="Adulte, Dangereux, Interdit"
                  value={config.filters.excluded_categories}
                  onChange={(e) => setConfig({
                    ...config, 
                    filters: {...config.filters, excluded_categories: e.target.value}
                  })}
                />
              </div>

              <div>
                <Label htmlFor="availability_filter">Filtre disponibilité</Label>
                <Select value={config.filters.availability_filter} onValueChange={(value) => setConfig({...config, filters: {...config.filters, availability_filter: value as any}})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les produits</SelectItem>
                    <SelectItem value="in_stock">En stock uniquement</SelectItem>
                    <SelectItem value="preorder">Précommande autorisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Authentification */}
          <Card>
            <CardHeader>
              <CardTitle>Authentification (optionnel)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={config.authentication.username}
                    onChange={(e) => setConfig({
                      ...config, 
                      authentication: {...config.authentication, username: e.target.value}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={config.authentication.password}
                    onChange={(e) => setConfig({
                      ...config, 
                      authentication: {...config.authentication, password: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="api_key">Clé API</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={config.authentication.api_key}
                  onChange={(e) => setConfig({
                    ...config, 
                    authentication: {...config.authentication, api_key: e.target.value}
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral */}
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
                Tester le flux
              </Button>
              
              <Button onClick={handleStartImport} variant="default" className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Démarrer l'import
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline">
                    {feedTypes.find(t => t.value === config.feed_type)?.label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sync:</span>
                  <Badge variant={config.auto_sync ? "default" : "secondary"}>
                    {config.sync_frequency}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lot:</span>
                  <span>{config.batch_size} produits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validation:</span>
                  <Badge variant={config.validate_feed ? "default" : "secondary"}>
                    {config.validate_feed ? "Activée" : "Désactivée"}
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

export default XMLImportConfig;