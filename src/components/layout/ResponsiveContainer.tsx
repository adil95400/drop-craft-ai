import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
  return (
    <div className={cn('container mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
      {children}
    </div>
  );
}
