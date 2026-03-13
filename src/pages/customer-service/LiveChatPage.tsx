/**
 * Live Chat — Real-time agent/customer messaging interface
 */
import { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useLiveChat, type ChatSession, type ChatMessage } from '@/hooks/useLiveChat';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  MessageSquare, Send, Plus, X, Clock, CheckCircle, User,
  Bot, Zap, Star, Phone, Mail, Globe, AlertCircle, Search,
  Paperclip, Smile, Hash, ArrowLeft
} from 'lucide-react';

export default function LiveChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [newChatDialog, setNewChatDialog] = useState(false);
  const [newChatForm, setNewChatForm] = useState({ email: '', name: '', subject: '', channel: 'web', priority: 'normal' });
  const [searchFilter, setSearchFilter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sessions, activeSessions, closedSessions, messages, cannedResponses,
    isLoadingSessions, isLoadingMessages,
    createSession, sendMessage, closeSession,
  } = useLiveChat(activeSessionId || undefined);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeSessionId) return;
    sendMessage.mutate({ session_id: activeSessionId, content: messageInput.trim() });
    setMessageInput('');
  };

  const handleCreateChat = () => {
    if (!newChatForm.email.trim()) return;
    createSession.mutate({
      customer_email: newChatForm.email,
      customer_name: newChatForm.name || undefined,
      subject: newChatForm.subject || undefined,
      channel: newChatForm.channel,
      priority: newChatForm.priority,
    }, {
      onSuccess: (data) => {
        setActiveSessionId(data.id);
        setNewChatDialog(false);
        setNewChatForm({ email: '', name: '', subject: '', channel: 'web', priority: 'normal' });
      },
    });
  };

  const handleUseCanned = (content: string) => {
    if (!activeSessionId) return;
    sendMessage.mutate({ session_id: activeSessionId, content, message_type: 'canned' });
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const filteredSessions = sessions.filter(s =>
    !searchFilter || 
    s.customer_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.customer_email?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.subject?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'waiting': return 'bg-amber-500';
      case 'closed': return 'bg-muted-foreground/50';
      default: return 'bg-muted-foreground/30';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive" className="text-[10px] px-1.5">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-700 text-[10px] px-1.5">Haute</Badge>;
      default: return null;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-3 w-3" />;
      case 'whatsapp': return <Phone className="h-3 w-3" />;
      case 'messenger': return <MessageSquare className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  };

  return (
    <>
      <Helmet><title>Chat en direct — Drop-Craft AI</title></Helmet>
      <ChannablePageWrapper
        title="Chat en direct"
        description="Messagerie temps réel avec vos clients"
        badge={{ label: 'Live', icon: MessageSquare }}
      >
        <div className="flex h-[calc(100vh-220px)] border border-border rounded-xl overflow-hidden bg-card">
          {/* Sidebar - Sessions list */}
          <div className={cn(
            "w-80 border-r border-border flex flex-col bg-muted/30",
            activeSessionId && "hidden md:flex"
          )}>
            <div className="p-3 border-b border-border space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Dialog open={newChatDialog} onOpenChange={setNewChatDialog}>
                  <DialogTrigger asChild>
                    <Button size="icon" className="h-9 w-9 shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvelle conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>Email client *</Label>
                        <Input value={newChatForm.email} onChange={e => setNewChatForm(p => ({ ...p, email: e.target.value }))} placeholder="client@example.com" />
                      </div>
                      <div>
                        <Label>Nom</Label>
                        <Input value={newChatForm.name} onChange={e => setNewChatForm(p => ({ ...p, name: e.target.value }))} placeholder="Jean Dupont" />
                      </div>
                      <div>
                        <Label>Sujet</Label>
                        <Input value={newChatForm.subject} onChange={e => setNewChatForm(p => ({ ...p, subject: e.target.value }))} placeholder="Question livraison" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Canal</Label>
                          <Select value={newChatForm.channel} onValueChange={v => setNewChatForm(p => ({ ...p, channel: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="web">Web</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="messenger">Messenger</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Priorité</Label>
                          <Select value={newChatForm.priority} onValueChange={v => setNewChatForm(p => ({ ...p, priority: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Basse</SelectItem>
                              <SelectItem value="normal">Normale</SelectItem>
                              <SelectItem value="high">Haute</SelectItem>
                              <SelectItem value="urgent">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateChat} disabled={createSession.isPending}>
                        <Plus className="h-4 w-4 mr-2" />Créer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex gap-1 text-xs">
                <Badge variant="secondary" className="gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {activeSessions.length} actives
                </Badge>
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  {closedSessions.length} fermées
                </Badge>
              </div>
            </div>
            <ScrollArea className="flex-1">
              {filteredSessions.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Aucune conversation
                </div>
              ) : (
                filteredSessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={cn(
                      "w-full p-3 text-left border-b border-border/50 hover:bg-accent/50 transition-colors",
                      activeSessionId === session.id && "bg-accent"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {(session.customer_name || session.customer_email || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">
                            {session.customer_name || session.customer_email || 'Client'}
                          </span>
                          <div className={cn("h-2 w-2 rounded-full shrink-0", getStatusColor(session.status))} />
                          {getPriorityBadge(session.priority)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {session.subject || 'Pas de sujet'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                          {getChannelIcon(session.channel)}
                          <span>{session.last_message_at ? formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true, locale: fr }) : ''}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Main chat area */}
          <div className={cn(
            "flex-1 flex flex-col",
            !activeSessionId && "hidden md:flex"
          )}>
            {activeSession ? (
              <>
                {/* Chat header */}
                <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setActiveSessionId(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {(activeSession.customer_name || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{activeSession.customer_name || activeSession.customer_email}</span>
                        <div className={cn("h-2 w-2 rounded-full", getStatusColor(activeSession.status))} />
                      </div>
                      <p className="text-xs text-muted-foreground">{activeSession.subject || activeSession.channel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getPriorityBadge(activeSession.priority)}
                    {activeSession.status !== 'closed' && (
                      <Button variant="ghost" size="sm" onClick={() => closeSession.mutate(activeSession.id)} className="text-destructive hover:text-destructive">
                        <X className="h-4 w-4 mr-1" />Fermer
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3 max-w-3xl mx-auto">
                    <AnimatePresence initial={false}>
                      {messages.map(msg => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex gap-2",
                            msg.sender_type === 'agent' && "justify-end",
                            msg.sender_type === 'system' && "justify-center"
                          )}
                        >
                          {msg.sender_type === 'system' ? (
                            <div className="bg-muted/50 text-muted-foreground text-xs py-1 px-3 rounded-full">
                              {msg.content}
                            </div>
                          ) : (
                            <>
                              {msg.sender_type !== 'agent' && (
                                <Avatar className="h-7 w-7 shrink-0 mt-1">
                                  <AvatarFallback className="text-[10px]">
                                    {msg.sender_type === 'bot' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={cn(
                                "max-w-[70%] rounded-2xl px-3.5 py-2 text-sm",
                                msg.sender_type === 'agent'
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              )}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <span className={cn(
                                  "text-[10px] mt-1 block",
                                  msg.sender_type === 'agent' ? "text-primary-foreground/60" : "text-muted-foreground"
                                )}>
                                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                                </span>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input area */}
                {activeSession.status !== 'closed' && (
                  <div className="border-t border-border p-3 bg-card">
                    {/* Canned responses */}
                    {cannedResponses.length > 0 && (
                      <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                        {cannedResponses.slice(0, 5).map(cr => (
                          <Button
                            key={cr.id}
                            variant="outline"
                            size="sm"
                            className="text-xs shrink-0 h-7"
                            onClick={() => handleUseCanned(cr.content)}
                          >
                            <Zap className="h-3 w-3 mr-1" />{cr.title}
                          </Button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={e => setMessageInput(e.target.value)}
                        placeholder="Écrivez un message..."
                        className="flex-1"
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} disabled={!messageInput.trim() || sendMessage.isPending}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium">Sélectionnez une conversation</p>
                  <p className="text-sm mt-1">ou créez-en une nouvelle</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ChannablePageWrapper>
    </>
  );
}
