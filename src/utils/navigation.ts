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
    // Define valid paths - uniformized without /dashboard/ prefix
    const validPaths = [
      '/', '/auth', '/dashboard',
      '/products', '/products/import', '/products/import/quick', '/products/import/advanced', '/products/import/manage',
      '/products/catalogue', '/products/inventory-predictor',
      // Nouveau groupe Catalogue - Hub d'exécution
      '/catalog/to-process', '/catalog/variants', '/catalog/media', 
      '/catalog/attributes', '/catalog/categories-brands', '/catalog/health',
      '/orders', '/customers', '/marketplace-sync',
      '/analytics', '/analytics/advanced',
      '/automation', '/automation/ai-hub', '/automation/stock-sync',
      '/marketing', '/marketing/crm', '/marketing/seo',
      '/integrations', '/integrations/support', '/integrations/academy', '/integrations/extensions',
      '/admin', '/settings',
      '/tools/intelligence',
      // Suppliers / Fournisseurs routes
      '/suppliers', '/suppliers/catalog', '/suppliers/engine', '/suppliers/my',
      '/suppliers/analytics', '/suppliers/settings', '/suppliers/feeds',
      '/suppliers/variant-mapping', '/suppliers/create', '/suppliers/add',
      '/suppliers/bts/import',
      // French aliases
      '/fournisseurs', '/fournisseurs/moteur', '/fournisseurs/catalogue',
      '/fournisseurs/mes-fournisseurs', '/fournisseurs/analytics'
    ];

    return validPaths.includes(path) || 
           path.startsWith('/products/') || 
           path.startsWith('/catalog/') ||
           path.startsWith('/orders/') || 
           path.startsWith('/customers/') ||
           path.startsWith('/marketing/') || 
           path.startsWith('/integrations/') ||
           path.startsWith('/admin/') ||
           path.startsWith('/settings/') ||
           path.startsWith('/suppliers/') ||
           path.startsWith('/fournisseurs/');
  }
}
