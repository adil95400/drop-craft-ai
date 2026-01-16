import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIProductDescriptionGenerator } from '@/components/ai-automation/AIProductDescriptionGenerator';
import { AIPriceOptimizer } from '@/components/ai-automation/AIPriceOptimizer';
import { AIMarketingGenerator } from '@/components/ai-automation/AIMarketingGenerator';
import { AISentimentAnalyzer } from '@/components/ai-automation/AISentimentAnalyzer';
import { AIChatbotSupport } from '@/components/ai-automation/AIChatbotSupport';
import { Brain, FileText, DollarSign, MessageSquare, BarChart3, Sparkles, Zap, Target } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon 
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: any
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  </motion.div>
)

export default function AIAutomationHub() {
  return (
    <>
      <Helmet>
        <title>Hub d'Automatisation IA - E-commerce Intelligence</title>
        <meta name="description" content="Automatisez vos tâches e-commerce avec l'IA : descriptions produits, optimisation des prix, analyse de sentiment" />
      </Helmet>
      
      <ChannablePageWrapper
        title="Hub d'Automatisation IA"
        subtitle="Automatisez vos tâches e-commerce avec l'intelligence artificielle"
        heroImage="ai"
      >
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Contenus Générés"
            value="2,456"
            subtitle="Ce mois"
            icon={FileText}
          />
          <StatCard
            title="Optimisations IA"
            value="892"
            subtitle="Produits améliorés"
            icon={Sparkles}
          />
          <StatCard
            title="Temps Économisé"
            value="124h"
            subtitle="Automatisation active"
            icon={Zap}
          />
          <StatCard
            title="Taux de Succès"
            value="94.5%"
            subtitle="Qualité des résultats"
            icon={Target}
          />
        </div>

        <Tabs defaultValue="descriptions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="descriptions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Descriptions</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Prix</span>
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Marketing</span>
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Sentiment</span>
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Chatbot</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="descriptions" className="space-y-4">
            <AIProductDescriptionGenerator />
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <AIPriceOptimizer />
          </TabsContent>

          <TabsContent value="marketing" className="space-y-4">
            <AIMarketingGenerator />
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <AISentimentAnalyzer />
          </TabsContent>

          <TabsContent value="chatbot" className="space-y-4">
            <AIChatbotSupport />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
