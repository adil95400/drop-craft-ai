// Service de notifications pour ShopOpti
import { pwaService } from '@/services/pwa/PWAService';

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: any;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private subscribers: Map<string, ((notification: NotificationConfig) => void)[]> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialiser le service de notifications
  async initialize(): Promise<void> {
    try {
      // Vérifier et demander les permissions
      await this.requestPermission();
      
      // Configurer les gestionnaires d'événements
      this.setupEventHandlers();
      
      console.log('Notification Service initialized');
    } catch (error) {
      console.error('Error initializing Notification Service:', error);
    }
  }

  // Demander la permission pour les notifications
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Envoyer une notification
  async sendNotification(config: NotificationConfig): Promise<void> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      // Utiliser le PWA service pour les notifications locales
      await pwaService.sendLocalNotification(config.title, {
        body: config.body,
        icon: config.icon || '/icons/icon-192x192.png',
        badge: config.badge || '/icons/icon-72x72.png',
        tag: config.tag,
        requireInteraction: config.requireInteraction,
        data: config.data
      });

      // Notifier les abonnés
      this.notifySubscribers('notification_sent', config);
      
      console.log('Notification sent:', config.title);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Notifications spécialisées pour l'e-commerce

  // Nouvelle commande
  async notifyNewOrder(orderNumber: string, customerName: string, amount: number): Promise<void> {
    await this.sendNotification({
      title: '🛒 Nouvelle commande',
      body: `Commande #${orderNumber} de ${customerName} - ${amount}€`,
      tag: 'new-order',
      requireInteraction: true,
      icon: '/icons/order.png',
      actions: [
        { action: 'view', title: 'Voir', icon: '/icons/view.png' },
        { action: 'process', title: 'Traiter', icon: '/icons/process.png' }
      ],
      data: { type: 'order', orderNumber, customerName, amount }
    });
  }

  // Stock faible
  async notifyLowStock(productName: string, currentStock: number, threshold: number): Promise<void> {
    await this.sendNotification({
      title: '⚠️ Stock faible',
      body: `${productName} - Stock: ${currentStock}/${threshold}`,
      tag: 'low-stock',
      icon: '/icons/warning.png',
      actions: [
        { action: 'restock', title: 'Réapprovisionner', icon: '/icons/restock.png' },
        { action: 'view', title: 'Voir produit', icon: '/icons/view.png' }
      ],
      data: { type: 'stock', productName, currentStock, threshold }
    });
  }

  // Paiement reçu
  async notifyPaymentReceived(orderNumber: string, amount: number, method: string): Promise<void> {
    await this.sendNotification({
      title: '💰 Paiement reçu',
      body: `${amount}€ via ${method} - Commande #${orderNumber}`,
      tag: 'payment-received',
      icon: '/icons/success.png',
      actions: [
        { action: 'view', title: 'Voir commande', icon: '/icons/view.png' }
      ],
      data: { type: 'payment', orderNumber, amount, method }
    });
  }

  // Retour produit
  async notifyProductReturn(orderNumber: string, productName: string, reason: string): Promise<void> {
    await this.sendNotification({
      title: '↩️ Demande de retour',
      body: `${productName} - ${reason} (Commande #${orderNumber})`,
      tag: 'product-return',
      icon: '/icons/return.png',
      requireInteraction: true,
      actions: [
        { action: 'approve', title: 'Approuver', icon: '/icons/approve.png' },
        { action: 'review', title: 'Examiner', icon: '/icons/review.png' }
      ],
      data: { type: 'return', orderNumber, productName, reason }
    });
  }

  // Nouveau message client
  async notifyCustomerMessage(customerName: string, subject: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
    const priorityEmoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
    
    await this.sendNotification({
      title: `${priorityEmoji} Nouveau message`,
      body: `${customerName}: ${subject}`,
      tag: 'customer-message',
      requireInteraction: priority === 'high',
      icon: '/icons/message.png',
      actions: [
        { action: 'reply', title: 'Répondre', icon: '/icons/reply.png' },
        { action: 'view', title: 'Voir conversation', icon: '/icons/view.png' }
      ],
      data: { type: 'message', customerName, subject, priority }
    });
  }

  // Synchronisation terminée
  async notifySyncComplete(platform: string, itemsCount: number, errors: number = 0): Promise<void> {
    const title = errors > 0 ? '⚠️ Synchronisation terminée avec erreurs' : '✅ Synchronisation terminée';
    const body = errors > 0 
      ? `${platform}: ${itemsCount} éléments, ${errors} erreurs`
      : `${platform}: ${itemsCount} éléments synchronisés`;

    await this.sendNotification({
      title,
      body,
      tag: 'sync-complete',
      icon: errors > 0 ? '/icons/warning.png' : '/icons/success.png',
      actions: errors > 0 ? [
        { action: 'view-errors', title: 'Voir erreurs', icon: '/icons/error.png' }
      ] : [],
      data: { type: 'sync', platform, itemsCount, errors }
    });
  }

  // Seuil de revenus atteint
  async notifyRevenueThreshold(amount: number, period: string, threshold: number): Promise<void> {
    await this.sendNotification({
      title: '🎉 Objectif de revenus atteint',
      body: `${amount}€ sur ${period} (Objectif: ${threshold}€)`,
      tag: 'revenue-threshold',
      icon: '/icons/celebration.png',
      actions: [
        { action: 'view-analytics', title: 'Voir analytics', icon: '/icons/analytics.png' }
      ],
      data: { type: 'revenue', amount, period, threshold }
    });
  }

  // Configurer les gestionnaires d'événements
  private setupEventHandlers(): void {
    // Gestionnaire pour les clics sur notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'notification-click') {
          this.handleNotificationClick(event.data.action, event.data.notificationData);
        }
      });
    }
  }

  // Gérer les clics sur les notifications
  private handleNotificationClick(action: string, data: any): void {
    console.log('Notification clicked:', action, data);
    
    switch (action) {
      case 'view':
        this.navigateToRelevantPage(data);
        break;
      case 'process':
        if (data.type === 'order') {
          this.navigateToOrderProcessing(data.orderNumber);
        }
        break;
      case 'restock':
        if (data.type === 'stock') {
          this.navigateToInventoryManagement(data.productName);
        }
        break;
      case 'reply':
        if (data.type === 'message') {
          this.navigateToCustomerSupport(data.customerName);
        }
        break;
      default:
        console.log('Unknown notification action:', action);
    }

    // Notifier les abonnés
    this.notifySubscribers('notification_clicked', { action, data });
  }

  // Navigation helpers
  private navigateToRelevantPage(data: any): void {
    switch (data.type) {
      case 'order':
        window.location.href = `/orders/${data.orderNumber}`;
        break;
      case 'stock':
        window.location.href = `/inventory?search=${encodeURIComponent(data.productName)}`;
        break;
      case 'payment':
        window.location.href = `/orders/${data.orderNumber}`;
        break;
      case 'message':
        window.location.href = `/support?customer=${encodeURIComponent(data.customerName)}`;
        break;
      default:
        window.location.href = '/dashboard';
    }
  }

  private navigateToOrderProcessing(orderNumber: string): void {
    window.location.href = `/orders/${orderNumber}/process`;
  }

  private navigateToInventoryManagement(productName: string): void {
    window.location.href = `/inventory/restock?product=${encodeURIComponent(productName)}`;
  }

  private navigateToCustomerSupport(customerName: string): void {
    window.location.href = `/support/conversation?customer=${encodeURIComponent(customerName)}`;
  }

  // Système d'abonnement pour les événements
  subscribe(event: string, callback: (data: any) => void): void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(callback);
  }

  unsubscribe(event: string, callback: (data: any) => void): void {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifySubscribers(event: string, data: any): void {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Nettoyer les notifications obsolètes
  async clearOldNotifications(olderThanHours: number = 24): Promise<void> {
    // Cette fonctionnalité nécessiterait l'accès au service worker
    // pour nettoyer les notifications système
    console.log(`Clearing notifications older than ${olderThanHours} hours`);
  }

  // Planifier des notifications
  async scheduleNotification(config: NotificationConfig, delayMs: number): Promise<void> {
    setTimeout(() => {
      this.sendNotification(config);
    }, delayMs);
  }
}

export const notificationService = NotificationService.getInstance();