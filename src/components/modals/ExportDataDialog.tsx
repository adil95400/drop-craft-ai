import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface ExportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "products" | "orders" | "customers" | "reports";
}

export const ExportDataDialog = ({ open, onOpenChange, type = "products" }: ExportDataDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    format: "csv",
    dateRange: "all",
    filters: "",
    includeHeaders: true,
    compression: false
  });

  const handleExport = () => {
    toast({
      title: "Export démarré",
      description: `L'export des ${type} va être téléchargé dans quelques instants.`,
    });
    onOpenChange(false);
  };

  const getTitle = () => {
    switch(type) {
      case "products": return "Exporter les Produits";
      case "orders": return "Exporter les Commandes";
      case "customers": return "Exporter les Clients";
      case "reports": return "Exporter les Rapports";
      default: return "Exporter les Données";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Exportez vos données dans le format souhaité
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="format">Format d'export</Label>
            <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateRange">Période</Label>
            <Select value={formData.dateRange} onValueChange={(value) => setFormData({ ...formData, dateRange: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les données</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
                <SelectItem value="custom">Période personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="filters">Filtres (optionnel)</Label>
            <Textarea
              id="filters"
              value={formData.filters}
              onChange={(e) => setFormData({ ...formData, filters: e.target.value })}
              placeholder="Spécifiez des filtres pour l'export"
              rows={3}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="includeHeaders"
                checked={formData.includeHeaders}
                onCheckedChange={(includeHeaders) => setFormData({ ...formData, includeHeaders })}
              />
              <Label htmlFor="includeHeaders">Inclure les en-têtes</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="compression"
                checked={formData.compression}
                onCheckedChange={(compression) => setFormData({ ...formData, compression })}
              />
              <Label htmlFor="compression">Compresser le fichier (ZIP)</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport}>
            Démarrer l'export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};