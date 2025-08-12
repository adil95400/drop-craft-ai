import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Micro-interaction button
export const MicroButton = memo(function MicroButton({
  children,
  className,
  variant = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'outline';
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setIsPressed(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const newRipple = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
    
    props.onMouseDown?.(e);
  }, [props]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <Button
      {...props}
      variant={variant as any}
      className={cn("relative overflow-hidden", className)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <motion.div
        animate={{
          scale: isPressed ? 0.95 : 1
        }}
        transition={{ duration: 0.1 }}
      >
        {children}
      </motion.div>
      
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x - 20,
              top: ripple.y - 20,
              width: 40,
              height: 40
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        ))}
      </AnimatePresence>
    </Button>
  );
});

// Hover card with micro-interactions
export const HoverCard = memo(function HoverCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  }, []);

  return (
    <Card
      {...props}
      className={cn("relative overflow-hidden transition-all duration-300", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(var(--primary-rgb, 59 130 246), 0.1) 0%, transparent 50%)`
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Border glow */}
      <motion.div
        className="absolute inset-0 rounded-inherit"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(var(--primary-rgb, 59 130 246), 0.5), transparent)`
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isHovered ? 0.5 : 0,
          scale: isHovered ? 1 : 0.8
        }}
        transition={{ duration: 0.3 }}
      />
      
      <motion.div
        animate={{
          y: isHovered ? -2 : 0,
          scale: isHovered ? 1.02 : 1
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </Card>
  );
});

// Input with focus animations
export const AnimatedInput = memo(function AnimatedInput({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  }, [props]);

  return (
    <div className="relative">
      <input
        {...props}
        className={cn(
          "w-full px-3 py-2 border rounded-md transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "peer",
          className
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={handleChange}
      />
      
      {label && (
        <motion.label
          className="absolute left-3 text-muted-foreground pointer-events-none"
          animate={{
            y: isFocused || hasValue ? -24 : 8,
            scale: isFocused || hasValue ? 0.85 : 1,
            color: isFocused ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {label}
        </motion.label>
      )}
      
      {/* Focus indicator */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-primary"
        initial={{ width: 0 }}
        animate={{ width: isFocused ? '100%' : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </div>
  );
});

// Toggle switch with animations
export const AnimatedToggle = memo(function AnimatedToggle({
  checked,
  onChange,
  className
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <motion.button
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors duration-200",
        checked ? "bg-primary" : "bg-muted",
        className
      )}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
        animate={{
          x: checked ? 24 : 2
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
    </motion.button>
  );
});

// Notification with entrance animation
export const AnimatedNotification = memo(function AnimatedNotification({
  children,
  isVisible,
  onClose,
  className
}: {
  children: React.ReactNode;
  isVisible: boolean;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "fixed top-4 right-4 bg-card border border-border rounded-lg shadow-lg p-4 z-50",
            className
          )}
        >
          {children}
          {onClose && (
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              ×
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// Progress indicator
export const AnimatedProgress = memo(function AnimatedProgress({
  steps,
  currentStep,
  className
}: {
  steps: string[];
  currentStep: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center space-x-4", className)}>
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <motion.div
            className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium",
              index < currentStep
                ? "bg-primary border-primary text-primary-foreground"
                : index === currentStep
                ? "border-primary text-primary"
                : "border-muted text-muted-foreground"
            )}
            initial={{ scale: 0.8 }}
            animate={{ 
              scale: index === currentStep ? 1.1 : 1,
              borderColor: index <= currentStep ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
            }}
            transition={{ duration: 0.3 }}
          >
            {index < currentStep ? '✓' : index + 1}
          </motion.div>
          
          {index < steps.length - 1 && (
            <motion.div
              className="w-12 h-0.5 bg-muted mx-2"
              initial={{ scaleX: 0 }}
              animate={{ 
                scaleX: index < currentStep ? 1 : 0,
                backgroundColor: index < currentStep ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
          )}
        </div>
      ))}
    </div>
  );
});

MicroButton.displayName = 'MicroButton';
HoverCard.displayName = 'HoverCard';
AnimatedInput.displayName = 'AnimatedInput';
AnimatedToggle.displayName = 'AnimatedToggle';
AnimatedNotification.displayName = 'AnimatedNotification';
AnimatedProgress.displayName = 'AnimatedProgress';