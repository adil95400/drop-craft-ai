import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAdsManagerNew } from '@/hooks/useAdsManagerNew';
import { Loader2, Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignDialog({ open, onOpenChange }: Props) {
  const { createCampaign, isCreatingCampaign } = useAdsManagerNew();
  const [formData, setFormData] = useState({
    name: '',
    platform: 'facebook',
    objective: 'conversions',
    budgetType: 'daily',
    budgetAmount: '',
    targetAudience: '',
    aiOptimization: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createCampaign({
      name: formData.name,
      platform: formData.platform,
      objective: formData.objective,
      budgetType: formData.budgetType,
      budgetAmount: parseFloat(formData.budgetAmount),
      targetAudience: formData.targetAudience,
      aiOptimizationEnabled: formData.aiOptimization
    });

    onOpenChange(false);
    setFormData({
      name: '',
      platform: 'facebook',
      objective: 'conversions',
      budgetType: 'daily',
      budgetAmount: '',
      targetAudience: '',
      aiOptimization: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une Nouvelle Campagne</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de la Campagne</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Lancement Produit Hiver 2024"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform">Plateforme</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="pinterest">Pinterest</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="objective">Objectif</Label>
              <Select value={formData.objective} onValueChange={(value) => setFormData({ ...formData, objective: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversions">Conversions</SelectItem>
                  <SelectItem value="traffic">Trafic</SelectItem>
                  <SelectItem value="awareness">Notoriété</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="leads">Génération de leads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budgetType">Type de Budget</Label>
              <Select value={formData.budgetType} onValueChange={(value) => setFormData({ ...formData, budgetType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="lifetime">Total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="budgetAmount">Montant (€)</Label>
              <Input
                id="budgetAmount"
                type="number"
                step="0.01"
                value={formData.budgetAmount}
                onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                placeholder="100.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="targetAudience">Audience Cible</Label>
            <Textarea
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              placeholder="Ex: Femmes 25-45 ans, intéressées par la mode et le lifestyle"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Optimisation IA</p>
                <p className="text-sm text-muted-foreground">
                  L'IA ajustera automatiquement votre campagne pour de meilleurs résultats
                </p>
              </div>
            </div>
            <Switch
              checked={formData.aiOptimization}
              onCheckedChange={(checked) => setFormData({ ...formData, aiOptimization: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isCreatingCampaign}>
              {isCreatingCampaign ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer la Campagne'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
