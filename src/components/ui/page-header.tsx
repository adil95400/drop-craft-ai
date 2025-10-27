import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, badge, children }: PageHeaderProps) {
  return (
    <header className="border-b glass sticky top-0 z-40 animate-slide-in-left">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-heading font-bold text-gradient-primary">
                {title}
              </h1>
              {badge && (
                <Badge variant="secondary" className="px-3 py-1 animate-scale-in">
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-muted-foreground text-lg max-w-2xl">
                {description}
              </p>
            )}
          </div>
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </div>
    </header>
  );
}