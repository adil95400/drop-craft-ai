import React from 'react'
import { Helmet } from 'react-helmet-async'
import { MarketplacePublic } from '@/components/extensions/MarketplacePublic'

export default function MarketplacePage() {
  return (
    <>
      <Helmet>
        <title>Marketplace Extensions - Découvrez des Extensions E-commerce</title>
        <meta name="description" content="Marketplace public d'extensions e-commerce. Découvrez, achetez et installez des extensions créées par la communauté pour booster votre boutique en ligne." />
        <meta name="keywords" content="marketplace, extensions, e-commerce, plugins, boutique en ligne, intégrations" />
      </Helmet>

      <MarketplacePublic />
    </>
  )
}