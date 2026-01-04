import { Helmet } from 'react-helmet-async';
import { AdsSpyDashboard } from '@/components/ads-spy';

export default function AdsSpyPage() {
  return (
    <>
      <Helmet>
        <title>Ads Spy - Analysez les Publicités Concurrentes | Drop Craft AI</title>
        <meta name="description" content="Espionnez les publicités de vos concurrents sur Facebook, TikTok et Instagram. Analysez leurs stratégies et découvrez les winners." />
      </Helmet>
      
      <div className="container mx-auto p-6">
        <AdsSpyDashboard />
      </div>
    </>
  );
}
