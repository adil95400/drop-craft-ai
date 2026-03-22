import React from 'react';
import { Helmet } from 'react-helmet-async';
import FeedManager from '@/components/feeds/FeedManager';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Rss } from 'lucide-react';

export default function FeedManagerPage() {
  const { t: tPages } = useTranslation('pages');
  return (
    <>
      <Helmet>
        <title>Gestion de Feeds | Dropshipping Platform</title>
        <meta name="description" content="Optimisez vos produits pour chaque marketplace avec génération de feeds automatique, SEO intelligent et mapping de catégories" />
      </Helmet>
      <ChannablePageWrapper
        title={tPages('gestionDeFeeds.title')}
        description="Optimisez vos produits pour chaque marketplace avec feeds automatiques et SEO intelligent"
        heroImage="schema"
        badge={{ label: 'Feeds', icon: Rss }}
      >
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.feeds} />
        <FeedManager />
      </ChannablePageWrapper>
    </>
  );
}
