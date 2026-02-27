/**
 * AI Assistant Page - Chat conversationnel IA pour l'analyse produits et la stratégie
 * Powered by Lovable AI (OpenAI GPT-5-mini)
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Sparkles, Package, TrendingUp, DollarSign, Search, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  { icon: Package, label: 'Analyser un produit', prompt: 'Aide-moi à analyser le potentiel d\'un produit de niche fitness pour le dropshipping.' },
  { icon: TrendingUp, label: 'Tendances du moment', prompt: 'Quelles sont les tendances produits les plus prometteuses pour le dropshipping en ce moment ?' },
  { icon: DollarSign, label: 'Stratégie pricing', prompt: 'Comment définir une stratégie de prix optimale pour maximiser mes marges en dropshipping ?' },
  { icon: Search, label: 'Optimiser mon SEO', prompt: 'Comment optimiser mes fiches produits pour le référencement sur Google Shopping ?' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = useCallback(async (allMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Erreur réseau' }));
      if (resp.status === 429) toast({ title: '⏳ Limite atteinte', description: err.error, variant: 'destructive' });
      else if (resp.status === 402) toast({ title: '💳 Crédits épuisés', description: err.error, variant: 'destructive' });
      else toast({ title: 'Erreur', description: err.error || 'Erreur du service IA', variant: 'destructive' });
      return;
    }

    if (!resp.body) return;

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch { /* partial JSON */ }
      }
    }
  }, [toast]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    
    const userMsg: Message = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de contacter l\'assistant IA', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <ChannablePageWrapper
      title="Assistant IA"
      subtitle="Votre expert e-commerce"
      description="Posez vos questions sur vos produits, votre stratégie et vos performances"
      heroImage="ai"
      badge={{ label: 'GPT-5', icon: Sparkles }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-320px)] min-h-[500px]">
        {/* Chat Panel */}
        <Card className="lg:col-span-3 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold">Assistant Drop Craft AI</span>
              <Badge variant="secondary" className="text-xs">En ligne</Badge>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <Trash2 className="h-4 w-4 mr-1" /> Effacer
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Comment puis-je vous aider ?</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Je suis votre assistant IA spécialisé en e-commerce et dropshipping. Posez-moi n'importe quelle question !
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {SUGGESTIONS.map((s, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4 text-left"
                      onClick={() => send(s.prompt)}
                    >
                      <s.icon className="h-4 w-4 mr-2 shrink-0 text-primary" />
                      <span className="text-sm">{s.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>

        {/* Sidebar with quick actions */}
        <div className="space-y-4 hidden lg:block">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-sm">💡 Idées de questions</h4>
              <div className="space-y-2">
                {[
                  'Quels produits vendre en 2026 ?',
                  'Comment améliorer ma marge ?',
                  'Analyser ma stratégie publicitaire',
                  'Optimiser mes descriptions produits',
                  'Conseils pour le Black Friday',
                  'Évaluer un nouveau fournisseur',
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => send(q)}
                    className="block w-full text-left text-xs p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 text-sm">🤖 Modèle IA</h4>
              <p className="text-xs text-muted-foreground">
                Propulsé par <span className="font-medium">OpenAI GPT-5-mini</span> — 
                réponses rapides et intelligentes pour votre business e-commerce.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ChannablePageWrapper>
  );
}
