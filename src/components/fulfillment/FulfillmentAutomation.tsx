import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Zap, Truck, Mail, Printer, Package, Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  carrier_selection: string;
  auto_label: boolean;
  auto_print: boolean;
  auto_notify: boolean;
  is_active: boolean;
}

export function FulfillmentAutomation() {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Commandes France - Colissimo',
      trigger: 'paid',
      carrier_selection: 'cheapest',
      auto_label: true,
      auto_print: false,
      auto_notify: true,
      is_active: true
    },
    {
      id: '2',
      name: 'Express - Chronopost',
      trigger: 'confirmed',
      carrier_selection: 'fastest',
      auto_label: true,
      auto_print: true,
      auto_notify: true,
      is_active: false
    }
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger: 'paid',
    carrier_selection: 'cheapest',
    auto_label: true,
    auto_print: false,
    auto_notify: true
  });
  
  const triggerLabels: Record<string, string> = {
    paid: 'Commande payée',
    confirmed: 'Commande confirmée',
    processing: 'En traitement'
  };
  
  const selectionLabels: Record<string, string> = {
    cheapest: 'Moins cher',
    fastest: 'Plus rapide',
    preferred: 'Préféré',
    rules_based: 'Selon règles'
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRule) {
      setRules(rules.map(r => r.id === editingRule.id ? { ...r, ...formData } : r));
    } else {
      setRules([...rules, { id: Date.now().toString(), ...formData, is_active: true }]);
    }
    
    setIsDialogOpen(false);
    setEditingRule(null);
    setFormData({
      name: '',
      trigger: 'paid',
      carrier_selection: 'cheapest',
      auto_label: true,
      auto_print: false,
      auto_notify: true
    });
  };
  
  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      trigger: rule.trigger,
      carrier_selection: rule.carrier_selection,
      auto_label: rule.auto_label,
      auto_print: rule.auto_print,
      auto_notify: rule.auto_notify
    });
    setIsDialogOpen(true);
  };
  
  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
  };
  
  const deleteRule = (id: string) => {
    if (confirm('Supprimer cette règle ?')) {
      setRules(rules.filter(r => r.id !== id));
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Automatisation des expéditions</h3>
            <p className="text-sm text-muted-foreground">
              Configurez des règles pour automatiser la sélection du transporteur, la génération d'étiquettes et les notifications
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Rules List */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Règles d'automatisation ({rules.length})</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingRule(null);
            setFormData({
              name: '',
              trigger: 'paid',
              carrier_selection: 'cheapest',
              auto_label: true,
              auto_print: false,
              auto_notify: true
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Modifier la règle' : 'Nouvelle règle d\'automatisation'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la règle</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Commandes France standard"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Déclencheur</Label>
                <Select
                  value={formData.trigger}
                  onValueChange={(value) => setFormData({ ...formData, trigger: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Commande payée</SelectItem>
                    <SelectItem value="confirmed">Commande confirmée</SelectItem>
                    <SelectItem value="processing">En traitement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Sélection du transporteur</Label>
                <Select
                  value={formData.carrier_selection}
                  onValueChange={(value) => setFormData({ ...formData, carrier_selection: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cheapest">Le moins cher</SelectItem>
                    <SelectItem value="fastest">Le plus rapide</SelectItem>
                    <SelectItem value="preferred">Transporteur préféré</SelectItem>
                    <SelectItem value="rules_based">Selon règles personnalisées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <Label>Générer l'étiquette automatiquement</Label>
                  </div>
                  <Switch
                    checked={formData.auto_label}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_label: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4 text-muted-foreground" />
                    <Label>Imprimer automatiquement</Label>
                  </div>
                  <Switch
                    checked={formData.auto_print}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_print: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label>Notifier le client</Label>
                  </div>
                  <Switch
                    checked={formData.auto_notify}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_notify: checked })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingRule ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Aucune règle configurée</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez des règles pour automatiser vos expéditions
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une règle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={rule.is_active ? '' : 'opacity-60'}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{rule.name}</h3>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {triggerLabels[rule.trigger]}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {selectionLabels[rule.carrier_selection]}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className={rule.auto_label ? 'text-green-600' : ''}>
                        {rule.auto_label ? '✓' : '✗'} Étiquette auto
                      </span>
                      <span className={rule.auto_print ? 'text-green-600' : ''}>
                        {rule.auto_print ? '✓' : '✗'} Impression auto
                      </span>
                      <span className={rule.auto_notify ? 'text-green-600' : ''}>
                        {rule.auto_notify ? '✓' : '✗'} Notification client
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
