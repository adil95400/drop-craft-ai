import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Sparkles, MessageSquare, Zap } from 'lucide-react';

const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Bonjour! Je suis votre assistant IA. Comment puis-je vous aider aujourd\'hui?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  const suggestions = [
    'Analyser mes ventes du mois',
    'Optimiser mes descriptions produits',
    'Créer une campagne marketing',
    'Suggestions de prix',
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages([
      ...messages,
      {
        id: messages.length + 1,
        role: 'user',
        content: input,
        timestamp: new Date(),
      },
    ]);
    setInput('');
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
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Posez votre question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button onClick={handleSend}>
                <Send className="h-4 w-4" />
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
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {suggestion}
                </Button>
              ))}
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
