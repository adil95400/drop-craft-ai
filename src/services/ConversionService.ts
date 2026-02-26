/**
 * @module ConversionService
 * @description Centralized service for conversion optimization features:
 * product bundles, upsell rules, dynamic discounts, scarcity timers,
 * social proof widgets, and conversion tracking/analytics.
 *
 * All methods delegate to the `conversionApi` HTTP client.
 */
import { conversionApi } from '@/services/api/client';

export class ConversionService {
  // ── Product Bundles ────────────────────────────────────────────

  /** Retrieve all product bundles for the current user. */
  static async getProductBundles() {
    const resp = await conversionApi.listBundles();
    return resp.items;
  }

  /**
   * Create a new product bundle.
   * @param bundle - Bundle configuration (products, discount, name…).
   */
  static async createProductBundle(bundle: any) {
    return conversionApi.createBundle(bundle);
  }

  // ── Upsell Rules ───────────────────────────────────────────────

  /** List all upsell rules configured by the user. */
  static async getUpsellRules() {
    const resp = await conversionApi.listUpsells();
    return resp.items;
  }

  /**
   * Ask the AI to generate upsell suggestions for a given product & cart.
   * @param params.product_id - The product to generate upsells for.
   * @param params.cart_items  - Current cart contents for context.
   */
  static async generateAIUpsells(params: { product_id: string; cart_items: any[] }) {
    return conversionApi.createUpsell({ action: 'generate_upsells', ...params });
  }

  /**
   * Persist a manually-created upsell rule.
   * @param rule - Upsell rule definition (trigger, offer, priority…).
   */
  static async createUpsellRule(rule: any) {
    return conversionApi.createUpsell(rule);
  }

  // ── Dynamic Discounts ──────────────────────────────────────────

  /** Fetch all dynamic discount rules. */
  static async getDynamicDiscounts() {
    const resp = await conversionApi.listDiscounts();
    return resp.items;
  }

  /**
   * Calculate the effective discount for a cart / product context.
   * @param params - Cart data, customer segment, etc.
   */
  static async calculateDiscount(params: any) {
    return conversionApi.createDiscount({ action: 'calculate_discount', ...params });
  }

  /** Create a new dynamic discount rule. */
  static async createDynamicDiscount(discount: any) {
    return conversionApi.createDiscount(discount);
  }

  // ── Scarcity Timers ────────────────────────────────────────────

  /** List all scarcity/countdown timers. */
  static async getScarcityTimers() {
    const resp = await conversionApi.listTimers();
    return resp.items;
  }

  /** Create a new scarcity timer (flash sale, limited stock…). */
  static async createScarcityTimer(timer: any) {
    return conversionApi.createTimer(timer);
  }

  // ── Social Proof Widgets ───────────────────────────────────────

  /** List all social proof widget configurations. */
  static async getSocialProofWidgets() {
    const resp = await conversionApi.listSocialProof();
    return resp.items;
  }

  /**
   * Fetch live social proof data for a given widget type.
   * @param widget_type - e.g. "recent_purchases", "live_visitors".
   */
  static async getSocialProofData(widget_type: string) {
    return conversionApi.createSocialProof({ action: 'get_social_proof_data', widget_type });
  }

  /** Create a new social proof widget. */
  static async createSocialProofWidget(widget: any) {
    return conversionApi.createSocialProof(widget);
  }

  // ── Conversion Tracking ────────────────────────────────────────

  /**
   * Track a conversion event (purchase, add-to-cart, checkout…).
   * @param event - Event payload with type, value, metadata.
   */
  static async trackConversion(event: any) {
    return conversionApi.trackEvent(event);
  }

  // ── Analytics ──────────────────────────────────────────────────

  /** Retrieve aggregated conversion analytics (rates, revenue, funnel…). */
  static async getConversionAnalytics() {
    return conversionApi.analytics();
  }
}
