import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Plus, Eye, Trash2, Play } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PricingRulesManagerProps {
  rules: any[];
  createRule: (rule: any) => void;
  updateRule: (rule: any) => void;
  deleteRule: (ruleId: string) => void;
  applyRule: (params: any) => void;
  previewRule: (params: any) => void;
}

export function PricingRulesManager({ rules, createRule, updateRule, deleteRule, applyRule, previewRule }: PricingRulesManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRule, setNewRule] = useState<any>({
    rule_name: '',
    strategy: 'fixed_margin',
    applies_to: 'all',
    fixed_margin_percent: 30,
    is_active: true,
    priority: 1
  });

  const handleCreate = () => {
    createRule(newRule);
    setShowCreateDialog(false);
    setNewRule({
      rule_name: '',
      strategy: 'fixed_margin',
      applies_to: 'all',
      fixed_margin_percent: 30,
      is_active: true,
      priority: 1
    });
  };

  const getStrategyLabel = (strategy: string) => {
    const labels: Record<string, string> = {
      fixed_margin: 'Marge Fixe',
      target_margin: 'Marge Cible',
      competitive: 'Compétitif',
      dynamic: 'Dynamique'
    };
    return labels[strategy] || strategy;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Règles de Repricing</CardTitle>
              <CardDescription>
                Gérez vos stratégies de pricing automatique
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Règle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une Règle de Pricing</DialogTitle>
                  <DialogDescription>
                    Définissez une stratégie de pricing automatique
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label>Nom de la règle</Label>
                    <Input
                      value={newRule.rule_name}
                      onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                      placeholder="Ex: Marge 30% sur électronique"
                    />
                  </div>

                  <div>
                    <Label>Stratégie</Label>
                    <Select
                      value={newRule.strategy}
                      onValueChange={(value) => setNewRule({ ...newRule, strategy: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed_margin">Marge Fixe (%)</SelectItem>
                        <SelectItem value="target_margin">Marge Cible</SelectItem>
                        <SelectItem value="competitive">Prix Compétitif</SelectItem>
                        <SelectItem value="dynamic">Pricing Dynamique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newRule.strategy === 'fixed_margin' && (
                    <div>
                      <Label>Marge fixe (%)</Label>
                      <Input
                        type="number"
                        value={newRule.fixed_margin_percent}
                        onChange={(e) => setNewRule({ ...newRule, fixed_margin_percent: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}

                  {newRule.strategy === 'target_margin' && (
                    <>
                      <div>
                        <Label>Marge cible (%)</Label>
                        <Input
                          type="number"
                          value={newRule.target_margin_percent || 30}
                          onChange={(e) => setNewRule({ ...newRule, target_margin_percent: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Prix minimum (€)</Label>
                          <Input
                            type="number"
                            value={newRule.min_price || ''}
                            onChange={(e) => setNewRule({ ...newRule, min_price: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Prix maximum (€)</Label>
                          <Input
                            type="number"
                            value={newRule.max_price || ''}
                            onChange={(e) => setNewRule({ ...newRule, max_price: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Appliquer à</Label>
                    <Select
                      value={newRule.applies_to}
                      onValueChange={(value) => setNewRule({ ...newRule, applies_to: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les produits</SelectItem>
                        <SelectItem value="category">Une catégorie</SelectItem>
                        <SelectItem value="supplier">Un fournisseur</SelectItem>
                        <SelectItem value="products">Produits spécifiques</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Activer la règle</Label>
                    <Switch
                      checked={newRule.is_active}
                      onCheckedChange={(checked) => setNewRule({ ...newRule, is_active: checked })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreate} className="flex-1">Créer</Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg">{rule.rule_name}</p>
                      <Badge variant="outline">{getStrategyLabel(rule.strategy)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => updateRule({ id: rule.id, is_active: checked })}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => previewRule({ rule_id: rule.id })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => applyRule({ rule_id: rule.id })}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Priorité</p>
                      <p className="font-bold">{rule.priority}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Produits affectés</p>
                      <p className="font-bold">{rule.products_affected || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Applications</p>
                      <p className="font-bold">{rule.total_applications || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dernière application</p>
                      <p className="text-xs">{rule.last_applied_at ? new Date(rule.last_applied_at).toLocaleDateString() : 'Jamais'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {rules.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Aucune règle de pricing</p>
                <p className="text-sm text-muted-foreground">
                  Créez votre première règle pour automatiser votre pricing
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
