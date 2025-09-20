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
    <div className="border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {title}
              </h1>
              {badge && (
                <Badge variant="secondary" className="px-3 py-1">
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
          {children}
        </div>
      </div>
    </div>
  );
}