import { PricingEngineDashboard } from '@/components/pricing-engine';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Calculator } from 'lucide-react';

export default function PricingEnginePage() {
  return (
    <ChannablePageWrapper
      title="Moteur de Règles Pricing"
      description="Règles automatiques de tarification avec simulateur et protection de marge"
      heroImage="products"
      badge={{ label: 'Pricing Engine', icon: Calculator }}
    >
      <PricingEngineDashboard />
    </ChannablePageWrapper>
  );
}
