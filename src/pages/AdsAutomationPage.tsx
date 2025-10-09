import { AdsAutomationDashboard } from '@/components/ads/AdsAutomationDashboard';
import { Helmet } from 'react-helmet-async';

export default function AdsAutomationPage() {
  return (
    <>
      <Helmet>
        <title>Ads Automation & Marketing - AI-Powered Advertising</title>
        <meta name="description" content="Automate your Facebook, Google, Instagram ads with AI-powered creation and A/B testing" />
      </Helmet>
      <div className="container mx-auto p-6">
        <AdsAutomationDashboard />
      </div>
    </>
  );
}
