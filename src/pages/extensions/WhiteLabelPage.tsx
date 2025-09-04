import React from 'react'
import { Helmet } from 'react-helmet-async'
import { WhiteLabelMarketplace } from '@/components/extensions/WhiteLabelMarketplace'

export default function WhiteLabelPage() {
  return (
    <>
      <Helmet>
        <title>White-Label Marketplace - Créez votre Marketplace d'Extensions</title>
        <meta name="description" content="Solution white-label pour créer votre propre marketplace d'extensions. Branding personnalisé, domaine dédié, et gestion complète." />
        <meta name="keywords" content="white-label, marketplace privé, branding, domaine personnalisé, entreprise" />
      </Helmet>

      <WhiteLabelMarketplace />
    </>
  )
}