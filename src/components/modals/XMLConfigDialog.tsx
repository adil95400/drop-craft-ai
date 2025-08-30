import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Code, FileText, Download, Upload, CheckCircle, AlertCircle } from "lucide-react";

interface XMLConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const XMLConfigDialog = ({ open, onOpenChange }: XMLConfigDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "Configuration XML",
    xmlUrl: "",
    xmlContent: "",
    updateFrequency: "daily",
    autoImport: true,
    validateSchema: true,
    mappingRules: {
      productId: "//product/@id",
      name: "//product/name/text()",
      price: "//product/price/text()",
      description: "//product/description/text()",
      category: "//product/category/text()",
      stock: "//product/stock/text()",
      images: "//product/images/image/@url"
    }
  });

  const [xmlValidation, setXmlValidation] = useState({
    isValid: false,
    errors: [] as string[],
    productCount: 0
  });

  const validateXML = () => {
    // Simulation de validation XML
    setTimeout(() => {
      if (formData.xmlUrl || formData.xmlContent) {
        setXmlValidation({
          isValid: true,
          errors: [],
          productCount: Math.floor(Math.random() * 1000) + 100
        });
        toast({
          title: "XML Validé",
          description: "Le fichier XML est valide et prêt à être importé",
        });
      } else {
        setXmlValidation({
          isValid: false,
          errors: ["Aucun contenu XML fourni"],
          productCount: 0
        });
      }
    }, 1000);
  };

  const handleSave = () => {
    if (!formData.name || (!formData.xmlUrl && !formData.xmlContent)) {
      toast({
        title: "Erreur",
        description: "Veuillez fournir un nom et une source XML",
        variant: "destructive"
      });
      return;
    }

    // Simulation de sauvegarde
    toast({
      title: "Configuration sauvegardée",
      description: "Votre configuration XML a été enregistrée avec succès",
    });
    
    setStep(3);
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
            <div className="flex items-center gap-3 p-4 bg-warning/5 rounded-lg border border-warning/20">
              <Code className="w-8 h-8 text-warning" />
              <div>
                <h3 className="font-semibold text-foreground">Configuration XML</h3>
                <p className="text-sm text-muted-foreground">Configurez l'import de données via XML</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="configName">Nom de la configuration *</Label>
                <Input
                  id="configName"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Catalogue fournisseur"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="xmlSource">Source XML *</Label>
                <div className="space-y-2">
                  <Input
                    id="xmlUrl"
                    value={formData.xmlUrl}
                    onChange={(e) => setFormData({...formData, xmlUrl: e.target.value})}
                    placeholder="https://exemple.com/catalogue.xml"
                  />
                  <div className="text-center text-sm text-muted-foreground">ou</div>
                  <Textarea
                    value={formData.xmlContent}
                    onChange={(e) => setFormData({...formData, xmlContent: e.target.value})}
                    placeholder="Collez votre contenu XML ici..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence de mise à jour</Label>
                <Select 
                  value={formData.updateFrequency} 
                  onValueChange={(value) => setFormData({...formData, updateFrequency: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="manual">Manuel uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoImport">Import automatique</Label>
                  <p className="text-xs text-muted-foreground">Importer automatiquement les nouveaux produits</p>
                </div>
                <Switch
                  id="autoImport"
                  checked={formData.autoImport}
                  onCheckedChange={(checked) => setFormData({...formData, autoImport: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="validateSchema">Validation du schéma</Label>
                  <p className="text-xs text-muted-foreground">Valider la structure XML avant import</p>
                </div>
                <Switch
                  id="validateSchema"
                  checked={formData.validateSchema}
                  onCheckedChange={(checked) => setFormData({...formData, validateSchema: checked})}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-12 h-12 text-warning mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Mappage des champs</h3>
              <p className="text-sm text-muted-foreground">
                Définissez comment extraire les données de votre XML
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sélecteurs XPath</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(formData.mappingRules).map(([field, xpath]) => (
                  <div key={field} className="space-y-1">
                    <Label htmlFor={field} className="text-sm font-medium capitalize">
                      {field === 'productId' ? 'ID Produit' : 
                       field === 'name' ? 'Nom' :
                       field === 'price' ? 'Prix' :
                       field === 'description' ? 'Description' :
                       field === 'category' ? 'Catégorie' :
                       field === 'stock' ? 'Stock' :
                       field === 'images' ? 'Images' : field}
                    </Label>
                    <Input
                      id={field}
                      value={xpath}
                      onChange={(e) => setFormData({
                        ...formData,
                        mappingRules: {
                          ...formData.mappingRules,
                          [field]: e.target.value
                        }
                      })}
                      placeholder={`XPath pour ${field}`}
                      className="font-mono text-sm"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={validateXML}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider XML
              </Button>
            </div>

            {xmlValidation.isValid && (
              <Card className="border-success/20 bg-success/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">XML Valide</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {xmlValidation.productCount} produits détectés
                  </p>
                </CardContent>
              </Card>
            )}

            {xmlValidation.errors.length > 0 && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Erreurs détectées</span>
                  </div>
                  <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">
                    {xmlValidation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
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
                Votre configuration XML "{formData.name}" est prête à être utilisée.
              </p>
            </div>
            <Badge className="bg-success/10 text-success border-success/20">
              Configuration active
            </Badge>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Configuration XML"}
            {step === 2 && "Mappage des données"}
            {step === 3 && "Configuration terminée"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Configurez l'import de données depuis un fichier XML"}
            {step === 2 && "Définissez comment extraire les données de votre XML"}
            {step === 3 && "Votre configuration XML est prête"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
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
                    disabled={!formData.name || (!formData.xmlUrl && !formData.xmlContent)}
                  >
                    Continuer
                  </Button>
                )}
                {step === 2 && (
                  <Button onClick={handleSave}>
                    Sauvegarder
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