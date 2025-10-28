import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfitCalculator } from '@/hooks/useProfitCalculator';
import { Save, Loader2 } from 'lucide-react';

export function ProfitConfiguration() {
  const { config, isLoadingConfig, saveConfig, isSavingConfig } = useProfitCalculator();
  
  const [formData, setFormData] = useState({
    defaultShippingCost: '0',
    defaultPackagingCost: '0',
    defaultTransactionFeePercent: '2.9',
    defaultAdCostPercent: '15',
    defaultVatPercent: '20',
    currency: 'EUR'
  });

  useEffect(() => {
    if (config) {
      setFormData({
        defaultShippingCost: config.default_shipping_cost?.toString() || '0',
        defaultPackagingCost: config.default_packaging_cost?.toString() || '0',
        defaultTransactionFeePercent: config.default_transaction_fee_percent?.toString() || '2.9',
        defaultAdCostPercent: config.default_ad_cost_percent?.toString() || '15',
        defaultVatPercent: config.default_vat_percent?.toString() || '20',
        currency: config.currency || 'EUR'
      });
    }
  }, [config]);

  const handleSave = () => {
    saveConfig({
      defaultShippingCost: parseFloat(formData.defaultShippingCost),
      defaultPackagingCost: parseFloat(formData.defaultPackagingCost),
      defaultTransactionFeePercent: parseFloat(formData.defaultTransactionFeePercent),
      defaultAdCostPercent: parseFloat(formData.defaultAdCostPercent),
      defaultVatPercent: parseFloat(formData.defaultVatPercent),
      currency: formData.currency
    });
  };

  if (isLoadingConfig) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Configuration par Défaut</h2>
        <p className="text-muted-foreground mt-1">
          Définissez vos valeurs par défaut pour accélérer les calculs
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="defaultShippingCost">Frais de Livraison (€)</Label>
            <Input
              id="defaultShippingCost"
              type="number"
              step="0.01"
              value={formData.defaultShippingCost}
              onChange={(e) => setFormData({ ...formData, defaultShippingCost: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="defaultPackagingCost">Frais d'Emballage (€)</Label>
            <Input
              id="defaultPackagingCost"
              type="number"
              step="0.01"
              value={formData.defaultPackagingCost}
              onChange={(e) => setFormData({ ...formData, defaultPackagingCost: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="defaultTransactionFeePercent">Frais de Transaction (%)</Label>
            <Input
              id="defaultTransactionFeePercent"
              type="number"
              step="0.1"
              value={formData.defaultTransactionFeePercent}
              onChange={(e) => setFormData({ ...formData, defaultTransactionFeePercent: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ex: Stripe, PayPal ~2.9%
            </p>
          </div>
          <div>
            <Label htmlFor="defaultAdCostPercent">Coût Publicitaire (%)</Label>
            <Input
              id="defaultAdCostPercent"
              type="number"
              step="0.1"
              value={formData.defaultAdCostPercent}
              onChange={(e) => setFormData({ ...formData, defaultAdCostPercent: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Budget pub sur prix de vente
            </p>
          </div>
          <div>
            <Label htmlFor="defaultVatPercent">TVA (%)</Label>
            <Input
              id="defaultVatPercent"
              type="number"
              step="0.1"
              value={formData.defaultVatPercent}
              onChange={(e) => setFormData({ ...formData, defaultVatPercent: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              France: 20%
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="currency">Devise</Label>
          <Input
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            placeholder="EUR"
          />
        </div>

        <Button onClick={handleSave} disabled={isSavingConfig} size="lg" className="w-full">
          {isSavingConfig ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer la Configuration
            </>
          )}
        </Button>
      </div>

      <div className="bg-accent/50 border rounded-lg p-4">
        <p className="text-sm font-medium mb-2">💡 Conseils</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Les valeurs par défaut seront pré-remplies dans le calculateur</li>
          <li>• Vous pouvez toujours les modifier pour chaque calcul</li>
          <li>• Une marge de 30%+ est généralement recommandée pour le e-commerce</li>
        </ul>
      </div>
    </div>
  );
}
