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
    // Valid route prefixes (modules)
    const validPrefixes = [
      '/dashboard', '/products', '/catalog', '/orders', '/customers',
      '/stores-channels', '/channels', '/import', '/suppliers', '/feeds',
      '/analytics', '/audit', '/research', '/automation', '/ai', '/pricing',
      '/rewrite', '/marketing', '/tools', '/stock', '/integrations',
      '/extensions', '/settings', '/enterprise', '/admin', '/help-center'
    ];
    
    // Exact valid paths
    const validExact = [
      '/', '/auth', '/store', '/academy', '/pwa-install',
      '/sync-manager', '/reviews', '/advanced', '/monitoring',
      '/catalog-intelligence', '/coupons', '/trial', '/ab-testing',
      '/repricing', '/enrichment', '/reports', '/ads-spy',
      '/page-builder', '/support', '/sitemap', '/notifications'
    ];
    
    // Check exact match
    if (validExact.includes(path)) return true;
    
    // Check prefix match
    return validPrefixes.some(prefix => path.startsWith(prefix));
  }
}
