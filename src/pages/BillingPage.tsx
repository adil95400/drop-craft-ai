import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Download,
  Receipt,
  DollarSign,
  TrendingUp,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BillingPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const currentPlan = {
    name: 'Pro',
    price: 99,
    billingCycle: 'monthly',
    nextBillingDate: '2025-02-15',
  }

  const invoices = [
    { id: '1', number: 'INV-2025-001', date: '2025-01-15', amount: 99.0, status: 'paid' },
    { id: '2', number: 'INV-2024-012', date: '2024-12-15', amount: 99.0, status: 'paid' },
  ]

  const paymentMethods = [
    { id: '1', type: 'card', last4: '4242', brand: 'Visa', expiryMonth: 12, expiryYear: 2025, isDefault: true },
  ]

  const statsCards = [
    { label: 'Current Plan', value: currentPlan.name, icon: CreditCard, color: 'text-primary', bgColor: 'bg-primary/10', tab: 'plan' },
    { label: 'Monthly Cost', value: `€${currentPlan.price}`, icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-500/10', tab: 'plan' },
    { label: 'Next Billing', value: new Date(currentPlan.nextBillingDate).toLocaleDateString(), icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-500/10', tab: 'invoices' },
  ]

  const [activeTab, setActiveTab] = useState('plan')

  const handleChangePlan = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      { loading: 'Chargement des plans...', success: 'Plans disponibles affichés', error: 'Erreur' }
    )
  }

  const handleCancelSubscription = () => {
    toast.error('Action annulée - Veuillez contacter le support pour annuler votre abonnement')
  }

  const handleAddPaymentMethod = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1000)),
      { loading: 'Ouverture du formulaire...', success: 'Formulaire de paiement ouvert', error: 'Erreur' }
    )
  }

  const handleDownloadInvoice = (invoiceNumber: string) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 800)),
      { loading: `Téléchargement de ${invoiceNumber}...`, success: `${invoiceNumber} téléchargée`, error: 'Erreur' }
    )
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast.success('Données de facturation actualisées')
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Billing & Payments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your subscription and payment methods
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards - Clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 sm:p-6">
              <Skeleton className="h-6 w-6 mb-2" />
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))
        ) : (
          statsCards.map((stat, idx) => (
            <Card 
              key={idx} 
              className="p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              onClick={() => setActiveTab(stat.tab)}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={cn("p-2 sm:p-3 rounded-lg", stat.bgColor)}>
                  <stat.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", stat.color)} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full sm:w-auto">
            <TabsTrigger value="plan" className="text-xs sm:text-sm px-3 py-2">
              <span className="hidden sm:inline">Current Plan</span>
              <span className="sm:hidden">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-xs sm:text-sm px-3 py-2">
              <span className="hidden sm:inline">Payment Methods</span>
              <span className="sm:hidden">Payment</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs sm:text-sm px-3 py-2">Invoices</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="plan" className="space-y-4">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{currentPlan.name} Plan</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Full access to all features and integrations
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl sm:text-3xl font-bold">€{currentPlan.price}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">per month</p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {['Unlimited products', 'Advanced analytics', 'Priority support', 'API access'].map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" className="flex-1 text-sm" onClick={handleChangePlan}>
                Change Plan
              </Button>
              <Button variant="destructive" className="flex-1 text-sm" onClick={handleCancelSubscription}>
                Cancel Subscription
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Payment Methods</h2>
              <Button size="sm" className="w-full sm:w-auto" onClick={handleAddPaymentMethod}>
                <CreditCard className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm sm:text-base font-semibold">
                            {method.brand} •••• {method.last4}
                          </p>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-auto sm:ml-0">
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => toast.info('Édition de la carte...')}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => toast.error('Impossible de supprimer la carte par défaut')}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Invoice History</h2>
            <div className="space-y-3 sm:space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                      <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold">{invoice.number}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 ml-auto">
                    <div className="text-left sm:text-right">
                      <p className="text-sm sm:text-base font-semibold">€{invoice.amount.toFixed(2)}</p>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleDownloadInvoice(invoice.number)}
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden xs:inline">Download</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
