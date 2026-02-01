import type { ModuleDocumentation } from '../types';

export const catalogDocumentation: ModuleDocumentation = {
  id: 'catalog',
  slug: 'catalog',
  title: 'Catalogue - Hub d\'Exécution',
  subtitle: 'Centre de traitement et qualité catalogue',
  description: 'Le Hub Catalogue est votre centre d\'exécution pour traiter, qualifier et maintenir un catalogue e-commerce irréprochable. Il regroupe le backlog à traiter, la gestion des variantes, les médias, les attributs et la santé globale du catalogue.',
  icon: 'FolderOpen',
  category: 'catalog',
  routes: ['/catalog', '/catalog/to-process', '/catalog/variants', '/catalog/media', '/catalog/attributes', '/catalog/categories', '/catalog/health'],
  
  minPlan: 'standard',
  targetLevels: ['intermediate', 'advanced', 'expert'],
  estimatedReadTime: 12,
  lastUpdated: '2025-02-01',
  version: '2.5',
  tags: ['backlog', 'variantes', 'médias', 'attributs', 'catégories', 'santé', 'qualité'],
  
  overview: {
    purpose: 'Organiser le travail de maintenance catalogue en zones d\'action claires. Chaque onglet correspond à un type de tâche spécifique, permettant de traiter efficacement les produits par priorité.',
    whenToUse: 'Utilisez le Hub Catalogue quotidiennement pour traiter les nouveaux produits importés (backlog), corriger les problèmes de variantes, optimiser les médias et maintenir une santé catalogue > 85%.',
    targetAudience: 'Gestionnaires catalogue, équipes qualité produit, responsables e-commerce cherchant à industrialiser leur processus.',
    prerequisites: [
      'Avoir des produits dans le système',
      'Comprendre la structure produit/variantes',
      'Connaître les exigences des marketplaces cibles'
    ],
    keyFeatures: [
      'Backlog priorisé par IA avec actions suggérées',
      'Gestionnaire de variantes avec détection d\'anomalies',
      'Bibliothèque médias centralisée avec CDN',
      'Mapping d\'attributs par marketplace',
      'Arborescence catégories avec suggestions IA',
      'Dashboard santé avec prédictions J+7/J+30',
      'Alertes proactives sur dégradation qualité'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Traiter le backlog quotidien',
      description: 'Chaque matin, vous devez qualifier les nouveaux produits importés et les préparer pour publication.',
      steps: [
        'Accédez à Catalogue > À traiter',
        'Les produits sont triés par priorité IA (impact business)',
        'Pour chaque produit: vérifiez titre, complétez attributs manquants',
        'Utilisez "Enrichir IA" pour les descriptions incomplètes',
        'Validez et publiez ou renvoyez en correction'
      ],
      expectedOutcome: 'Backlog traité en 1h au lieu de 4h, avec qualité homogène.'
    },
    {
      level: 'advanced',
      title: 'Auditer et corriger les variantes',
      description: 'Vos variantes ont des incohérences (prix, stocks, attributs) qui créent des erreurs marketplace.',
      steps: [
        'Accédez à Catalogue > Variantes',
        'Filtrez par "Anomalies détectées"',
        'Identifiez les problèmes: prix incohérents, attributs manquants, SKU en double',
        'Utilisez "Corriger en masse" pour harmoniser',
        'Validez les corrections et resynchronisez'
      ],
      expectedOutcome: '0 erreur de variantes, taux de rejet marketplace < 1%.'
    },
    {
      level: 'expert',
      title: 'Optimiser la santé catalogue à 95%+',
      description: 'Vous visez l\'excellence pour maximiser votre visibilité algorithmique sur toutes les marketplaces.',
      steps: [
        'Accédez à Catalogue > Santé',
        'Analysez le score par critère (images, attributs, SEO...)',
        'Identifiez les 20% de produits qui plombent le score',
        'Appliquez des corrections ciblées ou archivez les irrécupérables',
        'Configurez des alertes sur dégradation > 5%'
      ],
      expectedOutcome: 'Score santé 95%+, visibilité maximale, conversion +15%.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Naviguer dans le Hub Catalogue',
      description: 'Le Hub est organisé en onglets: À traiter (backlog), Variantes, Médias, Attributs, Catégories, Santé. Chaque onglet affiche un compteur de tâches en attente.',
      tip: 'Commencez toujours par "À traiter" puis adressez les alertes des autres onglets.'
    },
    {
      stepNumber: 2,
      title: 'Traiter le backlog',
      description: 'Les produits en backlog sont classés par priorité IA: rouge (urgent), orange (important), vert (normal). Chaque carte affiche les actions requises.',
      tip: 'Utilisez les raccourcis clavier: E (éditer), V (valider), R (rejeter), N (suivant).',
      warning: 'Les produits non traités après 7 jours sont automatiquement désactivés.'
    },
    {
      stepNumber: 3,
      title: 'Gérer les variantes',
      description: 'L\'onglet Variantes affiche une vue parent/enfants. Les anomalies sont surlignées: prix incohérents (rouge), attributs manquants (orange), stocks désynchronisés (jaune).',
      tip: 'Utilisez "Harmoniser les prix" pour appliquer une règle (+X% par taille par exemple).'
    },
    {
      stepNumber: 4,
      title: 'Optimiser les médias',
      description: 'La bibliothèque médias centralise toutes vos images. Filtrez par "Sans produit" pour nettoyer, ou "Basse qualité" pour identifier les images à remplacer.',
      tip: 'Activez le CDN pour des temps de chargement optimaux sur toutes les marketplaces.'
    },
    {
      stepNumber: 5,
      title: 'Mapper les attributs',
      description: 'Chaque marketplace exige des attributs spécifiques. L\'onglet Attributs permet de créer des règles de mapping: "Si attribut_source = X, alors attribut_cible = Y".',
      tip: 'L\'IA suggère des mappings basés sur vos produits existants.'
    },
    {
      stepNumber: 6,
      title: 'Organiser les catégories',
      description: 'L\'arborescence catégories permet de classer vos produits. L\'IA suggère des catégories basées sur les titres et attributs.',
      tip: 'Alignez votre arborescence sur celle de votre marketplace principale.'
    },
    {
      stepNumber: 7,
      title: 'Surveiller la santé',
      description: 'Le dashboard Santé affiche un score global et par critère. Les prédictions J+7 et J+30 anticipent l\'évolution si aucune action n\'est prise.',
      tip: 'Configurez une alerte si le score passe sous 80%.',
      warning: 'Un score < 70% réduit drastiquement votre visibilité marketplace.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Traitez le backlog quotidiennement',
        description: 'Un backlog qui s\'accumule = des opportunités de vente manquées. Objectif: < 24h de délai traitement.',
        impact: 'high'
      },
      {
        title: 'Automatisez le mapping attributs',
        description: 'Créez des règles de transformation pour mapper automatiquement vos attributs sources vers chaque marketplace.',
        impact: 'high'
      },
      {
        title: 'Utilisez des images HD hébergées',
        description: 'Évitez les URLs externes instables. Uploadez sur ShopOpti+ pour bénéficier du CDN et de la conversion automatique.',
        impact: 'medium'
      },
      {
        title: 'Surveillez les prédictions J+7',
        description: 'Anticipez les baisses de score et agissez avant qu\'elles n\'impactent vos ventes.',
        impact: 'high'
      }
    ],
    pitfalls: [
      {
        title: 'Ignorer les variantes orphelines',
        description: 'Les variantes sans parent créent des erreurs marketplace. Rattachez-les ou supprimez-les.',
        impact: 'high'
      },
      {
        title: 'Utiliser des catégories trop génériques',
        description: 'Une catégorie "Divers" = 0 visibilité algorithmique. Soyez précis dans votre arborescence.',
        impact: 'medium'
      },
      {
        title: 'Négliger les attributs optionnels',
        description: 'Les attributs "optionnels" des marketplaces boostent le ranking. Renseignez-en un maximum.',
        impact: 'medium'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'Le backlog ne se vide jamais',
      cause: 'Les règles d\'import créent plus de travail que vous n\'en traitez',
      solution: 'Activez l\'enrichissement IA automatique à l\'import pour réduire le travail manuel de 70%',
      severity: 'high'
    },
    {
      symptom: 'Les variantes sont dupliquées',
      cause: 'Import répété sans déduplication ou SKU non uniques',
      solution: 'Activez la déduplication par SKU dans les paramètres d\'import',
      severity: 'medium'
    },
    {
      symptom: 'Les images sont floues sur la marketplace',
      cause: 'Images source trop petites ou compression excessive',
      solution: 'Uploadez des images 1500x1500px minimum. ShopOpti+ conserve la qualité optimale',
      severity: 'medium'
    },
    {
      symptom: 'Le score santé fluctue sans modification',
      cause: 'Les exigences marketplace évoluent ou de nouveaux produits arrivent',
      solution: 'Vérifiez les nouveaux critères marketplace et adaptez vos règles',
      severity: 'low'
    }
  ],
  
  expertTips: [
    {
      title: 'La règle du "Zero Backlog Friday"',
      content: 'Les meilleures équipes catalogue terminent chaque semaine avec un backlog à zéro. Cela garantit que tous les produits sont publiables pour le week-end (pic de ventes).',
      differentiator: 'ShopOpti+ affiche un indicateur de "temps de traitement moyen" pour piloter cette métrique.'
    },
    {
      title: 'Automatisez 80% des décisions',
      content: 'Créez des règles pour auto-valider les produits qui passent tous les critères (score > 85, images OK, attributs complets). Concentrez-vous sur les 20% problématiques.',
      differentiator: 'Notre moteur de règles permet une validation automatique conditionnelle.'
    },
    {
      title: 'Benchmark par catégorie',
      content: 'Comparez le score santé de chaque catégorie. Une catégorie sous-performante tire le score global vers le bas. Identifiez et corrigez en priorité.',
      differentiator: 'ShopOpti+ fournit un benchmark sectoriel pour chaque catégorie.'
    }
  ],
  
  callToValue: {
    headline: 'Transformez le chaos catalogue en machine bien huilée',
    description: 'Le Hub Catalogue structure votre travail quotidien en tâches claires et priorisées. Fini les produits oubliés, les variantes incohérentes et les erreurs marketplace. Votre catalogue devient un avantage compétitif.',
    metrics: [
      { label: 'Taux de rejet marketplace', value: '< 1%', improvement: '-95%' },
      { label: 'Temps traitement backlog', value: '< 24h', improvement: '-75%' },
      { label: 'Score santé moyen', value: '92%', improvement: '+28%' }
    ],
    cta: {
      label: 'Accéder au Hub Catalogue',
      route: '/catalog'
    }
  },
  
  faqs: [
    {
      question: 'Quelle est la différence entre Produits et Catalogue ?',
      answer: 'Produits = vue tabulaire pour édition rapide. Catalogue = hub de traitement par type de tâche (backlog, variantes, médias...). Utilisez Produits pour des modifications ponctuelles, Catalogue pour du traitement en masse organisé.'
    },
    {
      question: 'Comment fonctionne la priorisation IA du backlog ?',
      answer: 'L\'IA analyse: potentiel de vente (basé sur catégorie et prix), urgence (date import), complexité (nombre de corrections requises). Les produits à fort potentiel et faible complexité passent en premier.'
    },
    {
      question: 'Puis-je automatiser entièrement le traitement ?',
      answer: 'Oui, créez des règles de validation automatique. Ex: "Si score > 85 ET images > 3 ET attributs 100%, ALORS publier automatiquement". Les produits hors critères restent en backlog manuel.'
    }
  ],
  
  relatedModules: ['products', 'import', 'channels', 'ai'],
  externalResources: [
    { label: 'Checklist qualité catalogue', url: '/templates/catalog-checklist' },
    { label: 'Webinaire: Industrialiser son catalogue', url: '/academy/catalog-mastery' }
  ]
};
