import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  Download,
  Receipt,
  DollarSign,
  TrendingUp,
  Calendar,
} from 'lucide-react'

export default function BillingPage() {
  const currentPlan = {
    name: 'Pro',
    price: 99,
    billingCycle: 'monthly',
    nextBillingDate: '2025-02-15',
  }

  const invoices = [
    {
      id: '1',
      number: 'INV-2025-001',
      date: '2025-01-15',
      amount: 99.0,
      status: 'paid',
    },
    {
      id: '2',
      number: 'INV-2024-012',
      date: '2024-12-15',
      amount: 99.0,
      status: 'paid',
    },
  ]

  const paymentMethods = [
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
  ]

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Billing & Payments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your subscription and payment methods
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Current Plan</p>
              <p className="text-lg sm:text-2xl font-bold">{currentPlan.name}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-green-500/10">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Monthly Cost</p>
              <p className="text-lg sm:text-2xl font-bold">€{currentPlan.price}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Next Billing</p>
              <p className="text-base sm:text-lg font-bold">
                {new Date(currentPlan.nextBillingDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="plan" className="space-y-4 sm:space-y-6">
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
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm sm:text-base">Unlimited products</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm sm:text-base">Advanced analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm sm:text-base">Priority support</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm sm:text-base">API access</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" className="flex-1 text-sm">
                Change Plan
              </Button>
              <Button variant="destructive" className="flex-1 text-sm">
                Cancel Subscription
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Payment Methods</h2>
              <Button size="sm" className="w-full sm:w-auto">
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
                      <Button variant="outline" size="sm" className="text-xs">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs">
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
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg bg-muted/50"
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
                      <Badge
                        variant={
                          invoice.status === 'paid' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">
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
