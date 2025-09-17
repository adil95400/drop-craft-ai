import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AdminBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getBreadcrumbName = (segment: string, index: number): string => {
    const names: Record<string, string> = {
      'admin': 'Administration',
      'admin-panel': 'Administration',
      'users': 'Utilisateurs',
      'suppliers': 'Fournisseurs', 
      'products': 'Produits',
      'orders': 'Commandes',
      'analytics': 'Analytics',
      'database': 'Base de données',
      'monitoring': 'Monitoring',
      'logs': 'Logs',
      'settings': 'Paramètres',
      'connectors': 'Connecteurs',
      'sync-manager': 'Gestionnaire de Sync'
    };
    
    return names[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const getBreadcrumbPath = (index: number): string => {
    return '/' + pathSegments.slice(0, index + 1).join('/');
  };

  if (pathSegments.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link to="/">
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Home className="h-4 w-4" />
        </Button>
      </Link>
      
      {pathSegments.map((segment, index) => (
        <React.Fragment key={segment}>
          <ChevronRight className="h-4 w-4" />
          {index === pathSegments.length - 1 ? (
            <span className="font-medium text-foreground">
              {getBreadcrumbName(segment, index)}
            </span>
          ) : (
            <Link to={getBreadcrumbPath(index)}>
              <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-foreground">
                {getBreadcrumbName(segment, index)}
              </Button>
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};