import { supabase } from '@/integrations/supabase/client';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  branding: {
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    favicon_url?: string;
  };
  settings: {
    features: string[];
    limits: Record<string, number>;
    integrations: string[];
    custom_fields: Record<string, any>;
  };
  subscription: {
    plan: string;
    status: 'active' | 'cancelled' | 'expired';
    trial_ends_at?: string;
    billing_cycle: 'monthly' | 'yearly';
  };
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'user' | 'viewer';
  permissions: string[];
  invited_by?: string;
  joined_at: string;
}

export class MultiTenantService {
  private static instance: MultiTenantService;
  private currentTenant: Tenant | null = null;
  
  public static getInstance(): MultiTenantService {
    if (!this.instance) {
      this.instance = new MultiTenantService();
    }
    return this.instance;
  }

  // Tenant Management
  async createTenant(tenantData: {
    name: string;
    slug: string;
    owner_id: string;
    domain?: string;
    plan?: string;
  }): Promise<Tenant> {
    try {
      const { data, error } = await supabase.functions.invoke('multi-tenant', {
        body: {
          action: 'create_tenant',
          tenant: {
            ...tenantData,
            branding: {
              primary_color: '#3b82f6',
              secondary_color: '#64748b',
              accent_color: '#10b981',
              font_family: 'Inter'
            },
            settings: {
              features: ['basic_dashboard', 'product_management', 'order_management'],
              limits: {
                users: 5,
                products: 1000,
                orders: 10000,
                storage_gb: 10
              },
              integrations: [],
              custom_fields: {}
            },
            subscription: {
              plan: tenantData.plan || 'starter',
              status: 'active',
              billing_cycle: 'monthly'
            }
          }
        }
      });

      if (error) throw error;
      
      return data.tenant;
    } catch (error) {
      console.error('Failed to create tenant:', error);
      throw error;
    }
  }

  // Update tenant branding
  async updateTenantBranding(tenantId: string, branding: Partial<Tenant['branding']>): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('multi-tenant', {
        body: {
          action: 'update_branding',
          tenant_id: tenantId,
          branding
        }
      });

      if (error) throw error;
      
      // Update local tenant if it's the current one
      if (this.currentTenant?.id === tenantId) {
        this.currentTenant.branding = { ...this.currentTenant.branding, ...branding };
        this.applyBranding(this.currentTenant.branding);
      }
    } catch (error) {
      console.error('Failed to update tenant branding:', error);
      throw error;
    }
  }

  // Get tenant by domain or slug
  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    try {
      // Use edge function since tenants table doesn't exist in schema
      const { data, error } = await supabase.functions.invoke('multi-tenant', {
        body: {
          action: 'get_tenant_by_domain',
          domain
        }
      });

      if (error || !data?.tenant) return null;
      
      return data.tenant as Tenant;
    } catch (error) {
      console.error('Failed to get tenant by domain:', error);
      return null;
    }
  }

  // Set current tenant context
  async setCurrentTenant(tenant: Tenant): Promise<void> {
    this.currentTenant = tenant;
    
    // Apply tenant branding
    this.applyBranding(tenant.branding);
    
    // Store in localStorage for persistence
    localStorage.setItem('current_tenant', JSON.stringify(tenant));
    
    // Set global CSS variables for theming
    this.setCSSVariables(tenant.branding);
  }

  // Get current tenant
  getCurrentTenant(): Tenant | null {
    if (!this.currentTenant) {
      // Try to restore from localStorage
      const stored = localStorage.getItem('current_tenant');
      if (stored) {
        this.currentTenant = JSON.parse(stored);
      }
    }
    
    return this.currentTenant;
  }

  // Apply tenant branding to the app
  private applyBranding(branding: Tenant['branding']): void {
    // Update document title and favicon
    const tenant = this.getCurrentTenant();
    if (tenant) {
      document.title = `${tenant.name} - Drop Craft AI`;
      
      if (branding.favicon_url) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = branding.favicon_url;
        }
      }
    }

    // Apply CSS custom properties
    this.setCSSVariables(branding);
  }

  // Set CSS variables for dynamic theming
  private setCSSVariables(branding: Tenant['branding']): void {
    const root = document.documentElement;
    
    // Convert colors to HSL if they're in hex format
    const primaryHSL = this.hexToHSL(branding.primary_color);
    const secondaryHSL = this.hexToHSL(branding.secondary_color);
    const accentHSL = this.hexToHSL(branding.accent_color);
    
    root.style.setProperty('--primary', primaryHSL);
    root.style.setProperty('--secondary', secondaryHSL);
    root.style.setProperty('--accent', accentHSL);
    
    // Font family
    root.style.setProperty('--font-family', branding.font_family);
    
    // Load custom font if needed
    if (branding.font_family !== 'Inter' && branding.font_family !== 'system-ui') {
      this.loadCustomFont(branding.font_family);
    }
  }

  private hexToHSL(hex: string): string {
    // Convert hex to HSL for CSS custom properties
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  private loadCustomFont(fontFamily: string): void {
    // Load font from Google Fonts
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  // User Management within Tenant
  async inviteUserToTenant(
    tenantId: string, 
    email: string, 
    role: TenantUser['role'],
    permissions: string[] = []
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('multi-tenant', {
        body: {
          action: 'invite_user',
          tenant_id: tenantId,
          email,
          role,
          permissions
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to invite user to tenant:', error);
      throw error;
    }
  }

  // Get tenant users
  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    try {
      // Use edge function since tenant_users table doesn't exist in schema
      const { data, error } = await supabase.functions.invoke('multi-tenant', {
        body: {
          action: 'get_tenant_users',
          tenant_id: tenantId
        }
      });

      if (error) throw error;
      
      return (data?.users || []) as TenantUser[];
    } catch (error) {
      console.error('Failed to get tenant users:', error);
      return [];
    }
  }

  // Check user permissions within tenant
  hasPermission(permission: string): boolean {
    const user = this.getCurrentTenantUser();
    if (!user) return false;
    
    // Owners and admins have all permissions
    if (user.role === 'owner' || user.role === 'admin') return true;
    
    return user.permissions.includes(permission);
  }

  private getCurrentTenantUser(): TenantUser | null {
    // This would be fetched from current auth context
    // For now, return mock data
    return null;
  }

  // Data Isolation
  async getTenantData(table: string, filters: Record<string, any> = {}): Promise<any[]> {
    const tenant = this.getCurrentTenant();
    if (!tenant) throw new Error('No tenant context');

    try {
      // For now, just return mock data since we need proper tenant isolation
      console.log(`Getting tenant data from ${table} for tenant ${tenant.id}`, filters);
      
      return [];
    } catch (error) {
      console.error(`Failed to get tenant data from ${table}:`, error);
      throw error;
    }
  }

  // Tenant Analytics
  async getTenantAnalytics(tenantId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('multi-tenant', {
        body: {
          action: 'get_analytics',
          tenant_id: tenantId
        }
      });

      if (error) throw error;
      
      return data.analytics;
    } catch (error) {
      console.error('Failed to get tenant analytics:', error);
      throw error;
    }
  }

  // Billing Management
  async updateTenantSubscription(
    tenantId: string,
    plan: string,
    billing_cycle: 'monthly' | 'yearly'
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('multi-tenant', {
        body: {
          action: 'update_subscription',
          tenant_id: tenantId,
          plan,
          billing_cycle
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update tenant subscription:', error);
      throw error;
    }
  }
}

export const multiTenantService = MultiTenantService.getInstance();