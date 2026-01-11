import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  Paperclip,
  Smile
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'support' | 'bot';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

const quickReplies = [
  "Comment importer des produits ?",
  "Problème de synchronisation",
  "Modifier mon abonnement",
  "Contacter un humain"
];

const botResponses: Record<string, string> = {
  "import": "Pour importer des produits, allez dans Produits > Importer et choisissez votre source (CSV, AliExpress, BigBuy). Besoin d'aide supplémentaire ?",
  "sync": "Les problèmes de synchronisation peuvent être résolus en vérifiant votre connexion API dans Paramètres > Intégrations. Voulez-vous que je vérifie le statut ?",
  "abonnement": "Pour modifier votre abonnement, rendez-vous dans Paramètres > Facturation. Vous pouvez upgrader à tout moment. Puis-je vous aider avec autre chose ?",
  "humain": "Je vous mets en contact avec un conseiller. Temps d'attente estimé : 2-3 minutes. En attendant, puis-je vous aider ?",
  "default": "Merci pour votre message ! Je suis l'assistant IA de Shopopti. Comment puis-je vous aider aujourd'hui ?"
};

export function ChatSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Bonjour ! Je suis l'assistant Shopopti. Comment puis-je vous aider ?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('import') || lowerMessage.includes('produit')) {
      return botResponses.import;
    }
    if (lowerMessage.includes('sync') || lowerMessage.includes('synchron')) {
      return botResponses.sync;
    }
    if (lowerMessage.includes('abonnement') || lowerMessage.includes('plan') || lowerMessage.includes('upgrade')) {
      return botResponses.abonnement;
    }
    if (lowerMessage.includes('humain') || lowerMessage.includes('conseiller') || lowerMessage.includes('contact')) {
      return botResponses.humain;
    }
    return botResponses.default;
  };

  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(content),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }, 1500);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative"
            >
              <MessageCircle className="h-6 w-6" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : 500
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px]"
          >
            <Card className="shadow-2xl border-2 overflow-hidden">
              {/* Header */}
              <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary-foreground/20">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary-foreground/20">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm font-semibold">Support Shopopti</CardTitle>
                    <div className="flex items-center gap-1 text-xs text-primary-foreground/80">
                      <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                      En ligne
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {!isMinimized && (
                <>
                  {/* Messages */}
                  <CardContent className="p-0">
                    <ScrollArea className="h-[320px] p-4" ref={scrollRef}>
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                {message.sender === 'user' ? (
                                  <AvatarFallback className="bg-secondary">
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    <Bot className="h-4 w-4" />
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  message.sender === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted rounded-tl-none'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <span className="text-[10px] opacity-70 mt-1 block">
                                  {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                              <div className="flex gap-1">
                                <span className="h-2 w-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="h-2 w-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="h-2 w-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Quick Replies */}
                      {messages.length === 1 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {quickReplies.map((reply) => (
                            <Button
                              key={reply}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleQuickReply(reply)}
                            >
                              {reply}
                            </Button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>

                  {/* Input */}
                  <CardFooter className="p-3 border-t">
                    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 flex-shrink-0"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Écrivez votre message..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 flex-shrink-0"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="submit" 
                        size="icon"
                        className="h-10 w-10 flex-shrink-0"
                        disabled={!inputValue.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </CardFooter>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
