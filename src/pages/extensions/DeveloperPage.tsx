import React from 'react'
import { Helmet } from 'react-helmet-async'
import { DeveloperDashboard } from '@/components/extensions/DeveloperDashboard'

export default function DeveloperPage() {
  return (
    <>
      <Helmet>
        <title>Developer Dashboard - Créez vos Extensions E-commerce</title>
        <meta name="description" content="Dashboard développeur pour créer, publier et gérer vos extensions e-commerce. Outils de développement, analytics et gestion des revenus." />
        <meta name="keywords" content="développeur, extensions, SDK, API, développement, publication, marketplace" />
      </Helmet>

      <DeveloperDashboard />
    </>
  )
}