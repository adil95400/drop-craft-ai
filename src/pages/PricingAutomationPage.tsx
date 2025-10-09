import { PricingAutomationHub } from '@/components/pricing/PricingAutomationHub';

export default function PricingAutomationPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Automatisation des Prix & Bénéfices</h1>
        <p className="text-muted-foreground">
          Gérez vos prix de manière intelligente avec l'IA
        </p>
      </div>
      <PricingAutomationHub />
    </div>
  );
}