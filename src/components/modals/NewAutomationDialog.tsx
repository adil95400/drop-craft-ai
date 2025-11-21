import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Zap, Clock, Target, Settings } from 'lucide-react';

interface NewAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAutomationDialog({ open, onOpenChange }: NewAutomationDialogProps) {
  const { user } = useAuth();
  const { supabaseFunction } = useApi();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'product_stock_low',
    rule_type: 'stock_management',
    priority: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabaseFunction('automation-engine', {
        action: 'create_rule',
        rule: {
          ...formData,
          user_id: user.id,
          trigger_conditions: {
            threshold: 10,
            field: 'stock_quantity',
            operator: 'less_than',
          },
          actions: [
            {
              type: 'send_notification',
              config: { channel: 'email', template: 'low_stock' },
            },
          ],
          ai_conditions: {},
          performance_metrics: {},
        },
      });

      if (error) throw new Error(error);

      toast.success('Automation créée avec succès');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        trigger_type: 'product_stock_low',
        rule_type: 'stock_management',
        priority: 5,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Nouvelle Automation
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle règle d'automation pour automatiser vos tâches
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'automation</Label>
            <Input
              id="name"
              placeholder="Ex: Alerte stock bas"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez ce que fait cette automation..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trigger_type" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Type de déclencheur
              </Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_stock_low">Stock bas</SelectItem>
                  <SelectItem value="product_created">Produit créé</SelectItem>
                  <SelectItem value="order_created">Commande créée</SelectItem>
                  <SelectItem value="order_status_changed">Statut commande modifié</SelectItem>
                  <SelectItem value="price_changed">Prix modifié</SelectItem>
                  <SelectItem value="scheduled">Planifié</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule_type" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Catégorie
              </Label>
              <Select
                value={formData.rule_type}
                onValueChange={(value) => setFormData({ ...formData, rule_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock_management">Gestion stock</SelectItem>
                  <SelectItem value="pricing">Tarification</SelectItem>
                  <SelectItem value="order_processing">Traitement commandes</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="notification">Notifications</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Priorité ({formData.priority})
            </Label>
            <Input
              id="priority"
              type="range"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              1 = Basse priorité, 10 = Haute priorité
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name}>
              {isSubmitting ? 'Création...' : 'Créer l\'automation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
