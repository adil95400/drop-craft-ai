import React from 'react'
import { Helmet } from 'react-helmet-async'
import { CLIDeveloperTools } from '@/components/extensions/CLIDeveloperTools'

export default function CLIToolsPage() {
  return (
    <>
      <Helmet>
        <title>CLI Developer Tools - Outils de Développement d'Extensions</title>
        <meta name="description" content="Outils CLI professionnels pour développer des extensions e-commerce. Terminal interactif, templates, tests automatisés et déploiement." />
        <meta name="keywords" content="CLI, outils développeur, terminal, tests, déploiement, templates, développement" />
      </Helmet>

      <CLIDeveloperTools />
    </>
  )
}