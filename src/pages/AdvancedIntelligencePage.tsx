import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  Zap,
  BarChart3,
  Shield
} from 'lucide-react';
import { SalesIntelligenceDashboard } from '@/components/intelligence/SalesIntelligenceDashboard';
import { BehaviorAnalysisDashboard } from '@/components/customer-intelligence/BehaviorAnalysisDashboard';
import { EnhancedPlanGuard } from '@/components/plan/EnhancedPlanGuard';

export default function AdvancedIntelligencePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Intelligence Avancée
              </h1>
              <p className="text-muted-foreground">
                IA prédictive pour les ventes, comportement client et intelligence marketing
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              <Zap className="w-3 h-3 mr-1" />
              Phase 3: Marketing & Sales Intelligence
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prédictions Ventes</p>
                    <p className="font-semibold">IA Prédictive</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Comportement Client</p>
                    <p className="font-semibold">Segmentation IA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Marketing Intelligence</p>
                    <p className="font-semibold">ROI & Attribution</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Intelligence Compétitive</p>
                    <p className="font-semibold">Veille Marché</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <EnhancedPlanGuard
          requiredPlan="ultra_pro"
          feature="advanced-intelligence"
          showUpgradeCard={true}
        >
          <Tabs defaultValue="sales-intelligence" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sales-intelligence" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Intelligence Ventes
              </TabsTrigger>
              <TabsTrigger value="customer-behavior" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Comportement Client
              </TabsTrigger>
              <TabsTrigger value="marketing-intelligence" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Intelligence Marketing
              </TabsTrigger>
              <TabsTrigger value="competitive-intelligence" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Intelligence Compétitive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sales-intelligence">
              <SalesIntelligenceDashboard />
            </TabsContent>

            <TabsContent value="customer-behavior">
              <BehaviorAnalysisDashboard />
            </TabsContent>

            <TabsContent value="marketing-intelligence">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Intelligence Marketing (En développement)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Attribution Multi-Touch & ROI Analysis</h3>
                    <p className="text-muted-foreground mb-4">
                      Analyse avancée des performances marketing avec attribution des conversions et optimisation ROI.
                    </p>
                    <Badge variant="outline">Bientôt disponible</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="competitive-intelligence">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Intelligence Compétitive (En développement)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Veille Concurrentielle & Gap Analysis</h3>
                    <p className="text-muted-foreground mb-4">
                      Surveillance automatique des concurrents, analyse des prix et identification des opportunités de marché.
                    </p>
                    <Badge variant="outline">Bientôt disponible</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </EnhancedPlanGuard>
      </div>
    </div>
  );
}