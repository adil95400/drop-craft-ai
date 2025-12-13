import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { FulfillmentRule, RuleCondition, RuleAction } from "@/hooks/useFulfillmentRules";

interface FulfillmentRuleBuilderProps {
  rule?: FulfillmentRule;
  onSave: (rule: Partial<FulfillmentRule>) => void;
  onCancel: () => void;
}

const conditionFields = [
  { value: "sku", label: "SKU" },
  { value: "title", label: "Titre produit" },
  { value: "price", label: "Prix" },
  { value: "quantity", label: "Quantité" },
  { value: "category", label: "Catégorie" },
  { value: "supplier", label: "Fournisseur" },
  { value: "stock", label: "Stock" },
];

const conditionOperators = [
  { value: "equals", label: "Égal à" },
  { value: "not_equals", label: "Différent de" },
  { value: "contains", label: "Contient" },
  { value: "starts_with", label: "Commence par" },
  { value: "greater_than", label: "Supérieur à" },
  { value: "less_than", label: "Inférieur à" },
  { value: "greater_or_equal", label: "Supérieur ou égal" },
  { value: "less_or_equal", label: "Inférieur ou égal" },
];

const ruleTypes = [
  { value: "supplier_selection", label: "Sélection fournisseur" },
  { value: "price_adjustment", label: "Ajustement prix" },
  { value: "stock_management", label: "Gestion stock" },
  { value: "order_routing", label: "Routage commande" },
  { value: "notification", label: "Notification" },
];

const actionTypes = [
  { value: "assign_supplier", label: "Assigner fournisseur" },
  { value: "apply_margin", label: "Appliquer marge" },
  { value: "set_price", label: "Définir prix" },
  { value: "update_stock", label: "Mettre à jour stock" },
  { value: "send_notification", label: "Envoyer notification" },
  { value: "skip_order", label: "Ignorer commande" },
  { value: "flag_for_review", label: "Marquer pour révision" },
];

export function FulfillmentRuleBuilder({
  rule,
  onSave,
  onCancel,
}: FulfillmentRuleBuilderProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || "",
    description: rule?.description || "",
    rule_type: rule?.rule_type || "supplier_selection",
    is_active: rule?.is_active ?? true,
    priority: rule?.priority || 0,
    condition_logic: rule?.condition_logic || "AND",
    conditions: rule?.conditions || [],
    actions: rule?.actions || [],
  });

  const addCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { field: "sku", operator: "equals", value: "" },
      ],
    }));
  };

  const removeCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c, i) =>
        i === index ? { ...c, ...updates } : c
      ),
    }));
  };

  const addAction = () => {
    setFormData((prev) => ({
      ...prev,
      actions: [
        ...prev.actions,
        { type: "assign_supplier", config: {} },
      ],
    }));
  };

  const removeAction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.map((a, i) =>
        i === index ? { ...a, ...updates } : a
      ),
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de la règle</CardTitle>
          <CardDescription>
            Définissez les paramètres de base de votre règle d'automatisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la règle</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Assigner CJ pour produits < 50€"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type de règle</Label>
              <Select
                value={formData.rule_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, rule_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ruleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Décrivez le comportement de cette règle..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="active">Règle active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="priority">Priorité</Label>
                <Input
                  id="priority"
                  type="number"
                  className="w-20"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conditions</CardTitle>
              <CardDescription>
                Définissez quand cette règle doit s'appliquer
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={formData.condition_logic}
                onValueChange={(value: "AND" | "OR") =>
                  setFormData((prev) => ({ ...prev, condition_logic: value }))
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">ET</SelectItem>
                  <SelectItem value="OR">OU</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {formData.conditions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucune condition. La règle s'appliquera à toutes les commandes.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />

                  {index > 0 && (
                    <Badge variant="outline" className="shrink-0">
                      {formData.condition_logic}
                    </Badge>
                  )}

                  <Select
                    value={condition.field}
                    onValueChange={(value) =>
                      updateCondition(index, { field: value })
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionFields.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(value) =>
                      updateCondition(index, { operator: value })
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOperators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={condition.value}
                    onChange={(e) =>
                      updateCondition(index, { value: e.target.value })
                    }
                    placeholder="Valeur..."
                    className="flex-1"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Définissez ce qui doit se passer quand les conditions sont remplies
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addAction}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.actions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucune action définie. Ajoutez au moins une action.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.actions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />

                  <Badge variant="secondary" className="shrink-0">
                    {index + 1}
                  </Badge>

                  <Select
                    value={action.type}
                    onValueChange={(value) =>
                      updateAction(index, { type: value })
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={JSON.stringify(action.config)}
                    onChange={(e) => {
                      try {
                        const config = JSON.parse(e.target.value);
                        updateAction(index, { config });
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    placeholder='{"supplier_id": "xxx"}'
                    className="flex-1 font-mono text-xs"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAction(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={!formData.name}>
          <Save className="h-4 w-4 mr-2" />
          {rule ? "Mettre à jour" : "Créer la règle"}
        </Button>
      </div>
    </div>
  );
}
