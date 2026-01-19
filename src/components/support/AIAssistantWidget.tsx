import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles,
  Loader2,
  MessageCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "Comment importer mes produits ?",
  "Comment configurer mes flux ?",
  "Problème de synchronisation",
  "Gérer mon abonnement",
];

// Simple local AI responses (no API needed for basic support)
const getAIResponse = (question: string): string => {
  const q = question.toLowerCase();
  
  if (q.includes('import') || q.includes('produit')) {
    return "Pour importer vos produits, rendez-vous dans **Import > Sources** et choisissez votre méthode d'import (CSV, API, ou connexion directe). Vous pouvez importer jusqu'à 10 000 produits avec le plan Pro. Besoin d'aide supplémentaire ? Créez un ticket de support.";
  }
  if (q.includes('flux') || q.includes('feed') || q.includes('export')) {
    return "La configuration des flux se fait dans **Flux > Mes Flux**. Vous pouvez créer des flux pour Google Shopping, Facebook, Amazon et plus. Chaque flux peut avoir ses propres règles de transformation. Consultez notre guide dans l'onglet Documentation.";
  }
  if (q.includes('sync') || q.includes('synchron')) {
    return "Les problèmes de synchronisation peuvent avoir plusieurs causes. Vérifiez d'abord votre connexion dans **Paramètres > Intégrations**. Si le problème persiste, consultez les logs dans **Analytiques > Logs** ou créez un ticket pour une assistance personnalisée.";
  }
  if (q.includes('abonnement') || q.includes('plan') || q.includes('prix')) {
    return "Vous pouvez gérer votre abonnement dans **Paramètres > Abonnement**. Nous proposons les plans Free, Pro et Ultra Pro. Les upgrades sont instantanés et les downgrades prennent effet à la fin de votre période de facturation.";
  }
  if (q.includes('aide') || q.includes('help') || q.includes('support')) {
    return "Je suis là pour vous aider ! Vous pouvez me poser des questions sur l'utilisation de la plateforme. Pour une assistance personnalisée, créez un ticket de support ou utilisez le chat en direct dans l'onglet Contact.";
  }
  
  return "Merci pour votre question. Pour une réponse plus précise, je vous suggère de consulter notre documentation ou de créer un ticket de support. Notre équipe vous répondra dans les plus brefs délais.";
};

export function AIAssistantWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Bonjour ! 👋 Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = getAIResponse(messageText);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/80">
              <Bot className="h-4 w-4 text-white" />
            </div>
            Assistant IA
          </CardTitle>
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
            En ligne
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
                        <Sparkles className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-xl px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Suggested questions */}
          {messages.length <= 2 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Questions suggérées
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleSend(q)}
                  >
                    {q}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Posez votre question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
