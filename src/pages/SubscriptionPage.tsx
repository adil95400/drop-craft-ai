import React from 'react'
import { Helmet } from 'react-helmet-async'
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager'

const SubscriptionPage = () => {
  return (
    <>
      <Helmet>
        <title>Mon Abonnement - Gestion des plans</title>
        <meta name="description" content="Gérez votre abonnement et découvrez nos plans Premium" />
      </Helmet>

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Mon Abonnement</h1>
            <p className="text-muted-foreground">
              Gérez votre plan et découvrez les fonctionnalités premium
            </p>
          </div>

          <SubscriptionManager />
        </div>
      </div>
    </>
  )
}

export default SubscriptionPage