/**
 * Page d'import unifiée qui remplace ImportUltraPro et autres versions
 * Utilise le système de plans unifié pour afficher les bonnes fonctionnalités
 */

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Zap, Upload, BarChart3, Settings, Brain, Layers, Activity } from 'lucide-react'

import { UnifiedFeatureGate, ProFeature, UltraProFeature } from '@/components/unified/UnifiedFeatureGate'
import { useAuthWithPlan } from '@/components/unified/UnifiedProvider'
import { usePlanConditionalRender } from '@/components/unified/UnifiedComponent'

// Import des composants existants (à unifier progressivement)
import { ImportUltraProInterface } from '@/components/import/ImportUltraProInterface'
import { AdvancedImportResults } from '@/components/import/AdvancedImportResults'
import { AIImportUltraPro } from '@/components/import/AIImportUltraPro'
import { BulkImportUltraPro } from '@/components/import/BulkImportUltraPro'
import { RealTimeMonitoring } from '@/components/import/RealTimeMonitoring'
import { AdvancedMapping } from '@/components/import/AdvancedMapping'
import { ImportAnalytics } from '@/components/import/ImportAnalytics'
import { AutomationRules } from '@/components/import/AutomationRules'

export default function UnifiedImport() {
  const { effectivePlan, hasFeature, isPro, isUltraPro, loading } = useAuthWithPlan()
  const { renderByPlan } = usePlanConditionalRender()
  const [activeTab, setActiveTab] = useState('import')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const planBadge = renderByPlan({
    standard: <Badge variant="outline">Standard</Badge>,
    pro: <Badge variant="default" className="bg-blue-600"><Zap className="w-3 h-3 mr-1" />Pro</Badge>,
    ultra_pro: <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600"><Crown className="w-3 h-3 mr-1" />Ultra Pro</Badge>
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header unifié */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Import Produits</h1>
            {planBadge}
          </div>
          <p className="text-muted-foreground">
            {renderByPlan({
              standard: "Importez vos produits avec les outils de base",
              pro: "Import avancé avec IA et analytics",
              ultra_pro: "Suite complète d'import avec automatisation et monitoring temps réel"
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Tabs avec accès conditionnel */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </TabsTrigger>
          
          <TabsTrigger value="products">
            Produits 
          </TabsTrigger>
          
          <ProFeature>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              IA
            </TabsTrigger>
          </ProFeature>
          
          <UltraProFeature>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Bulk
            </TabsTrigger>
          </UltraProFeature>
          
          <UltraProFeature>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
          </UltraProFeature>
          
          <ProFeature>
            <TabsTrigger value="mapping">
              Mapping
            </TabsTrigger>
          </ProFeature>
          
          <ProFeature>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </ProFeature>
          
          <UltraProFeature>
            <TabsTrigger value="automation">
              Automation
            </TabsTrigger>
          </UltraProFeature>
        </TabsList>

        {/* Interface d'import de base */}
        <TabsContent value="import" className="space-y-4">
          {renderByPlan({
            standard: (
              <div className="p-6 border border-dashed rounded-lg text-center space-y-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Import Standard</h3>
                  <p className="text-muted-foreground">Interface basique d'import de produits</p>
                </div>
                <Button>Importer des produits</Button>
              </div>
            ),
            pro: <ImportUltraProInterface onImportComplete={() => setActiveTab('products')} />,
            ultra_pro: <ImportUltraProInterface onImportComplete={() => setActiveTab('products')} />
          })}
        </TabsContent>

        {/* Résultats produits */}
        <TabsContent value="products">
          <AdvancedImportResults />
        </TabsContent>

        {/* IA - Pro et Ultra Pro */}
        <TabsContent value="ai">
          <ProFeature>
            <AIImportUltraPro />
          </ProFeature>
        </TabsContent>

        {/* Bulk - Ultra Pro uniquement */}
        <TabsContent value="bulk">
          <UltraProFeature>
            <BulkImportUltraPro />
          </UltraProFeature>
        </TabsContent>

        {/* Monitoring temps réel - Ultra Pro */}
        <TabsContent value="monitoring">
          <UltraProFeature>
            <RealTimeMonitoring />
          </UltraProFeature>
        </TabsContent>

        {/* Mapping avancé - Pro et Ultra Pro */}
        <TabsContent value="mapping">
          <ProFeature>
            <AdvancedMapping />
          </ProFeature>
        </TabsContent>

        {/* Analytics - Pro et Ultra Pro */}
        <TabsContent value="analytics">
          <ProFeature>
            <ImportAnalytics />
          </ProFeature>
        </TabsContent>

        {/* Automation - Ultra Pro */}
        <TabsContent value="automation">
          <UltraProFeature>
            <AutomationRules />
          </UltraProFeature>
        </TabsContent>
      </Tabs>
    </div>
  )
}