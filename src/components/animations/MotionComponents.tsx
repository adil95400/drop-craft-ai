import React, { memo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, useAnimation, Variants } from 'framer-motion';

import { cn } from '@/lib/utils';

// Animation variants
const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const slideInVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const staggerContainerVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Animated components
interface AnimatedComponentProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export const FadeIn = memo(function FadeIn({ 
  children, 
  className, 
  delay = 0, 
  duration = 0.5,
  once = true 
}: AnimatedComponentProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

export const SlideIn = memo(function SlideIn({ 
  children, 
  className, 
  delay = 0,
  direction = 'left'
}: AnimatedComponentProps & { direction?: 'left' | 'right' | 'up' | 'down' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  const variants = {
    left: { x: -30 },
    right: { x: 30 },
    up: { y: -30 },
    down: { y: 30 }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...variants[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

export const ScaleIn = memo(function ScaleIn({ 
  children, 
  className, 
  delay = 0 
}: AnimatedComponentProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

export const StaggerContainer = memo(function StaggerContainer({ 
  children, 
  className 
}: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
});

export const StaggerItem = memo(function StaggerItem({ 
  children, 
  className 
}: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={fadeInVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
});

// Page transition wrapper
export const PageTransition = memo(function PageTransition({ 
  children 
}: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});

// Hover animations
export const HoverScale = memo(function HoverScale({ 
  children, 
  className,
  scale = 1.05 
}: { 
  children: React.ReactNode; 
  className?: string;
  scale?: number;
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

export const HoverLift = memo(function HoverLift({ 
  children, 
  className 
}: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

// Loading animation
export const PulseLoader = memo(function PulseLoader({ 
  className 
}: { className?: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      className={cn("w-4 h-4 bg-primary rounded-full", className)}
    />
  );
});

// Modal animations
export const ModalOverlay = memo(function ModalOverlay({ 
  children, 
  isOpen 
}: { 
  children: React.ReactNode; 
  isOpen: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const ModalContent = memo(function ModalContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("relative", className)}
    >
      {children}
    </motion.div>
  );
});

// Typing animation
export const TypeWriter = memo(function TypeWriter({ 
  text, 
  delay = 100,
  className 
}: { 
  text: string; 
  delay?: number;
  className?: string;
}) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, delay]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-0.5 h-5 bg-current ml-1"
      />
    </span>
  );
});

// Count up animation
export const CountUp = memo(function CountUp({ 
  end, 
  duration = 2,
  className 
}: { 
  end: number; 
  duration?: number;
  className?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      const currentCount = Math.floor(startValue + (end - startValue) * progress);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
    </span>
  );
});

FadeIn.displayName = 'FadeIn';
SlideIn.displayName = 'SlideIn';
ScaleIn.displayName = 'ScaleIn';
StaggerContainer.displayName = 'StaggerContainer';
StaggerItem.displayName = 'StaggerItem';
PageTransition.displayName = 'PageTransition';
HoverScale.displayName = 'HoverScale';
HoverLift.displayName = 'HoverLift';
PulseLoader.displayName = 'PulseLoader';
ModalOverlay.displayName = 'ModalOverlay';
ModalContent.displayName = 'ModalContent';
TypeWriter.displayName = 'TypeWriter';
CountUp.displayName = 'CountUp';