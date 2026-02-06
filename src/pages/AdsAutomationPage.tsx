import { AdsAutomationDashboard } from '@/components/ads/AdsAutomationDashboard';
import { Helmet } from 'react-helmet-async';
import { PageBanner } from '@/components/shared/PageBanner';
import { Megaphone } from 'lucide-react';

export default function AdsAutomationPage() {
  return (
    <>
      <Helmet>
        <title>Ads Automation & Marketing - AI-Powered Advertising</title>
        <meta name="description" content="Automate your Facebook, Google, Instagram ads with AI-powered creation and A/B testing" />
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <PageBanner
          icon={Megaphone}
          title="Ads Automation & Marketing"
          description="Automatisez vos publicités Facebook, Google et Instagram avec l'IA"
          theme="orange"
        />
        <AdsAutomationDashboard />
      </div>
    </>
  );
}
