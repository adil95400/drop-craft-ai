import React from 'react';
import { Helmet } from 'react-helmet-async';
import { AdvancedAnalyticsDashboard } from '@/components/analytics';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';

export default function AdvancedAnalyticsPage() {
  return (
    <>
      <Helmet>
        <title>Analytics Avancés | ShopOpti</title>
        <meta name="description" content="Tableau de bord analytique avancé" />
      </Helmet>
      
      <ChannablePageWrapper
        title={tPages('analyticsAvances.title')}
        description="Tableau de bord analytique avancé avec insights et prédictions"
        heroImage="analytics"
        badge={{ label: 'Analytics', icon: BarChart3 }}
      >
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.advancedAnalytics} />
        <AdvancedAnalyticsDashboard />
      </ChannablePageWrapper>
    </>
  );
}
