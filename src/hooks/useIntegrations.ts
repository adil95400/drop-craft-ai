import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Integration {
  id: string;
  platform_type: string;
  platform_name: string;
  platform_url?: string;
  shop_domain?: string;
  seller_id?: string;
  is_active: boolean;
  connection_status: 'connected' | 'disconnected' | 'error' | 'pending';
  sync_frequency: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
  has_api_key: boolean;
  has_api_secret: boolean;
  last_error?: string;
  sync_settings: any;
  store_config?: any;
}

export interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  color: string;
  features: string[];
  setupSteps: string[];
  isPopular?: boolean;
  isPremium?: boolean;
  status: 'available' | 'coming_soon' | 'beta';
}

const INTEGRATION_TEMPLATES: IntegrationTemplate[] = [
  // E-commerce Platforms
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Synchronisez vos produits avec votre boutique Shopify',
    category: 'E-commerce',
    logo: '🛍️',
    color: 'bg-green-500',
    features: ['Sync produits', 'Gestion stock', 'Prix automatiques', 'SEO optimisé'],
    setupSteps: ['Connectez votre boutique', 'Configurez les paramètres', 'Synchronisez vos produits'],
    isPopular: true,
    status: 'available'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Intégration complète avec votre boutique WordPress',
    category: 'E-commerce',
    logo: '🏪',
    color: 'bg-purple-500',
    features: ['Plugin WordPress', 'Sync bidirectionnelle', 'Catégories auto', 'Images HD'],
    setupSteps: ['Installez le plugin', 'Configurez les clés API', 'Activez la synchronisation'],
    isPopular: true,
    status: 'available'
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    description: 'Connectez votre boutique PrestaShop facilement',
    category: 'E-commerce',
    logo: '🏬',
    color: 'bg-blue-500',
    features: ['Module natif', 'Multi-langues', 'Gestion taxes', 'Variants produits'],
    setupSteps: ['Téléchargez le module', 'Configurez les paramètres', 'Lancez l\'import'],
    status: 'available'
  },
  {
    id: 'magento',
    name: 'Magento',
    description: 'Solution enterprise pour Magento 2',
    category: 'E-commerce',
    logo: '🏢',
    color: 'bg-orange-500',
    features: ['Magento 2 compatible', 'Gestion B2B', 'Multi-stores', 'Performance optimisée'],
    setupSteps: ['Installez l\'extension', 'Configurez les stores', 'Paramétrez les règles'],
    isPremium: true,
    status: 'available'
  },

  // Marketplaces
  {
    id: 'amazon',
    name: 'Amazon',
    description: 'Vendez sur la plus grande marketplace mondiale',
    category: 'Marketplaces',
    logo: '📦',
    color: 'bg-yellow-500',
    features: ['FBA compatible', 'Gestion repricing', 'Multi-pays', 'Rapports détaillés'],
    setupSteps: ['Créez un compte vendeur', 'Obtenez les clés API', 'Configurez les règles pricing'],
    isPopular: true,
    isPremium: true,
    status: 'available'
  },
  {
    id: 'ebay',
    name: 'eBay',
    description: 'Marketplace historique avec milliards d\'acheteurs',
    category: 'Marketplaces',
    logo: '🏷️',
    color: 'bg-red-500',
    features: ['Enchères & Buy It Now', 'Gestion promotions', 'Multi-catégories', 'Store integration'],
    setupSteps: ['Connectez votre compte', 'Validez les catégories', 'Configurez les templates'],
    isPopular: true,
    status: 'available'
  },
  {
    id: 'etsy',
    name: 'Etsy',
    description: 'Parfait pour les produits artisanaux et créatifs',
    category: 'Marketplaces',
    logo: '🎨',
    color: 'bg-pink-500',
    features: ['Produits personnalisés', 'Gestion variations', 'SEO Etsy', 'Reviews management'],
    setupSteps: ['Connectez votre boutique', 'Mappez les catégories', 'Optimisez les descriptions'],
    status: 'available'
  },
  {
    id: 'cdiscount',
    name: 'Cdiscount',
    description: 'Marketplace française leader',
    category: 'Marketplaces',
    logo: '🇫🇷',
    color: 'bg-indigo-500',
    features: ['Marketplace FR', 'C-Logistique', 'Gestion EAN', 'Promotions flash'],
    setupSteps: ['Inscription vendeur', 'Validation catalogue', 'Configuration logistique'],
    status: 'available'
  },

  // Social Commerce
  {
    id: 'facebook',
    name: 'Facebook Shop',
    description: 'Vendez directement sur Facebook et Instagram',
    category: 'Social Commerce',
    logo: '👥',
    color: 'bg-blue-600',
    features: ['Facebook Shop', 'Instagram Shopping', 'Pixel tracking', 'Audiences custom'],
    setupSteps: ['Connectez Facebook Business', 'Configurez le catalogue', 'Activez Instagram Shopping'],
    isPopular: true,
    status: 'available'
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    description: 'Nouvelle plateforme de social commerce en plein essor',
    category: 'Social Commerce',
    logo: '🎪',
    color: 'bg-black',
    features: ['TikTok Shop', 'Live shopping', 'Creator partnerships', 'Viral marketing'],
    setupSteps: ['Demandez l\'accès', 'Configurez votre shop', 'Lancez vos campagnes'],
    isPopular: true,
    status: 'beta'
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    description: 'Plateforme visuelle parfaite pour le e-commerce',
    category: 'Social Commerce',
    logo: '📌',
    color: 'bg-red-400',
    features: ['Product Rich Pins', 'Shopping features', 'Audiences visuelles', 'Trends insights'],
    setupSteps: ['Créez un compte business', 'Validez votre site', 'Configurez le catalogue'],
    status: 'available'
  },

  // Analytics & Tools
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Suivez vos performances avec GA4',
    category: 'Analytics',
    logo: '📊',
    color: 'bg-green-600',
    features: ['GA4 tracking', 'E-commerce enhanced', 'Conversions tracking', 'Custom reports'],
    setupSteps: ['Connectez GA4', 'Configurez les événements', 'Activez le suivi e-commerce'],
    isPopular: true,
    status: 'available'
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Automatisez vos campagnes publicitaires',
    category: 'Marketing',
    logo: '🎯',
    color: 'bg-yellow-600',
    features: ['Smart Shopping', 'Dynamic remarketing', 'Performance Max', 'Bid automation'],
    setupSteps: ['Connectez Google Ads', 'Importez vos produits', 'Configurez les campagnes'],
    isPremium: true,
    status: 'available'
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing et automation avancée',
    category: 'Marketing',
    logo: '📧',
    color: 'bg-yellow-500',
    features: ['Email campaigns', 'Automation flows', 'Segmentation', 'A/B testing'],
    setupSteps: ['Connectez votre compte', 'Synchronisez les contacts', 'Créez vos campagnes'],
    status: 'available'
  },

  // Logistics & Fulfillment
  {
    id: 'printful',
    name: 'Printful',
    description: 'Print-on-demand et fulfillment automatique',
    category: 'Fulfillment',
    logo: '🖨️',
    color: 'bg-gray-700',
    features: ['Print on demand', 'Fulfillment auto', '200+ produits', 'Mockup generator'],
    setupSteps: ['Connectez Printful', 'Choisissez vos produits', 'Configurez les designs'],
    isPopular: true,
    status: 'available'
  },
  {
    id: 'spocket',
    name: 'Spocket',
    description: 'Dropshipping de produits européens et américains',
    category: 'Suppliers',
    logo: '🚚',
    color: 'bg-blue-400',
    features: ['Produits EU/US', 'Livraison rapide', 'Échantillons gratuits', 'Branding personnalisé'],
    setupSteps: ['Connectez votre compte', 'Parcourez le catalogue', 'Importez vos produits'],
    status: 'available'
  },

  // Coming Soon
  {
    id: 'alibaba',
    name: 'Alibaba',
    description: 'Intégration directe avec les fournisseurs Alibaba',
    category: 'Suppliers',
    logo: '🏭',
    color: 'bg-orange-600',
    features: ['Fournisseurs vérifiés', 'Prix négociés', 'MOQ flexibles', 'Trade Assurance'],
    setupSteps: ['En développement'],
    status: 'coming_soon'
  },
  {
    id: 'walmart',
    name: 'Walmart',
    description: 'Marketplace américaine en forte croissance',
    category: 'Marketplaces',
    logo: '🛒',
    color: 'bg-blue-700',
    features: ['Marketplace US', 'Fulfillment services', 'Walmart+', 'Grocery integration'],
    setupSteps: ['Bientôt disponible'],
    status: 'coming_soon'
  }
];

