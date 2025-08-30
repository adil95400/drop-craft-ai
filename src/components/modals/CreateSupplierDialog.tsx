import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Store, 
  Globe, 
  Upload, 
  Key, 
  Database, 
  FileText,
  Plus,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateSupplierDialogProps {
  open: boolean;
  onClose: () => void;
  supplierData?: any;
}

const countries = [
  'France', 'China', 'USA', 'Germany', 'Netherlands', 'UK', 'Italy', 'Spain', 'Belgium', 'Switzerland'
];

const sectors = [
  'Electronics', 'Fashion', 'Home & Garden', 'Beauty & Health', 'Sports & Outdoor', 
  'Automotive', 'Books & Media', 'Toys & Games', 'Food & Beverages', 'Industrial'
];

export const CreateSupplierDialog: React.FC<CreateSupplierDialogProps> = ({
  open,
  onClose,
  supplierData
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const [formData, setFormData] = useState({
    name: supplierData?.name || '',
    description: supplierData?.description || '',
    website: '',
    country: supplierData?.country || '',
    sector: supplierData?.sector || '',
    contact_email: '',
    contact_phone: '',
    supplier_type: supplierData?.supplier_type || 'manual',
    
    // API Configuration
    api_endpoint: '',
    api_key: '',
    api_secret: '',
    authentication_type: 'bearer',
    
    // Feed Configuration
    feed_url: '',
    feed_format: 'csv',
    field_mapping: {
      sku: 'sku',
      name: 'name',
      price: 'price',
      description: 'description',
      category: 'category',
      stock: 'stock',
      images: 'images'
    },
    
    // Sync Settings
    sync_frequency: 'daily',
    auto_sync: true,
    
    // Business Info
    min_order_value: '',
    commission_rate: '',
    payment_terms: '',
    shipping_methods: [] as string[]
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMappingChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      field_mapping: { ...prev.field_mapping, [field]: value }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const testConnection = async () => {
    if (!formData.api_endpoint) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez saisir l'endpoint API",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Connexion réussie",
        description: "La configuration API est valide",
      });
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à l'API",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.country) {
      toast({
        title: "Champs obligatoires",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Fournisseur créé",
        description: `${formData.name} a été ajouté avec succès`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le fournisseur",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {supplierData ? 'Connecter le fournisseur' : 'Ajouter un fournisseur'}
          </DialogTitle>
          <DialogDescription>
            Configurez les paramètres de connexion et de synchronisation pour votre fournisseur
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informations</TabsTrigger>
            <TabsTrigger value="connection">Connexion</TabsTrigger>
            <TabsTrigger value="mapping">Mapping</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du fournisseur *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: AliExpress"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.exemple.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Décrivez ce fournisseur..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pays *</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Secteur</Label>
                <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map(sector => (
                      <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email de contact</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="contact@fournisseur.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Téléphone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Ajouter un tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
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
          </TabsContent>

          <TabsContent value="connection" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type de connexion</Label>
                <Select 
                  value={formData.supplier_type} 
                  onValueChange={(value) => handleInputChange('supplier_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Manuel
                      </div>
                    </SelectItem>
                    <SelectItem value="api">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        API REST
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        CSV/Excel
                      </div>
                    </SelectItem>
                    <SelectItem value="xml">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        XML/RSS
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.supplier_type === 'api' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Configuration API
                  </h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="api_endpoint">Endpoint API *</Label>
                    <Input
                      id="api_endpoint"
                      value={formData.api_endpoint}
                      onChange={(e) => handleInputChange('api_endpoint', e.target.value)}
                      placeholder="https://api.fournisseur.com/v1/products"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="api_key">Clé API</Label>
                      <Input
                        id="api_key"
                        type="password"
                        value={formData.api_key}
                        onChange={(e) => handleInputChange('api_key', e.target.value)}
                        placeholder="sk_..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="api_secret">Secret API</Label>
                      <Input
                        id="api_secret"
                        type="password"
                        value={formData.api_secret}
                        onChange={(e) => handleInputChange('api_secret', e.target.value)}
                        placeholder="secret_..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Type d'authentification</Label>
                    <Select 
                      value={formData.authentication_type} 
                      onValueChange={(value) => handleInputChange('authentication_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="api_key">API Key</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={testConnection} disabled={loading} className="w-full">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Test en cours...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Tester la connexion
                      </div>
                    )}
                  </Button>
                </div>
              )}

              {(formData.supplier_type === 'csv' || formData.supplier_type === 'xml') && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Configuration du flux
                  </h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="feed_url">URL du flux</Label>
                    <Input
                      id="feed_url"
                      value={formData.feed_url}
                      onChange={(e) => handleInputChange('feed_url', e.target.value)}
                      placeholder="https://fournisseur.com/products.csv"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h4 className="font-medium">Mapping des champs</h4>
                  <p className="text-sm text-muted-foreground">
                    Faites correspondre les champs du fournisseur avec vos champs
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU / Référence</Label>
                  <Input
                    value={formData.field_mapping.sku}
                    onChange={(e) => handleMappingChange('sku', e.target.value)}
                    placeholder="sku, product_id, reference"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Nom du produit</Label>
                  <Input
                    value={formData.field_mapping.name}
                    onChange={(e) => handleMappingChange('name', e.target.value)}
                    placeholder="name, title, product_name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Prix</Label>
                  <Input
                    value={formData.field_mapping.price}
                    onChange={(e) => handleMappingChange('price', e.target.value)}
                    placeholder="price, cost, amount"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    value={formData.field_mapping.stock}
                    onChange={(e) => handleMappingChange('stock', e.target.value)}
                    placeholder="stock, quantity, inventory"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Input
                    value={formData.field_mapping.category}
                    onChange={(e) => handleMappingChange('category', e.target.value)}
                    placeholder="category, type, section"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Images</Label>
                  <Input
                    value={formData.field_mapping.images}
                    onChange={(e) => handleMappingChange('images', e.target.value)}
                    placeholder="images, photos, image_urls"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.field_mapping.description}
                  onChange={(e) => handleMappingChange('description', e.target.value)}
                  placeholder="description, details, content"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fréquence de synchronisation</Label>
                <Select 
                  value={formData.sync_frequency} 
                  onValueChange={(value) => handleInputChange('sync_frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Chaque heure</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="manual">Manuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto_sync"
                  checked={formData.auto_sync}
                  onCheckedChange={(checked) => handleInputChange('auto_sync', checked)}
                />
                <Label htmlFor="auto_sync">Synchronisation automatique</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_order_value">Commande minimum (€)</Label>
                  <Input
                    id="min_order_value"
                    type="number"
                    value={formData.min_order_value}
                    onChange={(e) => handleInputChange('min_order_value', e.target.value)}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">Taux de commission (%)</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    value={formData.commission_rate}
                    onChange={(e) => handleInputChange('commission_rate', e.target.value)}
                    placeholder="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms">Conditions de paiement</Label>
                <Textarea
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                  placeholder="Ex: Paiement à 30 jours, carte de crédit acceptée..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <div className="flex gap-2">
            {activeTab !== 'basic' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  const tabs = ['basic', 'connection', 'mapping', 'settings'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
                }}
              >
                Précédent
              </Button>
            )}
            {activeTab !== 'settings' ? (
              <Button 
                onClick={() => {
                  const tabs = ['basic', 'connection', 'mapping', 'settings'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
                }}
              >
                Suivant
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Création...' : 'Créer le fournisseur'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};