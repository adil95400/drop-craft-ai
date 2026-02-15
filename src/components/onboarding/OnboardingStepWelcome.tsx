/**
 * Onboarding Step 1: Welcome & Business Info
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Rocket, ShoppingBag, Package, Layers } from 'lucide-react';

const BUSINESS_TYPES = [
  { id: 'dropshipping', label: 'Dropshipping', icon: Package, desc: 'Vente sans stock' },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag, desc: 'Boutique avec stock' },
  { id: 'marketplace', label: 'Marketplace', icon: Layers, desc: 'Multi-vendeurs' },
];

export default function OnboardingStepWelcome({ onSave }: { onSave: () => void }) {
  const { businessName, businessType, setBusinessInfo, completeStep, nextStep } = useOnboardingStore();
  const [name, setName] = useState(businessName);
  const [type, setType] = useState(businessType);

  const canContinue = name.trim().length >= 2 && type;

  const handleContinue = () => {
    setBusinessInfo(name.trim(), type);
    completeStep(1);
    onSave();
    nextStep();
  };

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Bienvenue sur ShopOpti 🚀</CardTitle>
        <CardDescription className="text-base">
          Configurez votre boutique en quelques minutes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-2">
          <Label htmlFor="business-name">Nom de votre boutique</Label>
          <Input
            id="business-name"
            placeholder="Ma Super Boutique"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label>Type d'activité</Label>
          <div className="grid grid-cols-3 gap-3">
            {BUSINESS_TYPES.map((bt) => (
              <button
                key={bt.id}
                onClick={() => setType(bt.id)}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  type === bt.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <bt.icon className={`h-6 w-6 mx-auto mb-2 ${type === bt.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium">{bt.label}</p>
                <p className="text-xs text-muted-foreground">{bt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleContinue} disabled={!canContinue} className="w-full" size="lg">
          Continuer
        </Button>
      </CardContent>
    </Card>
  );
}
