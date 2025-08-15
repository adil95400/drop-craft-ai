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
          <SmartDashboard metrics={{
            totalUsers: 0,
            activeUsers: 0,
            revenue: 0,
            growth: 0
          }} />
        ) : (
          <ProductionDashboard />
        )}
      </div>
    </div>
  )
}