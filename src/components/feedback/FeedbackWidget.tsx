import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Bug, 
  Lightbulb, 
  ThumbsUp, 
  Star,
  Send,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFeedback } from '@/hooks/useFeedback';
import { cn } from '@/lib/utils';

interface FeedbackWidgetProps {
  className?: string;
}

type FeedbackType = 'bug' | 'feature' | 'satisfaction' | 'general';

export function FeedbackWidget({ className }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'details' | 'success'>('type');
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const { isSubmitting, submitFeedback } = useFeedback();

  const feedbackTypes = [
    { type: 'bug' as const, icon: Bug, label: 'Signaler un bug', color: 'text-destructive' },
    { type: 'feature' as const, icon: Lightbulb, label: 'Suggérer une idée', color: 'text-warning' },
    { type: 'satisfaction' as const, icon: ThumbsUp, label: 'Donner votre avis', color: 'text-success' },
    { type: 'general' as const, icon: MessageSquare, label: 'Autre feedback', color: 'text-info' },
  ];

  const handleTypeSelect = (type: FeedbackType) => {
    setFeedbackType(type);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!feedbackType || !message.trim()) return;

    const success = await submitFeedback({
      type: feedbackType,
      rating: feedbackType === 'satisfaction' ? rating : undefined,
      message,
    });

    if (success) {
      setStep('success');
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 2000);
    }
  };

  const resetForm = () => {
    setStep('type');
    setFeedbackType(null);
    setRating(0);
    setMessage('');
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  return (
    <>
      {/* Trigger button - positioned higher on mobile to avoid bottom nav overlap */}
      <motion.button
        className={cn(
          'fixed bottom-24 md:bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center',
          'hover:shadow-xl transition-shadow',
          className
        )}
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Donner votre feedback"
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>

      {/* Feedback modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Modal - positioned higher on mobile */}
            <motion.div
              className="fixed bottom-40 md:bottom-24 right-6 z-50 w-80 bg-card rounded-xl shadow-xl border overflow-hidden max-h-[70vh] overflow-y-auto"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Votre feedback</h3>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {step === 'type' && (
                    <motion.div
                      key="type"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-3"
                    >
                      <p className="text-sm text-muted-foreground mb-4">
                        Comment pouvons-nous vous aider ?
                      </p>
                      {feedbackTypes.map((item) => (
                        <motion.button
                          key={item.type}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                          onClick={() => handleTypeSelect(item.type)}
                          whileHover={{ x: 4 }}
                        >
                          <item.icon className={cn('h-5 w-5', item.color)} />
                          <span className="font-medium">{item.label}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}

                  {step === 'details' && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {feedbackType === 'satisfaction' && (
                        <div>
                          <Label className="text-sm mb-2 block">Votre note</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <motion.button
                                key={star}
                                onClick={() => setRating(star)}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Star
                                  className={cn(
                                    'h-8 w-8 transition-colors',
                                    star <= rating
                                      ? 'text-warning fill-warning'
                                      : 'text-muted-foreground'
                                  )}
                                />
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="feedback-message" className="text-sm mb-2 block">
                          {feedbackType === 'bug' && 'Décrivez le problème rencontré'}
                          {feedbackType === 'feature' && 'Décrivez votre idée'}
                          {feedbackType === 'satisfaction' && 'Un commentaire ? (optionnel)'}
                          {feedbackType === 'general' && 'Votre message'}
                        </Label>
                        <Textarea
                          id="feedback-message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Écrivez ici..."
                          className="min-h-[100px] resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setStep('type');
                            setFeedbackType(null);
                          }}
                          className="flex-1"
                        >
                          Retour
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={!message.trim() || isSubmitting}
                          className="flex-1"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Envoyer
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                      >
                        <ThumbsUp className="h-12 w-12 text-success mx-auto mb-4" />
                      </motion.div>
                      <h4 className="font-semibold mb-2">Merci !</h4>
                      <p className="text-sm text-muted-foreground">
                        Votre feedback a été envoyé avec succès.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
