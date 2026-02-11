// Service PWA pour ShopOpti
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

  // Initialisation du PWA
  async initialize(): Promise<void> {
    try {
      // Enregistrement du Service Worker
      await this.registerServiceWorker();
      
      // Configuration des notifications push
      await this.setupPushNotifications();
      
      // Gestion de l'installation PWA
      this.setupInstallPrompt();
      
      // Synchronisation en arrière-plan
      this.setupBackgroundSync();
      
      console.log('PWA Service initialized successfully');
    } catch (error) {
      console.error('Error initializing PWA Service:', error);
    }
  }

  // Enregistrement du Service Worker
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', this.registration);
        
        // Écouter les mises à jour
        this.registration.addEventListener('updatefound', () => {
          console.log('New service worker available');
          this.notifyUpdate();
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Configuration des notifications push
  async setupPushNotifications(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // S'abonner aux notifications push
      const subscription = await (this.registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // Clé publique VAPID (à configurer avec Firebase)
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIHHNiLqkxaaNXXJf4GJiN8JuHvBqQMZYFCFa2ezgWkGLLvJrTBWBqLPD_7A'
        ) as BufferSource
      });

      // Envoyer l'abonnement au serveur
      await this.sendSubscriptionToServer(subscription);
      
      console.log('Push notifications configured');
      return true;
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      return false;
    }
  }

  // Gestion de l'installation PWA
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('PWA install prompt ready');
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
    });
  }

  // Proposer l'installation PWA
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA already installed or prompt not available');
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`PWA install outcome: ${outcome}`);
      this.deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error prompting PWA install:', error);
      return false;
    }
  }

  // Vérifier si PWA est installable
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  // Vérifier si PWA est installé
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           document.referrer.includes('android-app://');
  }

  // Configuration de la synchronisation en arrière-plan
  private setupBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
      console.log('Background sync supported');
      
      // Programmer des synchronisations périodiques
      this.scheduleSync('sync-orders', 30000); // Toutes les 30 secondes
      this.scheduleSync('sync-inventory', 300000); // Toutes les 5 minutes
    }
  }

  // Programmer une synchronisation
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
      
      console.log(`Background sync scheduled: ${tag}`);
    } catch (error) {
      console.error(`Error scheduling sync ${tag}:`, error);
    }
  }

  // Envoyer l'abonnement push au serveur
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('Push subscription sent to server');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  // Notifier d'une mise à jour disponible
  private notifyUpdate(): void {
    // Afficher une notification ou un toast pour informer l'utilisateur
    console.log('App update available');
    
    // Ici on pourrait utiliser un toast service
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ShopOpti', {
        body: 'Une mise à jour est disponible',
        icon: '/icons/icon-192x192.png',
        tag: 'app-update'
      });
    }
  }

  // Forcer la mise à jour
  async forceUpdate(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ action: 'skipWaiting' });
      window.location.reload();
    }
  }

  // Utilitaire pour convertir la clé VAPID
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

  // Envoyer une notification push locale
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

        console.log('Local notification sent:', title);
      } catch (error) {
        console.error('Error sending local notification:', error);
      }
    }
  }

  // Notifications métier
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