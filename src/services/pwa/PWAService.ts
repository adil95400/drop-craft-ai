// Service PWA pour ShopOpti
import { logger } from '@/utils/logger';

const LOG_CTX = { component: 'PWAService' };

class PWAService {
  private static instance: PWAService;
  private registration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: any = null;

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.registerServiceWorker();
      await this.setupPushNotifications();
      this.setupInstallPrompt();
      this.setupBackgroundSync();
      
      logger.info('PWA Service initialized successfully', LOG_CTX);
    } catch (error) {
      logger.error('Error initializing PWA Service', error instanceof Error ? error : undefined, LOG_CTX);
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        logger.debug('Service Worker registered', { ...LOG_CTX, action: 'registerServiceWorker' });
        
        this.registration.addEventListener('updatefound', () => {
          logger.info('New service worker available', { ...LOG_CTX, action: 'updateFound' });
          this.notifyUpdate();
        });
      } catch (error) {
        logger.error('Service Worker registration failed', error instanceof Error ? error : undefined, { ...LOG_CTX, action: 'registerServiceWorker' });
      }
    }
  }

  async setupPushNotifications(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        logger.debug('Notification permission denied', { ...LOG_CTX, action: 'setupPushNotifications' });
        return false;
      }

      const subscription = await (this.registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIHHNiLqkxaaNXXJf4GJiN8JuHvBqQMZYFCFa2ezgWkGLLvJrTBWBqLPD_7A'
        ) as BufferSource
      });

      await this.sendSubscriptionToServer(subscription);
      
      logger.info('Push notifications configured', { ...LOG_CTX, action: 'setupPushNotifications' });
      return true;
    } catch (error) {
      logger.error('Error setting up push notifications', error instanceof Error ? error : undefined, { ...LOG_CTX, action: 'setupPushNotifications' });
      return false;
    }
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      logger.debug('PWA install prompt ready', { ...LOG_CTX, action: 'setupInstallPrompt' });
    });

    window.addEventListener('appinstalled', () => {
      logger.info('PWA was installed', { ...LOG_CTX, action: 'appInstalled' });
      this.deferredPrompt = null;
    });
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      logger.debug('PWA already installed or prompt not available', { ...LOG_CTX, action: 'promptInstall' });
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      logger.info(`PWA install outcome: ${outcome}`, { ...LOG_CTX, action: 'promptInstall' });
      this.deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      logger.error('Error prompting PWA install', error instanceof Error ? error : undefined, { ...LOG_CTX, action: 'promptInstall' });
      return false;
    }
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           document.referrer.includes('android-app://');
  }

  private setupBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
      logger.debug('Background sync supported', { ...LOG_CTX, action: 'setupBackgroundSync' });
      
      this.scheduleSync('sync-orders', 30000);
      this.scheduleSync('sync-inventory', 300000);
    }
  }

  async scheduleSync(tag: string, delay: number = 0): Promise<void> {
    if (!this.registration) return;

    try {
      if (delay > 0) {
        setTimeout(async () => {
          await (this.registration as any).sync.register(tag);
        }, delay);
      } else {
        await (this.registration as any).sync.register(tag);
      }
      
      logger.debug(`Background sync scheduled: ${tag}`, { ...LOG_CTX, action: 'scheduleSync' });
    } catch (error) {
      logger.error(`Error scheduling sync ${tag}`, error instanceof Error ? error : undefined, { ...LOG_CTX, action: 'scheduleSync' });
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      logger.debug('Push subscription sent to server', { ...LOG_CTX, action: 'sendSubscription' });
    } catch (error) {
      logger.error('Error sending subscription to server', error instanceof Error ? error : undefined, { ...LOG_CTX, action: 'sendSubscription' });
    }
  }

  private notifyUpdate(): void {
    logger.info('App update available', { ...LOG_CTX, action: 'notifyUpdate' });
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ShopOpti', {
        body: 'Une mise à jour est disponible',
        icon: '/icons/icon-192x192.png',
        tag: 'app-update'
      });
    }
  }

  async forceUpdate(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ action: 'skipWaiting' });
      window.location.reload();
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendLocalNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        logger.debug(`Local notification sent: ${title}`, { ...LOG_CTX, action: 'sendLocalNotification' });
      } catch (error) {
        logger.error('Error sending local notification', error instanceof Error ? error : undefined, { ...LOG_CTX, action: 'sendLocalNotification' });
      }
    }
  }

  async notifyNewOrder(orderNumber: string): Promise<void> {
    await this.sendLocalNotification('Nouvelle commande reçue', {
      body: `Commande #${orderNumber} a été créée`,
      tag: 'new-order',
      requireInteraction: true
    });
  }

  async notifyLowStock(productName: string, stock: number): Promise<void> {
    await this.sendLocalNotification('Stock faible', {
      body: `${productName} - Stock restant: ${stock}`,
      tag: 'low-stock',
      icon: '/icons/warning.png'
    });
  }

  async notifyPaymentReceived(amount: number, currency: string = 'EUR'): Promise<void> {
    await this.sendLocalNotification('Paiement reçu', {
      body: `Nouveau paiement de ${amount}${currency}`,
      tag: 'payment-received',
      icon: '/icons/success.png'
    });
  }
}

export const pwaService = PWAService.getInstance();
