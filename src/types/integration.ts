// Types temporaires pour corriger les erreurs de compilation
export interface IntegrationCredentials {
  has_api_key?: boolean;
  platform_url?: string;
  shop_domain?: string;
  store_config?: any;
  sync_settings?: any;
  credentials?: Record<string, string>;
}

export interface MockIntegrationTemplate {
  id: string;
  name: string;
  description: string;
  category: "ecommerce" | "marketplace" | "payment" | "marketing";
  logo: string;
  color: string;
  features: any[];
  setupSteps: any[];
  status: "available";
  icon: any;
  premium: boolean;
  rating: number;
  installs: number;
}