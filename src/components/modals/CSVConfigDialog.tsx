import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Sheet, Upload, Download, CheckCircle, AlertCircle, FileText } from "lucide-react";

interface CSVConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CSVConfigDialog = ({ open, onOpenChange }: CSVConfigDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "Configuration CSV",
    csvUrl: "",
    delimiter: ",",
    encoding: "UTF-8",
    hasHeader: true,
    skipLines: 0,
    updateFrequency: "daily",
    autoImport: true,
    fieldMapping: {
      id: "",
      name: "",
      price: "",
      description: "",
      category: "",
      stock: "",
      images: "",
      sku: "",
      brand: ""
    }
  });

  const [csvPreview, setCsvPreview] = useState({
    headers: [] as string[],
    rows: [] as string[][],
    totalRows: 0
  });

  const [validation, setValidation] = useState({
    isValid: false,
    errors: [] as string[],
    warnings: [] as string[]
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      // Simulation de lecture CSV
      setTimeout(() => {
        setCsvPreview({
          headers: ["ID", "Nom", "Prix", "Description", "Catégorie", "Stock", "Image", "SKU", "Marque"],
          rows: [
            ["1", "Produit 1", "29.99", "Description du produit 1", "Électronique", "10", "image1.jpg", "SKU001", "Samsung"],
            ["2", "Produit 2", "39.99", "Description du produit 2", "Mode", "5", "image2.jpg", "SKU002", "Nike"],
            ["3", "Produit 3", "19.99", "Description du produit 3", "Maison", "15", "image3.jpg", "SKU003", "IKEA"]
          ],
          totalRows: 1250
        });
        toast({
          title: "Fichier chargé",
          description: `${file.name} a été chargé avec succès`,
        });
      }, 1000);
    }
  };

  const validateMapping = () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!formData.fieldMapping.id) errors.push("Le champ ID produit est obligatoire");
    if (!formData.fieldMapping.name) errors.push("Le champ Nom est obligatoire");
    if (!formData.fieldMapping.price) errors.push("Le champ Prix est obligatoire");
    
    if (!formData.fieldMapping.description) warnings.push("Aucun champ Description mappé");
    if (!formData.fieldMapping.category) warnings.push("Aucun champ Catégorie mappé");

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings
    });

    if (errors.length === 0) {
      toast({
        title: "Mappage validé",
        description: "La configuration CSV est prête à être utilisée",
      });
      setStep(3);
    }
  };

  const handleSave = () => {
    toast({
      title: "Configuration sauvegardée",
      description: "Votre configuration CSV a été enregistrée avec succès",
    });
    
    setTimeout(() => {
      onOpenChange(false);
      setStep(1);
    }, 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-success/5 rounded-lg border border-success/20">
              <Sheet className="w-8 h-8 text-success" />
              <div>
                <h3 className="font-semibold text-foreground">Configuration CSV</h3>
                <p className="text-sm text-muted-foreground">Configurez l'import de données via CSV</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="configName">Nom de la configuration *</Label>
                <Input
                  id="configName"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Catalogue produits CSV"
                />
              </div>

              <div className="space-y-2">
                <Label>Source du fichier CSV</Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="csvUrl" className="text-sm">URL du fichier CSV</Label>
                    <Input
                      id="csvUrl"
                      value={formData.csvUrl}
                      onChange={(e) => setFormData({...formData, csvUrl: e.target.value})}
                      placeholder="https://exemple.com/catalogue.csv"
                    />
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">ou</div>
                  
                  <div>
                    <Label htmlFor="csvFile" className="text-sm">Télécharger un fichier CSV</Label>
                    <div className="mt-1">
                      <Input
                        id="csvFile"
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delimiter">Délimiteur</Label>
                  <Select 
                    value={formData.delimiter} 
                    onValueChange={(value) => setFormData({...formData, delimiter: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Virgule (,)</SelectItem>
                      <SelectItem value=";">Point-virgule (;)</SelectItem>
                      <SelectItem value="\t">Tabulation</SelectItem>
                      <SelectItem value="|">Pipe (|)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="encoding">Encodage</Label>
                  <Select 
                    value={formData.encoding} 
                    onValueChange={(value) => setFormData({...formData, encoding: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTF-8">UTF-8</SelectItem>
                      <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                      <SelectItem value="Windows-1252">Windows-1252</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="hasHeader">Première ligne = en-têtes</Label>
                  <p className="text-xs text-muted-foreground">La première ligne contient les noms des colonnes</p>
                </div>
                <Switch
                  id="hasHeader"
                  checked={formData.hasHeader}
                  onCheckedChange={(checked) => setFormData({...formData, hasHeader: checked})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skipLines">Lignes à ignorer</Label>
                <Input
                  id="skipLines"
                  type="number"
                  min="0"
                  value={formData.skipLines}
                  onChange={(e) => setFormData({...formData, skipLines: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Mappage des colonnes</h3>
              <p className="text-sm text-muted-foreground">
                Associez les colonnes de votre CSV aux champs de produits
              </p>
            </div>

            {csvPreview.headers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aperçu du fichier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                    {csvPreview.totalRows} lignes détectées
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {csvPreview.headers.map((header, index) => (
                            <th key={index} className="text-left p-2 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.rows.slice(0, 3).map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="p-2 text-muted-foreground">
                                {cell.length > 20 ? `${cell.substring(0, 20)}...` : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mappage des champs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(formData.fieldMapping).map(([field, mappedColumn]) => (
                  <div key={field} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">
                        {field === 'id' ? 'ID Produit *' :
                         field === 'name' ? 'Nom *' :
                         field === 'price' ? 'Prix *' :
                         field === 'description' ? 'Description' :
                         field === 'category' ? 'Catégorie' :
                         field === 'stock' ? 'Stock' :
                         field === 'images' ? 'Images' :
                         field === 'sku' ? 'SKU' :
                         field === 'brand' ? 'Marque' : field}
                      </Label>
                    </div>
                    <div className="flex-1 ml-4">
                      <Select
                        value={mappedColumn || "none"}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          fieldMapping: {
                            ...formData.fieldMapping,
                            [field]: value === "none" ? "" : value
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une colonne" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune</SelectItem>
                          {csvPreview.headers.map((header, index) => (
                            <SelectItem key={index} value={header || `col_${index}`}>
                              {header || `Colonne ${index + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {validation.errors.length > 0 && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Erreurs détectées</span>
                  </div>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-destructive">{error}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {validation.warnings.length > 0 && (
              <Card className="border-warning/20 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-warning mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Avertissements</span>
                  </div>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="text-warning">{warning}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-success mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-success mb-2">Configuration sauvegardée !</h3>
              <p className="text-muted-foreground">
                Votre configuration CSV "{formData.name}" est prête à être utilisée.
              </p>
            </div>
            <div className="space-y-2">
              <Badge className="bg-success/10 text-success border-success/20">
                Configuration active
              </Badge>
              <p className="text-xs text-muted-foreground">
                {csvPreview.totalRows} produits seront importés
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Configuration CSV"}
            {step === 2 && "Mappage des colonnes"}
            {step === 3 && "Configuration terminée"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Configurez l'import de données depuis un fichier CSV"}
            {step === 2 && "Associez les colonnes CSV aux champs de produits"}
            {step === 3 && "Votre configuration CSV est prête"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {renderStep()}
        </div>

        {step < 3 && (
          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Retour
                  </Button>
                )}
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                {step === 1 && (
                  <Button 
                    onClick={() => setStep(2)}
                    disabled={!formData.name || (!formData.csvUrl && !csvFile)}
                  >
                    Continuer
                  </Button>
                )}
                {step === 2 && (
                  <Button onClick={validateMapping}>
                    Valider et Sauvegarder
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};