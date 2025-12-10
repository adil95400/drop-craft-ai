/**
 * Types for 3PL integrations and advanced logistics
 */

export interface ThirdPartyLogistics {
  id: string
  user_id: string
  provider_name: string
  provider_type: '3pl' | 'fulfillment_center' | 'dropship' | 'cross_dock'
  api_credentials: Record<string, any>
  is_active: boolean
  connection_status: 'connected' | 'disconnected' | 'error' | 'pending'
  last_sync_at?: string
  sync_frequency: 'realtime' | 'hourly' | 'daily'
  supported_services: string[]
  pricing_model: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ThirdPartyLogisticsProvider {
  id: string
  name: string
  slug: string
  logo_url?: string
  description: string
  provider_type: '3pl' | 'fulfillment_center' | 'dropship'
  supported_countries: string[]
  supported_services: string[]
  integration_type: 'api' | 'ftp' | 'webhook' | 'manual'
  setup_requirements: string[]
  pricing_info: {
    storage_per_unit?: number
    pick_and_pack?: number
    shipping_markup?: number
  }
  features: string[]
  is_popular: boolean
}

export interface InventoryTransfer {
  id: string
  user_id: string
  transfer_number: string
  from_warehouse_id: string
  to_warehouse_id: string
  status: 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled'
  items: InventoryTransferItem[]
  expected_arrival_date?: string
  actual_arrival_date?: string
  carrier_name?: string
  tracking_number?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Joined
  from_warehouse?: {
    name: string
    location: string
  }
  to_warehouse?: {
    name: string
    location: string
  }
}

export interface InventoryTransferItem {
  id: string
  transfer_id: string
  product_id: string
  product_name: string
  sku?: string
  quantity_requested: number
  quantity_shipped?: number
  quantity_received?: number
  status: 'pending' | 'shipped' | 'received' | 'damaged' | 'missing'
}

export interface StockImportJob {
  id: string
  user_id: string
  source_type: 'csv' | 'api' | '3pl_sync' | 'manual'
  source_name: string
  file_url?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_items: number
  processed_items: number
  successful_items: number
  failed_items: number
  error_log: Record<string, any>[]
  created_at: string
  completed_at?: string
}

export interface WarehouseLocation {
  id: string
  warehouse_id: string
  zone: string
  aisle: string
  rack: string
  shelf: string
  bin: string
  location_code: string
  location_type: 'picking' | 'storage' | 'receiving' | 'shipping' | 'returns'
  is_available: boolean
  max_capacity: number
  current_utilization: number
  product_id?: string
  created_at: string
}

// Available 3PL Providers
export const AVAILABLE_3PL_PROVIDERS: ThirdPartyLogisticsProvider[] = [
  {
    id: 'shipbob',
    name: 'ShipBob',
    slug: 'shipbob',
    logo_url: '/logos/shipbob.svg',
    description: 'Fulfillment réseau USA, Canada, Europe avec intégration e-commerce native',
    provider_type: '3pl',
    supported_countries: ['US', 'CA', 'UK', 'EU', 'AU'],
    supported_services: ['fulfillment', 'storage', 'returns', 'kitting'],
    integration_type: 'api',
    setup_requirements: ['API Key', 'Account ID'],
    pricing_info: {
      storage_per_unit: 0.40,
      pick_and_pack: 2.50,
      shipping_markup: 0
    },
    features: ['Intégration Shopify native', '2-day shipping', 'Gestion des retours', 'Kitting'],
    is_popular: true
  },
  {
    id: 'amazon_fba',
    name: 'Amazon FBA',
    slug: 'amazon-fba',
    logo_url: '/logos/amazon.svg',
    description: 'Fulfillment by Amazon - accès Prime et réseau mondial',
    provider_type: 'fulfillment_center',
    supported_countries: ['US', 'CA', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'AU'],
    supported_services: ['fulfillment', 'storage', 'prime_delivery'],
    integration_type: 'api',
    setup_requirements: ['Seller Central Account', 'MWS Credentials'],
    pricing_info: {
      storage_per_unit: 0.75,
      pick_and_pack: 3.00,
      shipping_markup: 0
    },
    features: ['Prime éligible', 'Réseau mondial', 'FBA Small & Light', 'Multi-channel fulfillment'],
    is_popular: true
  },
  {
    id: 'delivengo',
    name: 'Delivengo',
    slug: 'delivengo',
    logo_url: '/logos/delivengo.svg',
    description: 'Solution logistique La Poste pour e-commerce international',
    provider_type: '3pl',
    supported_countries: ['FR', 'EU', 'WORLD'],
    supported_services: ['fulfillment', 'storage', 'international_shipping'],
    integration_type: 'api',
    setup_requirements: ['Contract Number', 'API Credentials'],
    pricing_info: {
      storage_per_unit: 0.35,
      pick_and_pack: 2.00,
      shipping_markup: 0
    },
    features: ['Réseau La Poste', 'Suivi international', 'Douanes simplifiées', 'Tarifs préférentiels'],
    is_popular: true
  },
  {
    id: 'bigblue',
    name: 'Bigblue',
    slug: 'bigblue',
    logo_url: '/logos/bigblue.svg',
    description: 'Fulfillment européen optimisé pour les DNVB et e-commerce',
    provider_type: '3pl',
    supported_countries: ['FR', 'DE', 'UK', 'ES', 'IT', 'NL', 'BE'],
    supported_services: ['fulfillment', 'storage', 'branded_packaging', 'returns'],
    integration_type: 'api',
    setup_requirements: ['API Key', 'Shop ID'],
    pricing_info: {
      storage_per_unit: 0.45,
      pick_and_pack: 2.80,
      shipping_markup: 0
    },
    features: ['Packaging personnalisé', 'Livraison J+1 Europe', 'Dashboard temps réel', 'Retours simplifiés'],
    is_popular: true
  },
  {
    id: 'cubyn',
    name: 'Cubyn',
    slug: 'cubyn',
    logo_url: '/logos/cubyn.svg',
    description: 'Fulfillment français avec expédition rapide et tracking avancé',
    provider_type: '3pl',
    supported_countries: ['FR', 'EU'],
    supported_services: ['fulfillment', 'storage', 'express_shipping'],
    integration_type: 'api',
    setup_requirements: ['API Key', 'Merchant ID'],
    pricing_info: {
      storage_per_unit: 0.30,
      pick_and_pack: 2.20,
      shipping_markup: 0
    },
    features: ['Express 24h', 'Points relais', 'API temps réel', 'Emballage éco-responsable'],
    is_popular: false
  },
  {
    id: 'shippingbo',
    name: 'ShippingBo',
    slug: 'shippingbo',
    logo_url: '/logos/shippingbo.svg',
    description: 'OMS & WMS tout-en-un pour e-commerce multi-canal',
    provider_type: '3pl',
    supported_countries: ['FR', 'EU'],
    supported_services: ['oms', 'wms', 'fulfillment', 'multi_carrier'],
    integration_type: 'api',
    setup_requirements: ['API Key', 'Tenant ID'],
    pricing_info: {
      storage_per_unit: 0.25,
      pick_and_pack: 1.80,
      shipping_markup: 0
    },
    features: ['Multi-transporteur', 'WMS intégré', 'Règles automatiques', 'Reporting avancé'],
    is_popular: false
  },
  {
    id: 'geodis',
    name: 'GEODIS',
    slug: 'geodis',
    logo_url: '/logos/geodis.svg',
    description: 'Logistique industrielle et e-commerce à grande échelle',
    provider_type: '3pl',
    supported_countries: ['FR', 'EU', 'WORLD'],
    supported_services: ['fulfillment', 'storage', 'freight', 'customs'],
    integration_type: 'api',
    setup_requirements: ['Customer ID', 'API Token', 'EDI Setup'],
    pricing_info: {
      storage_per_unit: 0.50,
      pick_and_pack: 3.50,
      shipping_markup: 0
    },
    features: ['Grands volumes', 'Fret international', 'Dédouanement', 'Supply chain complète'],
    is_popular: false
  },
  {
    id: 'c_log',
    name: 'C-Log',
    slug: 'c-log',
    logo_url: '/logos/clog.svg',
    description: 'Logistique e-commerce française avec entrepôts régionaux',
    provider_type: '3pl',
    supported_countries: ['FR', 'EU'],
    supported_services: ['fulfillment', 'storage', 'co_packing', 'returns'],
    integration_type: 'api',
    setup_requirements: ['Client ID', 'API Secret'],
    pricing_info: {
      storage_per_unit: 0.28,
      pick_and_pack: 1.90,
      shipping_markup: 0
    },
    features: ['Co-packing', 'Personnalisation', 'Entrepôts régionaux', 'B2B et B2C'],
    is_popular: false
  }
];
