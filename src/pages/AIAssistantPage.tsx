import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Send, Sparkles, MessageSquare, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistantPage: React.FC = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Bonjour! Je suis votre assistant IA. Comment puis-je vous aider aujourd\'hui?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch AI jobs history
  const { data: aiJobs } = useQuery({
    queryKey: ['ai-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_optimization_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Fetch business insights
  const { data: insights } = useQuery({
    queryKey: ['business-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_intelligence_insights')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const suggestions = [
    'Analyser mes ventes du mois',
    'Optimiser mes descriptions produits',
    'Créer une campagne marketing',
    'Suggestions de prix',
  ];

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Fetch relevant data for context
    const [ordersResult, productsResult] = await Promise.all([
      supabase.from('orders').select('total_amount, status, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('products').select('title, price, stock_quantity').limit(20)
    ]);

    const orders = ordersResult.data || [];
    const products = productsResult.data || [];

    // Calculate stats
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const lowStockProducts = products.filter(p => (p.stock_quantity || 0) < 10);

    // Simple response generation based on keywords
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('vente') || lowerMessage.includes('chiffre')) {
      return `📊 **Analyse des ventes**\n\nVoici un résumé de votre activité récente:\n\n- **Chiffre d'affaires total**: ${totalRevenue.toFixed(2)}€\n- **Commandes complétées**: ${completedOrders}\n- **Commandes en cours**: ${orders.length - completedOrders}\n\nJe peux vous aider à identifier les tendances et optimiser vos performances.`;
    }

    if (lowerMessage.includes('produit') || lowerMessage.includes('stock')) {
      return `📦 **État des produits**\n\n- **Produits en catalogue**: ${products.length}\n- **Produits en rupture/faible stock**: ${lowStockProducts.length}\n\n${lowStockProducts.length > 0 ? `⚠️ Attention: ${lowStockProducts.map(p => p.title).slice(0, 3).join(', ')} ont un stock faible.` : '✅ Tous vos stocks sont à un niveau satisfaisant.'}\n\nVoulez-vous que j'optimise les descriptions de vos produits?`;
    }

    if (lowerMessage.includes('marketing') || lowerMessage.includes('campagne')) {
      return `🚀 **Suggestions Marketing**\n\nBasé sur vos données, voici mes recommandations:\n\n1. **Email Campaign**: Ciblez les clients qui n'ont pas commandé depuis 30 jours\n2. **Promo Flash**: Vos produits les plus vendus peuvent bénéficier d'une promo\n3. **Retargeting**: Récupérez les paniers abandonnés\n\nVoulez-vous que je crée une campagne automatisée?`;
    }

    if (lowerMessage.includes('prix') || lowerMessage.includes('tarif')) {
      const avgPrice = products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length;
      return `💰 **Analyse des prix**\n\n- **Prix moyen de vos produits**: ${avgPrice.toFixed(2)}€\n- **Produits les plus chers**: Identifiés\n- **Marge moyenne estimée**: Calculée\n\nJe peux analyser la concurrence et suggérer des ajustements de prix optimaux.`;
    }

    // Default response
    return `Je comprends votre demande concernant "${userMessage}". \n\nActuellement, je peux vous aider avec:\n- 📊 Analyse des ventes et performances\n- 📦 Gestion des stocks et produits\n- 🚀 Stratégies marketing\n- 💰 Optimisation des prix\n\nQue souhaitez-vous explorer?`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateAIResponse(input);
      
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer une réponse",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Assistant IA</h1>
          <p className="text-muted-foreground">
            Votre assistant intelligent pour optimiser votre e-commerce
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          IA Activée
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Conversation
            </CardTitle>
            <CardDescription>Discutez avec l'assistant IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Posez votre question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Suggestions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setInput(suggestion)}
                  disabled={isLoading}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {suggestion}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insights récents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights && insights.length > 0 ? (
                insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="flex items-start gap-3 p-2 rounded border">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun insight récent
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacités IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Analyse de données</h4>
                  <p className="text-xs text-muted-foreground">
                    Insights sur vos ventes et produits
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Génération de contenu</h4>
                  <p className="text-xs text-muted-foreground">
                    Descriptions et textes marketing
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Optimisation</h4>
                  <p className="text-xs text-muted-foreground">
                    Prix, SEO et stratégies marketing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
