import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle, X, Send, Bot, User, Minimize2, 
  Maximize2, Sparkles, HelpCircle, FileText, Loader2,
  Package, BarChart3, Globe, Zap, ShoppingCart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import ReactMarkdown from 'react-markdown'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_ACTIONS = [
  { label: 'Importer des produits', icon: Package, message: 'Comment importer des produits depuis AliExpress ou un fichier CSV ?' },
  { label: 'Optimiser le SEO', icon: Sparkles, message: 'Comment optimiser le SEO de mes produits (titres, descriptions, ALT-text) ?' },
  { label: 'Recommandations IA', icon: Zap, message: 'Comment fonctionne le moteur de recommandation IA et comment l\'activer ?' },
  { label: 'Traduction & i18n', icon: Globe, message: 'Comment traduire mes produits en plusieurs langues automatiquement ?' },
  { label: 'Analytics & KPIs', icon: BarChart3, message: 'Comment suivre les performances de mes produits et ventes ?' },
  { label: 'Automatisations', icon: ShoppingCart, message: 'Quelles automatisations sont disponibles (pricing, stock, commandes) ?' },
  { label: 'Guide démarrage', icon: HelpCircle, message: 'Quel est le meilleur parcours pour démarrer rapidement avec ShopOpti+ ?' },
  { label: 'Résoudre un problème', icon: FileText, message: 'J\'ai un problème technique, pouvez-vous m\'aider à le diagnostiquer ?' },
]

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('ai-support-chat', {
        body: { 
          message: text,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          userId: user?.id,
          context: {
            currentPage: window.location.pathname,
            businessType: localStorage.getItem('shopopti_business_type') || undefined,
          }
        }
      })

      const response = data?.response || 'Je suis là pour vous aider ! N\'hésitez pas à reformuler votre question.'
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: error ? 'Désolé, je rencontre un problème technique. Essayez de créer un ticket de support dans le centre d\'aide.' : response,
        timestamp: new Date()
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Je suis disponible pour vous aider ! Pour les questions complexes, créez un ticket depuis le Centre d\'aide.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-primary to-primary/80 hover:scale-110 transition-transform"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed z-50 bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden",
              isExpanded 
                ? "bottom-4 right-4 w-[480px] h-[600px]" 
                : "bottom-6 right-6 w-[380px] h-[500px]"
            )}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Support ShopOpti+</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 bg-green-400 rounded-full" />
                    <span className="text-xs opacity-90">En ligne 24/7</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10" onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Bot className="h-10 w-10 mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium">Comment puis-je vous aider ?</p>
                    <p className="text-xs text-muted-foreground">Posez votre question ou choisissez un sujet</p>
                  </div>
                  <div className="space-y-2">
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(action.message)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors text-left"
                      >
                        <action.icon className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={cn("flex gap-2", msg.role === 'user' && 'flex-row-reverse')}>
                      <div className={cn(
                        "p-1.5 rounded-full h-7 w-7 flex items-center justify-center flex-shrink-0",
                        msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      </div>
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-sm",
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-muted rounded-tl-sm'
                      )}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1 [&_ul]:mb-1 [&_li]:mb-0.5">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2">
                      <div className="p-1.5 rounded-full h-7 w-7 flex items-center justify-center bg-muted">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="bg-muted p-3 rounded-2xl rounded-tl-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="rounded-full text-sm"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" className="rounded-full flex-shrink-0" disabled={!input.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
