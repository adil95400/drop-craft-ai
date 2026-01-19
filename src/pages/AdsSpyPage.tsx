import { AdsSpyDashboard } from '@/components/ads-spy';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Megaphone } from 'lucide-react';

export default function AdsSpyPage() {
  return (
    <ChannablePageWrapper
      title="Ads Spy Pro"
      description="Espionnez les publicités gagnantes et découvrez les stratégies de vos concurrents"
      heroImage="marketing"
      badge={{ label: "Marketing", icon: Megaphone }}
    >
      <AdsSpyDashboard />
    </ChannablePageWrapper>
  );
}
