import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface AnalyticsData {
  revenue: {
    total: number
    monthly: Array<{ month: string; amount: number }>
    growth: number
  }
  orders: {
    total: number
    monthly: Array<{ month: string; count: number }>
    growth: number
  }
  customers: {
    total: number
    active: number
    growth: number
  }
  products: {
    total: number
    active: number
    topSelling: Array<{ name: string; sales: number; revenue: number }>
  }
  traffic: {
    sources: Array<{ source: string; visitors: number; conversions: number }>
    conversion: number
  }
}

export const useAnalytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    revenue: {
      total: 47293,
      monthly: [
        { month: 'Jan', amount: 3500 },
        { month: 'Fév', amount: 4200 },
        { month: 'Mar', amount: 3800 },
        { month: 'Avr', amount: 5100 },
        { month: 'Mai', amount: 4700 },
        { month: 'Juin', amount: 6200 }
      ],
      growth: 12.5
    },
    orders: {
      total: 1847,
      monthly: [
        { month: 'Jan', count: 145 },
        { month: 'Fév', count: 168 },
        { month: 'Mar', count: 152 },
        { month: 'Avr', count: 201 },
        { month: 'Mai', count: 189 },
        { month: 'Juin', count: 234 }
      ],
      growth: 8.2
    },
    customers: {
      total: 892,
      active: 634,
      growth: 23.1
    },
    products: {
      total: 2341,
      active: 1876,
      topSelling: [
        { name: 'Montre Connectée Pro', sales: 234, revenue: 12450 },
        { name: 'Écouteurs Bluetooth', sales: 189, revenue: 8920 },
        { name: 'Chargeur Sans Fil', sales: 156, revenue: 6780 },
        { name: 'Coque iPhone Premium', sales: 143, revenue: 4290 },
        { name: 'Support Téléphone Auto', sales: 98, revenue: 2940 }
      ]
    },
    traffic: {
      sources: [
        { source: 'Google Ads', visitors: 1250, conversions: 45 },
        { source: 'Facebook Ads', visitors: 890, conversions: 32 },
        { source: 'Organique', visitors: 650, conversions: 28 },
        { source: 'Email', visitors: 340, conversions: 15 },
        { source: 'Direct', visitors: 280, conversions: 12 }
      ],
      conversion: 3.2
    }
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const refreshData = () => {
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Données actualisées",
        description: "Les analytics ont été mis à jour",
      })
    }, 2000)
  }

  const exportData = (format: 'csv' | 'pdf' | 'excel') => {
    toast({
      title: "Export démarré",
      description: `Génération du fichier ${format.toUpperCase()}...`,
    })
    
    setTimeout(() => {
      toast({
        title: "Export terminé",
        description: `Le fichier ${format.toUpperCase()} a été téléchargé`,
      })
    }, 3000)
  }

  const applyFilters = (filters: { dateRange: string; products: string[]; sources: string[] }) => {
    toast({
      title: "Filtres appliqués",
      description: "Données filtrées selon vos critères",
    })
    
    // Simulate filtered data loading
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }

  return {
    data,
    loading,
    refreshData,
    exportData,
    applyFilters
  }
}