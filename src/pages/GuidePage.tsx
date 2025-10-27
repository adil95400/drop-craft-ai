import React from 'react'
import { UserGuide } from '@/components/ux/UserGuide'
import { Helmet } from 'react-helmet-async'

export default function GuidePage() {
  return (
    <>
      <Helmet>
        <title>Guide utilisateur - DropCraft AI</title>
        <meta
          name="description"
          content="Apprenez à maîtriser toutes les fonctionnalités de DropCraft AI avec notre guide utilisateur complet"
        />
      </Helmet>
      <UserGuide />
    </>
  )
}