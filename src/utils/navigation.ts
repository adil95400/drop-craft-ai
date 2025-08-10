import { NavigateFunction } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

// Navigation helper with validation and error handling
export class NavigationService {
  private static navigate: NavigateFunction | null = null;

  static setNavigate(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  static goTo(path: string, options?: { replace?: boolean; state?: any }) {
    if (!this.navigate) {
      console.error('Navigator not initialized');
      toast({
        title: "Erreur de navigation",
        description: "Service de navigation non initialisé",
        variant: "destructive"
      });
      return;
    }

    try {
      this.navigate(path, options);
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Erreur de navigation",
        description: "Impossible de naviguer vers cette page",
        variant: "destructive"
      });
    }
  }

  static goToDashboard() {
    this.goTo('/dashboard');
  }

  static goToModule(module: string, subPath?: string) {
    const path = subPath ? `/${module}/${subPath}` : `/${module}`;
    this.goTo(path);
  }

  static goToUltraProModule(module: string, subPath?: string) {
    const path = subPath ? `/${module}-ultra-pro/${subPath}` : `/${module}-ultra-pro`;
    this.goTo(path);
  }

  static goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.goToDashboard();
    }
  }

  static refresh() {
    window.location.reload();
  }

  static isValidPath(path: string): boolean {
    // Define valid paths
    const validPaths = [
      '/', '/auth', '/dashboard', '/dashboard-ultra-pro',
      '/import', '/import-ultra-pro',
      '/catalogue', '/catalogue-ultra-pro', '/catalogue-ultra-pro-advanced',
      '/orders', '/orders-ultra-pro',
      '/crm', '/crm-ultra-pro',
      '/tracking', '/tracking-ultra-pro',
      '/reviews', '/reviews-ultra-pro',
      '/seo', '/seo-ultra-pro',
      '/marketing', '/marketing-ultra-pro',
      '/inventory', '/inventory-ultra-pro',
      '/automation', '/automation-ultra-pro',
      '/plugins', '/plugins-ultra-pro',
      '/mobile', '/mobile-ultra-pro',
      '/integrations', '/support', '/analytics', '/settings'
    ];

    return validPaths.includes(path) || path.startsWith('/crm/') || path.startsWith('/tracking/');
  }
}