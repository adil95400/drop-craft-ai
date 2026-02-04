/**
 * Feature Flags Client Library
 * Centralized, type-safe access to feature flags with caching and realtime updates
 */

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Json } from '@/integrations/supabase/types';

export interface FeatureFlag {
  flag_key: string;
  is_enabled: boolean;
  category: string;
  metadata: Json;
}

export interface FeatureFlagState {
  flags: Map<string, boolean>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Feature flag keys as constants for type safety
export const FLAG_KEYS = {
  // Products
  PRODUCTS_IMPORT_BASIC: 'products.import.basic',
  PRODUCTS_IMPORT_BULK: 'products.import.bulk',
  PRODUCTS_IMPORT_AI: 'products.import.ai',
  PRODUCTS_IMPORT_SCHEDULED: 'products.import.scheduled',
  
  // Import Pipeline (A/B Test)
  IMPORT_PIPELINE_V3: 'import.pipeline.v3',
  
  // Analytics
  ANALYTICS_BASIC: 'analytics.basic',
  ANALYTICS_ADVANCED: 'analytics.advanced',
  ANALYTICS_PREDICTIVE: 'analytics.predictive',
  
  // Automation
  AUTOMATION_RULES: 'automation.rules',
  AUTOMATION_WORKFLOWS: 'automation.workflows',
  AUTOMATION_ADVANCED: 'automation.advanced',
  
  // Integrations
  INTEGRATIONS_BASIC: 'integrations.basic',
  INTEGRATIONS_PREMIUM: 'integrations.premium',
  
  // API
  API_ACCESS: 'api.access',
  API_WEBHOOKS: 'api.webhooks',
  
  // Extension
  EXTENSION_BASIC: 'extension.basic',
  EXTENSION_PREMIUM: 'extension.premium',
} as const;

export type FlagKey = typeof FLAG_KEYS[keyof typeof FLAG_KEYS];

class FeatureFlagService {
  private static instance: FeatureFlagService;
  private cache: Map<string, boolean> = new Map();
  private categoryCache: Map<string, FeatureFlag[]> = new Map();
  private realtimeChannel: RealtimeChannel | null = null;
  private listeners: Set<(flags: Map<string, boolean>) => void> = new Set();
  private initialized = false;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Initialize feature flags for a user
   */
  async initialize(userId: string): Promise<void> {
    if (this.initialized && this.userId === userId) {
      return;
    }

    this.userId = userId;
    await this.loadFlags();
    this.subscribeToChanges();
    this.initialized = true;
  }

  /**
   * Load all feature flags for current user
   */
  private async loadFlags(): Promise<void> {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_feature_flags', { p_user_id: this.userId });

      if (error) throw error;

      this.cache.clear();
      this.categoryCache.clear();

      (data || []).forEach((flag: FeatureFlag) => {
        this.cache.set(flag.flag_key, flag.is_enabled);
        
        const categoryFlags = this.categoryCache.get(flag.category) || [];
        categoryFlags.push(flag);
        this.categoryCache.set(flag.category, categoryFlags);
      });

      this.notifyListeners();
    } catch (error) {
      console.error('[FeatureFlags] Failed to load flags:', error);
    }
  }

  /**
   * Subscribe to realtime flag changes
   */
  private subscribeToChanges(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = supabase
      .channel('feature_flags_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_flags',
        },
        async () => {
          // Reload all flags on any change
          await this.loadFlags();
        }
      )
      .subscribe();
  }

  /**
   * Check if a feature is enabled
   */
  async isEnabled(flagKey: FlagKey | string, context?: Record<string, unknown>): Promise<boolean> {
    // Check cache first
    if (this.cache.has(flagKey)) {
      return this.cache.get(flagKey) ?? false;
    }

    // If not in cache, evaluate directly
    if (!this.userId) return false;

    try {
      const { data, error } = await supabase
        .rpc('evaluate_feature_flag', {
          p_flag_key: flagKey,
          p_user_id: this.userId,
          p_context: (context || {}) as Json,
        });

      if (error) throw error;

      const isEnabled = data ?? false;
      this.cache.set(flagKey, isEnabled);
      return isEnabled;
    } catch (error) {
      console.error(`[FeatureFlags] Failed to evaluate ${flagKey}:`, error);
      return false;
    }
  }

  /**
   * Synchronous check (uses cache only)
   */
  isEnabledSync(flagKey: FlagKey | string): boolean {
    return this.cache.get(flagKey) ?? false;
  }

  /**
   * Check multiple flags at once
   */
  async areEnabled(flagKeys: (FlagKey | string)[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    await Promise.all(
      flagKeys.map(async (key) => {
        results[key] = await this.isEnabled(key);
      })
    );

    return results;
  }

  /**
   * Get all enabled flags for a category
   */
  getFlagsByCategory(category: string): FeatureFlag[] {
    return this.categoryCache.get(category) || [];
  }

  /**
   * Get all current flag states
   */
  getAllFlags(): Map<string, boolean> {
    return new Map(this.cache);
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(listener: (flags: Map<string, boolean>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const flags = this.getAllFlags();
    this.listeners.forEach((listener) => listener(flags));
  }

  /**
   * Force refresh flags
   */
  async refresh(): Promise<void> {
    await this.loadFlags();
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.cache.clear();
    this.categoryCache.clear();
    this.listeners.clear();
    this.initialized = false;
    this.userId = null;
  }
}

export const featureFlags = FeatureFlagService.getInstance();
