import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

// Stagger container for list animations
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className, staggerDelay = 0.1 }: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

// Stagger item for list children
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

// Hover scale effect
interface HoverScaleProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export function HoverScale({ children, className, scale = 1.02 }: HoverScaleProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
}

// Fade in on mount
interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeIn({ children, className, delay = 0, direction = 'up' }: FadeInProps) {
  const directionMap = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
    none: {},
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// Presence animation wrapper
interface AnimatedPresenceProps {
  children: React.ReactNode;
  className?: string;
  isVisible: boolean;
}

export function AnimatedPresenceWrapper({ children, className, isVisible }: AnimatedPresenceProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className={className}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Pulse effect for notifications/badges
interface PulseProps {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
}

export function Pulse({ children, className, isActive = true }: PulseProps) {
  if (!isActive) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Success checkmark animation
export function SuccessCheckmark({ className }: { className?: string }) {
  return (
    <motion.svg
      className={cn('w-6 h-6 text-success', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </motion.svg>
  );
}

// Loading spinner with better animation
export function LoadingSpinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      className={cn(sizes[size], 'border-2 border-primary/20 border-t-primary rounded-full', className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// Counter animation for numbers
interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({ value, className, duration = 1 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const startTime = performance.now();
    const startValue = displayValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
}

// Ripple effect on click
interface RippleProps {
  children: React.ReactNode;
  className?: string;
}

export function Ripple({ children, className }: RippleProps) {
  const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  };

  return (
    <div className={cn('relative overflow-hidden', className)} onClick={handleClick}>
      {children}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute bg-foreground/20 rounded-full pointer-events-none"
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.5 }}
            animate={{ width: 200, height: 200, x: -100, y: -100, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
