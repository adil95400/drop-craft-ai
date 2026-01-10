import React from 'react';
import { Helmet } from 'react-helmet-async';
import { RealDataAnalyticsDashboard } from '@/components/analytics';

export default function RealDataAnalyticsPage() {
  return (
    <>
      <Helmet>
        <title>Analytics Données Réelles | ShopOpti</title>
        <meta name="description" content="Tableau de bord analytique avec données réelles de votre boutique" />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <RealDataAnalyticsDashboard />
      </div>
    </>
  );
}
