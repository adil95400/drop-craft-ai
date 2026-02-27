// Service d'intégration mobile pour ShopOpti
import { pwaService } from '@/services/pwa/PWAService';
import { notificationService } from '@/services/notifications/NotificationService';

interface MobileDevice {
  id: string;
  platform: 'ios' | 'android' | 'web';
  version: string;
  model: string;
  userAgent: string;
  capabilities: {
    camera: boolean;
    gps: boolean;
    biometric: boolean;
    pushNotifications: boolean;
    offlineStorage: boolean;
  };
}

interface SyncStatus {
  lastSync: Date;
  status: 'syncing' | 'completed' | 'error' | 'pending';
  pendingItems: number;
  errorCount: number;
}

class MobileIntegrationService {
  private static instance: MobileIntegrationService;
  private device: MobileDevice | null = null;
  private syncStatus: SyncStatus = {
    lastSync: new Date(),
    status: 'pending',
    pendingItems: 0,
    errorCount: 0
  };
  private offlineData: Map<string, any> = new Map();
  private syncQueue: Array<{ action: string; data: any; timestamp: Date }> = [];

  static getInstance(): MobileIntegrationService {
    if (!MobileIntegrationService.instance) {
      MobileIntegrationService.instance = new MobileIntegrationService();
    }
    return MobileIntegrationService.instance;
  }

  // Initialiser le service mobile
  async initialize(): Promise<void> {
    try {
      await this.detectDevice();
      await this.setupOfflineCapabilities();
      await this.initializeNativeFeatures();
      
      console.log('Mobile Integration Service initialized', this.device);
    } catch (error) {
      console.error('Error initializing Mobile Integration Service:', error);
    }
  }

  // Détecter les capacités de l'appareil
  private async detectDevice(): Promise<void> {
    const userAgent = navigator.userAgent;
    let platform: 'ios' | 'android' | 'web' = 'web';
    
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      platform = 'ios';
    } else if (/Android/i.test(userAgent)) {
      platform = 'android';
    }

    // Détecter les capacités
    const capabilities = {
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      gps: 'geolocation' in navigator,
      biometric: await this.checkBiometricSupport(),
      pushNotifications: 'Notification' in window && 'serviceWorker' in navigator,
      offlineStorage: 'serviceWorker' in navigator && 'caches' in window
    };

