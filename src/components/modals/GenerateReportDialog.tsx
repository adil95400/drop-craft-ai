import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileText, Calendar, Download } from "lucide-react";

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateReportDialog({ open, onOpenChange }: GenerateReportDialogProps) {
  const [formData, setFormData] = useState({
    reportName: "",
    reportType: "",
    dateFrom: "",
    dateTo: "",
    format: "pdf",
    includeCharts: true,
    includeSummary: true,
    includeDetails: false,
    frequency: "",
    autoSend: false
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reportName || !formData.reportType || !formData.dateFrom || !formData.dateTo) {
      toast.error("Nom, type de rapport et dates requis");
      return;
    }
    
    toast.success("Rapport généré avec succès");
    onOpenChange(false);
    setFormData({
      reportName: "",
      reportType: "",
      dateFrom: "",
      dateTo: "",
      format: "pdf",
      includeCharts: true,
      includeSummary: true,
      includeDetails: false,
      frequency: "",
      autoSend: false
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générer un Rapport
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportName">Nom du rapport</Label>
              <Input
                id="reportName"
                value={formData.reportName}
                onChange={(e) => setFormData(prev => ({ ...prev, reportName: e.target.value }))}
                placeholder="Rapport mensuel des ventes"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="reportType">Type de rapport</Label>
              <Select value={formData.reportType} onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Ventes</SelectItem>
                  <SelectItem value="inventory">Inventaire</SelectItem>
                  <SelectItem value="customers">Clients</SelectItem>
                  <SelectItem value="orders">Commandes</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="financial">Financier</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de début
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={formData.dateFrom}
                onChange={(e) => setFormData(prev => ({ ...prev, dateFrom: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="dateTo" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de fin
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={formData.dateTo}
                onChange={(e) => setFormData(prev => ({ ...prev, dateTo: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="format">Format</Label>
              <Select value={formData.format} onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="frequency">Fréquence (optionnel)</Label>
              <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Ponctuel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="quarterly">Trimestriel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Options d'inclusion</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCharts"
                checked={formData.includeCharts}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeCharts: checked as boolean }))}
              />
              <Label htmlFor="includeCharts">Inclure les graphiques</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeSummary"
                checked={formData.includeSummary}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeSummary: checked as boolean }))}
              />
              <Label htmlFor="includeSummary">Inclure le résumé exécutif</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDetails"
                checked={formData.includeDetails}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeDetails: checked as boolean }))}
              />
              <Label htmlFor="includeDetails">Inclure les détails complets</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoSend"
                checked={formData.autoSend}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoSend: checked as boolean }))}
              />
              <Label htmlFor="autoSend">Envoyer automatiquement par email</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Générer le rapport
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}