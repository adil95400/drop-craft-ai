import type { ModuleDocumentation } from '../types';

export const preImportRulesDocumentation: ModuleDocumentation = {
  id: 'preImportRules',
  slug: 'pre-import-rules',
  title: 'Règles de Pré-Import',
  subtitle: 'Logique conditionnelle avant import catalogue',
  description: 'Définissez des règles automatiques (marges, stocks, catégories) appliquées avant l\'import pour filtrer et enrichir vos produits dès l\'entrée dans le pipeline.',
  icon: 'Filter',
  category: 'sourcing',
  routes: ['/import/rules'],
  
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced', 'expert'],
  estimatedReadTime: 10,
  lastUpdated: '2025-06-01',
  version: '1.0',
  tags: ['import', 'règles', 'filtres', 'marges', 'automatisation', 'pré-traitement'],
  
  overview: {
    purpose: 'Les Règles de Pré-Import permettent de définir des conditions automatiques appliquées avant qu\'un produit n\'entre dans votre catalogue. Filtrez par marge minimum, stock disponible, ou assignez automatiquement des catégories.',
    whenToUse: 'Utilisez ce module quand vous importez régulièrement depuis des fournisseurs et souhaitez éviter les produits non rentables ou sans stock dans votre catalogue.',
    targetAudience: 'Vendeurs intermédiaires à experts qui importent en volume et veulent un pipeline d\'import automatisé et propre.',
    prerequisites: ['Avoir au moins un fournisseur configuré', 'Comprendre les bases du calcul de marge'],
    keyFeatures: [
      'Règles conditionnelles IF/THEN avec opérateurs logiques',
      'Filtre par marge minimum automatique',
      'Seuil de stock minimum avant import',
      'Auto-catégorisation basée sur les mots-clés du titre',
      'Règles de pricing automatique (markup, arrondi)',
      'Priorité et ordre d\'exécution des règles',
      'Mode simulation pour tester avant activation',
      'Historique des règles appliquées'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Filtrer les produits non rentables',
      description: 'Bloquez automatiquement les produits dont la marge est inférieure à votre seuil de rentabilité.',
      steps: [
        'Créez une règle de type "Marge Minimum"',
        'Définissez le seuil (ex: 30%)',
        'Les produits sous ce seuil sont rejetés automatiquement à l\'import'
      ],
      expectedOutcome: 'Seuls les produits rentables entrent dans votre catalogue, éliminant le tri manuel.'
    },
    {
      level: 'advanced',
      title: 'Auto-catégoriser par mots-clés',
      description: 'Assignez automatiquement une catégorie basée sur le titre ou la description du produit.',
      steps: [
        'Créez une règle "Auto-catégorie"',
        'Définissez les mots-clés déclencheurs (ex: "montre" → Accessoires)',
        'Activez la règle pour tous les prochains imports'
      ],
      expectedOutcome: 'Vos produits sont classés automatiquement dès l\'import, sans intervention manuelle.'
    },
    {
      level: 'expert',
      title: 'Pipeline d\'import multi-règles',
      description: 'Chaînez plusieurs règles pour créer un pipeline d\'import complet : filtre marge → filtre stock → auto-catégorie → markup.',
      steps: [
        'Créez 4+ règles avec des priorités ordonnées',
        'Testez en mode simulation sur un échantillon',
        'Activez le pipeline complet'
      ],
      expectedOutcome: 'Import 100% automatisé avec zéro intervention manuelle sur les produits standards.'
    }
  ],
  
  stepByStep: [
    { stepNumber: 1, title: 'Accéder aux règles de pré-import', description: 'Naviguez vers Import > Règles de pré-import dans le menu latéral.', tip: 'Vous pouvez aussi y accéder depuis le bouton "Règles" dans la page d\'import.' },
    { stepNumber: 2, title: 'Créer une nouvelle règle', description: 'Cliquez sur "Nouvelle règle" et choisissez le type : marge, stock, catégorie ou pricing.', tip: 'Commencez par une règle de marge minimum — c\'est la plus impactante.' },
    { stepNumber: 3, title: 'Configurer les conditions', description: 'Définissez les paramètres : seuil de marge (%), stock minimum, mots-clés de catégorisation ou formule de markup.', warning: 'Des règles trop strictes peuvent bloquer la majorité de vos imports.' },
    { stepNumber: 4, title: 'Définir la priorité', description: 'Ordonnez vos règles par priorité. Les règles de filtrage doivent s\'exécuter avant les règles d\'enrichissement.', tip: 'Utilisez des multiples de 10 (10, 20, 30) pour pouvoir insérer des règles entre deux existantes.' },
    { stepNumber: 5, title: 'Tester en simulation', description: 'Activez le mode simulation pour voir l\'impact de vos règles sur un import fictif sans modifier de données.', tip: 'La simulation montre le nombre de produits acceptés vs rejetés.' },
    { stepNumber: 6, title: 'Activer la règle', description: 'Basculez le switch "Actif" pour que la règle s\'applique aux prochains imports.' }
  ],
  
  bestPractices: {
    recommendations: [
      { title: 'Commencez par la marge minimum', description: 'Une règle de marge minimum à 25-30% élimine immédiatement les produits non rentables.', impact: 'high' },
      { title: 'Testez en simulation d\'abord', description: 'Toujours tester vos règles en mode simulation avant de les activer en production.', impact: 'high' },
      { title: 'Utilisez des priorités claires', description: 'Les filtres d\'exclusion d\'abord, puis les règles d\'enrichissement.', impact: 'medium' }
    ],
    pitfalls: [
      { title: 'Règles trop restrictives', description: 'Un seuil de marge trop élevé (>50%) peut bloquer des produits à fort volume qui compensent par le volume.', impact: 'high' },
      { title: 'Oublier la simulation', description: 'Activer une règle sans tester peut rejeter massivement des produits valides.', impact: 'high' },
      { title: 'Conflits de règles', description: 'Deux règles contradictoires peuvent produire des résultats inattendus. Vérifiez l\'ordre de priorité.', impact: 'medium' }
    ]
  },
  
  troubleshooting: [
    { symptom: 'Tous mes produits sont rejetés', cause: 'Seuil de marge trop élevé ou stock minimum trop haut', solution: 'Réduisez les seuils ou testez en simulation pour voir les chiffres exacts', severity: 'high' },
    { symptom: 'Les catégories ne s\'assignent pas', cause: 'Mots-clés trop spécifiques ou casse incorrecte', solution: 'Utilisez des mots-clés plus génériques et vérifiez que la recherche est insensible à la casse', severity: 'medium' },
    { symptom: 'Les règles ne s\'appliquent pas', cause: 'La règle est en statut "Inactif"', solution: 'Vérifiez le switch d\'activation de chaque règle', severity: 'low' }
  ],
  
  expertTips: [
    { title: 'Pipeline en cascade', content: 'Les vendeurs performants enchaînent 5-7 règles : filtre marge → filtre stock → blacklist marques → auto-catégorie → markup → arrondi prix → tag qualité. Ce pipeline élimine 40% des produits non rentables automatiquement.', differentiator: 'ShopOpti+ est le seul outil qui supporte un pipeline de règles ordonné avec mode simulation.' },
    { title: 'Règles saisonnières', content: 'Créez des règles temporaires pour les périodes de fêtes : seuil de marge plus bas en échange d\'un volume plus élevé, puis revenez aux règles standard.', differentiator: 'Activez/désactivez les règles en un clic sans perdre la configuration.' }
  ],
  
  callToValue: {
    headline: 'Éliminez 40% de travail manuel sur vos imports',
    description: 'Les règles de pré-import automatisent le filtrage et l\'enrichissement de vos produits. Fini le tri manuel de centaines de produits non rentables.',
    metrics: [
      { label: 'Temps gagné', value: '3h/semaine', improvement: '-60% travail manuel' },
      { label: 'Produits filtrés', value: '40%', improvement: 'Non rentables exclus' },
      { label: 'Précision catégorisation', value: '95%', improvement: 'Auto vs manuel' }
    ],
    cta: { label: 'Configurer mes règles', route: '/import/rules' }
  },
  
  faqs: [
    { question: 'Les règles s\'appliquent-elles aux produits déjà importés ?', answer: 'Non, les règles de pré-import ne s\'appliquent qu\'aux nouveaux imports. Pour les produits existants, utilisez les règles de catalogue.' },
    { question: 'Puis-je avoir des règles différentes par fournisseur ?', answer: 'Oui, chaque règle peut être conditionnée par le fournisseur source, permettant des seuils différents par source d\'approvisionnement.' },
    { question: 'Le mode simulation consomme-t-il des crédits ?', answer: 'Non, la simulation est gratuite et illimitée.' }
  ],
  
  relatedModules: ['import', 'suppliers', 'products', 'pricing'],
  externalResources: [
    { label: 'Webinaire: Pipeline d\'import automatisé', url: '/academy/import-pipeline' }
  ]
};
