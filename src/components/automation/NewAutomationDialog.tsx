import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bot, Clock, Target, Zap, ShoppingCart, Mail, TrendingUp, Package } from "lucide-react";

interface NewAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const automationTemplates = [
  {
    id: "price-sync",
    name: "Synchronisation des Prix",
    description: "Met à jour automatiquement les prix selon les fournisseurs",
    icon: TrendingUp,
    trigger: "Horaire",
    category: "Prix"
  },
  {
    id: "product-import",
    name: "Import Produits Gagnants",
    description: "Importe les produits tendances d'AliExpress",
    icon: Package,
    trigger: "Quotidien",
    category: "Produits"
  },
  {
    id: "stock-update",
    name: "Mise à jour Stock",
    description: "Vérifie et met à jour le stock fournisseurs",
    icon: Bot,
    trigger: "Toutes les 2h",
    category: "Stock"
  },
  {
    id: "abandoned-cart",
    name: "Email Abandon Panier",
    description: "Relance automatique des paniers abandonnés",
    icon: Mail,
    trigger: "Après inactivité",
    category: "Marketing"
  },
  {
    id: "order-processing",
    name: "Traitement Commandes",
    description: "Automatise le processus de traitement des commandes",
    icon: ShoppingCart,
    trigger: "Nouvelle commande",
    category: "Commandes"
  },
  {
    id: "custom",
    name: "Automation Personnalisée",
    description: "Créez votre propre automation sur mesure",
    icon: Zap,
    trigger: "Personnalisé",
    category: "Personnalisé"
  }
];

export const NewAutomationDialog = ({ open, onOpenChange }: NewAutomationDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "",
    frequency: "",
    conditions: "",
    actions: ""
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = automationTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData(prev => ({
        ...prev,
        name: template.name,
        description: template.description
      }));
      setStep(2);
    }
  };

  const handleCreate = () => {
    toast({
      title: "Automation créée avec succès",
      description: `"${formData.name}" a été ajoutée à vos automations.`,
    });
    onOpenChange(false);
    setStep(1);
    setSelectedTemplate(null);
    setFormData({
      name: "",
      description: "",
      triggerType: "",
      frequency: "",
      conditions: "",
      actions: ""
    });
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Nouvelle Automation" : "Configuration de l'Automation"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Choisissez un modèle d'automation ou créez le vôtre"
              : "Configurez les paramètres de votre automation"
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automationTemplates.map((template) => {
                const IconComponent = template.icon;
                return (
                  <Card 
                    key={template.id}
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-secondary px-2 py-1 rounded">
                              {template.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {template.trigger}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{template.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'automation</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trigger-type">Type de déclencheur</Label>
                  <Select value={formData.triggerType} onValueChange={(value) => setFormData({ ...formData, triggerType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schedule">Planifié</SelectItem>
                      <SelectItem value="event">Événement</SelectItem>
                      <SelectItem value="condition">Condition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Fréquence</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Toutes les 15 minutes</SelectItem>
                      <SelectItem value="30">Toutes les 30 minutes</SelectItem>
                      <SelectItem value="1">Toutes les heures</SelectItem>
                      <SelectItem value="6">Toutes les 6 heures</SelectItem>
                      <SelectItem value="24">Quotidien</SelectItem>
                      <SelectItem value="168">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conditions">Conditions (optionnel)</Label>
                <Textarea
                  id="conditions"
                  placeholder="Définissez les conditions spécifiques..."
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actions">Actions à exécuter</Label>
                <Textarea
                  id="actions"
                  placeholder="Décrivez les actions à effectuer..."
                  value={formData.actions}
                  onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button variant="outline" onClick={handleBack}>
              Retour
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          {step === 2 && (
            <Button onClick={handleCreate}>
              Créer l'automation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};