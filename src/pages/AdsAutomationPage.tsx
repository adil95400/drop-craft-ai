import { AdsAutomationDashboard } from '@/components/ads/AdsAutomationDashboard';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Megaphone } from 'lucide-react';

export default function AdsAutomationPage() {
  return (
    <>
      <Helmet>
        <title>Ads Automation & Marketing - AI-Powered Advertising</title>
        <meta name="description" content="Automate your Facebook, Google, Instagram ads with AI-powered creation and A/B testing" />
      </Helmet>
      <ChannablePageWrapper
        title="Ads Automation & Marketing"
        description="Automatisez vos publicités Facebook, Google et Instagram avec l'IA"
        heroImage="marketing"
        badge={{ label: 'Ads', icon: Megaphone }}
      >
        <AdsAutomationDashboard />
      </ChannablePageWrapper>
    </>
  );
}