    this.device = {
      id: await this.generateDeviceId(),
      platform,
      version: this.extractVersionFromUserAgent(userAgent),
      model: this.extractModelFromUserAgent(userAgent),
      userAgent,
      capabilities
    };
  }

  // Vérifier le support biométrique
  private async checkBiometricSupport(): Promise<boolean> {
    try {
      // Web Authentication API pour la biométrie
      if ('credentials' in navigator && 'create' in navigator.credentials) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Générer un ID d'appareil unique
  private async generateDeviceId(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        const fingerprint = canvas.toDataURL();
        
        // Créer un hash simple
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
          const char = fingerprint.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36);
      }
    } catch (error) {
      console.error('Error generating device ID:', error);
    }
    
    // Fallback using crypto
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    return Date.now().toString(36) + Array.from(arr, b => b.toString(36)).join('');
  }

  // Extraire la version depuis le user agent
  private extractVersionFromUserAgent(userAgent: string): string {
    const matches = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([0-9.]+)/);
    return matches ? matches[2] : 'unknown';
  }

  // Extraire le modèle depuis le user agent
  private extractModelFromUserAgent(userAgent: string): string {
    if (/iPhone/i.test(userAgent)) {
      const match = userAgent.match(/iPhone OS ([0-9_]+)/);
      return match ? `iPhone (iOS ${match[1].replace(/_/g, '.')})` : 'iPhone';
    }
    
    if (/iPad/i.test(userAgent)) {
      return 'iPad';
    }
    
    if (/Android/i.test(userAgent)) {
      const match = userAgent.match(/Android ([0-9.]+)/);
      return match ? `Android ${match[1]}` : 'Android Device';
    }
    
    return 'Web Browser';
  }

  // Configurer les capacités hors-ligne
  private async setupOfflineCapabilities(): Promise<void> {
    if (!this.device?.capabilities.offlineStorage) return;

    try {
      // Configurer le cache pour les données critiques
      const cache = await caches.open('shopopti-mobile-v1');
      
      // Cache des pages importantes
      await cache.addAll([
        '/',
        '/dashboard',
        '/products',
        '/orders',
        '/offline.html'
      ]);
      
      // Écouter les événements de connectivité
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      
      console.log('Offline capabilities configured');
    } catch (error) {
      console.error('Error setting up offline capabilities:', error);
    }
  }

  // Initialiser les fonctionnalités natives
  private async initializeNativeFeatures(): Promise<void> {
    if (!this.device) return;

    // Initialiser les notifications push si supportées
    if (this.device.capabilities.pushNotifications) {
      await notificationService.initialize();
    }

    // Configurer l'authentification biométrique si supportée
    if (this.device.capabilities.biometric) {
      await this.setupBiometricAuth();
    }

    console.log('Native features initialized');
  }

  // Configurer l'authentification biométrique
  private async setupBiometricAuth(): Promise<void> {
    try {
      if (!('credentials' in navigator)) return;

      // Vérifier si des credentials existent déjà
      console.log('Biometric authentication available');
      
      // Cette fonctionnalité nécessiterait une configuration plus avancée
      // avec des clés publiques/privées côté serveur
    } catch (error) {
      console.error('Error setting up biometric auth:', error);
    }
  }

  // Gérer la connexion
  private async handleOnline(): Promise<void> {
    console.log('Device is online');
    
    await notificationService.sendNotification({
      title: '📶 Connexion rétablie',
      body: 'Synchronisation en cours...',
      tag: 'connection-restored'
    });

    // Démarrer la synchronisation
    await this.syncPendingData();
  }

  // Gérer la déconnexion
  private async handleOffline(): Promise<void> {
    console.log('Device is offline');
    
    await notificationService.sendNotification({
      title: '📶 Mode hors-ligne',
      body: 'Vos données seront synchronisées à la reconnexion',
      tag: 'offline-mode'
    });
  }

  // Scanner un code-barres (si caméra disponible)
  async scanBarcode(): Promise<string | null> {
    if (!this.device?.capabilities.camera) {
      throw new Error('Camera not available');
    }

    try {
      // Utiliser l'API Camera moderne
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Créer un canvas pour capturer l'image
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      return new Promise((resolve, reject) => {
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Capturer une frame
          context?.drawImage(video, 0, 0);
          
          // Arrêter le stream
          stream.getTracks().forEach(track => track.stop());
          
          // Simuler la détection de code-barres
          // Dans une vraie implémentation, on utiliserait une librairie comme QuaggaJS
          const mockBarcode = '123456789012';
          resolve(mockBarcode);
        });

        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
          reject(new Error('Barcode scan timeout'));
        }, 30000);
      });
      
    } catch (error) {
      console.error('Error scanning barcode:', error);
      throw error;
    }
  }

  // Obtenir la géolocalisation
  async getCurrentLocation(): Promise<GeolocationPosition> {
    if (!this.device?.capabilities.gps) {
      throw new Error('GPS not available');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Prendre une photo
  async capturePhoto(): Promise<Blob> {
    if (!this.device?.capabilities.camera) {
      throw new Error('Camera not available');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      return new Promise((resolve, reject) => {
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          context?.drawImage(video, 0, 0);
          
          // Arrêter le stream
          stream.getTracks().forEach(track => track.stop());
          
          canvas.toBlob(blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to capture photo'));
            }
          }, 'image/jpeg', 0.9);
        });
      });
      
    } catch (error) {
      console.error('Error capturing photo:', error);
      throw error;
    }
  }

  // Sauvegarder des données hors-ligne
  async saveOfflineData(key: string, data: any): Promise<void> {
    try {
      // Sauvegarder en mémoire
      this.offlineData.set(key, {
        data,
        timestamp: new Date(),
        synced: false
      });

      // Ajouter à la queue de synchronisation
      this.syncQueue.push({
        action: 'save',
        data: { key, data },
        timestamp: new Date()
      });

      // Sauvegarder dans IndexedDB si disponible
      if ('indexedDB' in window) {
        localStorage.setItem(`offline_${key}`, JSON.stringify({
          data,
          timestamp: new Date().toISOString(),
          synced: false
        }));
      }

      console.log('Data saved offline:', key);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  // Récupérer des données hors-ligne
  getOfflineData(key: string): any {
    // Essayer d'abord en mémoire
    const memoryData = this.offlineData.get(key);
    if (memoryData) {
      return memoryData.data;
    }

    // Essayer dans localStorage
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
    } catch (error) {
      console.error('Error reading offline data:', error);
    }

    return null;
  }

  // Synchroniser les données en attente
  async syncPendingData(): Promise<void> {
    if (this.syncQueue.length === 0) {
      this.syncStatus.status = 'completed';
      return;
    }

    this.syncStatus.status = 'syncing';
    this.syncStatus.pendingItems = this.syncQueue.length;

    try {
      // Traiter la queue de synchronisation
      while (this.syncQueue.length > 0) {
        const item = this.syncQueue.shift();
        if (!item) continue;

        try {
          await this.syncItem(item);
          this.syncStatus.pendingItems--;
        } catch (error) {
          console.error('Error syncing item:', error);
          this.syncStatus.errorCount++;
        }
      }

      this.syncStatus.status = 'completed';
      this.syncStatus.lastSync = new Date();

      await notificationService.sendNotification({
        title: '✅ Synchronisation terminée',
        body: `${this.syncStatus.pendingItems} éléments synchronisés`,
        tag: 'sync-completed'
      });

    } catch (error) {
      this.syncStatus.status = 'error';
      console.error('Error during sync:', error);
    }
  }

  // Synchroniser un élément spécifique
  private async syncItem(item: { action: string; data: any; timestamp: Date }): Promise<void> {
    // Send to API for sync
    // TODO: Replace with actual API call when mobile sync endpoint is ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Marquer comme synchronisé
    if (item.data.key) {
      const offlineItem = this.offlineData.get(item.data.key);
      if (offlineItem) {
        offlineItem.synced = true;
      }
    }
  }

  // Obtenir le statut de synchronisation
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Obtenir les infos de l'appareil
  getDeviceInfo(): MobileDevice | null {
    return this.device ? { ...this.device } : null;
  }

  // Vérifier si on est en mode hors-ligne
  isOffline(): boolean {
    return !navigator.onLine;
  }

  // Nettoyer les données hors-ligne anciennes
  async cleanupOfflineData(olderThanDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Nettoyer les données en mémoire
    for (const [key, value] of this.offlineData.entries()) {
      if (value.timestamp < cutoffDate && value.synced) {
        this.offlineData.delete(key);
      }
    }

    // Nettoyer localStorage
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('offline_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (new Date(data.timestamp) < cutoffDate && data.synced) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Supprimer les données corrompues
          localStorage.removeItem(key);
        }
      }
    }

    console.log('Offline data cleanup completed');
  }

  // Forcer une synchronisation
  async forcSync(): Promise<void> {
    await this.syncPendingData();
  }
}

export const mobileIntegrationService = MobileIntegrationService.getInstance();