import type { ModuleDocumentation } from '../types';

export const domainRegistrationDocumentation: ModuleDocumentation = {
  id: 'domainRegistration',
  slug: 'domain-registration',
  title: 'Enregistrement de Domaines',
  subtitle: 'Achat et gestion de noms de domaine',
  description: 'Recherchez, achetez et gérez vos noms de domaine (.store, .shop, .com) directement depuis ShopOpti+. Bénéficiez de tarifs promotionnels et d\'une gestion DNS intégrée.',
  icon: 'Globe',
  category: 'enterprise',
  routes: ['/settings/domains'],
  
  minPlan: 'pro',
  targetLevels: ['beginner', 'intermediate', 'advanced'],
  estimatedReadTime: 8,
  lastUpdated: '2025-06-01',
  version: '1.0',
  tags: ['domaine', 'dns', 'hébergement', 'shop', 'store', 'com'],
  
  overview: {
    purpose: 'Le module d\'enregistrement de domaines vous permet d\'acheter et gérer vos noms de domaine sans quitter ShopOpti+. Connectez-les à vos boutiques pour une marque professionnelle.',
    whenToUse: 'Quand vous créez une nouvelle boutique et avez besoin d\'un nom de domaine professionnel, ou quand vous voulez consolider la gestion de vos domaines existants.',
    targetAudience: 'Tous les vendeurs qui souhaitent une présence web professionnelle avec leur propre nom de domaine.',
    prerequisites: ['Un plan Pro ou supérieur'],
    keyFeatures: [
      'Recherche de disponibilité instantanée',
      'Support des extensions .store, .shop, .com, .fr et +20 autres',
      'Tarifs promotionnels première année',
      'Gestion DNS intégrée',
      'Renouvellement automatique',
      'Transfert de domaines existants',
      'Certificat SSL inclus',
      'Connexion directe à vos boutiques'
    ]
  },
  
  useCases: [
    {
      level: 'beginner',
      title: 'Acheter son premier domaine',
      description: 'Vous lancez votre boutique et avez besoin d\'un nom de domaine professionnel.',
      steps: ['Recherchez votre nom de marque', 'Comparez les extensions disponibles', 'Sélectionnez et achetez', 'Connectez à votre boutique'],
      expectedOutcome: 'Votre boutique est accessible sur votreboutique.com en moins de 30 minutes.'
    },
    {
      level: 'intermediate',
      title: 'Gérer un portefeuille de domaines',
      description: 'Vous gérez plusieurs marques et avez besoin de centraliser la gestion DNS.',
      steps: ['Transférez vos domaines existants', 'Configurez les DNS depuis l\'interface', 'Activez le renouvellement automatique'],
      expectedOutcome: 'Tous vos domaines gérés depuis un seul tableau de bord.'
    }
  ],
  
  stepByStep: [
    { stepNumber: 1, title: 'Rechercher un domaine', description: 'Saisissez le nom souhaité dans la barre de recherche. Les résultats affichent la disponibilité par extension.', tip: 'Les extensions .store et .shop sont souvent moins chères et plus pertinentes pour le e-commerce.' },
    { stepNumber: 2, title: 'Comparer les prix', description: 'Chaque extension affiche le prix de première année et le prix de renouvellement.' },
    { stepNumber: 3, title: 'Ajouter au panier et acheter', description: 'Sélectionnez votre domaine et procédez au paiement.', tip: 'Activez le renouvellement automatique pour ne pas perdre votre domaine.' },
    { stepNumber: 4, title: 'Configurer les DNS', description: 'Les DNS sont préconfigurés pour pointer vers votre boutique ShopOpti+.', warning: 'Si vous modifiez les DNS manuellement, la propagation peut prendre 24-48h.' },
    { stepNumber: 5, title: 'Connecter à une boutique', description: 'Assignez le domaine à une boutique dans les paramètres de connexion.' }
  ],
  
  bestPractices: {
    recommendations: [
      { title: 'Protégez votre marque', description: 'Enregistrez votre nom sur les principales extensions (.com, .fr, .store) pour éviter le cybersquatting.', impact: 'high' },
      { title: 'Activez le renouvellement automatique', description: 'Un domaine expiré est récupérable sous 30 jours mais peut être pris par un tiers.', impact: 'high' }
    ],
    pitfalls: [
      { title: 'Négliger le renouvellement', description: 'Un domaine non renouvelé peut être acheté par un concurrent ou un squatteur.', impact: 'high' },
      { title: 'Modifier les DNS sans sauvegarde', description: 'Notez toujours la configuration DNS actuelle avant toute modification.', impact: 'medium' }
    ]
  },
  
  troubleshooting: [
    { symptom: 'Le domaine ne pointe pas vers ma boutique', cause: 'Propagation DNS en cours (24-48h) ou mauvaise configuration', solution: 'Attendez 48h puis vérifiez les enregistrements DNS dans le panneau de configuration', severity: 'medium' },
    { symptom: 'Le SSL ne fonctionne pas', cause: 'Le certificat SSL est provisionné automatiquement sous 30 minutes', solution: 'Attendez 30 minutes puis rechargez. Si persistant, forcez le re-provisioning SSL', severity: 'medium' }
  ],
  
  expertTips: [
    { title: 'Extension stratégique', content: 'Les extensions .store et .shop ont un CTR 15% supérieur pour les boutiques e-commerce comparé au .com générique, car elles signalent immédiatement l\'intention commerciale.', differentiator: 'ShopOpti+ propose des tarifs préférentiels sur les extensions e-commerce.' }
  ],
  
  callToValue: {
    headline: 'Votre domaine professionnel en 5 minutes',
    description: 'Achetez et configurez votre nom de domaine sans quitter ShopOpti+. SSL inclus, DNS préconfigurés.',
    metrics: [
      { label: 'Temps de configuration', value: '5 min', improvement: 'DNS automatique' },
      { label: 'SSL inclus', value: 'Gratuit', improvement: 'Provisionné automatiquement' }
    ],
    cta: { label: 'Chercher un domaine', route: '/settings/domains' }
  },
  
  faqs: [
    { question: 'Puis-je transférer un domaine existant ?', answer: 'Oui, le transfert prend généralement 5-7 jours et nécessite le code de transfert de votre registraire actuel.' },
    { question: 'Le SSL est-il inclus ?', answer: 'Oui, un certificat SSL Let\'s Encrypt est provisionné automatiquement et renouvelé sans intervention.' }
  ],
  
  relatedModules: ['settings', 'integrations'],
};
