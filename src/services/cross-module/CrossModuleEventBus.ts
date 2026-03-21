/**
 * Cross-Module Event Bus - Événements inter-modules
 * Permet aux modules de communiquer entre eux (import → stock → pricing → marketing)
 */
import { create } from 'zustand';

export type CrossModuleEventType =
  | 'products.imported'
  | 'products.updated'
  | 'products.bulk_edited'
  | 'stock.low'
  | 'stock.updated'
  | 'stock.replenished'
  | 'pricing.rule_applied'
  | 'pricing.competitor_change'
  | 'pricing.auto_adjusted'
  | 'orders.created'
  | 'orders.fulfilled'
  | 'orders.returned'
  | 'marketing.campaign_created'
  | 'marketing.campaign_ended'
  | 'marketing.budget_alert'
  | 'sync.completed'
  | 'sync.failed'
  | 'ai.content_generated'
  | 'ai.recommendation_ready'
  | 'webhook.order_received'
  | 'webhook.product_updated'
  | 'webhook.inventory_changed'
  | 'webhook.refund_received'
  | 'fulfillment.order_shipped'
  | 'fulfillment.delivery_delayed';

export interface CrossModuleEvent {
  id: string;
  type: CrossModuleEventType;
  source: string;       // Module source (ex: 'import', 'stock', 'pricing')
  timestamp: Date;
  data: Record<string, any>;
  suggestions: ModuleSuggestion[];
  read: boolean;
}

export interface ModuleSuggestion {
  id: string;
  targetModule: string;
  targetRoute: string;
  icon: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionLabel: string;
}

/**
 * Génère des suggestions automatiques basées sur un événement
 */
function generateSuggestions(type: CrossModuleEventType, data: Record<string, any>): ModuleSuggestion[] {
  const suggestions: ModuleSuggestion[] = [];

  switch (type) {
    case 'products.imported':
      suggestions.push(
        {
          id: `${Date.now()}-pricing`,
          targetModule: 'pricing',
          targetRoute: '/pricing-manager/rules',
          icon: 'DollarSign',
          title: 'Définir les règles de prix',
          description: `${data.count || 0} nouveaux produits importés — configurez les marges et markups`,
          priority: 'high',
          actionLabel: 'Configurer les prix',
        },
        {
          id: `${Date.now()}-seo`,
          targetModule: 'ai',
          targetRoute: '/ai/content',
          icon: 'Sparkles',
          title: 'Optimiser le contenu IA',
          description: 'Générez des descriptions SEO pour les produits importés',
          priority: 'medium',
          actionLabel: 'Générer du contenu',
        },
        {
          id: `${Date.now()}-marketing`,
          targetModule: 'marketing',
          targetRoute: '/marketing',
          icon: 'Megaphone',
          title: 'Créer une campagne',
          description: 'Lancez une campagne pour promouvoir les nouveaux produits',
          priority: 'low',
          actionLabel: 'Créer une campagne',
        }
      );
      break;

    case 'stock.low':
      suggestions.push(
        {
          id: `${Date.now()}-restock`,
          targetModule: 'suppliers',
          targetRoute: '/suppliers',
          icon: 'Truck',
          title: 'Réapprovisionner',
          description: `${data.count || 0} produits en stock bas — contactez vos fournisseurs`,
          priority: 'high',
          actionLabel: 'Commander',
        },
        {
          id: `${Date.now()}-pricing-adjust`,
          targetModule: 'pricing',
          targetRoute: '/pricing-manager/repricing',
          icon: 'TrendingUp',
          title: 'Ajuster les prix',
          description: 'Augmentez les prix des produits en rupture imminente',
          priority: 'medium',
          actionLabel: 'Repricing',
        }
      );
      break;

    case 'pricing.competitor_change':
      suggestions.push(
        {
          id: `${Date.now()}-repricing`,
          targetModule: 'pricing',
          targetRoute: '/pricing-manager/repricing',
          icon: 'Zap',
          title: 'Repricing automatique',
          description: `${data.count || 0} changements de prix détectés chez les concurrents`,
          priority: 'high',
          actionLabel: 'Ajuster',
        },
        {
          id: `${Date.now()}-ads`,
          targetModule: 'marketing',
          targetRoute: '/marketing/ads',
          icon: 'Target',
          title: 'Ajuster les enchères',
          description: 'Adaptez vos campagnes pub aux nouveaux prix du marché',
          priority: 'medium',
          actionLabel: 'Voir les pubs',
        }
      );
      break;

    case 'orders.created':
      suggestions.push(
        {
          id: `${Date.now()}-fulfill`,
          targetModule: 'fulfillment',
          targetRoute: '/orders/fulfillment',
          icon: 'PackageCheck',
          title: 'Traiter les commandes',
          description: `${data.count || 1} nouvelle(s) commande(s) à traiter`,
          priority: 'high',
          actionLabel: 'Exécuter',
        }
      );
      break;

    case 'sync.failed':
      suggestions.push(
        {
          id: `${Date.now()}-sync-fix`,
          targetModule: 'stores',
          targetRoute: '/stores-channels/sync',
          icon: 'RefreshCw',
          title: 'Corriger la synchronisation',
          description: `Échec de sync avec ${data.platform || 'une boutique'} — intervention requise`,
          priority: 'high',
          actionLabel: 'Diagnostiquer',
        }
      );
      break;

    case 'ai.recommendation_ready':
      suggestions.push(
        {
          id: `${Date.now()}-ai-apply`,
          targetModule: 'ai',
          targetRoute: '/automation/ai-hub',
          icon: 'Brain',
          title: 'Appliquer les recommandations IA',
          description: `${data.count || 0} recommandations prêtes à appliquer`,
          priority: 'medium',
          actionLabel: 'Voir',
        }
      );
      break;

    case 'webhook.order_received':
      suggestions.push(
        {
          id: `${Date.now()}-wh-order`,
          targetModule: 'orders',
          targetRoute: '/orders/fulfillment',
          icon: 'PackageCheck',
          title: 'Nouvelle commande marketplace',
          description: `Commande reçue via ${data.platform || 'webhook'} — à traiter`,
          priority: 'high',
          actionLabel: 'Traiter',
        }
      );
      break;

    case 'webhook.product_updated':
      suggestions.push(
        {
          id: `${Date.now()}-wh-product`,
          targetModule: 'pricing',
          targetRoute: '/pricing-manager/rules',
          icon: 'DollarSign',
          title: 'Produit mis à jour externalement',
          description: `Un produit a été modifié sur ${data.platform || 'la marketplace'} — vérifiez les prix`,
          priority: 'medium',
          actionLabel: 'Vérifier les prix',
        }
      );
      break;

    case 'webhook.inventory_changed':
      suggestions.push(
        {
          id: `${Date.now()}-wh-stock`,
          targetModule: 'stock',
          targetRoute: '/stock',
          icon: 'AlertTriangle',
          title: 'Stock modifié externalement',
          description: `Changement de stock détecté sur ${data.platform || 'la marketplace'}`,
          priority: 'high',
          actionLabel: 'Voir le stock',
        }
      );
      break;

    case 'webhook.refund_received':
      suggestions.push(
        {
          id: `${Date.now()}-wh-refund`,
          targetModule: 'orders',
          targetRoute: '/orders',
          icon: 'RefreshCw',
          title: 'Remboursement reçu',
          description: `Un remboursement a été émis sur ${data.platform || 'la marketplace'}`,
          priority: 'high',
          actionLabel: 'Voir',
        }
      );
      break;
  }

  return suggestions;
}

