import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, Send, AlertCircle, HelpCircle, Bug, Lightbulb, 
  Mail, Sparkles, CheckCircle2, Clock, Zap, AlertTriangle,
  FileText, Info
} from 'lucide-react';
import { useSupportTickets, CreateTicketData } from '@/hooks/useSupportTickets';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const ticketSchema = z.object({
  subject: z.string().min(5, 'Le sujet doit contenir au moins 5 caractères').max(100, 'Maximum 100 caractères'),
  message: z.string().min(20, 'Le message doit contenir au moins 20 caractères').max(2000, 'Maximum 2000 caractères'),
  category: z.string().min(1, 'Veuillez sélectionner une catégorie'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { value: 'general', label: 'Question générale', icon: HelpCircle, description: 'Informations, fonctionnalités', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/50' },
  { value: 'technical', label: 'Problème technique', icon: Bug, description: 'Bugs, erreurs, dysfonctionnements', color: 'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-500/50' },
  { value: 'billing', label: 'Facturation', icon: AlertCircle, description: 'Paiements, abonnements', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-500/50' },
  { value: 'feature', label: 'Suggestion', icon: Lightbulb, description: 'Idées, améliorations', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500/50' },
];

const priorities = [
  { value: 'low', label: 'Basse', icon: Clock, description: 'Réponse sous 48h', color: 'bg-muted hover:bg-muted/80 border-border', activeColor: 'bg-slate-500/10 border-slate-500 text-slate-600' },
  { value: 'medium', label: 'Moyenne', icon: CheckCircle2, description: 'Réponse sous 24h', color: 'bg-muted hover:bg-muted/80 border-border', activeColor: 'bg-blue-500/10 border-blue-500 text-blue-600' },
  { value: 'high', label: 'Haute', icon: Zap, description: 'Réponse sous 12h', color: 'bg-muted hover:bg-muted/80 border-border', activeColor: 'bg-orange-500/10 border-orange-500 text-orange-600' },
  { value: 'urgent', label: 'Urgente', icon: AlertTriangle, description: 'Réponse sous 4h', color: 'bg-muted hover:bg-muted/80 border-border', activeColor: 'bg-red-500/10 border-red-500 text-red-600' },
];

export function CreateTicketDialog({ open, onOpenChange }: CreateTicketDialogProps) {
  const { createTicket, isCreatingTicket } = useSupportTickets();
  const [step, setStep] = useState(1);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      message: '',
      category: '',
      priority: 'medium',
      email: '',
    },
  });

  const watchedMessage = useWatch({ control: form.control, name: 'message' });
  const watchedSubject = useWatch({ control: form.control, name: 'subject' });
  const watchedCategory = useWatch({ control: form.control, name: 'category' });
  const watchedPriority = useWatch({ control: form.control, name: 'priority' });

  const messageLength = watchedMessage?.length || 0;
  const subjectLength = watchedSubject?.length || 0;
  
  // Calculate form completion percentage
  const completionPercentage = [
    watchedCategory ? 25 : 0,
    subjectLength >= 5 ? 25 : 0,
    messageLength >= 20 ? 25 : 0,
    watchedPriority ? 25 : 0,
  ].reduce((a, b) => a + b, 0);

  const onSubmit = (data: TicketFormData) => {
    createTicket(data as CreateTicketData, {
      onSuccess: () => {
        form.reset();
        setStep(1);
        onOpenChange(false);
      },
    });
  };

  const handleClose = () => {
    form.reset();
    setStep(1);
    onOpenChange(false);
  };

  const selectedCategory = categories.find(c => c.value === watchedCategory);
  const selectedPriority = priorities.find(p => p.value === watchedPriority);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border-b">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                <Send className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl">Créer un ticket de support</DialogTitle>
                <DialogDescription className="mt-1">
                  Notre équipe vous répondra dans les plus brefs délais.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {/* Progress bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium text-primary">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    <FileText className="h-4 w-4 text-primary" />
                    Type de demande
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <AnimatePresence>
                      {categories.map((cat, index) => {
                        const Icon = cat.icon;
                        const isSelected = field.value === cat.value;
                        return (
                          <motion.button
                            key={cat.value}
                            type="button"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => field.onChange(cat.value)}
                            className={cn(
                              "relative p-4 rounded-xl border-2 transition-all text-left overflow-hidden group",
                              isSelected
                                ? `bg-gradient-to-br ${cat.color} border-primary shadow-md`
                                : "border-border hover:border-primary/30 bg-card hover:bg-muted/50"
                            )}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="categoryCheck"
                                className="absolute top-2 right-2"
                              >
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              </motion.div>
                            )}
                            <Icon className={cn(
                              "h-5 w-5 mb-2 transition-colors",
                              isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                            )} />
                            <div className={cn(
                              "font-medium text-sm transition-colors",
                              isSelected ? "text-foreground" : "text-foreground"
                            )}>
                              {cat.label}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {cat.description}
                            </div>
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Subject Input */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-2 text-base font-semibold">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Sujet
                    </FormLabel>
                    <span className={cn(
                      "text-xs transition-colors",
                      subjectLength > 80 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      {subjectLength}/100
                    </span>
                  </div>
                  <FormControl>
                    <Input 
                      placeholder="Décrivez brièvement votre demande..." 
                      className="h-11 text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message Textarea */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-2 text-base font-semibold">
                      <Mail className="h-4 w-4 text-primary" />
                      Description détaillée
                    </FormLabel>
                    <span className={cn(
                      "text-xs transition-colors",
                      messageLength < 20 ? "text-amber-500" : 
                      messageLength > 1800 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      {messageLength}/2000
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Expliquez votre problème en détail. Plus vous êtes précis, plus nous pourrons vous aider rapidement..."
                      className="min-h-[140px] resize-none text-base leading-relaxed"
                      {...field}
                    />
                  </FormControl>
                  {messageLength < 20 && messageLength > 0 && (
                    <p className="text-xs text-amber-500 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Encore {20 - messageLength} caractères requis
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority Selection */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    <Zap className="h-4 w-4 text-primary" />
                    Niveau de priorité
                  </FormLabel>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {priorities.map((p) => {
                      const Icon = p.icon;
                      const isSelected = field.value === p.value;
                      return (
                        <motion.button
                          key={p.value}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => field.onChange(p.value)}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 text-center",
                            isSelected ? p.activeColor : p.color
                          )}
                        >
                          <Icon className={cn(
                            "h-4 w-4",
                            isSelected ? "" : "text-muted-foreground"
                          )} />
                          <span className="text-xs font-medium">{p.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  {selectedPriority && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-muted-foreground flex items-center gap-1 mt-2"
                    >
                      <Clock className="h-3 w-3" />
                      {selectedPriority.description}
                    </motion.p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Summary & Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {selectedCategory && (
                  <Badge variant="outline" className="text-xs">
                    {selectedCategory.label}
                  </Badge>
                )}
                {selectedPriority && (
                  <Badge variant="outline" className={cn("text-xs", selectedPriority.activeColor)}>
                    {selectedPriority.label}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleClose}
                  className="px-6"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreatingTicket || completionPercentage < 100}
                  className="px-6 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
                >
                  {isCreatingTicket ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Créer le ticket
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
