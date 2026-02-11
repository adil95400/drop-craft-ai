import type { ModuleDocumentation } from '../types';

export const webhookManagementDocumentation: ModuleDocumentation = {
  id: 'webhookManagement',
  slug: 'webhook-management',
  title: 'Gestion des Webhooks',
  subtitle: 'Intégrations en temps réel avec vos outils',
  description: 'Configurez des webhooks pour connecter ShopOpti+ à vos outils tiers. Recevez des notifications en temps réel sur 12 types d\'événements (commandes, stock, produits, etc.).',
  icon: 'Webhook',
  category: 'enterprise',
  routes: ['/settings/webhooks'],
  
  minPlan: 'pro',
  targetLevels: ['advanced', 'expert'],
  estimatedReadTime: 12,
  lastUpdated: '2025-06-01',
  version: '1.0',
  tags: ['webhooks', 'api', 'intégrations', 'développeur', 'automatisation', 'événements'],
  
  overview: {
    purpose: 'Les webhooks permettent à ShopOpti+ d\'envoyer des notifications HTTP en temps réel vers vos serveurs ou outils tiers quand un événement se produit (nouvelle commande, changement de stock, etc.).',
    whenToUse: 'Quand vous avez besoin d\'intégrer ShopOpti+ avec des outils tiers (ERP, comptabilité, CRM) ou de déclencher des workflows automatisés.',
    targetAudience: 'Développeurs et intégrateurs techniques qui construisent des automatisations avancées.',
    prerequisites: ['Un endpoint HTTP accessible publiquement', 'Connaissances de base en API REST'],
    keyFeatures: [
      '12 types d\'événements supportés',
      'Signature HMAC pour sécurisation',
      'Outil de test intégré',
      'Logs de livraison détaillés',
      'Retry automatique en cas d\'échec',
      'Gestion des secrets webhook',
      'Monitoring des échecs',
      'Mode debug pour le développement'
    ]
  },
  
  useCases: [
    {
      level: 'advanced',
      title: 'Synchroniser avec un ERP',
      description: 'Envoyez automatiquement chaque nouvelle commande à votre ERP comptable.',
      steps: ['Créez un webhook sur l\'événement "order.created"', 'Pointez vers l\'endpoint de votre ERP', 'Configurez le secret HMAC', 'Testez et activez'],
      expectedOutcome: 'Chaque commande est automatiquement créée dans votre ERP en temps réel.'
    },
    {
      level: 'expert',
      title: 'Pipeline d\'automatisation multi-webhook',
      description: 'Configurez plusieurs webhooks pour créer un pipeline d\'intégration complet.',
      steps: ['Webhook stock → alerte Slack', 'Webhook commande → ERP', 'Webhook produit → mise à jour CRM'],
      expectedOutcome: 'Écosystème d\'outils entièrement synchronisé sans intervention manuelle.'
    }
  ],
  
  stepByStep: [
    { stepNumber: 1, title: 'Créer un webhook', description: 'Cliquez "Nouveau webhook" et renseignez le nom et l\'URL de destination.', tip: 'Utilisez un service comme webhook.site pour tester avant de connecter votre vrai endpoint.' },
    { stepNumber: 2, title: 'Sélectionner les événements', description: 'Cochez les types d\'événements à écouter : order.*, product.*, stock.*, etc.' },
    { stepNumber: 3, title: 'Configurer la sécurité', description: 'Définissez un secret HMAC pour signer les payloads et vérifier l\'authenticité.', warning: 'Conservez votre secret en lieu sûr. Il ne sera plus affiché après la création.' },
    { stepNumber: 4, title: 'Tester le webhook', description: 'Utilisez l\'outil de test intégré pour envoyer un payload d\'exemple à votre endpoint.', tip: 'Le test montre le code de réponse HTTP et le body retourné par votre endpoint.' },
    { stepNumber: 5, title: 'Activer et monitorer', description: 'Activez le webhook et consultez les logs de livraison pour vérifier que tout fonctionne.' }
  ],
  
  bestPractices: {
    recommendations: [
      { title: 'Toujours vérifier la signature HMAC', description: 'Côté serveur, validez la signature HMAC de chaque payload pour éviter les injections.', impact: 'high' },
      { title: 'Répondre rapidement (< 5s)', description: 'Votre endpoint doit répondre 200 en moins de 5 secondes. Traitez le payload de manière asynchrone.', impact: 'high' }
    ],
    pitfalls: [
      { title: 'Endpoint lent ou bloquant', description: 'Un endpoint qui met > 30s à répondre sera considéré en timeout et le webhook sera retenté.', impact: 'high' },
      { title: 'Ignorer les logs d\'échec', description: 'Les échecs de livraison s\'accumulent et peuvent masquer des problèmes d\'intégration.', impact: 'medium' }
    ]
  },
  
  troubleshooting: [
    { symptom: 'Le webhook ne se déclenche pas', cause: 'L\'événement n\'est pas coché ou le webhook est désactivé', solution: 'Vérifiez les événements sélectionnés et le statut d\'activation', severity: 'medium' },
    { symptom: 'Erreur 403 sur l\'endpoint', cause: 'L\'IP ShopOpti+ n\'est pas autorisée ou le secret est incorrect', solution: 'Ajoutez nos IPs à votre whitelist et vérifiez le secret HMAC', severity: 'high' },
    { symptom: 'Payloads dupliqués reçus', cause: 'Le premier envoi a reçu un timeout et le retry a été déclenché', solution: 'Implémentez l\'idempotence côté serveur en vérifiant l\'ID du webhook', severity: 'medium' }
  ],
  
  expertTips: [
    { title: 'Idempotence obligatoire', content: 'Chaque payload contient un champ "webhook_id" unique. Utilisez-le pour détecter les doublons côté serveur et garantir l\'idempotence de vos traitements.', differentiator: 'ShopOpti+ envoie 3 retry avec backoff exponentiel (1min, 5min, 30min) pour garantir la livraison.' }
  ],
  
  callToValue: {
    headline: 'Connectez vos outils en temps réel',
    description: 'Les webhooks synchronisent ShopOpti+ avec votre écosystème d\'outils sans développement complexe.',
    metrics: [
      { label: 'Événements supportés', value: '12', improvement: 'Types d\'événements' },
      { label: 'Latence moyenne', value: '< 2s', improvement: 'Temps de livraison' }
    ],
    cta: { label: 'Configurer un webhook', route: '/settings/webhooks' }
  },
  
  faqs: [
    { question: 'Combien de webhooks puis-je créer ?', answer: 'Pro: 5, Ultra Pro: illimité. Chaque webhook peut écouter plusieurs types d\'événements.' },
    { question: 'Les retry sont-ils automatiques ?', answer: 'Oui, 3 tentatives avec backoff exponentiel (1min, 5min, 30min) en cas d\'échec de livraison.' }
  ],
  
  relatedModules: ['integrations', 'settings', 'automation'],
};
