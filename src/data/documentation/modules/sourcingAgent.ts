import type { ModuleDocumentation } from '../types';

export const sourcingAgentDocumentation: ModuleDocumentation = {
  id: 'sourcingAgent',
  slug: 'sourcing-agent',
  title: 'Agent de Sourcing IA',
  subtitle: 'Demandes de devis automatisées',
  description: 'Automatisez vos demandes de devis fournisseurs avec l\'IA. Soumettez vos requêtes de sourcing et suivez l\'historique des cotations directement depuis l\'interface.',
  icon: 'Bot',
  category: 'sourcing',
  routes: ['/suppliers/sourcing-agent'],
  
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced', 'expert'],
  estimatedReadTime: 9,
  lastUpdated: '2025-06-01',
  version: '1.0',
  tags: ['sourcing', 'devis', 'fournisseurs', 'ia', 'agent', 'cotations'],
  
  overview: {
    purpose: 'L\'Agent de Sourcing IA contacte automatiquement vos fournisseurs pour demander des devis sur les produits que vous recherchez. Il compile les réponses et vous présente les meilleures offres.',
    whenToUse: 'Quand vous cherchez un nouveau fournisseur pour un produit, ou quand vous voulez comparer les prix entre plusieurs sources.',
    targetAudience: 'Sourcing managers et vendeurs qui veulent optimiser leurs coûts d\'approvisionnement.',
    prerequisites: ['Avoir au moins un fournisseur configuré', 'Décrire précisément le produit recherché'],
    keyFeatures: [
      'Demandes de devis automatisées en masse',
      'IA pour rédiger les messages fournisseurs',
      'Suivi des réponses et relances automatiques',
      'Comparaison multi-fournisseurs',
      'Historique complet des cotations',
      'Négociation assistée par IA',
      'Alertes prix et disponibilité',
      'Export des devis en PDF'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Trouver le meilleur prix',
      description: 'Vous avez identifié un produit gagnant et cherchez le meilleur fournisseur.',
      steps: ['Créez une requête de sourcing', 'Décrivez le produit avec spécifications', 'L\'IA contacte vos fournisseurs enregistrés', 'Comparez les devis reçus'],
      expectedOutcome: 'Tableau comparatif des offres fournisseurs avec prix, MOQ, délais et qualité.'
    },
    {
      level: 'expert',
      title: 'Négociation en volume',
      description: 'Vous voulez négocier des tarifs dégressifs pour un achat en volume.',
      steps: ['Créez une requête avec volumes échelonnés', 'L\'IA inclut les paliers dans la demande', 'Analysez les grilles tarifaires reçues', 'Sélectionnez l\'offre optimale'],
      expectedOutcome: 'Réduction de 15-25% sur les prix unitaires grâce à l\'achat en volume.'
    }
  ],
  
  stepByStep: [
    { stepNumber: 1, title: 'Créer une requête de sourcing', description: 'Cliquez sur "Nouvelle requête" et décrivez le produit recherché avec le maximum de détails.', tip: 'Plus la description est précise, meilleures seront les réponses. Incluez spécifications, quantités et budget cible.' },
    { stepNumber: 2, title: 'Sélectionner les fournisseurs', description: 'Choisissez les fournisseurs à contacter ou laissez l\'IA sélectionner les plus pertinents.' },
    { stepNumber: 3, title: 'Envoyer les demandes', description: 'L\'IA rédige et envoie les demandes de devis personnalisées.', tip: 'Vous pouvez prévisualiser et modifier chaque message avant envoi.' },
    { stepNumber: 4, title: 'Suivre les réponses', description: 'Les réponses arrivent dans votre dashboard sourcing. L\'IA relance automatiquement les fournisseurs silencieux après 48h.', warning: 'Les délais de réponse varient de 1h à 7 jours selon les fournisseurs.' },
    { stepNumber: 5, title: 'Comparer et choisir', description: 'Le tableau comparatif classe les offres par prix, qualité et délai pour faciliter votre choix.' }
  ],
  
  bestPractices: {
    recommendations: [
      { title: 'Soyez précis dans vos requêtes', description: 'Incluez spécifications techniques, quantités, emballage souhaité et budget indicatif.', impact: 'high' },
      { title: 'Contactez 3+ fournisseurs', description: 'Minimum 3 sources pour obtenir un benchmark prix fiable.', impact: 'high' }
    ],
    pitfalls: [
      { title: 'Description trop vague', description: 'Une requête vague génère des devis non comparables et des allers-retours coûteux.', impact: 'high' },
      { title: 'Ignorer le MOQ', description: 'Le Minimum Order Quantity peut rendre une offre attractive sur papier mais inaccessible en pratique.', impact: 'medium' }
    ]
  },
  
  troubleshooting: [
    { symptom: 'Aucune réponse des fournisseurs', cause: 'Requête peu attractive ou fournisseur inactif', solution: 'Vérifiez que le fournisseur est actif et ajustez vos quantités ou budget pour rendre la demande plus attractive', severity: 'medium' },
    { symptom: 'Les devis ne sont pas comparables', cause: 'Spécifications différentes dans les réponses', solution: 'Renvoyez une demande plus détaillée avec un template standardisé', severity: 'low' }
  ],
  
  expertTips: [
    { title: 'Timing stratégique', content: 'Les fournisseurs chinois sont plus négociables en mars-avril (après le Nouvel An chinois) et en septembre (avant la haute saison). Lancez vos requêtes de volume pendant ces fenêtres.', differentiator: 'L\'agent IA intègre les calendriers fournisseurs pour optimiser le timing des demandes.' }
  ],
  
  callToValue: {
    headline: 'Réduisez vos coûts d\'approvisionnement de 20%',
    description: 'L\'Agent de Sourcing automatise la recherche de fournisseurs et la comparaison de devis.',
    metrics: [
      { label: 'Économie moyenne', value: '20%', improvement: 'Sur les coûts d\'achat' },
      { label: 'Temps gagné', value: '5h/semaine', improvement: 'vs recherche manuelle' }
    ],
    cta: { label: 'Lancer une requête', route: '/suppliers/sourcing-agent' }
  },
  
  faqs: [
    { question: 'L\'IA contacte-t-elle directement les fournisseurs ?', answer: 'L\'IA prépare les messages mais vous pouvez prévisualiser et modifier avant l\'envoi. Les envois automatiques sont une option configurable.' },
    { question: 'Combien de requêtes puis-je envoyer ?', answer: 'Le nombre dépend de votre plan. Pro: 20/mois, Ultra Pro: illimité.' }
  ],
  
  relatedModules: ['suppliers', 'import', 'pricing'],
};
