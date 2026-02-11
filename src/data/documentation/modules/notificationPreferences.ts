import type { ModuleDocumentation } from '../types';

export const notificationPreferencesDocumentation: ModuleDocumentation = {
  id: 'notificationPreferences',
  slug: 'notification-preferences',
  title: 'Préférences de Notifications',
  subtitle: 'Contrôle granulaire de vos alertes',
  description: 'Configurez finement vos notifications par canal (Email, Push, In-App) pour chacune des 9 catégories système. Ne recevez que les alertes qui comptent pour vous.',
  icon: 'Bell',
  category: 'enterprise',
  routes: ['/settings/notification-preferences'],
  
  minPlan: 'standard',
  targetLevels: ['beginner', 'intermediate'],
  estimatedReadTime: 5,
  lastUpdated: '2025-06-01',
  version: '1.0',
  tags: ['notifications', 'préférences', 'alertes', 'email', 'push', 'configuration'],
  
  overview: {
    purpose: 'Les Préférences de Notifications vous permettent de contrôler exactement quelles alertes vous recevez et sur quel canal, pour éviter la surcharge d\'informations.',
    whenToUse: 'Lors de la configuration initiale de votre compte, ou quand vous recevez trop (ou pas assez) de notifications.',
    targetAudience: 'Tous les utilisateurs qui veulent personnaliser leur flux de notifications.',
    keyFeatures: [
      '9 catégories de notifications',
      '3 canaux : Email, Push, In-App',
      'Activation/désactivation par catégorie et canal',
      'Boutons "Tout activer" / "Tout désactiver"',
      'Prévisualisation des notifications',
      'Configuration des horaires de réception',
      'Mode "Ne pas déranger"',
      'Résumé quotidien par email (optionnel)'
    ]
  },
  
  useCases: [
    {
      level: 'beginner',
      title: 'Réduire le bruit des notifications',
      description: 'Vous recevez trop de notifications et voulez ne garder que les essentielles.',
      steps: ['Accédez aux préférences', 'Désactivez les catégories non essentielles', 'Gardez activées : Commandes, Stock, Sécurité'],
      expectedOutcome: 'Seules les notifications critiques arrivent, réduisant le bruit de 70%.'
    },
    {
      level: 'intermediate',
      title: 'Configurer par canal',
      description: 'Vous voulez les alertes urgentes en push et le reste par email.',
      steps: ['Activez Push pour Commandes et Stock', 'Activez Email pour Marketing et Analytics', 'Désactivez In-App pour les catégories secondaires'],
      expectedOutcome: 'Canal adapté à l\'urgence de chaque type de notification.'
    }
  ],
  
  stepByStep: [
    { stepNumber: 1, title: 'Accéder aux préférences', description: 'Naviguez vers Paramètres > Préférences de notifications.' },
    { stepNumber: 2, title: 'Configurer par catégorie', description: 'Pour chaque catégorie (Commandes, Stock, Marketing...), activez/désactivez les canaux souhaités.', tip: 'Les catégories Commandes et Sécurité sont recommandées toujours activées.' },
    { stepNumber: 3, title: 'Utiliser les raccourcis', description: '"Tout activer" et "Tout désactiver" permettent une configuration rapide pour chaque canal.' },
    { stepNumber: 4, title: 'Sauvegarder', description: 'Cliquez "Enregistrer" pour appliquer vos préférences. Elles prennent effet immédiatement.' }
  ],
  
  bestPractices: {
    recommendations: [
      { title: 'Gardez les alertes critiques', description: 'Commandes, Stock bas et Sécurité doivent toujours être activés sur au moins un canal.', impact: 'high' },
      { title: 'Push pour l\'urgent, email pour le reste', description: 'Réservez les push notifications aux événements nécessitant une action rapide.', impact: 'medium' }
    ],
    pitfalls: [
      { title: 'Tout désactiver', description: 'Désactiver toutes les notifications fait manquer des alertes critiques (commandes, sécurité).', impact: 'high' },
      { title: 'Trop de push', description: 'Des push notifications trop fréquentes sont ignorées ou causent la désactivation du canal.', impact: 'medium' }
    ]
  },
  
  troubleshooting: [
    { symptom: 'Je ne reçois plus de notifications', cause: 'Toutes les catégories sont désactivées', solution: 'Réactivez au minimum Commandes et Sécurité', severity: 'high' },
    { symptom: 'Les push ne fonctionnent pas', cause: 'Les notifications push sont bloquées dans le navigateur', solution: 'Vérifiez les autorisations du navigateur dans les paramètres système', severity: 'medium' }
  ],
  
  expertTips: [
    { title: 'La règle 3-5-7', content: 'Les vendeurs performants activent 3 catégories en push (urgent), 5 en email (suivi) et 7 en in-app (historique). Cette stratégie maximise la réactivité sans surcharge.', differentiator: 'ShopOpti+ offre 27 combinaisons possibles (9 catégories × 3 canaux) pour un contrôle total.' }
  ],
  
  callToValue: {
    headline: 'Ne manquez plus jamais une alerte importante',
    description: 'Configurez vos notifications pour recevoir exactement ce qui compte, sur le bon canal.',
    metrics: [
      { label: 'Catégories', value: '9', improvement: 'Types de notifications' },
      { label: 'Canaux', value: '3', improvement: 'Email, Push, In-App' }
    ],
    cta: { label: 'Configurer mes alertes', route: '/settings/notification-preferences' }
  },
  
  faqs: [
    { question: 'Puis-je configurer des horaires de réception ?', answer: 'Oui, le mode "Ne pas déranger" permet de définir des plages horaires sans notifications push.' },
    { question: 'Le résumé quotidien est-il disponible ?', answer: 'Oui, activez le résumé email quotidien pour recevoir un récapitulatif chaque matin à 8h.' }
  ],
  
  relatedModules: ['settings'],
};