interface CrossModuleStore {
  events: CrossModuleEvent[];
  unreadCount: number;
  emit: (type: CrossModuleEventType, source: string, data?: Record<string, any>) => void;
  markRead: (eventId: string) => void;
  markAllRead: () => void;
  dismissSuggestion: (eventId: string, suggestionId: string) => void;
  getLatestSuggestions: (limit?: number) => ModuleSuggestion[];
  clearOldEvents: () => void;
}

export const useCrossModuleEvents = create<CrossModuleStore>((set, get) => ({
  events: [],
  unreadCount: 0,

  emit: (type, source, data = {}) => {
    const suggestions = generateSuggestions(type, data);
    const event: CrossModuleEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      source,
      timestamp: new Date(),
      data,
      suggestions,
      read: false,
    };

    set(state => ({
      events: [event, ...state.events].slice(0, 50), // Keep last 50
      unreadCount: state.unreadCount + 1,
    }));
  },

  markRead: (eventId) => {
    set(state => ({
      events: state.events.map(e => e.id === eventId ? { ...e, read: true } : e),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: () => {
    set(state => ({
      events: state.events.map(e => ({ ...e, read: true })),
      unreadCount: 0,
    }));
  },

  dismissSuggestion: (eventId, suggestionId) => {
    set(state => ({
      events: state.events.map(e =>
        e.id === eventId
          ? { ...e, suggestions: e.suggestions.filter(s => s.id !== suggestionId) }
          : e
      ),
    }));
  },

  getLatestSuggestions: (limit = 5) => {
    const { events } = get();
    return events
      .flatMap(e => e.suggestions)
      .slice(0, limit);
  },

  clearOldEvents: () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h
    set(state => ({
      events: state.events.filter(e => e.timestamp > cutoff),
    }));
  },
}));
