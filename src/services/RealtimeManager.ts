import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Gestionnaire centralisé des subscriptions real-time
 * Évite les connexions multiples et gère le pooling
 */
class RealtimeManager {
  private static instance: RealtimeManager;
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscribers: Map<string, Set<string>> = new Map();
  private channelStatus: Map<string, 'connecting' | 'connected' | 'error'> = new Map();

  private constructor() {
    // Cleanup au déchargement de la page
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  /**
   * Subscribe à une table avec pooling automatique
   */
  public subscribe(
    table: string,
    subscriberId: string,
    callback: (payload: any) => void,
    options?: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      filter?: string;
    }
  ): () => void {
    const channelKey = this.getChannelKey(table, options?.event, options?.filter);

    // Créer ou réutiliser le channel
    if (!this.channels.has(channelKey)) {
      this.createChannel(channelKey, table, options);
    }

    // Enregistrer le subscriber
    if (!this.subscribers.has(channelKey)) {
      this.subscribers.set(channelKey, new Set());
    }
    this.subscribers.get(channelKey)!.add(subscriberId);

    // Retourner fonction de cleanup
    return () => {
      this.unsubscribe(channelKey, subscriberId);
    };
  }

  /**
   * Créer un nouveau channel
   */
  private createChannel(
    channelKey: string,
    table: string,
    options?: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      filter?: string;
    }
  ) {
    this.channelStatus.set(channelKey, 'connecting');

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes' as any,
        {
          event: options?.event || '*',
          schema: 'public',
          table: table,
          filter: options?.filter,
        },
        (payload) => {
          // Notifier tous les subscribers de ce channel
          this.notifySubscribers(channelKey, payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.channelStatus.set(channelKey, 'connected');
          console.log(`[RealtimeManager] Connected to ${channelKey}`);
        } else if (status === 'CHANNEL_ERROR') {
          this.channelStatus.set(channelKey, 'error');
          console.error(`[RealtimeManager] Error connecting to ${channelKey}`);
        }
      });

    this.channels.set(channelKey, channel);
  }

  /**
   * Notifier tous les subscribers d'un channel
   */
  private notifySubscribers(channelKey: string, payload: any) {
    const callbacks = (window as any).__realtimeCallbacks?.[channelKey];
    if (callbacks) {
      callbacks.forEach((callback: Function) => callback(payload));
    }
  }

  /**
   * Enregistrer un callback pour un channel
   */
  public registerCallback(channelKey: string, subscriberId: string, callback: (payload: any) => void) {
    if (!(window as any).__realtimeCallbacks) {
      (window as any).__realtimeCallbacks = {};
    }
    if (!(window as any).__realtimeCallbacks[channelKey]) {
      (window as any).__realtimeCallbacks[channelKey] = new Map();
    }
    (window as any).__realtimeCallbacks[channelKey].set(subscriberId, callback);
  }

  /**
   * Unsubscribe un subscriber spécifique
   */
  private unsubscribe(channelKey: string, subscriberId: string) {
    const subs = this.subscribers.get(channelKey);
    if (subs) {
      subs.delete(subscriberId);

      // Si plus aucun subscriber, fermer le channel
      if (subs.size === 0) {
        this.closeChannel(channelKey);
      }
    }

    // Supprimer le callback
    const callbacks = (window as any).__realtimeCallbacks?.[channelKey];
    if (callbacks) {
      callbacks.delete(subscriberId);
    }
  }

  /**
   * Fermer un channel
   */
  private closeChannel(channelKey: string) {
    const channel = this.channels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelKey);
      this.subscribers.delete(channelKey);
      this.channelStatus.delete(channelKey);
      console.log(`[RealtimeManager] Closed ${channelKey}`);
    }
  }

  /**
   * Générer une clé unique pour un channel
   */
  private getChannelKey(table: string, event?: string, filter?: string): string {
    return `realtime:${table}:${event || '*'}:${filter || 'all'}`;
  }

  /**
   * Obtenir le statut d'un channel
   */
  public getChannelStatus(table: string, event?: string, filter?: string): 'connecting' | 'connected' | 'error' | 'disconnected' {
    const channelKey = this.getChannelKey(table, event, filter);
    return this.channelStatus.get(channelKey) || 'disconnected';
  }

  /**
   * Obtenir statistiques des connexions
   */
  public getStats() {
    return {
      totalChannels: this.channels.size,
      totalSubscribers: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0),
      channels: Array.from(this.channels.keys()),
    };
  }

  /**
   * Cleanup de toutes les connexions
   */
  public cleanup() {
    console.log('[RealtimeManager] Cleaning up all channels');
    this.channels.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.subscribers.clear();
    this.channelStatus.clear();
  }
}

export const realtimeManager = RealtimeManager.getInstance();
