import React from 'react';
import { Helmet } from 'react-helmet-async';
import { AdvancedAnalyticsDashboard } from '@/components/analytics';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

export default function AdvancedAnalyticsPage() {
  return (
    <>
      <Helmet>
        <title>Analytics Avancés | DropShipper</title>
        <meta name="description" content="Tableau de bord analytique avancé" />
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.advancedAnalytics} />
        <AdvancedAnalyticsDashboard />
      </div>
    </>
  );
}