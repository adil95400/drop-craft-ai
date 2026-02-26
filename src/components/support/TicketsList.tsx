import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  MessageSquare, 
  ChevronRight,
  Plus,
  Inbox,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SupportTicket } from '@/hooks/useSupportTickets';
import { format, formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface TicketsListProps {
  tickets: SupportTicket[];
  isLoading: boolean;
  onSelectTicket: (ticket: SupportTicket) => void;
  onCreateTicket: () => void;
}

const statusConfig = {
  open: { label: 'Ouvert', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: MessageSquare },
  pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Loader2 },
  resolved: { label: 'Résolu', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'bg-muted text-muted-foreground border-border', icon: AlertCircle },
};

const priorityColors = {
  low: 'bg-muted',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-destructive',
};

export function TicketsList({ tickets, isLoading, onSelectTicket, onCreateTicket }: TicketsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">Aucun ticket</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Vous n'avez pas encore créé de ticket de support
          </p>
          <Button onClick={onCreateTicket}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un ticket
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {tickets.map((ticket, index) => {
          const StatusIcon = statusConfig[ticket.status].icon;
          
          return (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group"
                onClick={() => onSelectTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${priorityColors[ticket.priority]}`} />
                        <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {ticket.message}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                        </span>
                        <span className="capitalize text-muted-foreground/70">
                          {ticket.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusConfig[ticket.status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[ticket.status].label}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
