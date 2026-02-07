/**
 * StickyCtaBar - Barre CTA collante pour améliorer la conversion
 * Apparaît après scroll de 400px pour capturer les visiteurs qui scrollent
 */
import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, ArrowRight, X, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export const StickyCtaBar = memo(() => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('sticky-cta-dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show after scrolling 400px
      setIsVisible(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('sticky-cta-dismissed', 'true');
    } catch {
      // Ignore storage errors
    }
  };

  if (isDismissed) return null;

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { y: 100, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: 100, opacity: 0 },
        transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
      };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          {...motionProps}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-md shadow-2xl shadow-black/20"
        >
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Left: Value proposition */}
              <div className="flex items-center gap-2 sm:gap-4 text-center sm:text-left">
                <div className="hidden sm:flex items-center gap-2">
                  <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
                    <Clock className="h-3 w-3 mr-1" />
                    Offre limitée
                  </Badge>
                </div>
                <p className="text-sm sm:text-base font-medium">
                  <Sparkles className="h-4 w-4 inline mr-1 text-primary" />
                  <span className="hidden md:inline">Automatisez votre e-commerce aujourd'hui - </span>
                  <span className="text-primary font-bold">14 jours gratuits</span>
                </p>
              </div>

              {/* Right: CTAs */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs sm:text-sm"
                  onClick={() => navigate('/dashboard')}
                >
                  Voir démo
                </Button>
                <Button
                  size="sm"
                  className="text-xs sm:text-sm group"
                  onClick={() => {
                    try { localStorage.setItem('pending_trial', 'true'); } catch {}
                    navigate('/auth?trial=true');
                  }}
                >
                  <Crown className="h-3.5 w-3.5 mr-1.5" />
                  Essai gratuit
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleDismiss}
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

StickyCtaBar.displayName = 'StickyCtaBar';