export const useIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match Integration interface
      const transformedData = data?.map(item => ({
        id: item.id,
        platform_type: item.platform_type,
        platform_name: item.platform_name,
        platform_url: item.platform_url || '',
        shop_domain: item.shop_domain || '',
        seller_id: item.seller_id || '',
        is_active: item.is_active,
        connection_status: item.connection_status as 'connected' | 'disconnected' | 'error' | 'pending',
        sync_frequency: item.sync_frequency,
        last_sync_at: item.last_sync_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        has_api_key: !!item.api_key,
        has_api_secret: !!item.api_secret,
        last_error: item.last_error,
        sync_settings: item.sync_settings || {},
        store_config: item.store_config || {}
      })) || [];
      
      setIntegrations(transformedData);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger les intégrations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const connectIntegration = async (template: IntegrationTemplate, config: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const integrationData = {
        user_id: user.id,
        platform_type: template.category.toLowerCase(),
        platform_name: template.name,
        platform_url: config.url || '',
        shop_domain: config.domain || '',
        seller_id: config.sellerId || '',
        is_active: true,
        connection_status: 'pending',
        sync_frequency: 'daily',
        sync_settings: config,
        store_config: config.storeConfig || {},
        has_api_key: !!config.apiKey,
        has_api_secret: !!config.apiSecret
      };

      const { data, error } = await supabase
        .from('integrations')
        .insert([integrationData])
        .select()
        .single();

      if (error) throw error;

      const newIntegration: Integration = {
        id: data.id,
        platform_type: data.platform_type,
        platform_name: data.platform_name,
        platform_url: data.platform_url || '',
        shop_domain: data.shop_domain || '',
        seller_id: data.seller_id || '',
        is_active: data.is_active,
        connection_status: data.connection_status as 'connected' | 'disconnected' | 'error' | 'pending',
        sync_frequency: data.sync_frequency,
        last_sync_at: data.last_sync_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        has_api_key: !!data.api_key,
        has_api_secret: !!data.api_secret,
        last_error: data.last_error,
        sync_settings: data.sync_settings || {},
        store_config: data.store_config || {}
      };

      setIntegrations(prev => [newIntegration, ...prev]);
      toast({
        title: "Succès",
        description: `Intégration ${template.name} connectée avec succès`,
      });

      return newIntegration;
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const createIntegration = connectIntegration;
  const addIntegration = connectIntegration;

  const updateIntegration = async (integrationId: string, updates: Partial<Integration>) => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', integrationId);

      if (error) throw error;

      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, ...updates }
          : integration
      ));

      toast({
        title: "Succès",
        description: "Intégration mise à jour",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteIntegration = async (integrationId: string) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
      toast({
        title: "Succès",
        description: "Intégration supprimée",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const disconnectIntegration = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ 
          is_active: false,
          connection_status: 'disconnected'
        })
        .eq('id', integrationId);

      if (error) throw error;

      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, is_active: false, connection_status: 'disconnected' as const }
          : integration
      ));

      toast({
        title: "Succès",
        description: "Intégration déconnectée",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const updateIntegrationConfig = async (integrationId: string, config: any) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ 
          sync_settings: config,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId);

      if (error) throw error;

      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, sync_settings: config }
          : integration
      ));

      toast({
        title: "Succès",
        description: "Configuration mise à jour",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const syncIntegration = async (integrationId: string) => {
    try {
      setIsSyncing(true);
      // Simulation d'une synchronisation
      const { error } = await supabase
        .from('integrations')
        .update({ 
          last_sync_at: new Date().toISOString(),
          connection_status: 'connected'
        })
        .eq('id', integrationId);

      if (error) throw error;

      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { 
              ...integration, 
              last_sync_at: new Date().toISOString(),
              connection_status: 'connected' as const
            }
          : integration
      ));

      toast({
        title: "Succès",
        description: "Synchronisation terminée",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const testConnection = async (integrationId: string) => {
    try {
      // Simulation d'un test de connexion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { error } = await supabase
        .from('integrations')
        .update({ connection_status: 'connected' as 'connected' | 'disconnected' | 'error' | 'pending' })
        .eq('id', integrationId);

      if (error) throw error;

      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, connection_status: 'connected' as const }
          : integration
      ));

      toast({
        title: "Succès",
        description: "Test de connexion réussi",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Test de connexion échoué",
        variant: "destructive"
      });
    }
  };

  const syncData = syncIntegration;

  // Computed properties
  const connectedIntegrations = integrations.filter(i => i.connection_status === 'connected');
  const isLoading = loading;

  useEffect(() => {
    fetchIntegrations();
  }, []);

  return {
    integrations,
    templates: INTEGRATION_TEMPLATES,
    loading,
    error,
    isUpdating,
    isDeleting,
    isSyncing,
    isAdding,
    syncLogs,
    connectedIntegrations,
    isLoading,
    refetch: fetchIntegrations,
    fetchIntegrations,
    connectIntegration,
    createIntegration,
    addIntegration,
    updateIntegration,
    deleteIntegration,
    disconnectIntegration,
    updateIntegrationConfig,
    syncIntegration,
    syncData,
    testConnection
  };
};