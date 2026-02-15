import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, X, Minimize2, Maximize2, Sparkles, ThumbsUp, ThumbsDown, Copy, Check, Headphones, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SupportAvailabilityIndicator } from './SupportAvailabilityIndicator';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

interface AdvancedLiveChatProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdvancedLiveChat({ isOpen: externalIsOpen, onClose: externalOnClose }: AdvancedLiveChatProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHumanSupport, setShowHumanSupport] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '👋 Bonjour ! Je suis votre assistant IA Drop Craft. Je peux vous aider avec:\n\n• Import et gestion de produits\n• Optimisation SEO avec IA\n• Configuration des intégrations\n• Stratégies de dropshipping\n• Support technique\n\nComment puis-je vous aider ?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  
  const userPlan = (user?.user_metadata?.plan?.toLowerCase() || 'free') as 'free' | 'pro' | 'business' | 'enterprise';
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnClose !== undefined 
    ? (value: boolean) => !value && externalOnClose() 
    : setInternalIsOpen;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'Copié !',
      description: 'Le message a été copié dans le presse-papier',
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Create assistant message for streaming
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(
        (await import('@/lib/supabase-env')).edgeFunctionUrl('ai-chatbot-support'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              ...messages
                .filter(m => !m.isStreaming)
                .map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: inputValue }
            ]
          }),
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Erreur de streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: fullContent }
                    : m
                )
              );
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }

      // Mark streaming as complete
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, isStreaming: false }
            : m
        )
      );

    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: 'Annulé',
          description: 'Le message a été annulé',
        });
      } else {
        console.error('Chat error:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible d\'envoyer le message. Vérifiez votre connexion.',
          variant: 'destructive'
        });
        // Remove failed assistant message
        setMessages(prev => prev.filter(m => m.id !== assistantId));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    'Comment importer des produits ?',
    'Comment optimiser mes fiches produits ?',
    'Quels sont les meilleurs fournisseurs ?',
    'Comment augmenter mes conversions ?'
  ];

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-16 w-16 shadow-2xl hover:scale-110 transition-transform bg-gradient-to-br from-primary to-primary/80"
        >
          <Bot className="h-7 w-7" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`shadow-2xl border-2 transition-all duration-300 ${
        isMinimized ? 'h-16 w-[420px]' : 'h-[650px] w-[420px]'
      }`}>
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {showHumanSupport ? 'Support Humain' : 'Assistant IA'}
                <Badge variant="secondary" className="text-xs">
                  {showHumanSupport ? (
                    <>
                      <Headphones className="h-3 w-3 mr-1" />
                      Live
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Premium
                    </>
                  )}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                {showHumanSupport ? 'Agent disponible' : 'Réponse en temps réel'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHumanSupport(!showHumanSupport)}
              className="h-8 px-2 text-xs"
              title={showHumanSupport ? 'Retour à l\'IA' : 'Parler à un humain'}
            >
              {showHumanSupport ? <Bot className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!isMinimized && (
          <div className="flex flex-col h-[calc(650px-80px)]">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, idx) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 group ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-white' 
                        : 'bg-gradient-to-br from-muted to-muted/50'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`max-w-[80%] ${
                      message.role === 'user' ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`p-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-none'
                          : 'bg-muted rounded-tl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                          {message.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2 px-1">
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.role === 'assistant' && !message.isStreaming && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleCopy(message.content, message.id)}
                            >
                              {copiedId === message.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {messages.length === 1 && !showHumanSupport && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs text-muted-foreground px-2">Questions suggérées :</p>
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setInputValue(q)}
                        className="w-full text-left text-sm p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                
                {showHumanSupport && (
                  <div className="mt-4">
                    <SupportAvailabilityIndicator tier={userPlan} showDetails={true} />
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t bg-muted/20">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Posez votre question..."
                  className="flex-1"
                  disabled={isLoading}
                />
                {isLoading ? (
                  <Button
                    onClick={handleStop}
                    size="icon"
                    variant="destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Propulsé par IA • Réponses en temps réel
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
