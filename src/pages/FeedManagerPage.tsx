import React from 'react';
import { Helmet } from 'react-helmet-async';
import FeedManager from '@/components/feeds/FeedManager';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Rss } from 'lucide-react';

export default function FeedManagerPage() {
  return (
    <>
      <Helmet>
        <title>Gestion de Feeds | Dropshipping Platform</title>
        <meta name="description" content="Optimisez vos produits pour chaque marketplace avec génération de feeds automatique, SEO intelligent et mapping de catégories" />
      </Helmet>
      <ChannablePageWrapper
        title="Gestion de Feeds"
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
