import React from 'react'
import { Helmet } from 'react-helmet-async'
import { CurrentSubscription } from '@/components/subscription/CurrentSubscription'
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans'
import { PaymentHistory } from '@/components/subscription/PaymentHistory'

const SubscriptionPage = () => {
  return (
    <>
      <Helmet>
        <title>Mon Abonnement - Gestion des plans</title>
        <meta name="description" content="Gérez votre abonnement et découvrez nos plans Premium" />
      </Helmet>

      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Abonnements</h1>
            <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins
            </p>
          </div>

          {/* Current Subscription */}
          <div className="max-w-2xl mx-auto">
            <CurrentSubscription />
          </div>

          {/* Plans */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Nos plans</h2>
            <SubscriptionPlans />
          </div>

          {/* Payment History */}
          <div className="max-w-4xl mx-auto">
            <PaymentHistory />
          </div>
        </div>
      </div>
    </>
  )
}

export default SubscriptionPage