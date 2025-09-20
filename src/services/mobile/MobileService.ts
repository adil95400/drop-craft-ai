import { Capacitor } from '@capacitor/core';
import { PushNotifications, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export class MobileService {
  private static instance: MobileService;
  
  public static getInstance(): MobileService {
    if (!this.instance) {
      this.instance = new MobileService();
    }
    return this.instance;
  }

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public getPlatform(): string {
    return Capacitor.getPlatform();
  }

  // Push Notifications
  async initializePushNotifications(): Promise<void> {
    if (!this.isNative()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive === 'granted') {
      // Register for push notifications
      await PushNotifications.register();
      
      // Listen for registration
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ', token.value);
        this.sendTokenToServer(token.value);
      });

      // Listen for push notifications
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', notification);
        this.handleNotificationReceived(notification);
      });

      // Listen for notification actions
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push action performed: ', action);
        this.handleNotificationAction(action);
      });
    } else {
      console.log('Push notification permission denied');
    }
  }

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      // Send token to your backend for storing
      const response = await fetch('/api/push-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform: this.getPlatform() })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send token to server');
      }
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  private handleNotificationReceived(notification: PushNotificationSchema): void {
    // Handle foreground notification
    this.triggerHapticFeedback();
    
    // Show local notification if app is in foreground
    this.scheduleLocalNotification({
      title: notification.title || 'New Notification',
      body: notification.body || '',
      id: Date.now(),
      schedule: { at: new Date(Date.now() + 1000) }
    });
  }

  private handleNotificationAction(action: ActionPerformed): void {
    // Handle notification tap
    const data = action.notification.data;
    
    if (data?.route) {
      // Navigate to specific route
      window.location.href = data.route;
    }
  }

  // Local Notifications
  async scheduleLocalNotification(options: {
    title: string;
    body: string;
    id: number;
    schedule?: { at: Date };
    extra?: any;
  }): Promise<void> {
    try {
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [{
            title: options.title,
            body: options.body,
            id: options.id,
            schedule: options.schedule,
            extra: options.extra
          }]
        });
      }
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  // Haptic Feedback
  async triggerHapticFeedback(style: ImpactStyle = ImpactStyle.Medium): Promise<void> {
    if (this.isNative()) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.error('Error triggering haptic feedback:', error);
      }
    }
  }

  // Business Notifications
  async notifyLowStock(productName: string, currentStock: number): Promise<void> {
    await this.scheduleLocalNotification({
      title: '⚠️ Stock Faible',
      body: `${productName}: ${currentStock} unités restantes`,
      id: Date.now(),
      extra: { type: 'low_stock', product: productName }
    });
    
    await this.triggerHapticFeedback(ImpactStyle.Heavy);
  }

  async notifyNewOrder(orderNumber: string, amount: number): Promise<void> {
    await this.scheduleLocalNotification({
      title: '🛍️ Nouvelle Commande',
      body: `Commande ${orderNumber}: ${amount}€`,
      id: Date.now(),
      extra: { type: 'new_order', orderNumber }
    });
    
    await this.triggerHapticFeedback(ImpactStyle.Light);
  }

  async notifySupplierUpdate(supplierName: string, status: string): Promise<void> {
    await this.scheduleLocalNotification({
      title: '📦 Mise à jour Fournisseur',
      body: `${supplierName}: ${status}`,
      id: Date.now(),
      extra: { type: 'supplier_update', supplier: supplierName }
    });
  }

  // Analytics Event Tracking for Mobile
  trackMobileEvent(eventName: string, properties: Record<string, any> = {}): void {
    const mobileProperties = {
      ...properties,
      platform: this.getPlatform(),
      is_native: this.isNative(),
      timestamp: new Date().toISOString()
    };

    // Send to analytics service
    console.log('Mobile Analytics Event:', eventName, mobileProperties);
    
    // In production, send to your analytics provider
    // Example: mixpanel.track(eventName, mobileProperties);
  }
}

export const mobileService = MobileService.getInstance();