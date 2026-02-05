import { useState, useRef, useEffect } from 'react';
import { productionLogger } from '@/utils/productionLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Bot,
  User,
  Send,
  Loader2,
  Sparkles,
  TrendingUp,
  BarChart3,
  Zap,
  RefreshCw
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
}

interface AIAssistantChatProps {
  context?: string;
  className?: string;
}

export const AIAssistantChat = ({ context, className }: AIAssistantChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant IA spécialisé en e-commerce et gestion d\'entreprise. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStats, setConversationStats] = useState({
    totalMessages: 1,
    tokensUsed: 0,
    avgResponseTime: 0
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const quickActions = [
    {
      label: 'Analyser les ventes',
      icon: TrendingUp,
      prompt: 'Peux-tu analyser mes performances de ventes récentes et me donner des recommandations ?'
    },
    {
      label: 'Optimiser les prix',
      icon: BarChart3,
      prompt: 'Comment puis-je optimiser ma stratégie de pricing pour augmenter ma marge ?'
    },
    {
      label: 'Automatiser les processus',
      icon: Zap,
      prompt: 'Quels processus puis-je automatiser pour gagner du temps et de l\'efficacité ?'
    },
    {
      label: 'Idées marketing',
      icon: Sparkles,
      prompt: 'Donne-moi des idées créatives pour ma prochaine campagne marketing.'
    }
  ];

  useEffect(() => {
    // Scroll vers le bas quand de nouveaux messages arrivent
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Vous devez être connecté pour utiliser l\'assistant IA');
      }

      const response = await supabase.functions.invoke('ai-powerhouse/smart-assistant', {
        body: {
          message: messageText.trim(),
          context: context || 'Interface utilisateur générale',
          conversationHistory: messages.slice(-6).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la communication avec l\'IA');
      }

      const responseTime = Date.now() - startTime;
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        tokens: response.data.usage?.total_tokens
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Mettre à jour les statistiques
      setConversationStats(prev => ({
        totalMessages: prev.totalMessages + 2,
        tokensUsed: prev.tokensUsed + (response.data.usage?.total_tokens || 0),
        avgResponseTime: Math.round((prev.avgResponseTime + responseTime) / 2)
      }));

      toast({
        title: "Réponse générée",
        description: `Temps de réponse: ${(responseTime / 1000).toFixed(1)}s`
      });

    } catch (error: any) {
      productionLogger.error('AIAssistantChat.sendMessage', error, 'AIAssistantChat');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Désolé, j'ai rencontré une erreur : ${error.message}. Pouvez-vous réessayer ?`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    sendMessage(prompt);
  };

  const clearConversation = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Conversation effacée ! Comment puis-je vous aider ?',
      timestamp: new Date()
    }]);
    setConversationStats({
      totalMessages: 1,
      tokensUsed: 0,
      avgResponseTime: 0
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Assistant IA</CardTitle>
              <CardDescription>Votre conseiller business intelligent</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {conversationStats.totalMessages} messages
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearConversation}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Zone de chat */}
        <ScrollArea className="h-96 w-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-12'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {message.tokens && (
                      <Badge variant="outline" className="text-xs">
                        {message.tokens} tokens
                      </Badge>
                    )}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100">
                      <User className="h-4 w-4 text-blue-600" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">L'assistant réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions rapides */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Actions rapides :</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-auto p-2 justify-start text-left"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                >
                  <Icon className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="text-xs truncate">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Zone de saisie */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            disabled={isLoading}
            className="flex-1"
            maxLength={500}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Statistiques */}
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Tokens: {conversationStats.tokensUsed.toLocaleString()}</span>
          <span>Temps moyen: {conversationStats.avgResponseTime}ms</span>
        </div>
      </CardContent>
    </Card>
  );
};