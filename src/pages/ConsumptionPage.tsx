import { UserConsumptionDashboard } from '@/components/consumption';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { CreditCard } from 'lucide-react';

export default function ConsumptionPage() {
  return (
    <ChannablePageWrapper
      title="Consommation & Abonnement"
      description="Suivez votre utilisation et gérez votre abonnement"
      heroImage="analytics"
      badge={{ label: 'Consommation', icon: CreditCard }}
    >
      <UserConsumptionDashboard />
    </ChannablePageWrapper>
  );
}
