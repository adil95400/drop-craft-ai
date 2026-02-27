import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot-support`;

export const IntegratedChatSupport = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour ! Je suis votre assistant **Drop Craft AI**. Comment puis-je vous aider ?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    let assistantContent = '';

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.sender === 'assistant' && last.id.startsWith('stream-')) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { id: `stream-${Date.now()}`, content: assistantContent, sender: 'assistant', timestamp: new Date() }];
      });
    };

    try {
      const apiMessages = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      }));
      apiMessages.push({ role: 'user', content: currentInput });

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (errorData.response) {
          upsertAssistant(errorData.response);
        } else if (resp.status === 429) {
          toast({ title: 'Limite atteinte', description: 'Réessayez dans quelques instants', variant: 'destructive' });
        } else {
          throw new Error(errorData.error || 'Erreur serveur');
        }
        setIsLoading(false);
        return;
      }

      const contentType = resp.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && resp.body) {
        // Stream SSE
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) upsertAssistant(content);
            } catch {
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }
      } else {
        // Non-streaming fallback
        const data = await resp.json();
        upsertAssistant(data.response || 'Je suis là pour vous aider !');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer le message', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-12 w-12 shadow-lg bg-primary hover:bg-primary/90"
          aria-label="Ouvrir l'assistant"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`shadow-xl border transition-all duration-300 ${isMinimized ? 'h-16 w-80' : 'h-[28rem] w-96'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Assistant Drop Craft AI
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)} className="h-6 w-6 p-0">
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0">×</Button>
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col" style={{ height: 'calc(100% - 3.5rem)' }}>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`p-2 rounded-full shrink-0 ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {message.sender === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                    </div>
                    <div className={`max-w-[75%] p-3 rounded-lg ${message.sender === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}>
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && !messages[messages.length - 1]?.id.startsWith('stream-') && (
                  <div className="flex items-start gap-2">
                    <div className="p-2 rounded-full bg-muted"><Bot className="h-3 w-3" /></div>
                    <div className="bg-muted p-3 rounded-lg"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Posez votre question..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
