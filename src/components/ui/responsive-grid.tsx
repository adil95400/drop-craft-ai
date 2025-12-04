import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

const gapClasses = {
  sm: 'gap-2 sm:gap-3',
  md: 'gap-3 sm:gap-4 lg:gap-6',
  lg: 'gap-4 sm:gap-6 lg:gap-8',
};

export function ResponsiveGrid({ 
  children, 
  className,
  cols = { default: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gridCols = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn('grid', gridCols, gapClasses[gap], className)}>
      {children}
    </div>
  );
}

// Stat cards grid optimized for mobile
export function StatsGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4',
      className
    )}>
      {children}
    </div>
  );
}

// Dashboard cards grid
export function DashboardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6',
      className
    )}>
      {children}
    </div>
  );
}

// Product cards grid
export function ProductGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4',
      className
    )}>
      {children}
    </div>
  );
}

// Action buttons row - stacks on mobile
export function ActionRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row gap-2 sm:gap-3',
      className
    )}>
      {children}
    </div>
  );
}

// Page header with responsive title and actions
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6', className)}>
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// Mobile-friendly stat card
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export function MobileStatCard({ title, value, change, changeType = 'neutral', icon, className }: StatCardProps) {
  const changeColor = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground',
  }[changeType];

  return (
    <div className={cn(
      'bg-card border rounded-lg p-3 sm:p-4 space-y-1 sm:space-y-2',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-muted-foreground truncate">{title}</span>
        {icon && <div className="text-muted-foreground flex-shrink-0">{icon}</div>}
      </div>
      <div className="text-lg sm:text-2xl font-bold truncate">{value}</div>
      {change && (
        <div className={cn('text-xs sm:text-sm', changeColor)}>{change}</div>
      )}
    </div>
  );
}
