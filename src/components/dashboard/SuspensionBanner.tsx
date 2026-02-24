import { AlertTriangle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { useStripeSubscription } from '@/hooks/useStripeSubscription'

export function SuspensionBanner() {
  const { subscriptionStatus, isSuspended } = useUnifiedPlan()
  const { openCustomerPortal } = useStripeSubscription()

  if (!isSuspended()) return null

  const isPastDue = subscriptionStatus === 'past_due'

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        <div>
          <p className="font-semibold text-destructive">
            {isPastDue ? 'Paiement en retard' : 'Abonnement annulé'}
          </p>
          <p className="text-sm text-muted-foreground">
            {isPastDue
              ? 'Votre dernier paiement a échoué. Vos fonctionnalités premium sont suspendues.'
              : 'Votre abonnement a été annulé. Vous êtes repassé au plan gratuit.'}
          </p>
        </div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        className="shrink-0 gap-2"
        onClick={openCustomerPortal}
      >
        <CreditCard className="h-4 w-4" />
        {isPastDue ? 'Mettre à jour le paiement' : 'Réactiver'}
      </Button>
    </div>
  )
}
