import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface RuleActionConfigEditorProps {
  actionType: string;
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

const supplierOptions = [
  { id: "cj-dropshipping", name: "CJ Dropshipping" },
  { id: "bigbuy", name: "BigBuy" },
  { id: "bts-wholesaler", name: "BTS Wholesaler" },
  { id: "aliexpress", name: "AliExpress" },
  { id: "matterhorn", name: "Matterhorn" },
];

export function RuleActionConfigEditor({
  actionType,
  config,
  onChange,
}: RuleActionConfigEditorProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  switch (actionType) {
    case "assign_supplier":
      return (
        <div className="space-y-3 p-3 bg-background rounded-lg border">
          <div className="space-y-2">
            <Label>Fournisseur à assigner</Label>
            <Select
              value={config.supplier_id || ""}
              onValueChange={(v) => updateConfig("supplier_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {supplierOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.auto_place_order || false}
              onCheckedChange={(v) => updateConfig("auto_place_order", v)}
            />
            <Label>Passer la commande automatiquement</Label>
          </div>
        </div>
      );

    case "apply_margin":
      return (
        <div className="space-y-3 p-3 bg-background rounded-lg border">
          <div className="space-y-2">
            <Label>Marge à appliquer (%)</Label>
            <Input
              type="number"
              value={config.margin_percent || ""}
              onChange={(e) => updateConfig("margin_percent", Number(e.target.value))}
              placeholder="Ex: 30"
              min={0}
              max={500}
            />
          </div>
          <div className="space-y-2">
            <Label>Prix minimum (€)</Label>
            <Input
              type="number"
              value={config.min_price || ""}
              onChange={(e) => updateConfig("min_price", Number(e.target.value))}
              placeholder="Ex: 9.99"
              min={0}
              step={0.01}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.round_price || false}
              onCheckedChange={(v) => updateConfig("round_price", v)}
            />
            <Label>Arrondir au .99</Label>
          </div>
        </div>
      );

    case "set_price":
      return (
        <div className="space-y-3 p-3 bg-background rounded-lg border">
          <div className="space-y-2">
            <Label>Prix fixe (€)</Label>
            <Input
              type="number"
              value={config.price || ""}
              onChange={(e) => updateConfig("price", Number(e.target.value))}
              placeholder="Ex: 29.99"
              min={0}
              step={0.01}
            />
          </div>
        </div>
      );

    case "update_stock":
      return (
        <div className="space-y-3 p-3 bg-background rounded-lg border">
          <div className="space-y-2">
            <Label>Action sur le stock</Label>
            <Select
              value={config.stock_action || "sync"}
              onValueChange={(v) => updateConfig("stock_action", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sync">Synchroniser avec fournisseur</SelectItem>
                <SelectItem value="set">Définir une quantité fixe</SelectItem>
                <SelectItem value="decrease">Diminuer</SelectItem>
                <SelectItem value="increase">Augmenter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.stock_action !== "sync" && (
            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                value={config.quantity || ""}
                onChange={(e) => updateConfig("quantity", Number(e.target.value))}
                placeholder="Ex: 10"
                min={0}
              />
            </div>
          )}
        </div>
      );

    case "send_notification":
      return (
        <div className="space-y-3 p-3 bg-background rounded-lg border">
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select
              value={config.channel || "email"}
              onValueChange={(v) => updateConfig("channel", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="push">Notification push</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={config.message || ""}
              onChange={(e) => updateConfig("message", e.target.value)}
              placeholder="Message de notification..."
              rows={2}
            />
          </div>
          {config.channel === "webhook" && (
            <div className="space-y-2">
              <Label>URL Webhook</Label>
              <Input
                value={config.webhook_url || ""}
                onChange={(e) => updateConfig("webhook_url", e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}
        </div>
      );

    case "skip_order":
      return (
        <div className="space-y-3 p-3 bg-background rounded-lg border">
          <div className="space-y-2">
            <Label>Raison du skip</Label>
            <Input
              value={config.reason || ""}
              onChange={(e) => updateConfig("reason", e.target.value)}
              placeholder="Ex: Produit indisponible"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.notify_user || false}
              onCheckedChange={(v) => updateConfig("notify_user", v)}
            />
            <Label>Notifier l'utilisateur</Label>
          </div>
        </div>
      );

    case "flag_for_review":
      return (
        <div className="space-y-3 p-3 bg-background rounded-lg border">
          <div className="space-y-2">
            <Label>Priorité de révision</Label>
            <Select
              value={config.review_priority || "medium"}
              onValueChange={(v) => updateConfig("review_priority", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Basse</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              value={config.note || ""}
              onChange={(e) => updateConfig("note", e.target.value)}
              placeholder="Raison de la révision..."
              rows={2}
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          Configuration non disponible pour ce type d'action.
        </div>
      );
  }
}
