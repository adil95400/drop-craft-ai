/**
 * Page de consommation utilisateur
 */

import { UserConsumptionDashboard } from '@/components/consumption';
import { PageBanner } from '@/components/shared/PageBanner';
import { CreditCard } from 'lucide-react';

export default function ConsumptionPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageBanner
        icon={CreditCard}
        title="Consommation & Abonnement"
        description="Suivez votre utilisation et gérez votre abonnement"
        theme="blue"
      />
      <UserConsumptionDashboard />
    </div>
  );
}
