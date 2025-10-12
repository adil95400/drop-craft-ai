import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIProductDescriptionGenerator } from '@/components/ai-automation/AIProductDescriptionGenerator';
import { AIPriceOptimizer } from '@/components/ai-automation/AIPriceOptimizer';
import { Brain, FileText, DollarSign, MessageSquare, BarChart3 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function AIAutomationHub() {
  return (
    <>
      <Helmet>
        <title>Hub d'Automatisation IA - E-commerce Intelligence</title>
        <meta name="description" content="Automatisez vos tâches e-commerce avec l'IA : descriptions produits, optimisation des prix, analyse de sentiment" />
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Brain className="h-10 w-10 text-primary" />
            Hub d'Automatisation IA
          </h1>
          <p className="text-muted-foreground text-lg">
            Automatisez vos tâches e-commerce avec l'intelligence artificielle OpenAI
          </p>
        </div>

        <Tabs defaultValue="descriptions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="descriptions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descriptions
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Prix
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Marketing
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Sentiment
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Chatbot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="descriptions" className="space-y-4">
            <AIProductDescriptionGenerator />
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <AIPriceOptimizer />
          </TabsContent>

          <TabsContent value="marketing" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              Générateur de contenu marketing - À venir
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              Analyse de sentiment des avis - À venir
            </div>
          </TabsContent>

          <TabsContent value="chatbot" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              Chatbot intelligent support client - À venir
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
