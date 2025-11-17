import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnifiedStores } from '@/hooks/useUnifiedStores';
import { Store, Globe, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StoreCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoreCreationWizard({ open, onOpenChange }: StoreCreationWizardProps) {
  const { createStore, isCreating } = useUnifiedStores();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    country: 'FR',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    store_type: 'primary' as 'primary' | 'secondary' | 'marketplace',
  });

  const handleSubmit = () => {
    createStore(formData);
    onOpenChange(false);
    setStep(1);
    setFormData({
      name: '',
      domain: '',
      country: 'FR',
      currency: 'EUR',
      timezone: 'Europe/Paris',
      store_type: 'primary',
    });
  };

  const canProceed = () => {
    if (step === 1) return formData.name.trim().length > 0;
    if (step === 2) return formData.country && formData.currency;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle boutique</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 mx-2 ${
                      step > s ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la boutique *</Label>
                <Input
                  id="name"
                  placeholder="Ma boutique principale"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domaine (optionnel)</Label>
                <Input
                  id="domain"
                  placeholder="www.maboutique.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type de boutique</Label>
                <Select
                  value={formData.store_type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, store_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Boutique Principale</SelectItem>
                    <SelectItem value="secondary">Boutique Secondaire</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Location & Currency */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="BE">Belgique</SelectItem>
                    <SelectItem value="CH">Suisse</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="US">États-Unis</SelectItem>
                    <SelectItem value="GB">Royaume-Uni</SelectItem>
                    <SelectItem value="DE">Allemagne</SelectItem>
                    <SelectItem value="ES">Espagne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="CHF">CHF (Fr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                    <SelectItem value="Europe/Brussels">Europe/Brussels</SelectItem>
                    <SelectItem value="Europe/Zurich">Europe/Zurich</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                    <SelectItem value="America/Toronto">America/Toronto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Résumé de la boutique</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{formData.name}</p>
                  </div>
                </div>
                {formData.domain && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Domaine</p>
                      <p className="font-medium">{formData.domain}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Localisation</p>
                    <p className="font-medium">
                      {formData.country} • {formData.currency} • {formData.timezone}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (step > 1) setStep(step - 1);
                else onOpenChange(false);
              }}
            >
              {step === 1 ? 'Annuler' : 'Retour'}
            </Button>
            <Button
              onClick={() => {
                if (step < 3) setStep(step + 1);
                else handleSubmit();
              }}
              disabled={!canProceed() || isCreating}
            >
              {step === 3 ? (isCreating ? 'Création...' : 'Créer') : 'Suivant'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
