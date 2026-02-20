import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface BillingInvoice {
  id: string
  number: string | null
  status: string | null
  amount: number
  currency: string
  created: string
  hosted_invoice_url: string | null
  invoice_pdf: string | null
  description: string | null
}

export interface BillingPaymentMethod {
  id: string
  type: string
  brand: string | null
  last4: string | null
  exp_month: number | null
  exp_year: number | null
  is_default: boolean
}

export interface BillingSubscription {
  id: string
  status: string
  plan_name: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at: string | null
  amount: number
  currency: string
  interval: string
}

export interface UpcomingInvoice {
  amount: number
  currency: string
  next_payment_date: string | null
}

export interface BillingDetails {
  subscription: BillingSubscription | null
  invoices: BillingInvoice[]
  payment_methods: BillingPaymentMethod[]
  upcoming_invoice: UpcomingInvoice | null
}

export function useBillingDetails() {
  const { user } = useAuth()
  const [data, setData] = useState<BillingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBilling = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      const { data: result, error: fnError } = await supabase.functions.invoke('billing-details')
      
      if (fnError) throw fnError
      setData(result as BillingDetails)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement'
      setError(msg)
      console.error('[useBillingDetails]', msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBilling()
  }, [user])

  return { ...data, loading, error, refresh: fetchBilling }
}
