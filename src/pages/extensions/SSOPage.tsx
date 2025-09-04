import React from 'react'
import { Helmet } from 'react-helmet-async'
import { EnterpriseSSO } from '@/components/extensions/EnterpriseSSO'

export default function SSOPage() {
  return (
    <>
      <Helmet>
        <title>Enterprise SSO - Authentification Centralisée</title>
        <meta name="description" content="Solution SSO enterprise pour l'authentification centralisée. Support SAML, OAuth, OpenID Connect et Active Directory." />
        <meta name="keywords" content="SSO, authentification, SAML, OAuth, entreprise, sécurité, Active Directory" />
      </Helmet>

      <EnterpriseSSO />
    </>
  )
}