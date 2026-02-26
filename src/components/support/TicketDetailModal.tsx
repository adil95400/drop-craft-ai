import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Loader2, 
  Clock, 
  User, 
  Headphones,
  AlertCircle,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SupportTicket, useTicketMessages } from '@/hooks/useSupportTickets';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface TicketDetailModalProps {
  ticket: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  open: { label: 'Ouvert', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: MessageSquare },
  pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Loader2 },
  resolved: { label: 'Résolu', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'bg-muted text-muted-foreground border-border', icon: AlertCircle },
};

const priorityConfig = {
  low: { label: 'Basse', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'Moyenne', color: 'bg-blue-500/10 text-blue-600' },
  high: { label: 'Haute', color: 'bg-orange-500/10 text-orange-600' },
  urgent: { label: 'Urgente', color: 'bg-destructive/10 text-destructive' },
};

export function TicketDetailModal({ ticket, open, onOpenChange }: TicketDetailModalProps) {
  const [newMessage, setNewMessage] = useState('');
  const { messages, isLoading, addMessage, isAddingMessage } = useTicketMessages(ticket?.id || null);

  if (!ticket) return null;

  const StatusIcon = statusConfig[ticket.status].icon;

  const handleSendMessage = () => {
    if (!newMessage.trim() || !ticket) return;
    addMessage(
      { ticketId: ticket.id, message: newMessage },
      { onSuccess: () => setNewMessage('') }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-lg">{ticket.subject}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Créé le {format(new Date(ticket.created_at), "d MMMM yyyy 'à' HH:mm", { locale: getDateFnsLocale() })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={priorityConfig[ticket.priority].color}>
                {priorityConfig[ticket.priority].label}
              </Badge>
              <Badge variant="outline" className={statusConfig[ticket.status].color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[ticket.status].label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 py-4">
            {/* Original message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">Vous</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(ticket.created_at), "d MMM HH:mm", { locale: getDateFnsLocale() })}
                  </span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  {ticket.message}
                </div>
              </div>
            </motion.div>

            {/* Messages */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={msg.is_staff ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}>
                        {msg.is_staff ? <Headphones className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {msg.is_staff ? 'Support' : 'Vous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), "d MMM HH:mm", { locale: getDateFnsLocale() })}
                        </span>
                      </div>
                      <div className={`rounded-lg p-3 text-sm ${
                        msg.is_staff ? 'bg-green-500/5 border border-green-500/10' : 'bg-muted/50'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {messages.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune réponse pour le moment</p>
                <p className="text-xs">Notre équipe va bientôt vous répondre</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Reply input */}
        {ticket.status !== 'closed' && (
          <div className="border-t pt-4 space-y-3">
            <Textarea
              placeholder="Écrire une réponse..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isAddingMessage}
              >
                {isAddingMessage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Envoyer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
