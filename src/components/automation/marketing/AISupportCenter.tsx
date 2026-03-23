import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCreateTicket, useAITicketRespond, useChatSuggest } from '@/hooks/useCustomerService';
import { toast } from 'sonner';
import {
  Headphones, Bot, MessageSquare, Send, Sparkles,
  AlertTriangle, Clock, CheckCircle2, Loader2,
  TicketIcon, RefreshCw, ArrowRight
} from 'lucide-react';

export function AISupportCenter() {
  const createTicket = useCreateTicket();
  const aiRespond = useAITicketRespond();
  const chatSuggest = useChatSuggest();

  // Ticket form
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'general',
  });

  // Chat simulation
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isThinking, setIsThinking] = useState(false);

  const handleCreateTicket = () => {
    if (!ticketForm.subject || !ticketForm.message) {
      toast.error('Veuillez remplir le sujet et le message');
      return;
    }
    createTicket.mutate(ticketForm, {
      onSuccess: () => {
        setTicketForm({ subject: '', message: '', priority: 'medium', category: 'general' });
      },
    });
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const newMessages = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(newMessages);
    setIsThinking(true);

    chatSuggest.mutate(
      {
        customer_message: userMsg,
        conversation_history: newMessages,
      },
      {
        onSuccess: (data) => {
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: data?.suggestion || data?.response || 'Je vais analyser votre demande et vous répondre rapidement.',
          }]);
          setIsThinking(false);
        },
        onError: () => {
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Désolé, je rencontre un problème technique. Un agent va prendre le relais.',
          }]);
          setIsThinking(false);
        },
      }
    );
  };

  const CAPABILITIES = [
    { icon: MessageSquare, label: 'Questions fréquentes', desc: 'Réponses automatiques aux FAQ' },
    { icon: RefreshCw, label: 'Suivi commande', desc: 'Statut et tracking en temps réel' },
    { icon: ArrowRight, label: 'Retours / Échanges', desc: 'Workflow automatisé de retour' },
    { icon: CheckCircle2, label: 'Remboursements', desc: 'Traitement auto des cas simples' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Chat */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Assistant IA Support
            </CardTitle>
            <CardDescription>Testez les réponses automatiques de l'IA</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto border rounded-lg p-3 space-y-3 mb-3 bg-muted/30">
              {chatMessages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Posez une question comme le ferait un client</p>
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    {['Où est ma commande ?', 'Je veux un remboursement', 'Comment retourner un article ?'].map(q => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setChatInput(q);
                        }}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-card border rounded-lg p-2.5 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    L'IA réfléchit...
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Tapez un message client..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
              />
              <Button onClick={handleChatSend} disabled={!chatInput.trim() || isThinking}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Ticket */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5 text-warning" />
              Créer un ticket
            </CardTitle>
            <CardDescription>Ticket support avec réponse IA automatique</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sujet</Label>
              <Input
                placeholder="Ex: Problème avec ma commande #1234"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm(p => ({ ...p, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Décrivez le problème du client..."
                value={ticketForm.message}
                onChange={(e) => setTicketForm(p => ({ ...p, message: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={ticketForm.priority} onValueChange={(v: any) => setTicketForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={ticketForm.category} onValueChange={(v) => setTicketForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="order">Commande</SelectItem>
                    <SelectItem value="return">Retour</SelectItem>
                    <SelectItem value="refund">Remboursement</SelectItem>
                    <SelectItem value="product">Produit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleCreateTicket}
              disabled={createTicket.isPending}
            >
              {createTicket.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Créer le ticket + Réponse IA
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Capacités de l'assistant IA</CardTitle>
          <CardDescription>Actions automatisées disponibles pour le support client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CAPABILITIES.map((cap) => (
              <div key={cap.label} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded bg-primary/10">
                    <cap.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-sm">{cap.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{cap.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
