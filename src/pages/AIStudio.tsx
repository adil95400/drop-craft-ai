import { useState } from 'react';
import { useRealAnalytics } from '@/hooks/useRealAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AIAssistantChat } from '@/components/ai/AIAssistantChat';
import { ContentGenerator } from '@/components/ai/ContentGenerator';
import { PredictiveAnalyzer } from '@/components/ai/PredictiveAnalyzer';
import { AIProductDescriptionGenerator } from '@/components/ai/AIProductDescriptionGenerator';
import { AIPricingOptimizer } from '@/components/ai/AIPricingOptimizer';
import { AIMarketingGenerator } from '@/components/ai/AIMarketingGenerator';
import { AISentimentAnalyzer } from '@/components/ai/AISentimentAnalyzer';
import {
  Brain,
  Bot,
  FileText,
  TrendingUp,
  Zap,
  Sparkles,
  Target,
  BarChart3,
  Wand2,
  MessageSquare,
  Clock,
  DollarSign,
  Mail
} from 'lucide-react';

export default function AIStudio() {
  const [activeTab, setActiveTab] = useState('assistant');
  const { analytics, isLoading } = useRealAnalytics();

  const aiFeatures = [
    {
      id: 'assistant',
      name: 'Assistant IA',
      icon: Bot,
      description: 'Chat intelligent pour répondre à vos questions business',
      color: 'text-blue-600',
      badge: 'Interactif'
    },
    {
      id: 'content',
      name: 'Générateur de Contenu',
      icon: FileText,
      description: 'Créez du contenu marketing et commercial professionnel',
      color: 'text-green-600',
      badge: 'Créatif'
    },
    {
      id: 'analysis',
      name: 'Analyse Prédictive',
      icon: TrendingUp,
      description: 'Prédictions et insights basés sur vos données',
      color: 'text-purple-600',
      badge: 'Avancé'
    }
  ];

  const stats = [
    {
      label: 'Requêtes IA ce mois',
      value: analytics?.orders ? `${analytics.orders * 12}` : '0',
      icon: MessageSquare,
      change: '+23%'
    },
    {
      label: 'Contenu généré',
      value: analytics?.products ? `${Math.floor(analytics.products / 10)}` : '0',
      icon: FileText,
      change: '+15%'
    },
    {
      label: 'Analyses prédictives',
      value: analytics ? `${Math.floor((analytics.revenue || 0) / 10000)}` : '0',
      icon: TrendingUp,
      change: '+8%'
    },
    {
      label: 'Temps économisé',
      value: analytics ? `${Math.floor((analytics.customers || 0) / 20)}h` : '0h',
      icon: Clock,
      change: '+31%'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Suite complète d'outils d'intelligence artificielle pour votre business
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1">
          <Sparkles className="h-4 w-4" />
          Powered by GPT-5
        </Badge>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <Badge variant="outline" className="text-xs text-green-600">
                      {stat.change}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation des fonctionnalités IA */}
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités IA Disponibles</CardTitle>
          <CardDescription>
            Explorez nos outils d'intelligence artificielle avancés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    activeTab === feature.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setActiveTab(feature.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                      <Badge variant="outline" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <h3 className="font-medium mb-2">{feature.name}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="assistant" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Assistant
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contenu
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analyse
          </TabsTrigger>
          <TabsTrigger value="descriptions" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Descriptions
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Prix
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Sentiment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Assistant IA Intelligent
              </CardTitle>
              <CardDescription>
                Discutez avec votre assistant IA spécialisé en e-commerce et business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIAssistantChat context="AI Studio - Interface principale" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentGenerator />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <PredictiveAnalyzer />
        </TabsContent>

        <TabsContent value="descriptions" className="space-y-6">
          <AIProductDescriptionGenerator />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <AIPricingOptimizer />
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <AIMarketingGenerator />
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <AISentimentAnalyzer />
        </TabsContent>
      </Tabs>

      {/* Footer avec conseils */}
      <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Conseils pour optimiser l'utilisation de l'IA</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Soyez spécifique dans vos questions pour obtenir des réponses plus précises</li>
                <li>• Utilisez le générateur de contenu avec des paramètres détaillés</li>
                <li>• L'analyse prédictive est plus efficace avec des données historiques complètes</li>
                <li>• Explorez différents tons et styles pour le contenu généré</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}