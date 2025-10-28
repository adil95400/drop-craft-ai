import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfitCalculator } from '@/components/profit/ProfitCalculator';
import { ProfitHistory } from '@/components/profit/ProfitHistory';
import { ProfitConfiguration } from '@/components/profit/ProfitConfiguration';
import { Calculator, History, Settings } from 'lucide-react';

export default function ProfitCalculatorPage() {
  return (
    <>
      <Helmet>
        <title>Calculateur de Profit - Analyse & Optimisation IA</title>
        <meta name="description" content="Calculez vos marges et optimisez vos prix avec l'intelligence artificielle" />
      </Helmet>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Smart Profit Calculator</h1>
            <p className="text-muted-foreground mt-2">
              Calculez vos marges en temps réel et optimisez vos prix avec l'IA
            </p>
          </div>

          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-xl">
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calculateur
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historique
              </TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="mt-6">
              <ProfitCalculator />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <Card className="p-6">
                <ProfitHistory />
              </Card>
            </TabsContent>

            <TabsContent value="config" className="mt-6">
              <Card className="p-6">
                <ProfitConfiguration />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
