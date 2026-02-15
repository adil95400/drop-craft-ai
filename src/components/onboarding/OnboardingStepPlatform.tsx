/**
 * Onboarding Step 2: Platform Selection
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ArrowLeft, Store, Globe, ExternalLink } from 'lucide-react';

const PLATFORMS = [
  { id: 'shopify', name: 'Shopify', desc: 'La plateforme e-commerce #1', placeholder: 'ma-boutique.myshopify.com' },
  { id: 'woocommerce', name: 'WooCommerce', desc: 'WordPress + WooCommerce', placeholder: 'www.ma-boutique.com' },
  { id: 'prestashop', name: 'PrestaShop', desc: 'Solution française open-source', placeholder: 'www.ma-boutique.com' },
  { id: 'other', name: 'Autre', desc: 'Magento, BigCommerce, etc.', placeholder: 'www.ma-boutique.com' },
  { id: 'none', name: 'Pas encore de boutique', desc: 'Je démarre de zéro', placeholder: '' },
];

export default function OnboardingStepPlatform({ onSave }: { onSave: () => void }) {
  const { storePlatform, storeUrl, setPlatform, setStoreUrl, completeStep, nextStep, prevStep } = useOnboardingStore();
  const [platform, setLocalPlatform] = useState(storePlatform);
  const [url, setUrl] = useState(storeUrl);

  const needsUrl = platform && platform !== 'none';
  const canContinue = platform && (!needsUrl || url.trim().length >= 5);

  const handleContinue = () => {
    setPlatform(platform);
    setStoreUrl(needsUrl ? url.trim() : '');
    completeStep(2);
    onSave();
    nextStep();
  };

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Connectez votre boutique</CardTitle>
        <CardDescription className="text-base">
          Sélectionnez votre plateforme e-commerce
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setLocalPlatform(p.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                platform === p.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                platform === p.id ? 'bg-primary/10' : 'bg-muted'
              }`}>
                {p.id === 'none' ? (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {needsUrl && (
          <div className="space-y-2">
            <Label htmlFor="store-url">URL de votre boutique</Label>
            <Input
              id="store-url"
              placeholder={PLATFORMS.find(p => p.id === platform)?.placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              maxLength={255}
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={prevStep} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button onClick={handleContinue} disabled={!canContinue} className="flex-1">
            Continuer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
