import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useSpring, useTransform } from 'framer-motion';

import { cn } from '@/lib/utils';

// Magnetic button with cursor following
export const MagneticButton = memo(function MagneticButton({
  children,
  className,
  strength = 0.3,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  strength?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    
    x.set(deltaX);
    y.set(deltaY);
  }, [x, y, strength]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative overflow-hidden transition-colors duration-200",
        className
      )}
      type={props.type}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-primary/10 rounded-inherit"
      />
      {children}
    </motion.button>
  );
});

// Parallax scroll component
export const ParallaxScroll = memo(function ParallaxScroll({
  children,
  offset = 50,
  className
}: {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const y = useTransform(
    useSpring(scrollY),
    (value) => value * offset * 0.01
  );

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

// Morphing shapes
export const MorphingBlob = memo(function MorphingBlob({
  className,
  animate = true
}: {
  className?: string;
  animate?: boolean;
}) {
  const controls = useAnimation();

  useEffect(() => {
    if (!animate) return;

    const morphAnimation = async () => {
      await controls.start({
        d: "M60,-60C80,-40,100,-20,100,0C100,20,80,40,60,60C40,80,20,100,0,100C-20,100,-40,80,-60,60C-80,40,-100,20,-100,0C-100,-20,-80,-40,-60,-60C-40,-80,-20,-100,0,-100C20,-100,40,-80,60,-60Z",
        transition: { duration: 4, ease: "easeInOut" }
      });
      await controls.start({
        d: "M80,-80C100,-60,120,-30,120,0C120,30,100,60,80,80C60,100,30,120,0,120C-30,120,-60,100,-80,80C-100,60,-120,30,-120,0C-120,-30,-100,-60,-80,-80C-60,-100,-30,-120,0,-120C30,-120,60,-100,80,-80Z",
        transition: { duration: 4, ease: "easeInOut" }
      });
    };

    const interval = setInterval(morphAnimation, 8000);
    morphAnimation();

    return () => clearInterval(interval);
  }, [controls, animate]);

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          animate={controls}
          fill="currentColor"
          initial={{
            d: "M60,-60C80,-40,100,-20,100,0C100,20,80,40,60,60C40,80,20,100,0,100C-20,100,-40,80,-60,60C-80,40,-100,20,-100,0C-100,-20,-80,-40,-60,-60C-40,-80,-20,-100,0,-100C20,-100,40,-80,60,-60Z"
          }}
          transform="translate(100 100)"
        />
      </svg>
    </div>
  );
});

// Floating elements
export const FloatingElement = memo(function FloatingElement({
  children,
  className,
  amplitude = 20,
  duration = 3
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
}) {
  return (
    <motion.div
      animate={{
        y: [-amplitude, amplitude, -amplitude],
        rotate: [-2, 2, -2]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

// Reveal on scroll
export const RevealOnScroll = memo(function RevealOnScroll({
  children,
  className,
  direction = 'up',
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const variants = {
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
    left: { x: 50, opacity: 0 },
    right: { x: -50, opacity: 0 }
  };

  return (
    <motion.div
      ref={ref}
      initial={variants[direction]}
      animate={isVisible ? { x: 0, y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

// Spotlight effect
export const SpotlightCard = memo(function SpotlightCard({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 opacity-0 bg-gradient-radial from-primary/20 via-primary/10 to-transparent"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(var(--primary-rgb), 0.2), transparent 40%)`
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </div>
  );
});

// Text reveal animation
export const TextReveal = memo(function TextReveal({
  text,
  className,
  delay = 0
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(' ');

  return (
    <motion.div className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + index * 0.1,
            ease: "easeOut"
          }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
});

MagneticButton.displayName = 'MagneticButton';
ParallaxScroll.displayName = 'ParallaxScroll';
MorphingBlob.displayName = 'MorphingBlob';
FloatingElement.displayName = 'FloatingElement';
RevealOnScroll.displayName = 'RevealOnScroll';
SpotlightCard.displayName = 'SpotlightCard';
TextReveal.displayName = 'TextReveal';