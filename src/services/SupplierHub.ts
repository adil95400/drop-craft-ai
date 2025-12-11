export interface SupplierConnectorInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  status: 'available' | 'beta' | 'coming_soon';
  authType: 'api_key' | 'credentials' | 'oauth';
  logo?: string;
  features: {
    products: boolean;
    inventory: boolean;
    orders: boolean;
    webhooks: boolean;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  setupComplexity?: 'easy' | 'medium' | 'advanced';
}

export interface SyncSchedule {
  id: string;
  connectorId: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  active: boolean;
  enabled: boolean;
  nextRun: Date;
}

class SupplierHubService {
  private connectors: SupplierConnectorInfo[] = [
    {
      id: 'aliexpress',
      name: 'AliExpress',
      displayName: 'AliExpress',
      description: 'Plateforme de commerce électronique chinoise',
      category: 'Marketplace',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/aliexpress.svg',
      features: { products: true, inventory: true, orders: false, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1800 },
      setupComplexity: 'medium'
    },
    {
      id: 'shopify',
      name: 'Shopify',
      displayName: 'Shopify',
      description: 'Plateforme e-commerce complète',
      category: 'E-commerce',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/shopify.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 40, requestsPerHour: 2400 },
      setupComplexity: 'easy'
    },
    {
      id: 'amazon',
      name: 'Amazon',
      displayName: 'Amazon Marketplace',
      description: 'Plus grande marketplace mondiale',
      category: 'Marketplace',
      status: 'available',
      authType: 'credentials',
      logo: '/logos/amazon.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 25, requestsPerHour: 1500 },
      setupComplexity: 'advanced'
    },
    {
      id: 'ebay',
      name: 'eBay',
      displayName: 'eBay Marketplace',
      description: 'Plateforme de vente aux enchères et achat immédiat',
      category: 'Marketplace',
      status: 'available',
      authType: 'oauth',
      logo: '/logos/ebay.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 50, requestsPerHour: 3000 },
      setupComplexity: 'medium'
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      displayName: 'WooCommerce',
      description: 'Solution e-commerce WordPress',
      category: 'E-commerce',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/woocommerce.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 3600 },
      setupComplexity: 'easy'
    },
    {
      id: 'magento',
      name: 'Magento',
      displayName: 'Magento Commerce',
      description: 'Plateforme e-commerce enterprise',
      category: 'E-commerce',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/magento.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 35, requestsPerHour: 2100 },
      setupComplexity: 'advanced'
    },
    {
      id: 'prestashop',
      name: 'PrestaShop',
      displayName: 'PrestaShop',
      description: 'Solution e-commerce open source',
      category: 'E-commerce',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/prestashop.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 45, requestsPerHour: 2700 },
      setupComplexity: 'medium'
    },
    {
      id: 'bigbuy',
      name: 'BigBuy',
      displayName: 'BigBuy Dropshipping',
      description: 'Fournisseur dropshipping européen',
      category: 'Dropshipping',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/bigbuy.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 1200 },
      setupComplexity: 'easy'
    },
    {
      id: 'printful',
      name: 'Printful',
      displayName: 'Printful POD',
      description: 'Print-on-demand et dropshipping',
      category: 'Print-on-Demand',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/printful.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 120, requestsPerHour: 7200 },
      setupComplexity: 'easy'
    },
    {
      id: 'spocket',
      name: 'Spocket',
      displayName: 'Spocket Dropshipping',
      description: 'Fournisseurs européens et américains',
      category: 'Dropshipping',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/spocket.svg',
      features: { products: true, inventory: true, orders: false, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1800 },
      setupComplexity: 'medium'
    },
    {
      id: 'temu',
      name: 'Temu',
      displayName: 'Temu Marketplace',
      description: 'Marketplace chinoise populaire',
      category: 'Marketplace',
      status: 'beta',
      authType: 'api_key',
      logo: '/logos/temu.svg',
      features: { products: true, inventory: false, orders: false, webhooks: false },
      rateLimits: { requestsPerMinute: 15, requestsPerHour: 900 },
      setupComplexity: 'advanced'
    },
    {
      id: 'walmart',
      name: 'Walmart',
      displayName: 'Walmart Marketplace',
      description: 'Géant américain du retail',
      category: 'Marketplace',
      status: 'coming_soon',
      authType: 'oauth',
      logo: '/logos/walmart.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 1200 },
      setupComplexity: 'advanced'
    },
    // Nouveaux fournisseurs européens et internationaux
    {
      id: 'cdiscount',
      name: 'Cdiscount',
      displayName: 'Cdiscount Pro',
      description: 'Marketplace française leader',
      category: 'Marketplace France',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/cdiscount.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1800 },
      setupComplexity: 'medium'
    },
    {
      id: 'fnac',
      name: 'Fnac',
      displayName: 'Fnac Marketplace',
      description: 'Marketplace française culture & tech',
      category: 'Marketplace France',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/fnac.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 25, requestsPerHour: 1500 },
      setupComplexity: 'medium'
    },
    {
      id: 'zalando',
      name: 'Zalando',
      displayName: 'Zalando Partner',
      description: 'Leader européen de la mode en ligne',
      category: 'Mode & Lifestyle',
      status: 'available',
      authType: 'oauth',
      logo: '/logos/zalando.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 40, requestsPerHour: 2400 },
      setupComplexity: 'advanced'
    },
    {
      id: 'otto',
      name: 'Otto',
      displayName: 'Otto Marketplace',
      description: 'Grande marketplace allemande',
      category: 'Marketplace Allemagne',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/otto.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 35, requestsPerHour: 2100 },
      setupComplexity: 'medium'
    },
    {
      id: 'bol',
      name: 'Bol.com',
      displayName: 'Bol.com',
      description: 'Leader e-commerce Pays-Bas et Belgique',
      category: 'Marketplace Benelux',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/bol.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1800 },
      setupComplexity: 'easy'
    },
    {
      id: 'kaufland',
      name: 'Kaufland.de',
      displayName: 'Kaufland Global Marketplace',
      description: 'Marketplace pan-européenne',
      category: 'Marketplace Europe',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/kaufland.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 25, requestsPerHour: 1500 },
      setupComplexity: 'medium'
    },
    {
      id: 'allegro',
      name: 'Allegro',
      displayName: 'Allegro Marketplace',
      description: 'Leader e-commerce Pologne',
      category: 'Marketplace Pologne',
      status: 'available',
      authType: 'oauth',
      logo: '/logos/allegro.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 50, requestsPerHour: 3000 },
      setupComplexity: 'medium'
    },
    {
      id: 'emag',
      name: 'eMAG',
      displayName: 'eMAG Marketplace',
      description: 'Leader e-commerce Europe de l\'Est',
      category: 'Marketplace Europe Est',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/emag.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1800 },
      setupComplexity: 'medium'
    },
    {
      id: 'real-de',
      name: 'Real.de',
      displayName: 'Real.de Marketplace',
      description: 'Marketplace allemande premium',
      category: 'Marketplace Allemagne',
      status: 'beta',
      authType: 'api_key',
      logo: '/logos/real.svg',
      features: { products: true, inventory: true, orders: false, webhooks: false },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 1200 },
      setupComplexity: 'advanced'
    },
    // Fournisseurs spécialisés dropshipping
    {
      id: 'eprolo',
      name: 'Eprolo',
      displayName: 'Eprolo Dropshipping',
      description: 'Dropshipping européen premium avec entrepôts locaux',
      category: 'Dropshipping Premium',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/eprolo.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 100, requestsPerHour: 6000 },
      setupComplexity: 'easy'
    },
    {
      id: 'syncee',
      name: 'Syncee',
      displayName: 'Syncee Global',
      description: '8M+ produits, 12K+ marques mondiales',
      category: 'Marketplace Globale',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/syncee.svg',
      features: { products: true, inventory: true, orders: false, webhooks: true },
      rateLimits: { requestsPerMinute: 120, requestsPerHour: 7200 },
      setupComplexity: 'easy'
    },
    {
      id: 'modalyst',
      name: 'Modalyst',
      displayName: 'Modalyst Fashion',
      description: 'Dropshipping mode et lifestyle premium',
      category: 'Mode Premium',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/modalyst.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 3600 },
      setupComplexity: 'medium'
    },
    {
      id: 'oberlo',
      name: 'Oberlo',
      displayName: 'Oberlo by Shopify',
      description: 'Intégration dropshipping Shopify native',
      category: 'Dropshipping',
      status: 'available',
      authType: 'oauth',
      logo: '/logos/oberlo.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 80, requestsPerHour: 4800 },
      setupComplexity: 'easy'
    },
    {
      id: 'dropified',
      name: 'Dropified',
      displayName: 'Dropified Multi-Platform',
      description: 'Automatisation dropshipping multi-plateformes',
      category: 'Automation',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/dropified.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 150, requestsPerHour: 9000 },
      setupComplexity: 'medium'
    },
    // Fournisseurs B2B et wholesales
    {
      id: 'faire',
      name: 'Faire',
      displayName: 'Faire Wholesale',
      description: 'Marketplace B2B pour marques indépendantes',
      category: 'B2B Wholesale',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/faire.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 40, requestsPerHour: 2400 },
      setupComplexity: 'medium'
    },
    {
      id: 'alibaba',
      name: 'Alibaba',
      displayName: 'Alibaba B2B',
      description: 'Plus grande plateforme B2B mondiale',
      category: 'B2B Global',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/alibaba.svg',
      features: { products: true, inventory: false, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 1200 },
      setupComplexity: 'advanced'
    },
    {
      id: 'europartner',
      name: 'EuroPartner',
      displayName: 'EuroPartner B2B',
      description: 'Réseau B2B européen multi-secteurs',
      category: 'B2B Europe',
      status: 'available',
      authType: 'credentials',
      logo: '/logos/europartner.svg',
      features: { products: true, inventory: true, orders: false, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1800 },
      setupComplexity: 'medium'
    },
    // Print-on-Demand spécialisés
    {
      id: 'printify',
      name: 'Printify',
      displayName: 'Printify POD',
      description: 'Réseau mondial print-on-demand',
      category: 'Print-on-Demand',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/printify.svg',
      features: { products: true, inventory: false, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 100, requestsPerHour: 6000 },
      setupComplexity: 'easy'
    },
    {
      id: 'gooten',
      name: 'Gooten',
      displayName: 'Gooten POD',
      description: 'Print-on-demand avec design tools',
      category: 'Print-on-Demand',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/gooten.svg',
      features: { products: true, inventory: false, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 80, requestsPerHour: 4800 },
      setupComplexity: 'medium'
    },
    {
      id: 'customcat',
      name: 'CustomCat',
      displayName: 'CustomCat POD',
      description: 'Print-on-demand haut de gamme',
      category: 'Print-on-Demand',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/customcat.svg',
      features: { products: true, inventory: false, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 3600 },
      setupComplexity: 'easy'
    }
  ];

  getAvailableConnectors(): SupplierConnectorInfo[] {
    return this.connectors;
  }

  async connectSupplier(connectorId: string, credentials: Record<string, string>): Promise<boolean> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Non authentifié');
    
    // Sauvegarder la connexion dans Supabase
    const { error } = await supabase.from('suppliers').upsert({
      user_id: user.id,
      name: connectorId,
      status: 'active',
      website: credentials.api_url || credentials.store_url || '',
      contact_email: credentials.email || '',
      api_key: credentials.api_key || null
    }, { onConflict: 'user_id,name' });
    
    if (error) {
      console.error('Erreur connexion fournisseur:', error);
      return false;
    }
    
    return true;
  }

  async disconnectSupplier(connectorId: string): Promise<boolean> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    const { error } = await supabase
      .from('suppliers')
      .update({ status: 'inactive' })
      .eq('user_id', user.id)
      .eq('name', connectorId);
    
    return !error;
  }

  async syncProducts(connectorId: string, options?: any): Promise<any> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Non authentifié');
    
    // Récupérer le fournisseur
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', connectorId)
      .single();
    
    if (!supplier) throw new Error('Fournisseur non trouvé');
    
    // Compter les produits existants
    const { count: existingCount } = await supabase
      .from('supplier_products')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id);
    
    // Appeler l'edge function de sync
    const { data, error } = await supabase.functions.invoke('supplier-sync-products', {
      body: { supplierId: supplier.id, connectorId, options }
    });
    
    if (error) {
      console.error('Erreur sync:', error);
      return { imported: 0, duplicates: 0, errors: 1 };
    }
    
    return data || { imported: 0, duplicates: existingCount || 0, errors: 0 };
  }

  async syncSupplierProducts(connectorId: string, options?: any): Promise<any> {
    return this.syncProducts(connectorId, options);
  }

  async scheduleSync(connectorId: string, schedule: any): Promise<boolean> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    const { error } = await supabase.from('automation_workflows').insert({
      user_id: user.id,
      name: `Sync ${connectorId}`,
      trigger_type: 'scheduled',
      trigger_config: schedule,
      steps: [{ action: 'sync_supplier', params: { connectorId } }]
    });
    
    return !error;
  }

  async triggerManualSync(connectorId: string): Promise<any> {
    return this.syncProducts(connectorId);
  }

  getSyncSchedules(): SyncSchedule[] {
    return [];
  }

  autoDetectFields(data: any): any {
    return {};
  }
}

export const supplierHub = new SupplierHubService();