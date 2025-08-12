import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ImportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "products" | "orders" | "customers";
}

export const ImportDataDialog = ({ open, onOpenChange, type = "products" }: ImportDataDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    source: "",
    format: "csv",
    file: null as File | null,
    mapping: "",
    notes: ""
  });

  const handleImport = () => {
    toast({
      title: "Import démarré",
      description: `L'import des ${type} est en cours de traitement.`,
    });
    onOpenChange(false);
    setFormData({
      source: "",
      format: "csv",
      file: null,
      mapping: "",
      notes: ""
    });
  };

  const getTitle = () => {
    switch(type) {
      case "products": return "Importer des Produits";
      case "orders": return "Importer des Commandes";
      case "customers": return "Importer des Clients";
      default: return "Importer des Données";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Importez vos données depuis un fichier ou une source externe
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="source">Source d'import</Label>
            <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="file">Fichier local</SelectItem>
                <SelectItem value="shopify">Shopify</SelectItem>
                <SelectItem value="woocommerce">WooCommerce</SelectItem>
                <SelectItem value="aliexpress">AliExpress</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="format">Format de fichier</Label>
            <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file">Fichier à importer</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.json,.xml"
              onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mapping">Mappage des colonnes (optionnel)</Label>
            <Textarea
              id="mapping"
              value={formData.mapping}
              onChange={(e) => setFormData({ ...formData, mapping: e.target.value })}
              placeholder="Définissez le mappage des colonnes si nécessaire"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes d'import</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes et instructions spéciales"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleImport}>
            Démarrer l'import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};