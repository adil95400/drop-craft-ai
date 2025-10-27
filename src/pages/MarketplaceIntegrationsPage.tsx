import React from 'react'
import { Helmet } from 'react-helmet-async'
import { MarketplaceIntegrationsHub } from '@/components/marketplace/MarketplaceIntegrationsHub'

export default function MarketplaceIntegrationsPage() {
  return (
    <>
      <Helmet>
        <title>Intégrations Marketplace - DropCraft AI</title>
        <meta
          name="description"
          content="Connectez et synchronisez vos boutiques sur Etsy, Cdiscount, Allegro, ManoMano et autres marketplaces"
        />
      </Helmet>
      <MarketplaceIntegrationsHub />
    </>
  )
}