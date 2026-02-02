/**
 * Import Success Animation Component
 * Celebratory animation shown after successful product imports
 */
import { motion, AnimatePresence, type Easing } from 'framer-motion';
import { CheckCircle2, Sparkles, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ImportSuccessAnimationProps {
  isVisible: boolean;
  productCount: number;
  productName?: string;
  onViewProducts?: () => void;
  onContinue?: () => void;
  onClose?: () => void;
  className?: string;
}

export function ImportSuccessAnimation({
  isVisible,
  productCount,
  productName,
  onViewProducts,
  onContinue,
  onClose,
  className,
}: ImportSuccessAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  const confettiColors = [
    'hsl(var(--primary))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--info))',
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            'bg-background/80 backdrop-blur-md',
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Confetti particles (if motion enabled) */}
          {!prefersReducedMotion && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: confettiColors[i % confettiColors.length],
                    left: `${Math.random() * 100}%`,
                    top: '-10%',
                  }}
                  initial={{ y: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    y: '120vh',
                    opacity: [1, 1, 0],
                    rotate: Math.random() * 720 - 360,
                    x: Math.random() * 200 - 100,
                  }}
                  transition={{
                    duration: 2.5 + Math.random() * 1.5,
                    delay: Math.random() * 0.5,
                    ease: 'easeIn',
                  }}
                />
              ))}
            </div>
          )}

          {/* Main content */}
          <motion.div
            className="relative bg-card border border-border rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            transition={prefersReducedMotion ? { duration: 0.15 } : { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success icon with glow */}
            <motion.div
              className="relative mx-auto w-24 h-24 mb-6"
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, rotate: -180 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.15 }
                  : { type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }
              }
            >
              <div className="absolute inset-0 bg-success/20 rounded-full blur-xl" />
              <div className="relative w-full h-full bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-success-foreground" />
              </div>
              
              {/* Sparkle decorations */}
              {!prefersReducedMotion && (
                <>
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 15, -15, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-warning" />
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-1 -left-3"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, -15, 15, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.5,
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                </>
              )}
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-2xl font-bold text-center mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              Import réussi !
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-muted-foreground text-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              {productCount > 1 ? (
                <>
                  <span className="font-semibold text-foreground">{productCount} produits</span> ont été ajoutés à votre catalogue
                </>
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    {productName ? `"${productName.slice(0, 30)}${productName.length > 30 ? '...' : ''}"` : '1 produit'}
                  </span>{' '}
                  a été ajouté à votre catalogue
                </>
              )}
            </motion.p>

            {/* Stats preview */}
            <motion.div
              className="flex items-center justify-center gap-4 mb-6 p-4 bg-muted/50 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{productCount} importé{productCount > 1 ? 's' : ''}</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">Prêt à vendre</span>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Button
                variant="outline"
                className="flex-1"
                onClick={onContinue || onClose}
              >
                Continuer l'import
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                onClick={onViewProducts}
              >
                Voir les produits
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
