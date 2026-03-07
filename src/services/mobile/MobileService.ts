/**
 * MobileService — Web-API based (no Capacitor dependency)
 * Uses navigator.vibrate, Notification API, etc.
 */
import { logger } from '@/lib/logger';

const isNativePlatform = (): boolean => {
  return typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();
};

const getPlatform = (): string => {
  if (isNativePlatform()) return (window as any).Capacitor.getPlatform?.() ?? 'web';
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'ios-web';
  if (/Android/.test(navigator.userAgent)) return 'android-web';
  return 'web';
};

export class MobileService {
  private static instance: MobileService;

  public static getInstance(): MobileService {
    if (!this.instance) {
      this.instance = new MobileService();
    }
    return this.instance;
  }

  public isNative(): boolean {
    return isNativePlatform();
  }

  public getPlatform(): string {
    return getPlatform();
  }

  // Push Notifications (Web Notification API)
  async initializePushNotifications(): Promise<void> {
    if (!('Notification' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      logger.info('Push notification permission denied');
    }
  }

  // Local Notifications via Web Notification API
  async scheduleLocalNotification(options: {
    title: string;
    body: string;
    id: number;
    schedule?: { at: Date };
    extra?: any;
  }): Promise<void> {
    try {
      if (!('Notification' in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const show = () => {
        new Notification(options.title, {
          body: options.body,
          data: options.extra,
        });
      };

      if (options.schedule?.at) {
        const delay = options.schedule.at.getTime() - Date.now();
        if (delay > 0) {
          setTimeout(show, delay);
        } else {
          show();
        }
      } else {
        show();
      }
    } catch (error) {
      logger.warn('Error scheduling local notification', { error });
    }
  }

  // Haptic Feedback via navigator.vibrate
  async triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    try {
      if ('vibrate' in navigator) {
        const durations = { light: 10, medium: 25, heavy: 50 };
        navigator.vibrate(durations[intensity]);
      }
    } catch {
      // Vibration not supported
    }
  }

  // Business Notifications
  async notifyLowStock(productName: string, currentStock: number): Promise<void> {
    await this.scheduleLocalNotification({
      title: '⚠️ Stock Faible',
      body: `${productName}: ${currentStock} unités restantes`,
      id: Date.now(),
      extra: { type: 'low_stock', product: productName },
    });
    await this.triggerHapticFeedback('heavy');
  }

  async notifyNewOrder(orderNumber: string, amount: number): Promise<void> {
    await this.scheduleLocalNotification({
      title: '🛍️ Nouvelle Commande',
      body: `Commande ${orderNumber}: ${amount}€`,
      id: Date.now(),
      extra: { type: 'new_order', orderNumber },
    });
    await this.triggerHapticFeedback('light');
  }

  async notifySupplierUpdate(supplierName: string, status: string): Promise<void> {
    await this.scheduleLocalNotification({
      title: '📦 Mise à jour Fournisseur',
      body: `${supplierName}: ${status}`,
      id: Date.now(),
      extra: { type: 'supplier_update', supplier: supplierName },
    });
  }

  // Analytics Event Tracking for Mobile
  trackMobileEvent(eventName: string, properties: Record<string, any> = {}): void {
    const mobileProperties = {
      ...properties,
      platform: this.getPlatform(),
      is_native: this.isNative(),
      timestamp: new Date().toISOString(),
    };
    logger.debug(`Mobile event: ${eventName}`, mobileProperties);
  }
}

export const mobileService = MobileService.getInstance();
