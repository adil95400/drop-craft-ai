import { motion } from 'framer-motion';
import { memo } from 'react';

import { cn } from '@/lib/utils';

// Loading animations
export const SpinnerLoader = memo(function SpinnerLoader({
  size = 'md',
  className
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <motion.div
      className={cn(
        "border-2 border-muted border-t-primary rounded-full",
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
});

export const DotsLoader = memo(function DotsLoader({
  className
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  );
});

export const PulseLoader = memo(function PulseLoader({
  className
}: {
  className?: string;
}) {
  return (
    <motion.div
      className={cn("w-4 h-4 bg-primary rounded-full", className)}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
});

export const BarLoader = memo(function BarLoader({
  className
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2, 3].map((index) => (
        <motion.div
          key={index}
          className="w-1 h-6 bg-primary rounded-full"
          animate={{
            height: [24, 8, 24]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  );
});

export const SkeletonPulse = memo(function SkeletonPulse({
  className,
  children
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      className={cn("bg-muted rounded", className)}
      animate={{
        opacity: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
});

// Success/Error animations
export const CheckmarkAnimation = memo(function CheckmarkAnimation({
  className,
  size = 'md'
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      className={cn("relative", sizeClasses[size], className)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full h-full"
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4 }}
        />
        <motion.path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />
      </motion.svg>
    </motion.div>
  );
});

export const ErrorAnimation = memo(function ErrorAnimation({
  className,
  size = 'md'
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      className={cn("relative text-destructive", sizeClasses[size], className)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full h-full"
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4 }}
        />
        <motion.path
          d="M15 9l-6 6M9 9l6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />
      </motion.svg>
    </motion.div>
  );
});

// Number counting animation
export const AnimatedNumber = memo(function AnimatedNumber({
  value,
  duration = 2,
  className
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
});

// Progress bar animation
export const AnimatedProgressBar = memo(function AnimatedProgressBar({
  progress,
  className,
  showLabel = false
}: {
  progress: number;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <motion.div
          className="text-xs text-muted-foreground mt-1 text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {progress}%
        </motion.div>
      )}
    </div>
  );
});

SpinnerLoader.displayName = 'SpinnerLoader';
DotsLoader.displayName = 'DotsLoader';
PulseLoader.displayName = 'PulseLoader';
BarLoader.displayName = 'BarLoader';
SkeletonPulse.displayName = 'SkeletonPulse';
CheckmarkAnimation.displayName = 'CheckmarkAnimation';
ErrorAnimation.displayName = 'ErrorAnimation';
AnimatedNumber.displayName = 'AnimatedNumber';
AnimatedProgressBar.displayName = 'AnimatedProgressBar';