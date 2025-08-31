import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  TrendingUp, 
  Package, 
  Brain,
  Zap,
  Settings
} from 'lucide-react';
import { AutomationDashboard } from '@/components/automation/AutomationDashboard';
import { DynamicPricingDashboard } from '@/components/automation/DynamicPricingDashboard';
import { SmartInventoryDashboard } from '@/components/automation/SmartInventoryDashboard';
import { BusinessIntelligenceDashboard } from '@/components/automation/BusinessIntelligenceDashboard';
import { EnhancedPlanGuard } from '@/components/plan/EnhancedPlanGuard';
import { Helmet } from 'react-helmet-async';

export default function AutomationOptimizationPage() {
  return (
    <>
      <Helmet>
        <title>Automation & IA Business Optimization - Phase 4</title>
        <meta name="description" content="Automation intelligente et optimisation IA pour votre e-commerce avec prix dynamiques, gestion de stock et intelligence d'affaires prédictive" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Automation & Optimisation IA
                </h1>
                <p className="text-muted-foreground">
                  Intelligence artificielle pour l'automatisation business et l'optimisation continue
                </p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                <Zap className="w-3 h-3 mr-1" />
                Phase 4: Automation & AI Optimization
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Bot className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Automation IA</p>
                      <p className="font-semibold">Règles Intelligentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Prix Dynamiques</p>
                      <p className="font-semibold">Optimisation Auto</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Stock Intelligent</p>
                      <p className="font-semibold">Prédictions IA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Brain className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Business Intelligence</p>
                      <p className="font-semibold">Insights Prédictifs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <EnhancedPlanGuard
            requiredPlan="ultra_pro"
            feature="automation-optimization"
            showUpgradeCard={true}
          >
            <Tabs defaultValue="automation" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="automation" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Automation IA
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Prix Dynamiques
                </TabsTrigger>
                <TabsTrigger value="inventory" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Stock Intelligent
                </TabsTrigger>
                <TabsTrigger value="intelligence" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Business Intelligence
                </TabsTrigger>
              </TabsList>

              <TabsContent value="automation">
                <AutomationDashboard />
              </TabsContent>

              <TabsContent value="pricing">
                <DynamicPricingDashboard />
              </TabsContent>

              <TabsContent value="inventory">
                <SmartInventoryDashboard />
              </TabsContent>

              <TabsContent value="intelligence">
                <BusinessIntelligenceDashboard />
              </TabsContent>
            </Tabs>
          </EnhancedPlanGuard>
        </div>
      </div>
    </>
  );
}