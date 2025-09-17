import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Rss, Upload, Settings, Globe } from "lucide-react";

interface SupplierFeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierFeedDialog({ open, onOpenChange }: SupplierFeedDialogProps) {
  const [formData, setFormData] = useState({
    feedName: "",
    supplier: "",
    feedType: "",
    feedUrl: "",
    apiKey: "",
    updateFrequency: "",
    dataFormat: "",
    priceColumn: "",
    stockColumn: "",
    nameColumn: "",
    skuColumn: "",
    categoryColumn: "",
    imageColumn: "",
    filterCriteria: "",
    isActive: true,
    autoUpdate: true,
    notifyOnUpdate: false,
    backupEnabled: true
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.feedName || !formData.supplier || !formData.feedType) {
      toast.error("Nom du flux, fournisseur et type requis");
      return;
    }
    
    toast.success("Flux fournisseur configuré avec succès");
    onOpenChange(false);
    setFormData({
      feedName: "",
      supplier: "",
      feedType: "",
      feedUrl: "",
      apiKey: "",
      updateFrequency: "",
      dataFormat: "",
      priceColumn: "",
      stockColumn: "",
      nameColumn: "",
      skuColumn: "",
      categoryColumn: "",
      imageColumn: "",
      filterCriteria: "",
      isActive: true,
      autoUpdate: true,
      notifyOnUpdate: false,
      backupEnabled: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5" />
            Configuration du Flux Fournisseur
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleCreate} className="space-y-6">
          {/* Configuration de base */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Configuration de base</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="feedName">Nom du flux *</Label>
                <Input
                  id="feedName"
                  value={formData.feedName}
                  onChange={(e) => setFormData(prev => ({ ...prev, feedName: e.target.value }))}
                  placeholder="Flux produits Amazon"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="supplier">Fournisseur *</Label>
                <Select value={formData.supplier} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="alibaba">Alibaba</SelectItem>
                    <SelectItem value="ebay">eBay</SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="custom">Fournisseur personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="feedType">Type de flux *</Label>
                <Select value={formData.feedType} onValueChange={(value) => setFormData(prev => ({ ...prev, feedType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="api">API REST</SelectItem>
                    <SelectItem value="ftp">FTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="updateFrequency">Fréquence de mise à jour</Label>
                <Select value={formData.updateFrequency} onValueChange={(value) => setFormData(prev => ({ ...prev, updateFrequency: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="manual">Manuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Configuration de la source */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Source des données</h3>
            </div>
            
            <div>
              <Label htmlFor="feedUrl">URL du flux ou endpoint API</Label>
              <Input
                id="feedUrl"
                value={formData.feedUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, feedUrl: e.target.value }))}
                placeholder="https://supplier.com/api/products"
              />
            </div>

            <div>
              <Label htmlFor="apiKey">Clé API (si nécessaire)</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Clé d'authentification API"
              />
            </div>
          </div>

          {/* Mapping des colonnes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Mapping des colonnes</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nameColumn">Colonne nom produit</Label>
                <Input
                  id="nameColumn"
                  value={formData.nameColumn}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameColumn: e.target.value }))}
                  placeholder="name, title, product_name"
                />
              </div>
              
              <div>
                <Label htmlFor="skuColumn">Colonne SKU</Label>
                <Input
                  id="skuColumn"
                  value={formData.skuColumn}
                  onChange={(e) => setFormData(prev => ({ ...prev, skuColumn: e.target.value }))}
                  placeholder="sku, product_id, reference"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceColumn">Colonne prix</Label>
                <Input
                  id="priceColumn"
                  value={formData.priceColumn}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceColumn: e.target.value }))}
                  placeholder="price, cost, amount"
                />
              </div>
              
              <div>
                <Label htmlFor="stockColumn">Colonne stock</Label>
                <Input
                  id="stockColumn"
                  value={formData.stockColumn}
                  onChange={(e) => setFormData(prev => ({ ...prev, stockColumn: e.target.value }))}
                  placeholder="stock, quantity, available"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryColumn">Colonne catégorie</Label>
                <Input
                  id="categoryColumn"
                  value={formData.categoryColumn}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryColumn: e.target.value }))}
                  placeholder="category, type, classification"
                />
              </div>
              
              <div>
                <Label htmlFor="imageColumn">Colonne image</Label>
                <Input
                  id="imageColumn"
                  value={formData.imageColumn}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageColumn: e.target.value }))}
                  placeholder="image, photo, picture_url"
                />
              </div>
            </div>
          </div>

          {/* Filtres et options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Filtres et options</h3>
            
            <div>
              <Label htmlFor="filterCriteria">Critères de filtrage</Label>
              <Textarea
                id="filterCriteria"
                value={formData.filterCriteria}
                onChange={(e) => setFormData(prev => ({ ...prev, filterCriteria: e.target.value }))}
                rows={3}
                placeholder="Ex: category='electronics' AND price > 10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Flux actif</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="autoUpdate">Mise à jour automatique</Label>
                <Switch
                  id="autoUpdate"
                  checked={formData.autoUpdate}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoUpdate: checked }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnUpdate">Notifier les mises à jour</Label>
                <Switch
                  id="notifyOnUpdate"
                  checked={formData.notifyOnUpdate}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifyOnUpdate: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="backupEnabled">Sauvegarde activée</Label>
                <Switch
                  id="backupEnabled"
                  checked={formData.backupEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, backupEnabled: checked }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Configurer le flux</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}