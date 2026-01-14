/**
 * Feed Sub Navigation
 * Navigation cohérente entre toutes les pages feeds
 */
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Rss, 
  Sparkles, 
  GitBranch, 
  Link2, 
  FolderTree,
  ChevronRight
} from 'lucide-react';

const feedRoutes = [
  {
    path: '/feeds',
    label: 'Feeds',
    icon: Rss,
    description: 'Gestion des flux'
  },
  {
    path: '/feeds/optimization',
    label: 'Optimisation IA',
    icon: Sparkles,
    description: 'Améliorer avec l\'IA'
  },
  {
    path: '/feeds/rules',
    label: 'Règles IF/THEN',
    icon: GitBranch,
    description: 'Transformation auto'
  },
  {
    path: '/feeds/ppc-link',
    label: 'PPC Link',
    icon: Link2,
    description: 'Liaisons publicitaires'
  },
  {
    path: '/feeds/categories',
    label: 'Catégories',
    icon: FolderTree,
    description: 'Mapping catégories'
  },
];

export function FeedSubNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-foreground transition-colors">
          Accueil
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Feeds</span>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-xl">
        {feedRoutes.map((route) => {
          const isActive = currentPath === route.path || 
            (route.path !== '/feeds' && currentPath.startsWith(route.path));
          const Icon = route.icon;

          return (
            <Link
              key={route.path}
              to={route.path}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                "hover:bg-background hover:shadow-sm",
                isActive 
                  ? "bg-background text-primary shadow-sm" 
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="hidden sm:inline">{route.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
