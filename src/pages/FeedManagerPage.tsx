import React from 'react';
import { Helmet } from 'react-helmet-async';
import FeedManager from '@/components/feeds/FeedManager';
import { AdvancedFeatureGuide } from '@/components/guide';
import { ADVANCED_GUIDES } from '@/components/guide';

export default function FeedManagerPage() {
  return (
    <>
      <Helmet>
        <title>Gestion de Feeds | Dropshipping Platform</title>
        <meta 
          name="description" 
          content="Optimisez vos produits pour chaque marketplace avec génération de feeds automatique, SEO intelligent et mapping de catégories" 
        />
      </Helmet>
      
      <div className="container mx-auto py-8 px-4 space-y-6">
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.feeds} />
        <FeedManager />
      </div>
    </>
  );
}