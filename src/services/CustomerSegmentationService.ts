import { supabase } from '@/integrations/supabase/client';

export interface CustomerSegment {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  segment_type: 'dynamic' | 'static' | 'ai_generated';
  rules: SegmentRule[];
  customer_count: number;
  avg_order_value?: number;
  total_revenue?: number;
  last_calculated_at?: string;
  auto_update: boolean;
  update_frequency: 'hourly' | 'daily' | 'weekly';
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SegmentRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'within_days' | 'older_than_days' | 'between';
  value: any;
}

export interface SegmentMember {
  id: string;
  segment_id: string;
  customer_id: string;
  added_at: string;
  score?: number;
  metadata: Record<string, any>;
  customer?: { first_name: string; last_name: string; email: string };
}

export interface RFMScore {
  id: string;
  user_id: string;
  customer_id: string;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  rfm_segment: string;
  total_orders: number;
  total_spent: number;
  avg_order_value?: number;
  days_since_last_order?: number;
  calculated_at: string;
  customer?: { first_name: string; last_name: string; email: string };
}

// Modèles de segments inspirés de Shopify
export interface SegmentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'value' | 'behavior' | 'location' | 'engagement' | 'email' | 'cart' | 'lifecycle';
  actionLabel: string;
  rules: SegmentRule[];
  icon: string;
  isPopular?: boolean;
}

