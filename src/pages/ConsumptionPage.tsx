import { UserConsumptionDashboard } from '@/components/consumption';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';

export default function ConsumptionPage() {
    const { t: tPages } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={tPages('consommationAbonnement.title')}
      description="Suivez votre utilisation et gérez votre abonnement"
      heroImage="analytics"
      badge={{ label: 'Consommation', icon: CreditCard }}
    >
      <UserConsumptionDashboard />
    </ChannablePageWrapper>
  );
}
