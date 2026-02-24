import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULE_REGISTRY } from '@/config/modules';
import { getSubModuleById } from '@/config/sub-modules';
import { useTranslation } from 'react-i18next';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  className?: string;
  items?: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className, items: customItems }) => {
  const location = useLocation();
  const { t } = useTranslation('navigation');
  
  const getBreadcrumbsFromPath = (): BreadcrumbItem[] => {
    if (customItems) return customItems;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: t('home'), href: '/' }
    ];

    if (pathSegments.length === 0) {
      breadcrumbs[0].isActive = true;
      return breadcrumbs;
    }

    // Try to find module from first segment
    const moduleId = pathSegments[0];
    const module = Object.values(MODULE_REGISTRY).find(
      m => m.route === `/${moduleId}` || m.id === moduleId
    );

    if (module) {
      breadcrumbs.push({
        label: module.name,
        href: module.route,
        isActive: pathSegments.length === 1
      });

      // Check for sub-module
      if (pathSegments.length > 1) {
        const subModulePath = `/${pathSegments.join('/')}`;
        const subModule = getSubModuleById(pathSegments[1]);
        
        if (subModule) {
          breadcrumbs.push({
            label: subModule.name,
            href: subModulePath,
            isActive: true
          });
        } else {
          // Fallback: use path segment as label
          breadcrumbs.push({
            label: pathSegments[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            href: subModulePath,
            isActive: true
          });
        }
      }
    } else {
      // Fallback: create breadcrumbs from path segments
      pathSegments.forEach((segment, index) => {
        const href = '/' + pathSegments.slice(0, index + 1).join('/');
        breadcrumbs.push({
          label: segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          href,
          isActive: index === pathSegments.length - 1
        });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbsFromPath();

  return (
    <nav
      aria-label={t('breadcrumb')}
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
          {item.isActive ? (
            <span className="font-medium text-foreground flex items-center gap-1.5">
              {index === 0 && <Home className="h-4 w-4" />}
              {item.label}
            </span>
          ) : (
            <Link
              to={item.href || '#'}
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              {index === 0 && <Home className="h-4 w-4" />}
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Hook utilitaire pour gérer les breadcrumbs personnalisés
export const useBreadcrumbs = (items: BreadcrumbItem[]) => {
  return { items };
};