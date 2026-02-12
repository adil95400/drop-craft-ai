import { conversionApi } from '@/services/api/client';

export class ConversionService {
  // Product Bundles
  static async getProductBundles() {
    const resp = await conversionApi.listBundles();
    return resp.items;
  }

  static async createProductBundle(bundle: any) {
    return conversionApi.createBundle(bundle);
  }

  // Upsell Rules
  static async getUpsellRules() {
    const resp = await conversionApi.listUpsells();
    return resp.items;
  }

  static async generateAIUpsells(params: { product_id: string; cart_items: any[] }) {
    return conversionApi.createUpsell({ action: 'generate_upsells', ...params });
  }

  static async createUpsellRule(rule: any) {
    return conversionApi.createUpsell(rule);
  }

  // Dynamic Discounts
  static async getDynamicDiscounts() {
    const resp = await conversionApi.listDiscounts();
    return resp.items;
  }

  static async calculateDiscount(params: any) {
    return conversionApi.createDiscount({ action: 'calculate_discount', ...params });
  }

  static async createDynamicDiscount(discount: any) {
    return conversionApi.createDiscount(discount);
  }

  // Scarcity Timers
  static async getScarcityTimers() {
    const resp = await conversionApi.listTimers();
    return resp.items;
  }

  static async createScarcityTimer(timer: any) {
    return conversionApi.createTimer(timer);
  }

  // Social Proof Widgets
  static async getSocialProofWidgets() {
    const resp = await conversionApi.listSocialProof();
    return resp.items;
  }

  static async getSocialProofData(widget_type: string) {
    return conversionApi.createSocialProof({ action: 'get_social_proof_data', widget_type });
  }

  static async createSocialProofWidget(widget: any) {
    return conversionApi.createSocialProof(widget);
  }

  // Conversion Tracking
  static async trackConversion(event: any) {
    return conversionApi.trackEvent(event);
  }

  // Analytics
  static async getConversionAnalytics() {
    return conversionApi.analytics();
  }
}