export const SEGMENT_TEMPLATES: SegmentTemplate[] = [
  // ===== CATÉGORIE: VALEUR CLIENT =====
  {
    id: 'high-spenders-recent',
    name: 'Clients ayant récemment dépensé un montant élevé par commande',
    description: 'Effectuez des ventes croisées avec les clients qui ont dépensé beaucoup et qui ont passé une commande au cours des 90 derniers jours avec un autre produit de la même collection.',
    category: 'value',
    actionLabel: 'Interagissez avec les clients à forte valeur',
    rules: [
      { field: 'total_spent', operator: 'greater_than', value: 500 },
      { field: 'last_order_date', operator: 'within_days', value: 90 }
    ],
    icon: 'DollarSign',
    isPopular: true
  },
  {
    id: 'vip-customers',
    name: 'Interagissez avec vos clients VIP',
    description: 'Offrez à vos clients VIP un accès anticipé aux événements promotionnels, aux ventes et aux nouveaux produits.',
    category: 'value',
    actionLabel: 'Interagissez avec les clients à forte valeur',
    rules: [
      { field: 'total_spent', operator: 'greater_than', value: 1000 },
      { field: 'orders_count', operator: 'greater_than', value: 5 }
    ],
    icon: 'Crown',
    isPopular: true
  },
  {
    id: 'high-potential',
    name: 'Clients susceptibles de dépenser plus sur votre boutique',
    description: 'Le niveau de dépenses prévu correspond à une estimation du potentiel de dépenses futures de votre client, classé par niveau : élevé, moyen ou faible.',
    category: 'value',
    actionLabel: 'Interagissez avec les clients à forte valeur',
    rules: [
      { field: 'avg_order_value', operator: 'greater_than', value: 100 },
      { field: 'orders_count', operator: 'between', value: '2-5' }
    ],
    icon: 'TrendingUp'
  },
  {
    id: 'high-value-intent',
    name: 'Attirez des clients à forte valeur et à forte intention',
    description: 'Ciblez les clients qui ont beaucoup dépensé et qui ont récemment cliqué sur vos e-mails.',
    category: 'value',
    actionLabel: 'Relancer les clients',
    rules: [
      { field: 'total_spent', operator: 'greater_than', value: 500 },
      { field: 'email_clicked', operator: 'within_days', value: 30 }
    ],
    icon: 'Target'
  },
  {
    id: 'store-credit-unused',
    name: 'Clients qui n\'ont pas utilisé leur crédit en magasin après 1 mois',
    description: 'Suscitez l\'attention des clients qui ont reçu un crédit en magasin mais ne l\'ont pas dépensé en totalité dans un délai déterminé.',
    category: 'value',
    actionLabel: 'Relancer les clients',
    rules: [
      { field: 'store_credit', operator: 'greater_than', value: 0 },
      { field: 'last_order_date', operator: 'older_than_days', value: 30 }
    ],
    icon: 'CreditCard'
  },
  {
    id: 'store-credit-expiring',
    name: 'Clients dont le crédit en magasin arrive à expiration',
    description: 'Encouragez les clients dont le crédit en magasin arrive à expiration à le dépenser dans votre boutique.',
    category: 'value',
    actionLabel: 'Relancer les clients',
    rules: [
      { field: 'store_credit', operator: 'greater_than', value: 0 },
      { field: 'credit_expiration', operator: 'within_days', value: 30 }
    ],
    icon: 'Clock'
  },
  
  // ===== CATÉGORIE: COMPORTEMENT D'ACHAT =====
  {
    id: 'many-orders-recent',
    name: 'Clients ayant passé récemment de nombreuses commandes',
    description: 'Engagez-vous auprès des clients qui ont récemment passé de nombreuses commandes. Offrez-leur une expédition gratuite sur leur prochaine commande pour les encourager à acheter à nouveau.',
    category: 'behavior',
    actionLabel: 'Interagissez avec les clients à forte valeur',
    rules: [
      { field: 'orders_count', operator: 'greater_than', value: 3 },
      { field: 'last_order_date', operator: 'within_days', value: 180 }
    ],
    icon: 'ShoppingCart',
    isPopular: true
  },
  {
    id: 'loyal-with-tag',
    name: 'Clients fidèles ayant acheté des produits portant une balise spécifique',
    description: 'Vente incitative aux clients qui ont beaucoup dépensé dans votre boutique et qui ont acheté des produits portant une balise spécifique.',
    category: 'behavior',
    actionLabel: 'Interagissez avec les clients à forte valeur',
    rules: [
      { field: 'total_spent', operator: 'greater_than', value: 300 },
      { field: 'product_tags', operator: 'contains', value: '' }
    ],
    icon: 'Tag'
  },
  {
    id: 'recent-purchasers',
    name: 'Clients fidèles ayant récemment effectué un achat',
    description: 'Informez vos clients par e-mail du lancement de nouveaux produits en fonction du montant qu\'ils ont dépensé et de la date de leur dernière commande.',
    category: 'behavior',
    actionLabel: 'Interagissez avec les clients à forte valeur',
    rules: [
      { field: 'last_order_date', operator: 'within_days', value: 30 },
      { field: 'total_spent', operator: 'greater_than', value: 200 }
    ],
    icon: 'Clock'
  },
  {
    id: 'frequent-buyers-yearly',
    name: 'Clients ayant fréquemment effectué des achats en boutique au cours de l\'année écoulée',
    description: 'Récompensez et fidélisez vos clients les plus fidèles en boutique avec des offres ou des événements exclusifs.',
    category: 'behavior',
    actionLabel: 'Cibler un emplacement spécifique',
    rules: [
      { field: 'orders_count_year', operator: 'greater_than', value: 4 },
      { field: 'last_order_date', operator: 'within_days', value: 365 }
    ],
    icon: 'Calendar'
  },
  {
    id: 'shop-app-purchasers',
    name: 'Clients ayant réalisé un achat via l\'application Shop',
    description: 'Rétablissez le contact avec les clients ayant acheté via l\'application Shop en leur envoyant des suggestions personnalisées et des offres exclusives.',
    category: 'behavior',
    actionLabel: 'Cibler le comportement d\'achat',
    rules: [
      { field: 'purchase_channel', operator: 'equals', value: 'shop_app' }
    ],
    icon: 'Smartphone'
  },
  {
    id: 'viewed-collection',
    name: 'Clients ayant récemment affiché une collection',
    description: 'Annoncez les lancements de produits aux clients intéressés par une collection ou une marque spécifique.',
    category: 'behavior',
    actionLabel: 'Cibler les comportements sur la boutique en ligne',
    rules: [
      { field: 'viewed_collection', operator: 'within_days', value: 30 }
    ],
    icon: 'Eye'
  },
  {
    id: 'viewed-products-no-order',
    name: 'Les clients ayant affiché des produits spécifiques sans jamais passer de commande',
    description: 'Convertir les prospects à intention élevée, ayant abandonné leur panier, en acheteurs pour la première fois en leur offrant une réduction sur les produits qui les intéressent.',
    category: 'behavior',
    actionLabel: 'Cibler les comportements sur la boutique en ligne',
    rules: [
      { field: 'viewed_products', operator: 'greater_than', value: 0 },
      { field: 'orders_count', operator: 'equals', value: 0 }
    ],
    icon: 'Search'
  },
  {
    id: 'viewed-collections-no-order',
    name: 'Les clients ayant affiché des collections spécifiques sans jamais passer de commande',
    description: 'Transformez les prospects en acheteurs pour la première fois en les reciblant en fonction des collections qui les intéressent.',
    category: 'behavior',
    actionLabel: 'Cibler les comportements sur la boutique en ligne',
    rules: [
      { field: 'viewed_collections', operator: 'greater_than', value: 0 },
      { field: 'orders_count', operator: 'equals', value: 0 }
    ],
    icon: 'Layers'
  },
  
  // ===== CATÉGORIE: PANIER ABANDONNÉ =====
  {
    id: 'abandoned-cart',
    name: 'Clients ayant récemment abandonné leur panier',
    description: 'Clients ayant abandonné leur panier au cours des 30 derniers jours. Incitez-les à revenir finaliser leur commande en leur envoyant un code de réduction.',
    category: 'cart',
    actionLabel: 'Cibler les comportements sur la boutique en ligne',
    rules: [
      { field: 'has_abandoned_cart', operator: 'equals', value: true },
      { field: 'cart_abandoned_date', operator: 'within_days', value: 30 }
    ],
    icon: 'ShoppingBag',
    isPopular: true
  },
  {
    id: 'abandoned-checkout',
    name: 'Clients avec paiement abandonné',
    description: 'Clients qui ont commencé le processus de paiement mais ne l\'ont pas finalisé. Relancez-les avec un rappel personnalisé.',
    category: 'cart',
    actionLabel: 'Cibler les comportements sur la boutique en ligne',
    rules: [
      { field: 'has_abandoned_checkout', operator: 'equals', value: true }
    ],
    icon: 'CreditCard'
  },
  {
    id: 'high-value-abandoned-cart',
    name: 'Paniers abandonnés de forte valeur',
    description: 'Ciblez les clients qui ont abandonné un panier avec un montant élevé pour maximiser les revenus récupérés.',
    category: 'cart',
    actionLabel: 'Cibler les comportements sur la boutique en ligne',
    rules: [
      { field: 'has_abandoned_cart', operator: 'equals', value: true },
      { field: 'cart_value', operator: 'greater_than', value: 200 }
    ],
    icon: 'Gem'
  },
  
  // ===== CATÉGORIE: LOCALISATION =====
  {
    id: 'specific-country',
    name: 'Clients dans un pays spécifique',
    description: 'Tous les clients ayant une adresse d\'expédition ou de facturation dans un pays spécifique.',
    category: 'location',
    actionLabel: 'Cibler un emplacement spécifique',
    rules: [
      { field: 'country', operator: 'equals', value: '' }
    ],
    icon: 'Globe'
  },
  {
    id: 'specific-region',
    name: 'Clients dans un état ou province spécifique',
    description: 'Tous les clients ayant une adresse d\'expédition ou de facturation dans un état, province ou autre localité spécifique.',
    category: 'location',
    actionLabel: 'Cibler un emplacement spécifique',
    rules: [
      { field: 'region', operator: 'equals', value: '' }
    ],
    icon: 'Map'
  },
  {
    id: 'specific-city',
    name: 'Clients dans une ville spécifique',
    description: 'Tous les clients ayant une adresse d\'expédition ou de facturation dans une ville spécifique.',
    category: 'location',
    actionLabel: 'Cibler un emplacement spécifique',
    rules: [
      { field: 'city', operator: 'equals', value: '' }
    ],
    icon: 'MapPin'
  },
  {
    id: 'nearby-store',
    name: 'Clients à proximité du point de vente physique',
    description: 'Augmentez le trafic vers votre point de vente physique en ciblant les clients habitant à proximité.',
    category: 'location',
    actionLabel: 'Cibler un emplacement spécifique',
    rules: [
      { field: 'distance_to_store', operator: 'less_than', value: 50 }
    ],
    icon: 'Store'
  },
  {
    id: 'international-customers',
    name: 'Clients internationaux',
    description: 'Clients situés en dehors de votre pays principal. Adaptez vos offres et communications pour eux.',
    category: 'location',
    actionLabel: 'Cibler un emplacement spécifique',
    rules: [
      { field: 'is_international', operator: 'equals', value: true }
    ],
    icon: 'Plane'
  },
  
  // ===== CATÉGORIE: ENGAGEMENT EMAIL =====
  {
    id: 'email-subscribers',
    name: 'Abonnés à la newsletter',
    description: 'Clients qui ont accepté de recevoir des e-mails marketing de votre boutique.',
    category: 'email',
    actionLabel: 'Cibler l\'engagement par e-mail',
    rules: [
      { field: 'email_subscribed', operator: 'equals', value: true }
    ],
    icon: 'Mail'
  },
  {
    id: 'marketing-subscribed-recent-order',
    name: 'Abonnés au marketing ayant récemment passé une commande',
    description: 'Générez des ventes répétées en ciblant les clients qui sont abonnés au marketing par e-mail et qui ont récemment passé une commande.',
    category: 'email',
    actionLabel: 'Relancer les clients',
    rules: [
      { field: 'email_subscribed', operator: 'equals', value: true },
      { field: 'last_order_date', operator: 'within_days', value: 90 }
    ],
    icon: 'MailCheck',
    isPopular: true
  },
  {
    id: 'inactive-email-30-days',
    name: 'Clients à fort pouvoir d\'achat inactifs sur les e-mails de Shopify durant les 30 derniers jours',
    description: 'Reprenez contact avec les clients inactifs sur vos e-mails durant les 30 derniers jours. Offrez-leur des avantages pour renforcer l\'engagement envers votre marque.',
    category: 'email',
    actionLabel: 'Cibler l\'engagement par e-mail',
    rules: [
      { field: 'total_spent', operator: 'greater_than', value: 300 },
      { field: 'email_opened', operator: 'older_than_days', value: 30 }
    ],
    icon: 'MailX'
  },
  {
    id: 'unopened-emails-frequent',
    name: 'Abonnés qui n\'ont pas ouvert leurs e-mails récemment, mais qui avaient l\'habitude de le faire fréquemment',
    description: 'Récupérez les clients qui n\'ont pas réagi aux e-mails récemment, mais qui l\'ont fait par le passé.',
    category: 'email',
    actionLabel: 'Cibler l\'engagement par e-mail',
    rules: [
      { field: 'email_open_rate_historical', operator: 'greater_than', value: 50 },
      { field: 'email_opened', operator: 'older_than_days', value: 60 }
    ],
    icon: 'MailQuestion'
  },
  {
    id: 'frequently-opened-emails',
    name: 'Clients ayant ouvert fréquemment des e-mails au cours des 3 derniers mois',
    description: 'Trouvez les clients qui se sont récemment intéressés à vos e-mails et encouragez-les à effectuer un achat.',
    category: 'email',
    actionLabel: 'Cibler l\'engagement par e-mail',
    rules: [
      { field: 'email_opens_count', operator: 'greater_than', value: 5 },
      { field: 'email_opened', operator: 'within_days', value: 90 }
    ],
    icon: 'MailOpen'
  },
  {
    id: 'opened-emails-spent',
    name: 'Clients ayant récemment ouvert des e-mails et dépensé un certain montant',
    description: 'Trouvez des clients qui ont récemment interagi avec vos e-mails et personnalisez les messages en fonction du montant dépensé.',
    category: 'email',
    actionLabel: 'Cibler l\'engagement par e-mail',
    rules: [
      { field: 'email_opened', operator: 'within_days', value: 30 },
      { field: 'total_spent', operator: 'greater_than', value: 100 }
    ],
    icon: 'Sparkles'
  },
  {
    id: 'opened-no-purchase',
    name: 'Abonnés ayant récemment ouvert des e-mails sans jamais réaliser d\'achat',
    description: 'Relancez les abonnés ayant récemment interagi avec vos e-mails. Proposez-leur une offre spéciale pour leur premier achat.',
    category: 'email',
    actionLabel: 'Cibler l\'engagement par e-mail',
    rules: [
      { field: 'email_opened', operator: 'within_days', value: 30 },
      { field: 'orders_count', operator: 'equals', value: 0 }
    ],
    icon: 'UserSearch'
  },
  {
    id: 'often-opened-no-purchase',
    name: 'Abonnés qui ont ouvert leurs e-mails souvent récemment, mais qui n\'ont pas effectué d\'achat',
    description: 'Offrez une réduction aux abonnés qui ont beaucoup ouvert leurs e-mails récemment afin de les convertir en primo-acheteurs.',
    category: 'email',
    actionLabel: 'Cibler l\'engagement par e-mail',
    rules: [
      { field: 'email_opens_count', operator: 'greater_than', value: 10 },
      { field: 'orders_count', operator: 'equals', value: 0 }
    ],
    icon: 'Percent'
  },
  
  // ===== CATÉGORIE: CYCLE DE VIE CLIENT =====
  {
    id: 'first-time-buyers',
    name: 'Nouveaux clients',
    description: 'Clients qui ont effectué leur première commande. Accueillez-les et encouragez un deuxième achat.',
    category: 'lifecycle',
    actionLabel: 'Relancer les clients',
    rules: [
      { field: 'orders_count', operator: 'equals', value: 1 }
    ],
    icon: 'UserPlus',
    isPopular: true
  },
  {
    id: 'inactive-customers',
    name: 'Clients inactifs',
    description: 'Clients qui n\'ont pas passé de commande depuis plus de 6 mois. Réengagez-les avec une offre spéciale.',
    category: 'lifecycle',
    actionLabel: 'Relancer les clients',
    rules: [
      { field: 'last_order_date', operator: 'older_than_days', value: 180 }
    ],
    icon: 'UserMinus'
  },
  {
    id: 'at-risk-customers',
    name: 'Clients à risque de churn',
    description: 'Clients fidèles qui n\'ont pas commandé récemment. Réactivez-les avant qu\'ils ne partent.',
    category: 'lifecycle',
    actionLabel: 'Relancer les clients',
    rules: [
      { field: 'orders_count', operator: 'greater_than', value: 3 },
      { field: 'last_order_date', operator: 'older_than_days', value: 90 }
    ],
    icon: 'AlertTriangle',
    isPopular: true
  },
  {
    id: 'repeat-customers',
    name: 'Clients réguliers',
    description: 'Clients qui ont passé plusieurs commandes. Récompensez leur fidélité avec des offres exclusives.',
    category: 'lifecycle',
    actionLabel: 'Interagissez avec les clients à forte valeur',
    rules: [
      { field: 'orders_count', operator: 'greater_than', value: 2 }
    ],
    icon: 'Repeat'
  },
  {
    id: 'lapsed-loyal',
    name: 'Anciens clients fidèles',
    description: 'Clients qui étaient très actifs mais n\'ont pas commandé depuis longtemps. Tentez de les reconquérir.',
    category: 'lifecycle',
    actionLabel: 'Relancer les clients',
    rules: [
      { field: 'orders_count', operator: 'greater_than', value: 5 },
      { field: 'last_order_date', operator: 'older_than_days', value: 365 }
    ],
    icon: 'HeartOff'
  },
  {
    id: 'winback-candidates',
    name: 'Candidats à la reconquête',
    description: 'Clients ayant effectué des achats importants qui n\'ont pas commandé depuis longtemps.',
    category: 'lifecycle',
    actionLabel: 'Relancer les clients',
    rules: [
      { field: 'total_spent', operator: 'greater_than', value: 500 },
      { field: 'last_order_date', operator: 'older_than_days', value: 180 }
    ],
    icon: 'UserRoundCheck'
  },
  {
    id: 'anniversary-customers',
    name: 'Clients fêtant leur anniversaire d\'achat',
    description: 'Clients qui ont passé leur première commande il y a un an. Célébrez cet anniversaire avec une offre spéciale.',
    category: 'lifecycle',
    actionLabel: 'Relancer les clients',
    rules: [
      { field: 'first_order_anniversary', operator: 'within_days', value: 30 }
    ],
    icon: 'Gift'
  },
  
  // ===== CATÉGORIE: ENGAGEMENT GÉNÉRAL =====
  {
    id: 'sms-subscribers',
    name: 'Abonnés SMS',
    description: 'Clients qui ont accepté de recevoir des SMS marketing.',
    category: 'engagement',
    actionLabel: 'Cibler l\'engagement par SMS',
    rules: [
      { field: 'sms_subscribed', operator: 'equals', value: true }
    ],
    icon: 'MessageSquare'
  },
  {
    id: 'push-enabled',
    name: 'Notifications push activées',
    description: 'Clients qui ont activé les notifications push sur leur appareil.',
    category: 'engagement',
    actionLabel: 'Cibler l\'engagement par notification',
    rules: [
      { field: 'push_enabled', operator: 'equals', value: true }
    ],
    icon: 'Bell'
  },
  {
    id: 'social-followers',
    name: 'Abonnés sur les réseaux sociaux',
    description: 'Clients qui suivent votre marque sur les réseaux sociaux.',
    category: 'engagement',
    actionLabel: 'Cibler l\'engagement social',
    rules: [
      { field: 'social_follower', operator: 'equals', value: true }
    ],
    icon: 'Share2'
  },
  {
    id: 'referral-customers',
    name: 'Clients ayant parrainé',
    description: 'Clients qui ont recommandé votre boutique à d\'autres personnes.',
    category: 'engagement',
    actionLabel: 'Récompenser les parrainages',
    rules: [
      { field: 'referral_count', operator: 'greater_than', value: 0 }
    ],
    icon: 'Users'
  },
  {
    id: 'left-reviews',
    name: 'Clients ayant laissé des avis',
    description: 'Clients qui ont laissé des avis sur vos produits. Remerciez-les et encouragez de nouveaux avis.',
    category: 'engagement',
    actionLabel: 'Encourager les avis',
    rules: [
      { field: 'reviews_count', operator: 'greater_than', value: 0 }
    ],
    icon: 'Star'
  },
  {
    id: 'wishlist-users',
    name: 'Utilisateurs de la liste de souhaits',
    description: 'Clients ayant ajouté des produits à leur liste de souhaits. Informez-les des promotions sur ces articles.',
    category: 'engagement',
    actionLabel: 'Cibler les comportements sur la boutique en ligne',
    rules: [
      { field: 'wishlist_count', operator: 'greater_than', value: 0 }
    ],
    icon: 'Heart'
  }
];

