import React from 'react';
import { Helmet } from 'react-helmet-async';
import { AdvancedAnalyticsDashboard } from '@/components/analytics';

export default function AdvancedAnalyticsPage() {
  return (
    <>
      <Helmet>
        <title>Analytics Avancés | DropShipper</title>
        <meta name="description" content="Tableau de bord analytique avancé" />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <AdvancedAnalyticsDashboard />
      </div>
    </>
  );
}
