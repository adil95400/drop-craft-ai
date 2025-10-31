import React from 'react'
import { UserGuide } from '@/components/ux/UserGuide'
import { Helmet } from 'react-helmet-async'
import { PublicLayout } from '@/layouts/PublicLayout'

export default function GuidePage() {
  return (
    <PublicLayout>
      <Helmet>
        <title>Guide Utilisateur - ShopOpti+</title>
        <meta
          name="description"
          content="Apprenez à maîtriser toutes les fonctionnalités de ShopOpti+ avec notre guide utilisateur complet"
        />
      </Helmet>
      <UserGuide />
    </PublicLayout>
  )
}