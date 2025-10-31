import React, { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileOptimizedLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MobileOptimizedLayout({ children, className = '' }: MobileOptimizedLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div 
      className={`
        w-full max-w-full 
        ${isMobile ? 'px-3 py-4' : 'px-4 sm:px-6 lg:px-8 py-6'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface MobileSectionProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function MobileSection({ children, className = '', title }: MobileSectionProps) {
  const isMobile = useIsMobile();

  return (
    <section className={`mb-4 sm:mb-6 ${className}`}>
      {title && (
        <h2 className={`
          font-semibold mb-3 sm:mb-4
          ${isMobile ? 'text-base' : 'text-lg sm:text-xl'}
        `}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileCard({ children, className = '', onClick }: MobileCardProps) {
  const isMobile = useIsMobile();

  return (
    <div 
      className={`
        rounded-lg border bg-card text-card-foreground shadow-sm
        transition-all duration-200
        ${isMobile ? 'p-3' : 'p-4 sm:p-6'}
        ${onClick ? 'cursor-pointer hover:shadow-md active:scale-98' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface MobileGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function MobileGrid({ children, className = '', cols = 2 }: MobileGridProps) {
  const isMobile = useIsMobile();

  const gridCols = isMobile 
    ? 'grid-cols-1' 
    : cols === 1 
      ? 'grid-cols-1'
      : cols === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : cols === 3
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className={`
      grid ${gridCols}
      gap-3 sm:gap-4 lg:gap-6
      ${className}
    `}>
      {children}
    </div>
  );
}

interface MobileButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MobileButton({ 
  children, 
  onClick, 
  variant = 'primary',
  fullWidth = false,
  className = '',
  size = 'md'
}: MobileButtonProps) {
  const isMobile = useIsMobile();

  const sizeClasses = isMobile
    ? size === 'sm' ? 'h-9 px-3 text-xs' : size === 'lg' ? 'h-12 px-5 text-base' : 'h-10 px-4 text-sm'
    : size === 'sm' ? 'h-9 px-3 text-sm' : size === 'lg' ? 'h-11 px-8 text-base' : 'h-10 px-4 text-sm';

  const variantClasses = 
    variant === 'primary' 
      ? 'bg-primary text-primary-foreground hover:opacity-90'
      : variant === 'secondary'
        ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        rounded-md font-medium
        transition-all duration-200
        active:scale-95
        disabled:pointer-events-none disabled:opacity-50
        ${sizeClasses}
        ${variantClasses}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
