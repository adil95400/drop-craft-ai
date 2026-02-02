/**
 * Tablet-Optimized Dashboard Layout
 * Responsive adjustments for 768px-1024px viewports
 */
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

interface TabletOptimizedGridProps {
  children: ReactNode;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

const gapSizes = {
  sm: 'gap-3',
  md: 'gap-4 md:gap-5',
  lg: 'gap-4 md:gap-6',
};

export function TabletOptimizedGrid({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
}: TabletOptimizedGridProps) {
  const { isTablet } = useResponsive();

  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${columns.mobile}`,
        `md:grid-cols-${columns.tablet}`,
        `lg:grid-cols-${columns.desktop}`,
        gapSizes[gap],
        // Tablet-specific adjustments
        isTablet && 'px-2',
        className
      )}
    >
      {children}
    </div>
  );
}

// Widget wrapper with tablet-optimized sizing
interface TabletWidgetWrapperProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  priority?: 'high' | 'medium' | 'low';
}

export function TabletWidgetWrapper({
  children,
  size = 'md',
  className,
  priority = 'medium',
}: TabletWidgetWrapperProps) {
  const { isTablet, isMobile } = useResponsive();

  const sizeClasses = {
    sm: 'col-span-1',
    md: cn(
      'col-span-1',
      !isMobile && 'md:col-span-1',
      !isMobile && !isTablet && 'lg:col-span-1'
    ),
    lg: cn(
      'col-span-1',
      !isMobile && 'md:col-span-2',
      !isMobile && !isTablet && 'lg:col-span-2'
    ),
    full: 'col-span-full',
  };

  // On tablet, hide low priority widgets or stack them
  const visibilityClass =
    isTablet && priority === 'low' ? 'hidden lg:block' : '';

  return (
    <div className={cn(sizeClasses[size], visibilityClass, className)}>
      {children}
    </div>
  );
}

// Tablet-optimized stats row
interface TabletStatsRowProps {
  children: ReactNode;
  className?: string;
}

export function TabletStatsRow({ children, className }: TabletStatsRowProps) {
  const { isTablet, isMobile } = useResponsive();

  return (
    <div
      className={cn(
        'grid gap-3',
        // Mobile: 2 columns
        'grid-cols-2',
        // Tablet: 2 columns with larger cards
        isTablet && 'md:grid-cols-2 md:gap-4',
        // Desktop: 4 columns
        !isTablet && !isMobile && 'lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

// Tablet sidebar layout
interface TabletSidebarLayoutProps {
  main: ReactNode;
  sidebar: ReactNode;
  className?: string;
  sidebarPosition?: 'left' | 'right';
  collapseSidebarOnTablet?: boolean;
}

export function TabletSidebarLayout({
  main,
  sidebar,
  className,
  sidebarPosition = 'right',
  collapseSidebarOnTablet = true,
}: TabletSidebarLayoutProps) {
  const { isTablet } = useResponsive();

  if (isTablet && collapseSidebarOnTablet) {
    // Stack layout on tablet
    return (
      <div className={cn('flex flex-col gap-6', className)}>
        <div className="w-full">{main}</div>
        <div className="w-full">{sidebar}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-6',
        'grid-cols-1 lg:grid-cols-3',
        className
      )}
    >
      <div
        className={cn(
          'lg:col-span-2',
          sidebarPosition === 'left' && 'lg:order-2'
        )}
      >
        {main}
      </div>
      <div
        className={cn(
          'lg:col-span-1',
          sidebarPosition === 'left' && 'lg:order-1'
        )}
      >
        {sidebar}
      </div>
    </div>
  );
}

// Tablet-optimized card with touch-friendly sizing
interface TabletCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function TabletCard({
  children,
  className,
  onClick,
  interactive = false,
}: TabletCardProps) {
  const { isTablet, isMobile } = useResponsive();

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-border bg-card',
        // Tablet-optimized padding
        'p-4',
        isTablet && 'md:p-5',
        !isTablet && !isMobile && 'lg:p-6',
        // Touch-friendly tap targets
        interactive && 'cursor-pointer',
        interactive && 'active:scale-[0.98] transition-transform',
        interactive && (isTablet || isMobile) && 'min-h-[64px]',
        className
      )}
    >
      {children}
    </div>
  );
}

// Tablet-optimized action bar
interface TabletActionBarProps {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}

export function TabletActionBar({
  children,
  className,
  sticky = false,
}: TabletActionBarProps) {
  const { isTablet, isMobile } = useResponsive();

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        // Responsive gap
        isTablet && 'md:gap-3',
        !isTablet && !isMobile && 'lg:gap-4',
        // Sticky behavior
        sticky && 'sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4',
        className
      )}
    >
      {children}
    </div>
  );
}

// Responsive text that scales on tablet
interface ResponsiveTextProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

export function ResponsiveText({
  children,
  as: Component = 'p',
  size = 'base',
  className,
}: ResponsiveTextProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs md:text-sm',
    base: 'text-sm md:text-base',
    lg: 'text-base md:text-lg',
    xl: 'text-lg md:text-xl',
    '2xl': 'text-xl md:text-2xl',
    '3xl': 'text-2xl md:text-3xl',
  };

  return (
    <Component className={cn(sizeClasses[size], className)}>
      {children}
    </Component>
  );
}

// Hook for tablet-specific behavior
export function useTabletLayout() {
  const { isTablet, isMobile, isDesktop, width } = useResponsive();

  return {
    isTablet,
    isMobile,
    isDesktop,
    screenWidth: width,
    // Tablet-specific helpers
    showCompactView: isTablet || isMobile,
    showFullSidebar: isDesktop,
    gridColumns: isMobile ? 1 : isTablet ? 2 : 3,
    cardPadding: isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6',
    touchTarget: isMobile || isTablet ? 'min-h-[44px]' : '',
  };
}
