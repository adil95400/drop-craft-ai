import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { useBillingDetails } from '@/hooks/useBillingDetails'
import { useStripeSubscription, STRIPE_PRODUCTS } from '@/hooks/useStripeSubscription'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Download,
  Receipt,
  DollarSign,
  Calendar,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Crown,
  Settings,
} from 'lucide-react'

// Reverse map product IDs to display names
const PLAN_NAMES: Record<string, string> = {
  [STRIPE_PRODUCTS.standard]: 'Standard',
  [STRIPE_PRODUCTS.pro]: 'Pro',
  [STRIPE_PRODUCTS.ultra_pro]: 'Ultra Pro',
}

export default function BillingPage() {
  const { subscription, invoices, payment_methods, upcoming_invoice, loading, error, refresh } = useBillingDetails()
  const { openCustomerPortal } = useStripeSubscription()
  const navigate = useNavigate()

  const planName = subscription ? (PLAN_NAMES[subscription.plan_name] || subscription.plan_name) : 'Free'
  const hasSubscription = !!subscription && subscription.status === 'active'

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    paid: { label: 'Payée', variant: 'default' },
    open: { label: 'En attente', variant: 'secondary' },
    void: { label: 'Annulée', variant: 'outline' },
    draft: { label: 'Brouillon', variant: 'outline' },
    uncollectible: { label: 'Impayée', variant: 'destructive' },
  }

  if (loading) {
    return (
      <ChannablePageWrapper
        title="Facturation & Paiements"
        subtitle="Abonnement"
        description="Chargement de vos informations de facturation..."
        heroImage="settings"
        badge={{ label: 'Facturation', icon: CreditCard }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </ChannablePageWrapper>
    )
  }

  return (
    <ChannablePageWrapper
      title="Facturation & Paiements"
      subtitle="Abonnement"
      description="Gérez votre abonnement, vos méthodes de paiement et consultez vos factures."
      heroImage="settings"
      badge={{ label: `Plan ${planName}`, icon: CreditCard }}
    >
      {/* Error banner */}
      {error && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">
              <RefreshCw className="w-4 h-4 mr-1" /> Réessayer
            </Button>
          </div>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Plan actuel</p>
              <p className="text-lg sm:text-2xl font-bold">{planName}</p>
              {subscription?.cancel_at_period_end && (
                <p className="text-xs text-destructive">Annulation prévue</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-green-500/10">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {subscription?.interval === 'year' ? 'Coût annuel' : 'Coût mensuel'}
              </p>
              <p className="text-lg sm:text-2xl font-bold">
                {hasSubscription ? `€${subscription!.amount.toFixed(2)}` : '—'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Prochain prélèvement</p>
              <p className="text-base sm:text-lg font-bold">
                {upcoming_invoice?.next_payment_date
                  ? new Date(upcoming_invoice.next_payment_date).toLocaleDateString('fr-FR')
                  : hasSubscription
                    ? new Date(subscription!.current_period_end).toLocaleDateString('fr-FR')
                    : '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="plan" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full sm:w-auto">
            <TabsTrigger value="plan" className="text-xs sm:text-sm px-3 py-2">
              <span className="hidden sm:inline">Plan actuel</span>
              <span className="sm:hidden">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-xs sm:text-sm px-3 py-2">
              <span className="hidden sm:inline">Méthodes de paiement</span>
              <span className="sm:hidden">Paiement</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs sm:text-sm px-3 py-2">
              Factures ({invoices?.length || 0})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Plan Tab */}
        <TabsContent value="plan" className="space-y-4">
          <Card className="p-4 sm:p-6">
            {hasSubscription ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1">Plan {planName}</h2>
                    <p className="text-sm text-muted-foreground">
                      Actif depuis le {new Date(subscription!.current_period_start).toLocaleDateString('fr-FR')}
                    </p>
                    {subscription!.cancel_at_period_end && (
                      <p className="text-sm text-destructive mt-1">
                        ⚠️ Annulation prévue le {new Date(subscription!.current_period_end).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl sm:text-3xl font-bold">€{subscription!.amount.toFixed(2)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      par {subscription!.interval === 'year' ? 'an' : 'mois'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button variant="outline" className="flex-1 text-sm" onClick={() => navigate('/choose-plan')}>
                    <Crown className="w-4 h-4 mr-2" />
                    Changer de plan
                  </Button>
                  <Button variant="outline" className="flex-1 text-sm" onClick={openCustomerPortal}>
                    <Settings className="w-4 h-4 mr-2" />
                    Gérer l'abonnement
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun abonnement actif</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choisissez un plan pour débloquer les fonctionnalités premium.
                </p>
                <Button onClick={() => navigate('/choose-plan')}>
                  <Crown className="w-4 h-4 mr-2" />
                  Voir les plans
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Méthodes de paiement</h2>
              <Button size="sm" className="w-full sm:w-auto" onClick={openCustomerPortal}>
                <CreditCard className="w-4 h-4 mr-2" />
                Gérer via Stripe
              </Button>
            </div>

            {payment_methods && payment_methods.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {payment_methods.map((method) => (
                  <Card key={method.id} className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm sm:text-base font-semibold capitalize">
                              {method.brand || method.type} •••• {method.last4 || '****'}
                            </p>
                            {method.is_default && (
                              <Badge variant="secondary" className="text-xs">Par défaut</Badge>
                            )}
                          </div>
                          {method.exp_month && method.exp_year && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Expire {String(method.exp_month).padStart(2, '0')}/{method.exp_year}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune méthode de paiement enregistrée</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Historique des factures</h2>

            {invoices && invoices.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {invoices.map((invoice) => {
                  const st = statusLabels[invoice.status || 'paid'] || statusLabels.paid
                  return (
                    <div
                      key={invoice.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                          <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-semibold">
                            {invoice.number || invoice.id.slice(0, 16)}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(invoice.created).toLocaleDateString('fr-FR')}
                          </p>
                          {invoice.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {invoice.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 ml-auto">
                        <div className="text-left sm:text-right">
                          <p className="text-sm sm:text-base font-semibold">
                            €{invoice.amount.toFixed(2)}
                          </p>
                          <Badge variant={st.variant} className="text-xs">
                            {st.label}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          {invoice.invoice_pdf && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => window.open(invoice.invoice_pdf!, '_blank')}
                            >
                              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          )}
                          {invoice.hosted_invoice_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune facture disponible</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
