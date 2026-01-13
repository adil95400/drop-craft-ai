/**
 * Page Gestion des Retours - Style Channable
 * Gérez les retours clients et suivez les RMA
 */

import { ReturnsDashboard } from "@/components/returns/ReturnsDashboard"
import { EnhancedReturnFlowWrapper } from "@/components/returns/EnhancedReturnFlowWrapper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutDashboard, ArrowLeftRight, Package, RefreshCw, AlertCircle, TrendingDown } from "lucide-react"
import { 
  ChannablePageLayout,
  ChannableHeroSection,
  ChannableStatsGrid,
  ChannableQuickActions
} from '@/components/channable'
import { ChannableStat, ChannableQuickAction } from '@/components/channable/types'
import { useToast } from '@/hooks/use-toast'
import { useState } from "react"

const Returns = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Demo stats - in real app, fetch from database
  const stats: ChannableStat[] = [
    {
      label: 'Retours en cours',
      value: '12',
      icon: Package,
      color: 'primary',
      changeLabel: 'à traiter'
    },
    {
      label: 'En attente',
      value: '5',
      icon: AlertCircle,
      color: 'warning',
      changeLabel: 'validation requise'
    },
    {
      label: 'Remboursés',
      value: '23',
      icon: TrendingDown,
      color: 'success',
      change: 8,
      trend: 'up',
      changeLabel: 'ce mois'
    },
    {
      label: 'Taux de retour',
      value: '2.3%',
      icon: ArrowLeftRight,
      color: 'info',
      changeLabel: 'moyenne secteur: 3%'
    }
  ]

  const quickActions: ChannableQuickAction[] = [
    {
      id: 'new-return',
      label: 'Nouveau retour',
      icon: Package,
      onClick: () => setActiveTab('flow'),
      variant: 'primary'
    },
    {
      id: 'refresh',
      label: 'Actualiser',
      icon: RefreshCw,
      onClick: () => toast({ title: 'Données actualisées' }),
      description: 'Sync'
    }
  ]

  return (
    <ChannablePageLayout
      title="Gestion des Retours"
      metaTitle="Retours & RMA"
      metaDescription="Gérez vos retours clients et suivez les RMA"
    >
      {/* Hero Section */}
      <ChannableHeroSection
        title="Gestion des Retours"
        subtitle="RMA & Remboursements"
        description="Gérez les retours clients, suivez les RMA et automatisez le processus de remboursement."
        badge={{
          label: '12 retours actifs',
          icon: Package
        }}
        primaryAction={{
          label: 'Nouveau retour',
          onClick: () => setActiveTab('flow'),
          icon: Package
        }}
        secondaryAction={{
          label: 'Actualiser',
          onClick: () => toast({ title: 'Données actualisées' })
        }}
        variant="compact"
      />

      {/* Stats Grid */}
      <ChannableStatsGrid stats={stats} columns={4} compact />

      {/* Quick Actions */}
      <ChannableQuickActions actions={quickActions} variant="compact" />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md bg-muted/50">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Flux RMA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <ReturnsDashboard />
        </TabsContent>

        <TabsContent value="flow" className="mt-6">
          <EnhancedReturnFlowWrapper />
        </TabsContent>
      </Tabs>
    </ChannablePageLayout>
  )
}

export default Returns
