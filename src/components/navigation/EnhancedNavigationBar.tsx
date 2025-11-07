import React from 'react';
import { NavigationBreadcrumbs } from './NavigationBreadcrumbs';
import { QuickNavigationBar } from './QuickNavigationBar';
import { ModuleNavigationMenu } from './ModuleNavigationMenu';
import { MobileNavigationMenu } from './MobileNavigationMenu';
import { cn } from '@/lib/utils';

interface EnhancedNavigationBarProps {
  className?: string;
  showBreadcrumbs?: boolean;
  showQuickNav?: boolean;
  showModuleMenu?: boolean;
}

export function EnhancedNavigationBar({
  className,
  showBreadcrumbs = true,
  showQuickNav = true,
  showModuleMenu = true,
}: EnhancedNavigationBarProps) {
  return (
    <div className={cn('border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      <div className="flex h-14 items-center gap-4 px-4">
        {/* Menu mobile */}
        <MobileNavigationMenu />

        {/* Navigation par modules (desktop) */}
        {showModuleMenu && <ModuleNavigationMenu />}

        {/* Breadcrumbs */}
        {showBreadcrumbs && (
          <div className="hidden md:flex flex-1">
            <NavigationBreadcrumbs />
          </div>
        )}

        {/* Quick navigation search */}
        {showQuickNav && (
          <div className="ml-auto w-full max-w-xs">
            <QuickNavigationBar />
          </div>
        )}
      </div>
    </div>
  );
}
