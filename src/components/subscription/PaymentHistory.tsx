import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'
import { Download, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface Invoice {
  id: string
  amount_paid: number
  currency: string
  status: string
  created: number
  invoice_pdf: string | null
  hosted_invoice_url: string | null
}

export function PaymentHistory() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const locale = useDateFnsLocale()

  useEffect(() => {
    if (user) {
      fetchInvoices()
    }
  }, [user])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      
      // Call Stripe to get invoices
      const { data, error } = await supabase.functions.invoke('get-invoices')
      
      if (error) throw error
      
      setInvoices(data?.invoices || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer l'historique des paiements",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'open':
        return <Clock className="h-5 w-5 text-warning" />
      default:
        return <XCircle className="h-5 w-5 text-destructive" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payé'
      case 'open':
        return 'En attente'
      case 'void':
        return 'Annulé'
      case 'uncollectible':
        return 'Impayé'
      default:
        return status
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
          <p className="text-sm text-muted-foreground">
            Vos factures apparaîtront ici après votre premier paiement
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5" />
        Historique des paiements
      </h3>
      
      <div className="space-y-4">
        {invoices.map((invoice) => (
          <div 
            key={invoice.id} 
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              {getStatusIcon(invoice.status)}
              <div>
                <p className="font-medium">
                  {formatAmount(invoice.amount_paid, invoice.currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(invoice.created * 1000), 'dd MMMM yyyy', { locale })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-sm px-2 py-1 rounded ${
                invoice.status === 'paid' 
                  ? 'bg-success/10 text-success' 
                  : 'bg-warning/10 text-warning'
              }`}>
                {getStatusText(invoice.status)}
              </span>
              
              {invoice.invoice_pdf && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a 
                    href={invoice.invoice_pdf} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
