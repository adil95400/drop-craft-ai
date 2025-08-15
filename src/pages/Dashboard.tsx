import React, { useState } from 'react'
import { usePlan } from '@/contexts/PlanContext'
import { ProductionDashboard } from '@/components/dashboard/ProductionDashboard'
import { SmartDashboard } from '@/components/common/SmartDashboard'
import { AIInsightsModal } from '@/components/dashboard/AIInsightsModal'

export default function Dashboard() {
  const { isUltraPro, hasFeature } = usePlan()
  const [aiModalOpen, setAiModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      {/* Header avec indicateur de plan */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Dashboard {isUltraPro && <span className="text-primary">Ultra Pro</span>}
              </h1>
              <p className="text-muted-foreground mt-1">
                Vue d'ensemble de votre activité
              </p>
            </div>
            {hasFeature('ai-analysis') && (
              <AIInsightsModal 
                open={aiModalOpen} 
                onOpenChange={setAiModalOpen} 
              />
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {hasFeature('ai_insights') && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Insights IA</h2>
            <p className="text-muted-foreground">Analyses prédictives avancées disponibles.</p>
          </div>
        )}
        
        {/* Composant unifié avec feature flags */}
        {hasFeature('predictive-analytics') ? (
          <SmartDashboard 
            metrics={[
              {
                id: 'users',
                title: 'Utilisateurs Actifs',
                value: '1,234',
                change: { value: 12, type: 'increase', period: 'Ce mois' },
                status: 'success'
              },
              {
                id: 'revenue',
                title: 'Chiffre d\'Affaires',
                value: '€45,678',
                change: { value: 8.5, type: 'increase', period: 'Ce mois' },
                status: 'success'
              },
              {
                id: 'orders',
                title: 'Commandes',
                value: '156',
                change: { value: 3.2, type: 'increase', period: 'Cette semaine' },
                status: 'success'
              },
              {
                id: 'conversion',
                title: 'Taux de Conversion',
                value: '2.8%',
                change: { value: 0.5, type: 'decrease', period: 'Ce mois' },
                status: 'warning'
              }
            ]} 
          />
        ) : (
          <ProductionDashboard />
        )}
      </div>
    </div>
  )
}