export const CustomerSegmentationService = {
  // Segments
  async getSegments(): Promise<CustomerSegment[]> {
    const { data, error } = await supabase
      .from('customer_segments')
      .select('*')
      .order('customer_count', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as CustomerSegment[];
  },

  async getSegment(id: string): Promise<CustomerSegment> {
    const { data, error } = await supabase
      .from('customer_segments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as CustomerSegment;
  },

  async createSegment(segment: Partial<CustomerSegment>): Promise<CustomerSegment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('customer_segments')
      .insert({
        name: segment.name || 'Nouveau segment',
        description: segment.description,
        segment_type: segment.segment_type || 'dynamic',
        rules: (segment.rules || []) as unknown as Record<string, any>[],
        auto_update: segment.auto_update ?? true,
        update_frequency: segment.update_frequency || 'daily',
        tags: segment.tags || [],
        is_active: segment.is_active ?? true,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CustomerSegment;
  },

  async updateSegment(id: string, updates: Partial<CustomerSegment>): Promise<CustomerSegment> {
    const updateData: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };
    if (updates.rules) {
      updateData.rules = updates.rules as unknown as Record<string, any>[];
    }
    
    const { data, error } = await supabase
      .from('customer_segments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CustomerSegment;
  },

  async deleteSegment(id: string): Promise<void> {
    const { error } = await supabase
      .from('customer_segments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Segment Members
  async getSegmentMembers(segmentId: string): Promise<SegmentMember[]> {
    const { data, error } = await supabase
      .from('customer_segment_members')
      .select(`*, customer:customers(first_name, last_name, email)`)
      .eq('segment_id', segmentId)
      .order('score', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as SegmentMember[];
  },

  // RFM Scores
  async getRFMScores(): Promise<RFMScore[]> {
    const { data, error } = await supabase
      .from('customer_rfm_scores')
      .select(`*, customer:customers(first_name, last_name, email)`)
      .order('calculated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as RFMScore[];
  },

  async calculateRFMScores(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all customers with their orders
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id);

    const { data: orders } = await supabase
      .from('orders')
      .select('customer_id, total_amount, created_at')
      .eq('user_id', user.id);

    if (!customers || !orders) return;

    // Calculate RFM for each customer
    for (const customer of customers) {
      const customerOrders = orders.filter(o => o.customer_id === customer.id);
      
      if (customerOrders.length === 0) continue;

      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const avgOrderValue = totalSpent / customerOrders.length;
      
      const lastOrder = customerOrders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      
      const daysSinceLastOrder = Math.floor(
        (Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Simple RFM scoring (1-5 scale)
      const recencyScore = daysSinceLastOrder <= 30 ? 5 : daysSinceLastOrder <= 90 ? 4 : daysSinceLastOrder <= 180 ? 3 : daysSinceLastOrder <= 365 ? 2 : 1;
      const frequencyScore = customerOrders.length >= 10 ? 5 : customerOrders.length >= 5 ? 4 : customerOrders.length >= 3 ? 3 : customerOrders.length >= 2 ? 2 : 1;
      const monetaryScore = totalSpent >= 1000 ? 5 : totalSpent >= 500 ? 4 : totalSpent >= 200 ? 3 : totalSpent >= 50 ? 2 : 1;

      // Determine segment
      const avgScore = (recencyScore + frequencyScore + monetaryScore) / 3;
      let rfmSegment = 'À risque';
      if (avgScore >= 4.5) rfmSegment = 'Champions';
      else if (avgScore >= 4) rfmSegment = 'Fidèles';
      else if (avgScore >= 3) rfmSegment = 'Potentiels';
      else if (avgScore >= 2) rfmSegment = 'À réactiver';

      // Upsert RFM score
      await supabase
        .from('customer_rfm_scores')
        .upsert({
          user_id: user.id,
          customer_id: customer.id,
          recency_score: recencyScore,
          frequency_score: frequencyScore,
          monetary_score: monetaryScore,
          rfm_segment: rfmSegment,
          total_orders: customerOrders.length,
          total_spent: totalSpent,
          avg_order_value: avgOrderValue,
          days_since_last_order: daysSinceLastOrder,
          calculated_at: new Date().toISOString()
        }, { onConflict: 'user_id,customer_id' });
    }
  },

  async getSegmentStats(): Promise<{
    totalSegments: number;
    totalCustomersSegmented: number;
    avgSegmentSize: number;
    rfmDistribution: Record<string, number>;
  }> {
    const { data: segments } = await supabase
      .from('customer_segments')
      .select('customer_count');

    const { data: rfmScores } = await supabase
      .from('customer_rfm_scores')
      .select('rfm_segment');

    const segmentList = segments || [];
    const rfmList = rfmScores || [];

    const rfmDistribution: Record<string, number> = {};
    rfmList.forEach(r => {
      rfmDistribution[r.rfm_segment] = (rfmDistribution[r.rfm_segment] || 0) + 1;
    });

    const totalCustomers = segmentList.reduce((sum, s) => sum + (s.customer_count || 0), 0);

    return {
      totalSegments: segmentList.length,
      totalCustomersSegmented: totalCustomers,
      avgSegmentSize: segmentList.length > 0 ? Math.round(totalCustomers / segmentList.length) : 0,
      rfmDistribution
    };
  }
};
