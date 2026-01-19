import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MessageSquare, 
  BookOpen, 
  Headphones,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SupportQuickActionsProps {
  onCreateTicket: () => void;
  onOpenChat: () => void;
}

export function SupportQuickActions({ onCreateTicket, onOpenChat }: SupportQuickActionsProps) {
  const actions = [
    {
      label: 'Nouveau ticket',
      icon: Plus,
      onClick: onCreateTicket,
      variant: 'default' as const,
    },
    {
      label: 'Chat IA',
      icon: Sparkles,
      onClick: onOpenChat,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {actions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Button
            variant={action.variant}
            size="sm"
            onClick={action.onClick}
            className="gap-2"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
